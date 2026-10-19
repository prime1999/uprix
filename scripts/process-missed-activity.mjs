const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const MAX_RPC_ITERATIONS = Number(process.env.MAX_RPC_ITERATIONS ?? "5");

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing required environment variables: " +
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
  );

  process.exit(1);
}

if (!Number.isSafeInteger(MAX_RPC_ITERATIONS) || MAX_RPC_ITERATIONS < 1) {
  console.error("MAX_RPC_ITERATIONS must be a positive integer.");
  process.exit(1);
}

/**
 * Calls a Supabase RPC function and parses its JSON response.
 */
async function callRpc(functionName) {
  const rpcUrl = `${supabaseUrl}/rest/v1/rpc/${functionName}`;

  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
    signal: AbortSignal.timeout(120_000),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      `${functionName} failed with HTTP ${response.status}: ${responseText}`,
    );
  }

  let result;

  try {
    result = JSON.parse(responseText);
  } catch {
    throw new Error(`${functionName} returned invalid JSON: ${responseText}`);
  }

  if (result === null || typeof result !== "object" || Array.isArray(result)) {
    throw new Error(
      `${functionName} returned an unexpected response: ${responseText}`,
    );
  }

  return result;
}

/**
 * Runs one RPC and verifies its success flag.
 */
async function runRpc(functionName, description) {
  console.log(`\n${description}`);
  console.log(`Calling RPC: ${functionName}`);

  const result = await callRpc(functionName);

  if (result.success !== true) {
    throw new Error(
      `${functionName} did not report success: ${JSON.stringify(result)}`,
    );
  }

  console.log(`${description} completed successfully.`);
  console.log(JSON.stringify(result, null, 2));

  return result;
}

/**
 * Process missed activity in bounded batches.
 *
 * The SQL checkpoint preserves progress between RPC calls and
 * between scheduled GitHub Actions runs.
 */
async function processMissedActivity() {
  let iterations = 0;
  let hasMore = true;
  let totalDatesProcessed = 0;
  let totalActivityChecks = 0;

  const totalResults = {};

  console.log(`Maximum missed-activity RPC calls: ${MAX_RPC_ITERATIONS}`);

  while (hasMore && iterations < MAX_RPC_ITERATIONS) {
    const result = await runRpc(
      "process_missed_activity_batch",
      `Processing missed activity (batch ${iterations + 1}/${MAX_RPC_ITERATIONS})...`,
    );

    iterations++;

    if (
      !Number.isSafeInteger(result.dates_processed) ||
      result.dates_processed < 0 ||
      typeof result.has_more !== "boolean"
    ) {
      throw new Error(
        "process_missed_activity_batch returned an invalid batch summary.",
      );
    }

    totalDatesProcessed += result.dates_processed;
    totalActivityChecks += Number(result.calls ?? 0);

    for (const [outcome, count] of Object.entries(result.results ?? {})) {
      totalResults[outcome] = (totalResults[outcome] ?? 0) + Number(count);
    }

    hasMore = result.has_more;

    console.log(
      `Batch ${iterations}: ${result.dates_processed} dates processed; ` +
        `activity checks: ${result.calls ?? 0}; more work: ${hasMore}`,
    );

    if (!hasMore) {
      console.log(
        "All currently eligible missed-activity dates are processed.",
      );
    }
  }

  if (hasMore) {
    console.log(
      `RPC iteration limit reached (${iterations}/${MAX_RPC_ITERATIONS}).`,
    );
    console.log(
      "Remaining work is preserved by the SQL checkpoint for a later run.",
    );
  }

  console.log("\nMissed-activity summary:");
  console.log(`RPC iterations: ${iterations}`);
  console.log(`Dates processed: ${totalDatesProcessed}`);
  console.log(`Activity checks: ${totalActivityChecks}`);
  console.log(`More work remains: ${hasMore}`);
  console.log("Aggregated outcomes:", JSON.stringify(totalResults, null, 2));

  return { iterations, hasMore };
}

/**
 * Enforce fine deadlines and eviction stages.
 */
async function processFineEnforcement() {
  const result = await runRpc(
    "process_fine_enforcement",
    "Processing fine enforcement...",
  );

  console.log("Fine enforcement summary:");
  console.log(`Newly locked: ${result.newly_locked ?? 0}`);
  console.log(`Newly frontend-evicted: ${result.newly_frontend_evicted ?? 0}`);
  console.log(`Newly fully evicted: ${result.newly_fully_evicted ?? 0}`);
  console.log(`Newly unlocked: ${result.newly_unlocked ?? 0}`);

  if (result.completed_at) {
    console.log(`Fine enforcement completed at: ${result.completed_at}`);
  }
}

async function main() {
  console.log("============================================");
  console.log("Starting Result Room background worker");
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log("============================================");

  const { hasMore } = await processMissedActivity();

  // Always run fine enforcement after successful batch processing,
  // even if the missed-activity iteration cap was reached.
  await processFineEnforcement();

  console.log("\n============================================");
  console.log("Result Room background worker completed successfully.");
  console.log(`Missed-activity backlog remains: ${hasMore}`);
  console.log(`Finished at: ${new Date().toISOString()}`);
  console.log("============================================");
}

main().catch((error) => {
  console.error("\n============================================");
  console.error("Result Room background worker failed.");
  console.error(error);
  console.error("============================================");

  process.exitCode = 1;
});

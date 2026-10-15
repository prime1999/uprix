const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing required environment variables: " +
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
  );

  process.exit(1);
}

/**
 * Calls a Supabase RPC function and parses its JSON response.
 *
 * Uses the service-role key because these background operations
 * must run without a participant's browser session.
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

async function main() {
  console.log("============================================");
  console.log("Starting Result Room background worker");
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log("============================================");

  // --------------------------------------------------
  // 1. Process missed submissions and partner reviews.
  // --------------------------------------------------
  const missedActivity = await runRpc(
    "process_missed_activity_batch",
    "Processing missed activity...",
  );

  console.log(`RPC calls processed: ${missedActivity.calls ?? "unknown"}`);
  console.log(
    "Missed-activity outcome counts:",
    JSON.stringify(missedActivity.results ?? [], null, 2),
  );

  if (missedActivity.completed_at) {
    console.log(`Missed-activity completed at: ${missedActivity.completed_at}`);
  }

  // --------------------------------------------------
  // 2. Enforce fine deadlines and eviction stages.
  // --------------------------------------------------
  const fineEnforcement = await runRpc(
    "process_fine_enforcement",
    "Processing fine enforcement...",
  );

  console.log("Fine enforcement summary:");
  console.log(`Newly locked: ${fineEnforcement.newly_locked ?? 0}`);
  console.log(
    `Newly frontend-evicted: ${fineEnforcement.newly_frontend_evicted ?? 0}`,
  );
  console.log(
    `Newly fully evicted: ${fineEnforcement.newly_fully_evicted ?? 0}`,
  );
  console.log(`Newly unlocked: ${fineEnforcement.newly_unlocked ?? 0}`);

  if (fineEnforcement.completed_at) {
    console.log(
      `Fine enforcement completed at: ${fineEnforcement.completed_at}`,
    );
  }

  console.log("\n============================================");
  console.log("Result Room background worker completed successfully.");
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

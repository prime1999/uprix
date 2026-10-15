const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing required environment variables: " +
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
  );

  process.exit(1);
}

const rpcUrl = `${supabaseUrl}/rest/v1/rpc/process_missed_activity_batch`;

async function main() {
  console.log("Starting Result Room missed-activity worker...");

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
    console.error(
      `Batch RPC failed with HTTP ${response.status}:`,
      responseText,
    );

    process.exitCode = 1;
    return;
  }

  let result;

  try {
    result = JSON.parse(responseText);
  } catch {
    console.error("Batch RPC returned invalid JSON:", responseText);
    process.exitCode = 1;
    return;
  }

  if (result.success !== true) {
    console.error("Batch RPC did not report success:", result);
    process.exitCode = 1;
    return;
  }

  console.log("Missed-activity worker completed successfully.");
  console.log(`RPC calls processed: ${result.calls}`);
  console.log("Outcome counts:", JSON.stringify(result.results, null, 2));
  console.log(`Completed at: ${result.completed_at}`);
}

main().catch((error) => {
  console.error("Missed-activity worker failed:", error);
  process.exitCode = 1;
});

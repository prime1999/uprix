import { retryPendingSubmissionFileUploads } from "@/lib/result-room/upload-submission-files";

/**
 * Uprix background worker.
 *
 * This process runs directly in GitHub Actions.
 * It does not call a Uprix API route.
 */
async function main(): Promise<void> {
  console.log("[worker] Starting Uprix background jobs.");
  console.log(`[worker] Started at: ${new Date().toISOString()}`);

  console.log("[worker] Retrying pending Google Drive uploads.");

  await retryPendingSubmissionFileUploads(25);

  console.log("[worker] Google Drive retry job finished.");
  console.log("[worker] All configured jobs finished.");
}

main().catch((error: unknown) => {
  console.error("[worker] Worker failed:", error);
  process.exitCode = 1;
});

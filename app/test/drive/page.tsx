"use client";

import { useState } from "react";

interface UploadResult {
  success: boolean;
  message?: string;
  error?: string;
  file?: {
    fileId: string;
    webViewLink: string;
  };
}

export default function GoogleDriveUploadTestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  async function handleUpload() {
    if (!file) {
      setResult({
        success: false,
        error: "Choose an image first.",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/test/google-drive-upload", {
        method: "POST",
        body: formData,
      });

      const data: UploadResult = await response.json();
      setResult(data);
    } catch {
      setResult({
        success: false,
        error: "Request failed. Check your connection and server logs.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Google Drive Upload Test</h1>
        <p className="mt-2 text-sm text-gray-500">
          Temporary development tool for testing Result Room evidence storage.
        </p>
      </div>

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => {
          setFile(event.target.files?.[0] ?? null);
          setResult(null);
        }}
      />

      {file && (
        <p className="text-sm">
          Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
        </p>
      )}

      <button
        type="button"
        onClick={handleUpload}
        disabled={!file || loading}
        className="rounded-lg bg-black px-5 py-3 text-white disabled:opacity-50"
      >
        {loading ? "Uploading..." : "Upload to Google Drive"}
      </button>

      {result && (
        <section className="space-y-3 rounded-lg border p-4" aria-live="polite">
          <p className="font-medium">
            {result.success ? "Upload successful" : "Upload failed"}
          </p>

          {result.error && (
            <p className="text-sm text-red-600">{result.error}</p>
          )}

          {result.file && (
            <>
              <p className="break-all text-sm">File ID: {result.file.fileId}</p>

              <a
                href={result.file.webViewLink}
                target="_blank"
                rel="noreferrer"
                className="text-sm underline"
              >
                Open file in Google Drive
              </a>
            </>
          )}
        </section>
      )}
    </main>
  );
}

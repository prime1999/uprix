"use client";

import { useState } from "react";
import {
  uploadToCloudinary,
  type CloudinaryUploadResult,
} from "@/lib/cloudinary/upload";
import { prepareImage } from "@/lib/result-room/prepare-image";

export default function CloudinaryTestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<CloudinaryUploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preparedFile, setPreparedFile] = useState<File | null>(null);

  async function handleUpload() {
    if (!file) {
      return;
    }

    setUploading(true);
    setProgress(0);
    setResult(null);
    setError(null);

    try {
      const preparedFile = await prepareImage(file);
      const uploadResult = await uploadToCloudinary(preparedFile, {
        onProgress: setProgress,
      });
      setPreparedFile(preparedFile);
      console.log({
        originalSize: file.size,
        preparedSize: preparedFile.size,
        originalType: file.type,
        preparedType: preparedFile.type,
      });
      setResult(uploadResult);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Cloudinary Upload Test</h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Temporary test page for the Result Room upload pipeline.
        </p>
      </div>

      <input
        type="file"
        accept="image/*"
        onChange={(event) => {
          setFile(event.target.files?.[0] ?? null);
          setResult(null);
          setError(null);
          setProgress(0);
        }}
      />

      {file && (
        <div className="rounded-lg border p-4">
          <p className="font-medium">{file.name}</p>

          <p className="mt-1 text-sm text-muted-foreground">
            Original: {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>

          {preparedFile && (
            <p className="mt-1 text-sm text-muted-foreground">
              Prepared: {(preparedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          )}
        </div>
      )}
      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleUpload}
        disabled={!file || uploading}
        className="rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Upload Image"}
      </button>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4 rounded-lg border p-4">
          <div>
            <p className="font-medium">Upload successful</p>

            <p className="mt-1 break-all text-sm text-muted-foreground">
              {result.publicId}
            </p>
          </div>

          <img
            src={result.secureUrl}
            alt="Cloudinary test upload"
            className="max-h-80 w-full rounded-lg object-contain"
          />
        </div>
      )}
    </main>
  );
}

import "server-only";

import { createHash } from "node:crypto";

const CLOUDINARY_IMAGE_DESTROY_URL = "https://api.cloudinary.com/v1_1";

interface CloudinaryDestroyResponse {
  result?: string;
  error?: {
    message?: string;
  };
}

/**
 * Deletes an image using trusted server-side credentials.
 * Only call this after verifying the image's database ownership.
 */
export async function deleteCloudinaryImage(publicId: string): Promise<void> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary server credentials are not configured.");
  }

  const id = publicId.trim();

  if (!id) {
    throw new Error("Cloudinary public ID is required.");
  }

  const timestamp = Math.floor(Date.now() / 1000);

  // Cloudinary requires the sorted parameters followed by the API secret.
  const signature = createHash("sha1")
    .update(`public_id=${id}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  const body = new URLSearchParams({
    public_id: id,
    timestamp: String(timestamp),
    api_key: apiKey,
    signature,
  });

  const response = await fetch(
    `${CLOUDINARY_IMAGE_DESTROY_URL}/${encodeURIComponent(cloudName)}/image/destroy`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
    },
  );

  const result = (await response.json()) as CloudinaryDestroyResponse;

  if (!response.ok) {
    throw new Error(
      result.error?.message ?? "Cloudinary image deletion failed.",
    );
  }

  // "not found" is safe to treat as already deleted.
  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error(
      result.error?.message ?? "Cloudinary did not confirm image deletion.",
    );
  }
}

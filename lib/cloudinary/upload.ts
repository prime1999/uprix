export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  resourceType: string;
}

interface UploadOptions {
  onProgress?: (progress: number) => void;
}

export async function uploadToCloudinary(
  file: File,
  options: UploadOptions = {},
): Promise<CloudinaryUploadResult> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName) {
    throw new Error("Cloudinary cloud name is not configured.");
  }

  if (!uploadPreset) {
    throw new Error("Cloudinary upload preset is not configured.");
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;

    xhr.open("POST", uploadUrl);

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) {
        return;
      }

      const progress = Math.round((event.loaded / event.total) * 100);

      options.onProgress?.(progress);
    });

    xhr.addEventListener("load", () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        try {
          const error = JSON.parse(xhr.responseText);

          reject(
            new Error(error?.error?.message ?? "Cloudinary upload failed."),
          );
        } catch {
          reject(new Error("Cloudinary upload failed."));
        }

        return;
      }

      try {
        const data = JSON.parse(xhr.responseText);

        resolve({
          publicId: data.public_id,
          url: data.url,
          secureUrl: data.secure_url,
          resourceType: data.resource_type,
        });
      } catch {
        reject(new Error("Invalid response from Cloudinary."));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error while uploading to Cloudinary."));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Cloudinary upload was cancelled."));
    });

    const formData = new FormData();

    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    xhr.send(formData);
  });
}

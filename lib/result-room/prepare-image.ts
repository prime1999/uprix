const MAX_DIMENSION = 2000;
const JPEG_QUALITY = 0.82;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_INPUT_DIMENSION = 50_000;

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type SupportedImageType = "image/jpeg" | "image/png" | "image/webp";

type DecodedImage = {
  source: ImageBitmap | HTMLImageElement;
  width: number;
  height: number;
  cleanup: () => void;
};

export async function prepareImage(file: File): Promise<File> {
  validateFile(file);

  const detectedType = await detectImageType(file);

  if (!detectedType || !ALLOWED_TYPES.has(detectedType)) {
    throw new Error(
      "Unsupported image format. Please use JPG, JPEG, PNG, or WebP.",
    );
  }

  // Avoid accepting files whose declared type contradicts their contents.
  if (file.type && file.type.toLowerCase() !== detectedType) {
    throw new Error(
      "The image file appears to have an invalid format. " +
        "Please save it as JPG, PNG, or WebP and try again.",
    );
  }

  let decoded: DecodedImage | null = null;
  let canvas: HTMLCanvasElement | null = null;

  try {
    decoded = await loadImage(file);

    const { width, height } = getTargetDimensions(
      decoded.width,
      decoded.height,
    );

    canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d", {
      alpha: false,
    });

    if (!context) {
      throw new Error("Could not prepare image. Please try again.");
    }

    // JPEG does not support transparency. Use white instead of black.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);

    context.drawImage(decoded.source, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, "image/jpeg", JPEG_QUALITY);

    if (blob.size === 0) {
      throw new Error("The prepared image is empty. Please try again.");
    }

    return new File([blob], replaceExtension(file.name, "jpg"), {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "Could not prepare this image. Please try another JPG, PNG, or WebP file.",
    );
  } finally {
    decoded?.cleanup();

    if (canvas) {
      // Release the canvas backing store, especially important on phones.
      canvas.width = 0;
      canvas.height = 0;
    }
  }
}

function validateFile(file: File): void {
  if (!(file instanceof File)) {
    throw new Error("Please select a valid image file.");
  }

  if (file.size === 0) {
    throw new Error("This image file is empty. Please select another image.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Image must be 10 MB or smaller.");
  }

  // Browsers normally provide MIME types for these formats.
  // An empty type is allowed temporarily because we verify file signatures.
  if (file.type && !ALLOWED_TYPES.has(file.type.toLowerCase())) {
    throw new Error(
      "Unsupported image format. Please use JPG, JPEG, PNG, or WebP.",
    );
  }
}

async function detectImageType(file: File): Promise<SupportedImageType | null> {
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());

  // JPEG: FF D8 FF
  if (
    header.length >= 3 &&
    header[0] === 0xff &&
    header[1] === 0xd8 &&
    header[2] === 0xff
  ) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    header.length >= 8 &&
    header[0] === 0x89 &&
    header[1] === 0x50 &&
    header[2] === 0x4e &&
    header[3] === 0x47 &&
    header[4] === 0x0d &&
    header[5] === 0x0a &&
    header[6] === 0x1a &&
    header[7] === 0x0a
  ) {
    return "image/png";
  }

  // WebP: RIFF....WEBP
  if (
    header.length >= 12 &&
    header[0] === 0x52 &&
    header[1] === 0x49 &&
    header[2] === 0x46 &&
    header[3] === 0x46 &&
    header[8] === 0x57 &&
    header[9] === 0x45 &&
    header[10] === 0x42 &&
    header[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

async function loadImage(file: File): Promise<DecodedImage> {
  // Preferred path on supported browsers.
  if (typeof createImageBitmap === "function") {
    let bitmap: ImageBitmap | null = null;

    try {
      bitmap = await createImageBitmap(file);

      if (bitmap.width > 0 && bitmap.height > 0) {
        const result: DecodedImage = {
          source: bitmap,
          width: bitmap.width,
          height: bitmap.height,
          cleanup: () => bitmap?.close(),
        };

        return result;
      }

      bitmap.close();
      bitmap = null;
    } catch {
      bitmap?.close();
      // Fall back to HTMLImageElement for browser compatibility.
    }
  }

  return loadImageElement(file);
}

function loadImageElement(file: File): Promise<DecodedImage> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    let settled = false;

    const cleanupUrl = () => {
      URL.revokeObjectURL(objectUrl);
    };

    image.onload = () => {
      if (settled) return;

      settled = true;
      cleanupUrl();

      const width = image.naturalWidth;
      const height = image.naturalHeight;

      if (!width || !height) {
        reject(
          new Error(
            "Could not read image dimensions. Please try another image.",
          ),
        );
        return;
      }

      resolve({
        source: image,
        width,
        height,
        cleanup: () => {
          image.onload = null;
          image.onerror = null;
          image.src = "";
        },
      });
    };

    image.onerror = () => {
      if (settled) return;

      settled = true;
      cleanupUrl();

      image.onload = null;
      image.onerror = null;

      reject(
        new Error(
          "Could not read this image. Please try saving it as JPG, PNG, " +
            "or WebP, or select another image.",
        ),
      );
    };

    image.src = objectUrl;
  });
}

function getTargetDimensions(width: number, height: number) {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0 ||
    width > MAX_INPUT_DIMENSION ||
    height > MAX_INPUT_DIMENSION
  ) {
    throw new Error(
      "This image has unsupported dimensions. Please choose another image.",
    );
  }

  if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
    return { width, height };
  }

  const scale = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(
              new Error(
                "Could not compress this image. Please try another image.",
              ),
            );
            return;
          }

          resolve(blob);
        },
        type,
        quality,
      );
    } catch {
      reject(
        new Error(
          "Your device could not compress this image. Please try a smaller image.",
        ),
      );
    }
  });
}

function replaceExtension(filename: string, extension: string): string {
  const lastDot = filename.lastIndexOf(".");
  const baseName = lastDot > 0 ? filename.slice(0, lastDot) : filename;

  return `${baseName}.${extension}`;
}

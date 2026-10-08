const MAX_DIMENSION = 2000;
const JPEG_QUALITY = 0.82;

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function prepareImage(file: File): Promise<File> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Unsupported image format. Please use JPG, PNG, or WebP.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Image must be smaller than 10 MB.");
  }

  const image = await loadImage(file);

  const { width, height } = getTargetDimensions(image.width, image.height);

  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not prepare image.");
  }

  context.drawImage(image, 0, 0, width, height);

  const blob = await canvasToBlob(canvas, "image/jpeg", JPEG_QUALITY);

  const filename = replaceExtension(file.name, "jpg");

  return new File([blob], filename, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read image."));
    };

    image.src = objectUrl;
  });
}

function getTargetDimensions(width: number, height: number) {
  if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
    return {
      width,
      height,
    };
  }

  const scale = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);

  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not compress image."));
          return;
        }

        resolve(blob);
      },
      type,
      quality,
    );
  });
}

function replaceExtension(filename: string, extension: string) {
  const lastDot = filename.lastIndexOf(".");

  if (lastDot === -1) {
    return `${filename}.${extension}`;
  }

  return `${filename.slice(0, lastDot)}.${extension}`;
}

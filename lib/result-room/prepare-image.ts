const MAX_DIMENSION = 2000;
const JPEG_QUALITY = 0.82;
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;

// Bound decoded image memory before attempting to decode the full image.
// This is an intentional safety limit; extremely high-resolution images
// may need to be resized on the device before being selected.
const MAX_INPUT_DIMENSION = 50_000;
const MAX_INPUT_PIXELS = 40_000_000;
const MAX_JPEG_HEADER_BYTES = 1024 * 1024;
const MAX_WEBP_HEADER_BYTES = 1024 * 1024;

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type SupportedImageType = "image/jpeg" | "image/png" | "image/webp";

type ImageDimensions = {
  width: number;
  height: number;
};

type DecodedImage = {
  source: ImageBitmap | HTMLImageElement;
  width: number;
  height: number;
  cleanup: () => void;
};

type PrepareImageOptions = {
  /** Maximum original file size in bytes. Defaults to 10 MB. */
  maxBytes?: number;
};

export async function prepareImage(
  file: File,
  options: PrepareImageOptions = {},
): Promise<File> {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_FILE_SIZE;

  validateFile(file, maxBytes);

  const detectedType = await detectImageType(file);

  if (!detectedType || !ALLOWED_TYPES.has(detectedType)) {
    throw new Error(
      "Unsupported image format. Please use JPG, JPEG, PNG, or WebP.",
    );
  }

  if (file.type && file.type.toLowerCase() !== detectedType) {
    throw new Error(
      "The image file appears to have an invalid format. " +
        "Please save it as JPG, PNG, or WebP and try again.",
    );
  }

  // Inspect the image header before decoding. This helps reject huge images
  // before the browser allocates memory for their decoded pixel data.
  const headerDimensions = await readImageDimensions(file, detectedType);

  if (!headerDimensions) {
    throw new Error(
      "Could not verify this image's dimensions. " +
        "Please save it again as JPG, PNG, or WebP and retry.",
    );
  }

  assertSafeDimensions(headerDimensions.width, headerDimensions.height);

  let decoded: DecodedImage | null = null;
  let canvas: HTMLCanvasElement | null = null;

  try {
    decoded = await loadImage(file);

    // Check the decoded dimensions too. Header data alone is not sufficient
    // to trust a file, and orientation can affect the displayed dimensions.
    const { width, height } = getTargetDimensions(
      decoded.width,
      decoded.height,
    );

    canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d", { alpha: false });

    if (!context) {
      throw new Error("Could not prepare image. Please try again.");
    }

    // JPEG has no alpha channel, so use white behind transparent PNG/WebP.
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
      // Release the canvas backing store, especially on mobile devices.
      canvas.width = 0;
      canvas.height = 0;
    }
  }
}

function validateFile(file: File, maxBytes: number): void {
  if (!(file instanceof File)) {
    throw new Error("Please select a valid image file.");
  }

  if (file.size === 0) {
    throw new Error("This image file is empty. Please select another image.");
  }

  if (!Number.isFinite(maxBytes) || maxBytes <= 0) {
    throw new Error("The image size limit is invalid.");
  }

  if (file.size > maxBytes) {
    const limitMB = maxBytes / (1024 * 1024);
    throw new Error(`Image must be ${limitMB} MB or smaller.`);
  }

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

async function readImageDimensions(
  file: File,
  type: SupportedImageType,
): Promise<ImageDimensions | null> {
  if (type === "image/png") {
    // PNG width and height are stored in the IHDR chunk at byte offsets 16/20.
    const buffer = await file.slice(0, 24).arrayBuffer();

    if (buffer.byteLength < 24) return null;

    const view = new DataView(buffer);

    // Confirm that the first chunk is IHDR.
    if (
      view.getUint32(8) !== 13 ||
      view.getUint8(12) !== 0x49 ||
      view.getUint8(13) !== 0x48 ||
      view.getUint8(14) !== 0x44 ||
      view.getUint8(15) !== 0x52
    ) {
      return null;
    }

    return {
      width: view.getUint32(16),
      height: view.getUint32(20),
    };
  }

  if (type === "image/jpeg") {
    const buffer = await file.slice(0, MAX_JPEG_HEADER_BYTES).arrayBuffer();

    const view = new DataView(buffer);

    if (
      view.byteLength < 4 ||
      view.getUint8(0) !== 0xff ||
      view.getUint8(1) !== 0xd8
    ) {
      return null;
    }

    let offset = 2;

    while (offset + 4 <= view.byteLength) {
      if (view.getUint8(offset) !== 0xff) {
        // A valid JPEG header uses marker prefixes here. Refuse to guess
        // dimensions if the header structure is not parseable.
        return null;
      }

      // Skip repeated FF fill bytes.
      while (offset < view.byteLength && view.getUint8(offset) === 0xff) {
        offset++;
      }

      if (offset >= view.byteLength) return null;

      const marker = view.getUint8(offset);
      offset++;

      // Standalone markers have no length field.
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
        if (marker === 0xd9) return null; // EOI before SOF
        continue;
      }

      if (offset + 2 > view.byteLength) return null;

      const segmentLength = view.getUint16(offset);

      if (segmentLength < 2) return null;

      const segmentEnd = offset + segmentLength;

      if (segmentEnd > view.byteLength) {
        // The segment is truncated or extends beyond the inspected header.
        return null;
      }

      const isStartOfFrame =
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc;

      if (isStartOfFrame) {
        // Segment length includes its own two-byte length field.
        if (segmentLength < 7) return null;

        return {
          height: view.getUint16(offset + 3),
          width: view.getUint16(offset + 5),
        };
      }

      // SOS means image data starts before a dimensions marker was found.
      if (marker === 0xda) return null;

      offset = segmentEnd;
    }

    return null;
  }

  // WebP supports VP8X (extended), VP8 (lossy), and VP8L (lossless).
  if (type === "image/webp") {
    const buffer = await file.slice(0, MAX_WEBP_HEADER_BYTES).arrayBuffer();

    const view = new DataView(buffer);

    if (
      view.byteLength < 20 ||
      readAscii(view, 0, 4) !== "RIFF" ||
      readAscii(view, 8, 4) !== "WEBP"
    ) {
      return null;
    }

    let offset = 12;

    while (offset + 8 <= view.byteLength) {
      const chunkType = readAscii(view, offset, 4);
      const chunkSize = view.getUint32(offset + 4, true);
      const dataOffset = offset + 8;
      const chunkEnd = dataOffset + chunkSize;

      if (
        chunkSize < 0 ||
        chunkEnd > file.size ||
        dataOffset > view.byteLength
      ) {
        return null;
      }

      if (chunkType === "VP8X") {
        if (chunkSize < 10 || dataOffset + 10 > view.byteLength) {
          return null;
        }

        return {
          width:
            1 +
            view.getUint8(dataOffset + 4) +
            (view.getUint8(dataOffset + 5) << 8) +
            (view.getUint8(dataOffset + 6) << 16),
          height:
            1 +
            view.getUint8(dataOffset + 7) +
            (view.getUint8(dataOffset + 8) << 8) +
            (view.getUint8(dataOffset + 9) << 16),
        };
      }

      if (chunkType === "VP8 ") {
        // Lossy WebP frame header: 9D 01 2A followed by 14-bit dimensions.
        if (chunkSize < 10 || dataOffset + 10 > view.byteLength) {
          return null;
        }

        const frameOffset = dataOffset + 3;

        if (
          view.getUint8(frameOffset) !== 0x9d ||
          view.getUint8(frameOffset + 1) !== 0x01 ||
          view.getUint8(frameOffset + 2) !== 0x2a
        ) {
          return null;
        }

        return {
          width: view.getUint16(frameOffset + 3, true) & 0x3fff,
          height: view.getUint16(frameOffset + 5, true) & 0x3fff,
        };
      }

      if (chunkType === "VP8L") {
        if (chunkSize < 5 || dataOffset + 5 > view.byteLength) {
          return null;
        }

        if (view.getUint8(dataOffset) !== 0x2f) return null;

        const b1 = view.getUint8(dataOffset + 1);
        const b2 = view.getUint8(dataOffset + 2);
        const b3 = view.getUint8(dataOffset + 3);
        const b4 = view.getUint8(dataOffset + 4);

        return {
          width: 1 + b1 + ((b2 & 0x3f) << 8),
          height: 1 + ((b2 & 0xc0) >> 6) + (b3 << 2) + ((b4 & 0x0f) << 10),
        };
      }

      // WebP chunks are padded to an even byte boundary.
      const nextOffset = chunkEnd + (chunkSize % 2);

      if (nextOffset <= offset) return null;
      if (nextOffset > view.byteLength) return null;

      offset = nextOffset;
    }

    return null;
  }

  return null;
}

function readAscii(view: DataView, offset: number, length: number): string {
  let result = "";

  for (let index = 0; index < length; index++) {
    result += String.fromCharCode(view.getUint8(offset + index));
  }

  return result;
}

function assertSafeDimensions(width: number, height: number): void {
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width <= 0 ||
    height <= 0 ||
    width > MAX_INPUT_DIMENSION ||
    height > MAX_INPUT_DIMENSION ||
    width * height > MAX_INPUT_PIXELS
  ) {
    throw new Error(
      "This image is too large or has unsupported dimensions. " +
        "Please choose a smaller image or resize it and try again.",
    );
  }
}

async function loadImage(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    let bitmap: ImageBitmap | null = null;

    try {
      // Ask the browser to apply EXIF orientation where supported.
      bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });

      if (bitmap.width > 0 && bitmap.height > 0) {
        const decodedBitmap = bitmap;

        return {
          source: decodedBitmap,
          width: decodedBitmap.width,
          height: decodedBitmap.height,
          cleanup: () => decodedBitmap.close(),
        };
      }

      bitmap.close();
      bitmap = null;
    } catch {
      bitmap?.close();
      // Some browsers/files do not decode through createImageBitmap.
      // Fall back to HTMLImageElement.
    }
  }

  return loadImageElement(file);
}

function loadImageElement(file: File): Promise<DecodedImage> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    let settled = false;

    const cleanupUrl = () => URL.revokeObjectURL(objectUrl);

    image.onload = () => {
      if (settled) return;

      settled = true;
      cleanupUrl();

      const width = image.naturalWidth;
      const height = image.naturalHeight;

      if (!width || !height) {
        image.onload = null;
        image.onerror = null;
        image.src = "";

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
      image.src = "";

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
  assertSafeDimensions(width, height);

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
          "Your device could not compress this image. " +
            "Please try a smaller image.",
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

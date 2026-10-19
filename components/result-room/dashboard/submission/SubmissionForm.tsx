"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
  type KeyboardEvent,
} from "react";

import { ImageIcon, ImagePlus, Loader2, Plus, X } from "lucide-react";

import GeneralButton from "@/components/miscelleneous/generalButton";
import { prepareImage } from "@/lib/result-room/prepare-image";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface SubmissionFile {
  publicId: string;
  secureUrl: string;
}

export interface SubmissionPayload {
  description: string;
  files: SubmissionFile[];
}

interface SubmissionFormProps {
  /** Called after all images have been uploaded to Cloudinary. */
  onSubmit?: (payload: SubmissionPayload) => void | Promise<void>;

  /** Reports upload progress to the dashboard. */
  onUploadProgressChange?: (state: {
    uploading: boolean;
    progress: number;
    imageCount: number;
  }) => void;

  /** Called when the form is cancelled/cleared. */
  onCancel?: () => void;

  /** Maximum number of evidence images. */
  maxImages?: number;

  /** Maximum input size of each image in MB. */
  maxSizeMB?: number;

  /** Maximum description length. */
  maxLength?: number;

  /** Require at least one image before submitting. */
  requireImage?: boolean;

  /** External submitting state. */
  submitting?: boolean;

  /** Description placeholder. */
  placeholder?: string;

  /** Submit button label. */
  submitLabel?: string;

  /** Paint a soft gradient behind the glass. */
  withBackdrop?: boolean;

  className?: string;
}

interface UploadItem {
  id: number;
  file: File;
  url: string;
}

interface FormError {
  title: string;
  message: string;
}

/* -------------------------------------------------------------------------- */
/* Helpers and styles                                                         */
/* -------------------------------------------------------------------------- */

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const sameFile = (a: File, b: File) =>
  a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;

const GLASS =
  "border border-white/60 bg-white/40 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_32px_-8px_rgba(60,70,160,0.25)]";

const GLASS_INNER = "border border-white/70 bg-white/30 backdrop-blur-md";

/**
 * Some mobile browsers provide an empty MIME type. In that case, use the
 * extension as an initial check; prepareImage validates the actual signature.
 */
function isAllowedImageType(file: File): boolean {
  const type = file.type.toLowerCase();

  if (type) {
    return ALLOWED_IMAGE_TYPES.has(type);
  }

  return /\.(jpe?g|png|webp)$/i.test(file.name);
}

/**
 * Copy a picked file into memory right away. Files from the picker can become
 * unreadable later (the browser can revoke access), but a copy can't.
 */
async function snapshotFile(file: File): Promise<File> {
  const buffer = await file.arrayBuffer();

  return new File([buffer], file.name, {
    type: file.type,
    lastModified: file.lastModified,
  });
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function SubmissionForm({
  onSubmit,
  onUploadProgressChange,
  onCancel,
  maxImages = 5,
  maxSizeMB = 10,
  maxLength = 500,
  requireImage = true,
  submitting = false,
  placeholder = "What did you work on today? (optional)",
  submitLabel = "Submit Evidence",
  withBackdrop = true,
  className = "",
}: SubmissionFormProps) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<FormError | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInput = useRef<HTMLInputElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const idCounter = useRef(0);
  const itemsRef = useRef<UploadItem[]>([]);
  const submittingRef = useRef(false);

  /**
   * Cache successful Cloudinary uploads by this form item's unique ID.
   *
   * If an upload or submission request fails, retrying will reuse successful
   * uploads rather than uploading the same images to Cloudinary again.
   */
  const uploadedRef = useRef<Map<number, SubmissionFile>>(new Map());

  itemsRef.current = items;

  const loading = submitting || busy;

  const [reading, setReading] = useState(false);

  const canSubmit =
    !loading &&
    !reading &&
    (requireImage
      ? items.length > 0
      : items.length > 0 || description.trim().length > 0);

  const hasContent = items.length > 0 || description.trim().length > 0;

  /* ------------------------------------------------------------------------ */
  /* Cleanup                                                                  */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    return () => {
      itemsRef.current.forEach((item) => URL.revokeObjectURL(item.url));
      uploadedRef.current.clear();
    };
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Auto-growing textarea                                                    */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const element = textarea.current;
    if (!element) return;

    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, [description]);

  /* ------------------------------------------------------------------------ */
  /* Add files                                                                */
  /* ------------------------------------------------------------------------ */

  const addFiles = useCallback(
    async (incoming: File[]) => {
      setError(null);

      const current = itemsRef.current;
      const accepted: File[] = [];

      let problem: FormError | null = null;
      let remaining = Math.max(0, maxImages - current.length);

      for (const file of incoming) {
        if (!isAllowedImageType(file)) {
          problem = {
            title: "Unsupported image format.",
            message: "Please use JPG, JPEG, PNG, or WebP images.",
          };
          continue;
        }

        if (file.size === 0) {
          problem = {
            title: "This image is empty.",
            message: "Please select another image.",
          };
          continue;
        }

        if (file.size > maxSizeMB * 1024 * 1024) {
          problem = {
            title: "Image is too large.",
            message: `Each image must be ${maxSizeMB} MB or smaller.`,
          };
          continue;
        }

        const alreadyAdded =
          current.some((item) => sameFile(item.file, file)) ||
          accepted.some((picked) => sameFile(picked, file));

        if (alreadyAdded) continue;

        if (remaining <= 0) {
          problem = {
            title: "Image limit reached.",
            message: `You can upload up to ${maxImages} images.`,
          };
          break;
        }

        accepted.push(file);
        remaining--;
      }

      if (accepted.length > 0) {
        setReading(true);

        // Read every picked file into memory now.
        const results = await Promise.allSettled(accepted.map(snapshotFile));

        const next: UploadItem[] = [];

        for (const result of results) {
          if (result.status === "rejected") {
            problem = {
              title: "We couldn't read that image.",
              message:
                "Your device wouldn't let this page open it. If the photo is in Google Photos, iCloud or Drive, save it to your phone first, or choose a different image.",
            };
            continue;
          }

          try {
            next.push({
              id: ++idCounter.current,
              file: result.value,
              url: URL.createObjectURL(result.value),
            });
          } catch {
            problem = {
              title: "Could not preview this image.",
              message: "Please try selecting the image again.",
            };
          }
        }

        setReading(false);

        if (next.length) {
          // The list may have changed while we were reading.
          const merged = [...itemsRef.current, ...next];
          const kept = merged.slice(0, maxImages);

          merged
            .slice(maxImages)
            .forEach((item) => URL.revokeObjectURL(item.url));

          itemsRef.current = kept;
          setItems(kept);
        }
      }

      if (problem) setError(problem);
    },
    [maxImages, maxSizeMB],
  );
  /* ------------------------------------------------------------------------ */
  /* Remove image                                                             */
  /* ------------------------------------------------------------------------ */

  const removeItem = (id: number) => {
    if (loading) return;

    setError(null);

    const target = itemsRef.current.find((item) => item.id === id);

    if (target) {
      URL.revokeObjectURL(target.url);
    }

    // Do not reuse a Cloudinary asset if its image is removed from the form.
    uploadedRef.current.delete(id);

    const next = itemsRef.current.filter((item) => item.id !== id);

    itemsRef.current = next;
    setItems(next);
  };

  /* ------------------------------------------------------------------------ */
  /* Reset                                                                    */
  /* ------------------------------------------------------------------------ */

  const reset = () => {
    itemsRef.current.forEach((item) => URL.revokeObjectURL(item.url));

    // Clearing the form also clears its successful-upload cache.
    uploadedRef.current.clear();

    itemsRef.current = [];
    setItems([]);
    setDescription("");
    setError(null);
    setUploadProgress(0);

    if (fileInput.current) {
      fileInput.current.value = "";
    }
  };

  /* ------------------------------------------------------------------------ */
  /* File picker                                                              */
  /* ------------------------------------------------------------------------ */

  const openPicker = () => {
    if (loading) return;
    fileInput.current?.click();
  };

  /* ------------------------------------------------------------------------ */
  /* Drag and drop                                                            */
  /* ------------------------------------------------------------------------ */

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (loading || !event.dataTransfer.types.includes("Files")) return;

    event.preventDefault();
    setDragging(true);
  };

  const onDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setDragging(false);
    }
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    if (loading) return;

    event.preventDefault();
    setDragging(false);
    addFiles(Array.from(event.dataTransfer.files));
  };

  /* ------------------------------------------------------------------------ */
  /* Paste images                                                             */
  /* ------------------------------------------------------------------------ */

  const onPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    if (loading) return;

    const files = Array.from(event.clipboardData.files).filter(
      (file) => file.type.startsWith("image/") || !file.type,
    );

    if (!files.length) return;

    event.preventDefault();
    addFiles(files);
  };

  /* ------------------------------------------------------------------------ */
  /* Submit                                                                   */
  /* ------------------------------------------------------------------------ */

  const handleSubmit = async () => {
    if (!canSubmit || submittingRef.current) return;

    submittingRef.current = true;
    setError(null);
    setBusy(true);
    setUploadProgress(0);

    const selectedItems = [...itemsRef.current];
    const totalImages = selectedItems.length;
    const progress = new Array(totalImages).fill(0);

    if (totalImages > 0) {
      onUploadProgressChange?.({
        uploading: true,
        progress: 0,
        imageCount: totalImages,
      });
    }

    try {
      const cloudinaryFiles: SubmissionFile[] = [];

      // Upload sequentially to reduce memory use on mobile devices.
      for (let index = 0; index < selectedItems.length; index++) {
        const item = selectedItems[index];

        // A prior attempt may already have uploaded this image successfully.
        const cachedUpload = uploadedRef.current.get(item.id);

        if (cachedUpload) {
          cloudinaryFiles.push(cachedUpload);
          progress[index] = 100;
          updateProgress(progress, totalImages);
          continue;
        }

        try {
          const preparedFile = await prepareImage(item.file, {
            maxBytes: maxSizeMB * 1024 * 1024,
          });

          const result = await uploadToCloudinary(preparedFile, {
            onProgress: (value) => {
              progress[index] = Math.max(0, Math.min(100, value));
              updateProgress(progress, totalImages);
            },
          });

          const uploadedFile: SubmissionFile = {
            publicId: result.publicId,
            secureUrl: result.secureUrl,
          };

          // Cache immediately after each successful upload. If a later image
          // or the submission API fails, this result survives for the retry.
          uploadedRef.current.set(item.id, uploadedFile);
          cloudinaryFiles.push(uploadedFile);

          progress[index] = 100;
          updateProgress(progress, totalImages);
        } catch (imageError) {
          const reason =
            imageError instanceof Error && imageError.message
              ? imageError.message
              : "Please check your connection and try again.";

          throw new Error(`Image ${index + 1} (${item.file.name}): ${reason}`);
        }
      }

      /**
       * Important: onSubmit must reject/throw if saving the submission fails.
       * If its caller catches an API error without rethrowing, this component
       * cannot tell the save failed and will treat it as a successful submit.
       */
      if (!onSubmit) {
        throw new Error("The submission handler is not configured.");
      }

      await onSubmit({
        description: description.trim(),
        files: cloudinaryFiles,
      });

      setUploadProgress(100);
      reset();
    } catch (submissionError) {
      setError({
        title: "We couldn't submit your evidence.",
        message:
          submissionError instanceof Error && submissionError.message
            ? submissionError.message
            : "Something went wrong. Please check your connection and try again.",
      });
    } finally {
      onUploadProgressChange?.({
        uploading: false,
        progress: 0,
        imageCount: itemsRef.current.length,
      });

      submittingRef.current = false;
      setBusy(false);
    }
  };

  function updateProgress(progress: number[], imageCount: number) {
    if (imageCount === 0) return;

    const totalProgress = progress.reduce((sum, value) => sum + value, 0);
    const roundedProgress = Math.round(totalProgress / imageCount);

    setUploadProgress(roundedProgress);

    onUploadProgressChange?.({
      uploading: true,
      progress: roundedProgress,
      imageCount,
    });
  }

  /* ------------------------------------------------------------------------ */
  /* Keyboard submit                                                          */
  /* ------------------------------------------------------------------------ */

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      void handleSubmit();
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <div className={`relative w-full space-y-4 ${className}`}>
      {withBackdrop && (
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="sf-drift absolute -left-10 -top-10 size-56 rounded-full bg-blue-300/60 blur-3xl" />
          <div className="absolute -bottom-12 -right-10 size-64 rounded-full bg-violet-300/60 blur-3xl" />
          <div className="absolute left-1/2 top-1/3 size-40 -translate-x-1/2 rounded-full bg-cyan-200/50 blur-3xl" />
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div>
          <h6 className="text-base font-semibold tracking-tight text-secondary-blue sm:text-sm">
            Done with today&apos;s Work
          </h6>
          <p className="mt-0.5 text-xs text-gray-500">
            You can attach up to {maxImages} images.
          </p>
        </div>

        {hasContent && !loading && (
          <button
            type="button"
            onClick={() => {
              reset();
              onCancel?.();
            }}
            aria-label="Clear submission"
            className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-neutral-600 transition-all hover:-translate-y-0.5 hover:bg-white/70 hover:text-neutral-950 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/30 ${GLASS_INNER}`}
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div
        onDragOver={onDragOver}
        onDragEnter={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative overflow-hidden rounded-2xl transition-all duration-200 ${GLASS} ${
          dragging ? "ring-4 ring-blue-400/30" : ""
        }`}
      >
        <div className="p-4 sm:p-5">
          {items.length === 0 ? (
            <button
              type="button"
              onClick={openPicker}
              disabled={loading}
              className="group flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-blue-300/80 bg-white/30 px-5 py-9 text-center backdrop-blur-md transition-all duration-200 hover:border-blue-400 hover:bg-white/55 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="mb-3 flex size-11 items-center justify-center rounded-xl border border-white/80 bg-white/70 text-blue-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_14px_-6px_rgba(60,70,160,0.35)] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-105">
                <ImagePlus className="size-5" />
              </span>

              <span className="text-sm font-semibold text-neutral-900">
                Upload your evidence
              </span>
              <span className="mt-1.5 text-xs leading-relaxed text-neutral-600">
                Select images from your phone or computer
              </span>
              <span className="mt-3 text-[11px] font-medium text-neutral-500">
                JPG, PNG, WebP · Up to {maxImages} images · {maxSizeMB}MB each
              </span>
            </button>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {items.map((item, index) => (
                  <div key={item.id} className="sf-pop group relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={`Evidence ${index + 1}`}
                      title={item.file.name}
                      className="size-20 rounded-xl border-2 border-white/80 object-cover shadow-[0_8px_18px_-8px_rgba(60,70,160,0.45)] sm:size-24"
                    />

                    {!loading && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        aria-label={`Remove ${item.file.name}`}
                        className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full border border-white/80 bg-neutral-900/85 text-white shadow-md backdrop-blur transition-transform hover:scale-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/30"
                      >
                        <X className="size-3" strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                ))}

                {items.length < maxImages && (
                  <button
                    type="button"
                    onClick={openPicker}
                    disabled={loading}
                    aria-label="Add more evidence images"
                    className="flex size-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-blue-300/80 bg-white/30 text-neutral-500 backdrop-blur-md transition-all hover:border-blue-400 hover:bg-white/60 hover:text-blue-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/30 disabled:cursor-not-allowed disabled:opacity-50 sm:size-24"
                  >
                    <Plus className="size-5" />
                    <span className="text-[10px] font-medium">Add</span>
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-neutral-600">
                  <ImageIcon className="size-3.5 text-blue-500" />
                  <span>
                    {items.length} of {maxImages} images
                  </span>
                </div>

                <span className="text-[11px] text-neutral-500">
                  {items.length < maxImages
                    ? `${maxImages - items.length} remaining`
                    : "Maximum reached"}
                </span>
              </div>
            </div>
          )}

          <div className="mt-5 border-t border-white/60 pt-4">
            <label
              htmlFor="submission-description"
              className="mb-2 block text-sm font-medium text-neutral-900"
            >
              What did you work on?
              <span className="ml-1.5 font-normal text-neutral-500">
                Optional
              </span>
            </label>

            <textarea
              id="submission-description"
              ref={textarea}
              value={description}
              disabled={loading}
              onChange={(event) =>
                setDescription(event.target.value.slice(0, maxLength))
              }
              onPaste={onPaste}
              onKeyDown={onKeyDown}
              rows={3}
              placeholder={placeholder}
              className="block max-h-52 min-h-[88px] w-full resize-none rounded-xl border border-white/70 bg-white/40 px-3.5 py-3 text-sm leading-relaxed text-neutral-900 shadow-[inset_0_1px_2px_rgba(60,70,160,0.08)] outline-none backdrop-blur-md transition-all placeholder:text-neutral-500 focus:border-blue-400 focus:bg-white/70 focus:ring-4 focus:ring-blue-400/20 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-[11px] text-neutral-500">
                Briefly explain what your evidence shows.
              </p>
              <span className="shrink-0 text-[11px] tabular-nums text-neutral-500">
                {description.length}/{maxLength}
              </span>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-xl bg-red-500 px-3.5 py-3 text-sm text-white"
            >
              <p className="font-medium">{error.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed">{error.message}</p>
            </div>
          )}

          {loading && (
            <div className="mt-4 rounded-xl border border-blue-200/80 bg-white/50 px-3.5 py-3 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/80 text-blue-500 shadow-sm">
                  <Loader2 className="size-4 animate-spin" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-blue-950">
                      Uploading your evidence...
                    </p>
                    <span className="text-xs font-medium tabular-nums text-blue-800/70">
                      {uploadProgress}%
                    </span>
                  </div>

                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-blue-100">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-[width] duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>

                  <p className="mt-1.5 text-xs text-blue-800/70">
                    Please keep this page open.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl border-2 border-dashed border-blue-400 bg-blue-100/70 backdrop-blur-md transition-opacity duration-200 ${
            dragging ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex flex-col items-center gap-2 text-blue-700">
            <span className="flex size-11 items-center justify-center rounded-xl bg-white/80 shadow-sm">
              <ImagePlus className="size-5" />
            </span>
            <span className="text-sm font-semibold">
              Drop your evidence here
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs leading-relaxed text-neutral-600">
          <p>
            {requireImage
              ? "Evidence is required for today's submission."
              : "Add an image or a short note to submit."}
          </p>
        </div>

        <GeneralButton
          text={loading ? "Uploading..." : submitLabel}
          buttonFunction={() => void handleSubmit()}
          variant={!canSubmit ? "disabled" : "active"}
        />
      </div>

      <input
        ref={fileInput}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        multiple
        hidden
        disabled={loading}
        onChange={(event) => {
          const input = event.currentTarget;
          const picked = Array.from(input.files ?? []);

          // Read the files first, then clear the input so the same file can be picked again.
          void addFiles(picked).finally(() => {
            input.value = "";
          });
        }}
      />
    </div>
  );
}

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

  /**
   * Paint a soft gradient behind the glass so the blur has something to frost.
   * Turn off when the form already sits on a coloured or image background.
   */
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

const sameFile = (a: File, b: File) =>
  a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;

// frosted panel: translucent white, blur, light border, bright top edge
const GLASS =
  "border border-white/60 bg-white/40 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_32px_-8px_rgba(60,70,160,0.25)]";

// smaller frosted surface used inside the panel
const GLASS_INNER = "border border-white/70 bg-white/30 backdrop-blur-md";

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function SubmissionForm({
  onSubmit,
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

  itemsRef.current = items;

  const loading = submitting || busy;

  /*
   * An image is the required part.
   * When images are optional, at least a description or image
   * is still needed so an empty form cannot be submitted.
   */
  const canSubmit =
    !loading &&
    (requireImage
      ? items.length > 0
      : items.length > 0 || description.trim().length > 0);

  const hasContent = items.length > 0 || description.trim().length > 0;

  /* ------------------------------------------------------------------------ */
  /* Cleanup                                                                  */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    return () => {
      itemsRef.current.forEach((item) => {
        URL.revokeObjectURL(item.url);
      });
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
    (incoming: File[]) => {
      setError(null);

      const current = itemsRef.current;
      const next: UploadItem[] = [];

      let problem: FormError | null = null;
      let remaining = maxImages - current.length;

      for (const file of incoming) {
        if (!file.type.startsWith("image/")) {
          problem = {
            title: "We couldn't use that file.",
            message: "Only image files can be uploaded.",
          };

          continue;
        }

        if (file.size > maxSizeMB * 1024 * 1024) {
          problem = {
            title: "We couldn't use that file.",
            message: `Each image must be under ${maxSizeMB}MB.`,
          };

          continue;
        }

        const alreadyAdded =
          current.some((item) => sameFile(item.file, file)) ||
          next.some((item) => sameFile(item.file, file));

        if (alreadyAdded) continue;

        if (remaining <= 0) {
          problem = {
            title: "Image limit reached.",
            message: `You can upload up to ${maxImages} images.`,
          };

          break;
        }

        next.push({
          id: ++idCounter.current,
          file,
          url: URL.createObjectURL(file),
        });

        remaining--;
      }

      if (next.length) {
        const merged = [...current, ...next];

        // Keeps rapid back-to-back adds correct.
        itemsRef.current = merged;
        setItems(merged);
      }

      if (problem) {
        setError(problem);
      }
    },
    [maxImages, maxSizeMB],
  );

  /* ------------------------------------------------------------------------ */
  /* Remove image                                                             */
  /* ------------------------------------------------------------------------ */

  const removeItem = (id: number) => {
    setError(null);

    const target = itemsRef.current.find((item) => item.id === id);

    if (target) {
      URL.revokeObjectURL(target.url);
    }

    const next = itemsRef.current.filter((item) => item.id !== id);

    itemsRef.current = next;
    setItems(next);
  };

  /* ------------------------------------------------------------------------ */
  /* Reset                                                                    */
  /* ------------------------------------------------------------------------ */

  const reset = () => {
    itemsRef.current.forEach((item) => {
      URL.revokeObjectURL(item.url);
    });

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
    if (loading) return;

    if (!event.dataTransfer.types.includes("Files")) {
      return;
    }

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

    const files = Array.from(event.clipboardData.files).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (!files.length) return;

    event.preventDefault();

    addFiles(files);
  };

  /* ------------------------------------------------------------------------ */
  /* Submit                                                                   */
  /* ------------------------------------------------------------------------ */

  const handleSubmit = async () => {
    /*
     * The ref blocks a second submit fired before the loading
     * state has rendered.
     */
    if (!canSubmit || submittingRef.current) {
      return;
    }

    submittingRef.current = true;

    setError(null);
    setBusy(true);
    setUploadProgress(0);

    try {
      const selectedFiles = itemsRef.current.map((item) => item.file);

      /*
       * Each image has its own upload progress.
       *
       * We store progress for every image and calculate the
       * average so the UI represents the whole submission.
       */
      const progress = new Array(selectedFiles.length).fill(0);

      const cloudinaryFiles: SubmissionFile[] = [];

      for (let index = 0; index < selectedFiles.length; index++) {
        const originalFile = selectedFiles[index];

        /*
         * Step 1:
         * Validate, resize and compress the image in the browser.
         */
        const preparedFile = await prepareImage(originalFile);

        /*
         * Step 2:
         * Upload the prepared image directly to Cloudinary.
         */
        const result = await uploadToCloudinary(preparedFile, {
          onProgress: (value) => {
            progress[index] = value;

            const totalProgress = progress.reduce(
              (sum, current) => sum + current,
              0,
            );

            const averageProgress = totalProgress / progress.length;

            setUploadProgress(Math.round(averageProgress));
          },
        });

        cloudinaryFiles.push({
          publicId: result.publicId,
          secureUrl: result.secureUrl,
        });
      }
      console.log("All Cloudinary uploads succeeded:", cloudinaryFiles);
      /*
       * All Cloudinary uploads succeeded.
       *
       * The parent/dashboard now receives only the metadata
       * required for the submission API.
       */
      await onSubmit?.({
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
            : "Something went wrong. Please try again.",
      });
    } finally {
      submittingRef.current = false;
      setBusy(false);
    }
  };

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
    <div
      className={`relative w-full space-y-4 ${
        withBackdrop ? "" : ""
      } ${className}`}
    >
      {/* Soft colour blobs the glass can frost */}
      {withBackdrop && (
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="sf-drift absolute -left-10 -top-10 size-56 rounded-full bg-blue-300/60 blur-3xl" />

          <div className="absolute -bottom-12 -right-10 size-64 rounded-full bg-violet-300/60 blur-3xl" />

          <div className="absolute left-1/2 top-1/3 size-40 -translate-x-1/2 rounded-full bg-cyan-200/50 blur-3xl" />
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Header                                                             */}
      {/* ------------------------------------------------------------------ */}

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

      {/* ------------------------------------------------------------------ */}
      {/* Main glass card                                                    */}
      {/* ------------------------------------------------------------------ */}

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
          {/* ---------------------------- upload area ---------------------------- */}

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
                Drop images here or click to browse
              </span>

              <span className="mt-3 text-[11px] font-medium text-neutral-500">
                Up to {maxImages} images · {maxSizeMB}MB each
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

          {/* ----------------------------- description ----------------------------- */}

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

          {/* --------------------------------- error --------------------------------- */}

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-xl bg-red-500 px-3.5 py-3 text-sm text-white"
            >
              <p className="font-medium">{error.title}</p>

              <p className="mt-0.5 text-xs leading-relaxed">{error.message}</p>
            </div>
          )}

          {/* ------------------------------ submitting ------------------------------ */}

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
                      style={{
                        width: `${uploadProgress}%`,
                      }}
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

        {/* ------------------------------ drag overlay ------------------------------ */}

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

      {/* ------------------------------------------------------------------ */}
      {/* Footer / action                                                    */}
      {/* ------------------------------------------------------------------ */}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs leading-relaxed text-neutral-600">
          <p>
            {requireImage
              ? "Evidence is required for today's submission."
              : "Add an image or a short note to submit."}
          </p>
        </div>

        {/* 3D blue button */}
        <GeneralButton
          text={loading ? "Uploading..." : submitLabel}
          buttonFunction={() => void handleSubmit()}
          variant={!canSubmit ? "disabled" : "active"}
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Hidden file input                                                   */}
      {/* ------------------------------------------------------------------ */}

      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        disabled={loading}
        onChange={(event) => {
          addFiles(Array.from(event.target.files ?? []));

          // Reset so the same file can be picked again after removing it.
          event.target.value = "";
        }}
      />
    </div>
  );
}

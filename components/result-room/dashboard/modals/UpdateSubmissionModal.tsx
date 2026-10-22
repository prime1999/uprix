"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  CheckCircle2,
  CloudUpload,
  ImagePlus,
  LoaderCircle,
  Pencil,
  RotateCcw,
  Trash2,
  Undo2,
} from "lucide-react";

import GeneralButton from "@/components/miscelleneous/generalButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  useResultRoomMySubmission,
  useUpdateResultRoomSubmission,
} from "@/lib/queries/result-room";
// TODO: point this at your existing Cloudinary helper. It must accept a File
// and resolve to { publicId, secureUrl }.
import { uploadToCloudinary } from "@/lib/cloudinary/upload";

/* -------------------------------------------------------------------------- */
/* Constants (match these to your create-form validation rules)               */
/* -------------------------------------------------------------------------- */

const MAX_IMAGES = 5;
const MIN_IMAGES = 1;
const MAX_FILE_SIZE_MB = 10;
const DESCRIPTION_MAX = 1000;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface UpdateSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Today's submission date (YYYY-MM-DD) used to load the current submission. */
  date: string;
  onUpdated?: () => void;
}

type ExistingItem = {
  key: string;
  kind: "existing";
  id: string;
  url: string;
};

type NewItem = {
  key: string;
  kind: "new";
  file: File;
  url: string; // object URL preview
};

type ImageItem = ExistingItem | NewItem;

type Phase = "form" | "uploading" | "saving" | "success" | "error";

type UploadedFile = { publicId: string; secureUrl: string };

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Tailwind `md` breakpoint. Dialog at/above it, bottom sheet below it. */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(media.matches);

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isDesktop;
}

/* -------------------------------------------------------------------------- */
/* Design tokens (shared look with SubmissionViewModal)                       */
/* -------------------------------------------------------------------------- */

const GLASS_INNER = "border border-white/70 bg-white/40 backdrop-blur-md";

const SURFACE =
  "isolate flex flex-col gap-0 overflow-hidden border border-white/70 bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 p-0 shadow-2xl";

function Tile3D({
  children,
  tone = "blue",
}: {
  children: React.ReactNode;
  tone?: "blue" | "red" | "green";
}) {
  const palette = {
    blue: "border-blue-400/80 from-blue-400 via-blue-500 to-blue-600 shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_8px_16px_-6px_rgba(59,130,246,0.6)]",
    red: "border-red-400/80 from-red-400 via-red-500 to-red-600 shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_8px_16px_-6px_rgba(239,68,68,0.6)]",
    green:
      "border-emerald-400/80 from-emerald-400 via-emerald-500 to-emerald-600 shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_8px_16px_-6px_rgba(16,185,129,0.6)]",
  }[tone];

  return (
    <span
      className={`relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-gradient-to-b text-white ${palette}`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-1.5 top-0.5 h-1/2 rounded-xl bg-gradient-to-b from-white/50 to-transparent"
      />
      <span className="relative">{children}</span>
    </span>
  );
}

function Button3D({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl border border-blue-400/80 bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_8px_16px_-6px_rgba(59,130,246,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/40 active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-2 top-0.5 h-1/2 rounded-lg bg-gradient-to-b from-white/45 to-transparent"
      />
      <span className="relative inline-flex items-center gap-2">
        {children}
      </span>
    </button>
  );
}

function GlassButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-neutral-700 transition-all hover:-translate-y-0.5 hover:bg-white/70 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/30 disabled:pointer-events-none disabled:opacity-50 ${GLASS_INNER}`}
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function UpdateSubmissionModal({
  isOpen,
  onClose,
  date,
  onUpdated,
}: UpdateSubmissionModalProps) {
  const isDesktop = useIsDesktop();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("form");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<ImageItem[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cleanupWarning, setCleanupWarning] = useState<string | null>(null);
  const [initializedFor, setInitializedFor] = useState<string | null>(null);

  // Keeps Cloudinary results so a retry after a failed PATCH never re-uploads.
  const uploadedRef = useRef<Map<string, UploadedFile>>(new Map());
  // Always holds the latest items so unmount cleanup can revoke preview URLs.
  const itemsRef = useRef<ImageItem[]>([]);
  itemsRef.current = items;

  const query = useResultRoomMySubmission(date, isOpen);
  const submission = query.data?.submission ?? null;
  const mutation = useUpdateResultRoomSubmission();

  const isBusy = phase === "uploading" || phase === "saving";

  /* ----------------------------- initialisation ---------------------------- */

  useEffect(() => {
    if (!isOpen || !submission || initializedFor === submission.id) return;

    setDescription(submission.description ?? "");
    setItems(
      submission.images.map((image) => ({
        key: `existing-${image.id}`,
        kind: "existing" as const,
        id: image.id,
        url: image.url,
      })),
    );
    setInitializedFor(submission.id);
  }, [isOpen, submission, initializedFor]);

  const revokeNewPreviews = useCallback((list: ImageItem[]) => {
    list.forEach((item) => {
      if (item.kind === "new") URL.revokeObjectURL(item.url);
    });
  }, []);

  // Reset everything when the modal closes.
  useEffect(() => {
    if (isOpen) return;

    revokeNewPreviews(itemsRef.current);
    uploadedRef.current.clear();
    setItems([]);
    setDescription("");
    setInitializedFor(null);
    setFormError(null);
    setErrorMessage(null);
    setCleanupWarning(null);
    setPhase("form");
    mutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    return () => revokeNewPreviews(itemsRef.current);
  }, [revokeNewPreviews]);

  /* -------------------------------- derived -------------------------------- */

  const retainedIds = useMemo(
    () =>
      items
        .filter((item): item is ExistingItem => item.kind === "existing")
        .map((item) => item.id),
    [items],
  );

  const newItems = useMemo(
    () => items.filter((item): item is NewItem => item.kind === "new"),
    [items],
  );

  const removedCount = (submission?.images.length ?? 0) - retainedIds.length;

  const isDirty =
    !!submission &&
    (description.trim() !== (submission.description ?? "").trim() ||
      removedCount > 0 ||
      newItems.length > 0);

  /* -------------------------------- handlers ------------------------------- */

  function handleOpenChange(open: boolean) {
    // Never allow dismissing while uploading/saving.
    if (!open && !isBusy) onClose();
  }

  function handleFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (selected.length === 0) return;

    const problems: string[] = [];
    const accepted: NewItem[] = [];
    let slots = MAX_IMAGES - items.length;

    for (const file of selected) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        problems.push(`${file.name} is not a supported image type.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        problems.push(`${file.name} is larger than ${MAX_FILE_SIZE_MB}MB.`);
        continue;
      }

      if (slots <= 0) {
        problems.push(`You can attach up to ${MAX_IMAGES} images.`);
        break;
      }

      slots -= 1;
      accepted.push({
        key: `new-${crypto.randomUUID()}`,
        kind: "new",
        file,
        url: URL.createObjectURL(file),
      });
    }

    if (accepted.length > 0) setItems((current) => [...current, ...accepted]);
    setFormError(problems.length > 0 ? problems[0] : null);
  }

  function removeItem(key: string) {
    setItems((current) => {
      const target = current.find((item) => item.key === key);
      if (target?.kind === "new") {
        URL.revokeObjectURL(target.url);
        uploadedRef.current.delete(target.key);
      }
      return current.filter((item) => item.key !== key);
    });
    setFormError(null);
  }

  function resetToOriginal() {
    if (!submission) return;

    revokeNewPreviews(items);
    uploadedRef.current.clear();
    setDescription(submission.description ?? "");
    setItems(
      submission.images.map((image) => ({
        key: `existing-${image.id}`,
        kind: "existing" as const,
        id: image.id,
        url: image.url,
      })),
    );
    setFormError(null);
  }

  async function handleSubmit() {
    if (isBusy || !submission) return;

    if (items.length < MIN_IMAGES) {
      setFormError("Attach at least one evidence image.");
      return;
    }

    setFormError(null);
    setErrorMessage(null);

    try {
      // 1. Upload only the new images, reusing earlier successful uploads.
      setPhase("uploading");

      const newFiles: UploadedFile[] = [];

      for (const item of newItems) {
        let uploaded = uploadedRef.current.get(item.key);

        if (!uploaded) {
          uploaded = await uploadToCloudinary(item.file);
          uploadedRef.current.set(item.key, uploaded);
        }

        newFiles.push({
          publicId: uploaded.publicId,
          secureUrl: uploaded.secureUrl,
        });
      }

      // 2. Send the PATCH.
      setPhase("saving");

      const result = await mutation.mutateAsync({
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        description: description.trim(),
        retainedFileIds: retainedIds,
        newFiles,
      });

      setCleanupWarning(result.cleanupWarning ?? null);
      setPhase("success");
      onUpdated?.();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while updating your submission.",
      );
      setPhase("error");
    }
  }

  async function handleReloadSubmission() {
    // After a partial failure the server state is the source of truth.
    revokeNewPreviews(items);
    uploadedRef.current.clear();
    setInitializedFor(null);
    mutation.reset();
    setErrorMessage(null);
    setPhase("form");
    await query.refetch();
  }

  const needsReload = !!errorMessage && /reload/i.test(errorMessage);

  /* --------------------------------- parts --------------------------------- */

  const Title = isDesktop ? DialogTitle : SheetTitle;
  const Description = isDesktop ? DialogDescription : SheetDescription;

  const blobs = (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="sv-drift absolute -left-10 -top-10 size-56 rounded-full bg-blue-300/60 blur-3xl" />
      <div className="absolute -bottom-12 -right-10 size-64 rounded-full bg-violet-300/60 blur-3xl" />
      <div className="absolute left-1/2 top-1/3 size-40 -translate-x-1/2 rounded-full bg-cyan-200/50 blur-3xl" />
    </div>
  );

  const header = (
    <header className="shrink-0 border-b border-white/60 bg-white/30 px-5 py-4 pr-14 text-left backdrop-blur-xl">
      <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold tracking-wide text-neutral-600">
        <Pencil className="size-4 text-blue-500" />
        <span>RESULT ROOM</span>
      </div>

      <Title className="text-lg font-heading font-semibold tracking-tight text-secondary-blue">
        Edit your submission
      </Title>

      <Description className="mt-1 text-sm text-neutral-600">
        Update your description or swap evidence before today&apos;s deadline.
      </Description>
    </header>
  );

  let body: React.ReactNode;

  if (query.isLoading) {
    body = (
      <StateBlock
        tile={
          <Tile3D>
            <LoaderCircle className="size-6 animate-spin" />
          </Tile3D>
        }
        title="Loading your submission..."
      />
    );
  } else if (query.isError || !submission) {
    body = (
      <StateBlock
        tile={
          <Tile3D tone="red">
            <AlertCircle className="size-6" />
          </Tile3D>
        }
        title={
          query.isError ? "Could not load submission" : "No submission to edit"
        }
        body={
          query.isError
            ? query.error instanceof Error
              ? query.error.message
              : "Something went wrong while loading this submission."
            : "You need to submit today's task before you can edit it."
        }
        action={
          query.isError ? (
            <GeneralButton
              text="Try again"
              variant="active"
              buttonFunction={() => void query.refetch()}
            />
          ) : undefined
        }
      />
    );
  } else if (isBusy) {
    body = (
      <PendingState
        phase={phase as "uploading" | "saving"}
        newCount={newItems.length}
      />
    );
  } else if (phase === "success") {
    body = (
      <StateBlock
        tile={
          <Tile3D tone="green">
            <CheckCircle2 className="size-7" />
          </Tile3D>
        }
        title="Submission updated"
        body="Your changes have been saved and will show on your dashboard."
        extra={
          cleanupWarning ? (
            <p className="mt-4 max-w-sm rounded-xl border border-amber-300/80 bg-amber-100/60 px-3 py-2 text-xs leading-5 text-amber-900 backdrop-blur-md">
              {cleanupWarning}
            </p>
          ) : null
        }
      />
    );
  } else if (phase === "error") {
    body = (
      <StateBlock
        tile={
          <Tile3D tone="red">
            <AlertCircle className="size-7" />
          </Tile3D>
        }
        title="Could not update submission"
        body={errorMessage ?? undefined}
        action={
          <div className="flex flex-wrap items-center justify-center gap-3">
            {needsReload ? (
              <Button3D onClick={() => void handleReloadSubmission()}>
                <RotateCcw className="size-4" />
                Reload submission
              </Button3D>
            ) : (
              <Button3D onClick={() => void handleSubmit()}>
                <RotateCcw className="size-4" />
                Try again
              </Button3D>
            )}
            <GlassButton onClick={() => setPhase("form")}>
              Back to edit
            </GlassButton>
          </div>
        }
      />
    );
  } else {
    body = (
      <div className="space-y-6 p-5">
        {/* Description */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <label
              htmlFor="update-description"
              className="text-sm font-semibold text-neutral-900"
            >
              Submission description
            </label>
            <span className="text-xs tabular-nums text-neutral-500">
              {description.length}/{DESCRIPTION_MAX}
            </span>
          </div>

          <textarea
            id="update-description"
            value={description}
            maxLength={DESCRIPTION_MAX}
            rows={5}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe what you completed today..."
            className={`w-full resize-none rounded-xl p-4 text-sm leading-6 text-neutral-800 shadow-[inset_0_2px_6px_rgba(60,70,160,0.12)] placeholder:text-neutral-400 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-400/30 ${GLASS_INNER}`}
          />
        </section>

        {/* Evidence */}
        <section>
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-neutral-900">
              Supporting evidence
            </h3>
            <p className="mt-1 text-xs text-neutral-600">
              {items.length} of {MAX_IMAGES} images
              {removedCount > 0 && ` · ${removedCount} to remove`}
              {newItems.length > 0 && ` · ${newItems.length} new`}
            </p>
          </div>

          <ul className="grid grid-cols-3 gap-3">
            {items.map((item, i) => (
              <li
                key={item.key}
                className="relative aspect-square overflow-hidden rounded-2xl bg-white shadow-[0_12px_24px_-12px_rgba(30,40,120,0.5)] ring-1 ring-black/5"
              >
                <Image
                  src={item.url}
                  alt={`Evidence image ${i + 1}`}
                  fill
                  unoptimized
                  sizes="120px"
                  draggable={false}
                  className="object-cover"
                />

                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/35 to-transparent"
                />

                {item.kind === "new" && (
                  <span className="absolute left-1.5 top-1.5 rounded-full border border-blue-300/80 bg-gradient-to-b from-blue-400 to-blue-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
                    NEW
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => removeItem(item.key)}
                  aria-label={`Remove image ${i + 1}`}
                  className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full border border-white/60 bg-white/25 text-white backdrop-blur-md transition hover:bg-red-500/80 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-400/50"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}

            {items.length < MAX_IMAGES && (
              <li>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-blue-300/80 bg-white/30 text-xs font-medium text-neutral-600 backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/60 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/40"
                >
                  <ImagePlus className="size-5 text-blue-500" />
                  Add image
                </button>
              </li>
            )}
          </ul>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            multiple
            hidden
            onChange={handleFilesSelected}
          />

          {formError && (
            <p
              role="alert"
              className="mt-3 flex items-start gap-2 rounded-xl border border-red-300/80 bg-red-100/60 px-3 py-2 text-xs text-red-800 backdrop-blur-md"
            >
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              {formError}
            </p>
          )}
        </section>
      </div>
    );
  }

  const footer = (
    <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-white/60 bg-white/30 px-5 py-3 backdrop-blur-xl">
      {phase === "form" && submission && !query.isLoading ? (
        <>
          <GeneralButton
            buttonFunction={resetToOriginal}
            variant={!isDirty ? "disabled" : "reset"}
          >
            <Undo2 className="size-4" />
            Reset
          </GeneralButton>

          <div className="flex items-center gap-2">
            <GeneralButton variant="danger" buttonFunction={onClose}>
              Cancel
            </GeneralButton>
            <GeneralButton
              buttonFunction={() => void handleSubmit()}
              variant={!isDirty ? "disabled" : "active"}
            >
              <CloudUpload className="size-4" />
              Save changes
            </GeneralButton>
          </div>
        </>
      ) : phase === "success" ? (
        <>
          <span />
          <GeneralButton
            text="Done"
            variant="active"
            buttonFunction={onClose}
          />
        </>
      ) : (
        <>
          <span />
          {!isBusy && <GlassButton onClick={onClose}>Close</GlassButton>}
        </>
      )}
    </footer>
  );

  // Header and footer stay fixed; only the body scrolls.
  const content = (
    <>
      {blobs}
      {header}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {body}
      </div>
      {footer}
    </>
  );

  // Hides Radix's built-in X while a request is in flight.
  const hideClose = isBusy ? "[&>button]:hidden" : "";
  const blockDismiss = (event: Event) => {
    if (isBusy) event.preventDefault();
  };

  /* --------------------------------- render -------------------------------- */

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent
          onInteractOutside={blockDismiss}
          onEscapeKeyDown={blockDismiss}
          className={`${SURFACE} ${hideClose} max-h-[90vh] w-full max-w-md rounded-3xl sm:max-w-md`}
        >
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        onInteractOutside={blockDismiss}
        onEscapeKeyDown={blockDismiss}
        // Never taller than half the page; the body area scrolls inside.
        className={`${SURFACE} ${hideClose} h-auto max-h-[50dvh] rounded-t-3xl`}
      >
        {content}
      </SheetContent>
    </Sheet>
  );
}

/* -------------------------------------------------------------------------- */
/* State blocks                                                               */
/* -------------------------------------------------------------------------- */

function StateBlock({
  tile,
  title,
  body,
  action,
  extra,
}: {
  tile: React.ReactNode;
  title: string;
  body?: string;
  action?: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-48 flex-col items-center justify-center px-6 py-6 text-center"
      role="status"
    >
      <div className="mb-4">{tile}</div>

      <h3 className="font-semibold text-neutral-950">{title}</h3>

      {body && (
        <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-600">
          {body}
        </p>
      )}

      {extra}

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function PendingState({
  phase,
  newCount,
}: {
  phase: "uploading" | "saving";
  newCount: number;
}) {
  const steps = [
    {
      label:
        newCount > 0
          ? `Uploading ${newCount} new ${newCount === 1 ? "image" : "images"}`
          : "No new images to upload",
      state:
        newCount === 0 ? "skipped" : phase === "uploading" ? "active" : "done",
    },
    {
      label: "Saving your changes",
      state: phase === "saving" ? "active" : "waiting",
    },
  ] as const;

  return (
    <div
      className="flex min-h-48 flex-col items-center justify-center gap-5 px-6 py-6 text-center"
      role="status"
      aria-live="polite"
    >
      <Tile3D>
        <LoaderCircle className="size-7 animate-spin" />
      </Tile3D>

      <div>
        <h3 className="font-semibold text-neutral-950">
          Updating your submission...
        </h3>
        <p className="mt-1 text-sm text-neutral-600">
          Please keep this window open.
        </p>
      </div>

      <ol
        className={`w-full max-w-xs space-y-2 rounded-2xl p-3 ${GLASS_INNER}`}
      >
        {steps.map((step) => (
          <li
            key={step.label}
            className="flex items-center gap-3 text-left text-sm"
          >
            <span className="flex size-6 shrink-0 items-center justify-center">
              {step.state === "active" ? (
                <LoaderCircle className="size-4 animate-spin text-blue-500" />
              ) : step.state === "done" ? (
                <CheckCircle2 className="size-4 text-emerald-500" />
              ) : (
                <span className="size-2 rounded-full bg-neutral-300" />
              )}
            </span>

            <span
              className={
                step.state === "active"
                  ? "font-medium text-neutral-900"
                  : "text-neutral-500"
              }
            >
              {step.label}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

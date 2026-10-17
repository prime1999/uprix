"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Check, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  useUpdateMyProfile,
  type UpdateMyProfileInput,
} from "@/lib/queries/result-room";
import { AVATAR_OPTIONS } from "@/lib/result-room/avatars";
import AvatarImage from "../AvatarImage";

export interface EditableProfile {
  full_name: string | null;
  /** An avatar key ("male-1") or, for older accounts, a real URL. */
  avatar_url: string | null;
  goal: string | null;
  phone: string | null;
  email: string | null;
}

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: EditableProfile;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Longest primary goal allowed, in characters. */
const GOAL_MAX = 70;

const PANEL_GLASS =
  "border border-white/70 bg-white/75 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_24px_60px_-24px_rgba(60,70,160,0.5)]";

const FIELD =
  "w-full rounded-xl border border-white/80 bg-white/60 px-3 py-2 text-sm text-neutral-900 shadow-[inset_0_2px_4px_rgba(60,70,160,0.12),0_1px_0_rgba(255,255,255,1)] outline-none placeholder:text-neutral-400 focus-visible:ring-4 focus-visible:ring-blue-400/30";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

/** Dialog from md up, bottom sheet below. */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(query.matches);

    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return isDesktop;
}

/* -------------------------------------------------------------------------- */
/* Form                                                                       */
/* -------------------------------------------------------------------------- */

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string | null;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-xs font-medium text-neutral-600">
        {label}
        {hint}
      </span>
      {children}
      {error && (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      )}
    </label>
  );
}

function EditProfileForm({
  profile,
  onClose,
  className = "",
}: {
  profile: EditableProfile;
  onClose: () => void;
  className?: string;
}) {
  const mutation = useUpdateMyProfile();

  const [avatar, setAvatar] = useState<string | null>(profile.avatar_url);
  const [name, setName] = useState(profile.full_name ?? "");
  const [goal, setGoal] = useState(profile.goal ?? "");
  const [email, setEmail] = useState(profile.email ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Only fields that actually changed are sent.
  const same = (value: string, original: string | null) =>
    value.trim() === (original ?? "").trim();

  const changed = {
    full_name: !same(name, profile.full_name),
    goal: !same(goal, profile.goal),
    email: !same(email, profile.email),
    phone: !same(phone, profile.phone),
    avatar_url: (avatar ?? null) !== (profile.avatar_url ?? null),
  };

  const changes: UpdateMyProfileInput = {};
  if (changed.full_name) changes.full_name = name.trim();
  if (changed.goal) changes.goal = goal.trim();
  if (changed.email) changes.email = email.trim();
  if (changed.phone) changes.phone = phone.trim();
  if (changed.avatar_url) changes.avatar_url = avatar;

  const dirty = Object.keys(changes).length > 0;

  // The API rejects empty strings, so block them here with a clear message.
  const errors = {
    full_name: changed.full_name && !name.trim() ? "Enter your name." : null,
    goal: !changed.goal
      ? null
      : !goal.trim()
        ? "Enter your primary goal."
        : goal.trim().length > GOAL_MAX
          ? `Keep your primary goal to ${GOAL_MAX} characters or fewer.`
          : null,
    phone: changed.phone && !phone.trim() ? "Enter your phone number." : null,
    email:
      changed.email && !EMAIL_RE.test(email.trim())
        ? "Enter a valid email address."
        : null,
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    setServerError(null);

    if (hasErrors || !dirty) return;

    try {
      await mutation.mutateAsync(changes);
      onClose();
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    }
  };

  const showError = (message: string | null) => (submitted ? message : null);

  return (
    <form onSubmit={save} noValidate className={`space-y-5 ${className}`}>
      {/* Preview */}
      <div className="flex justify-center">
        <div className="relative size-24 overflow-hidden rounded-full border-4 border-white/80 bg-gradient-to-b from-neutral-700 to-neutral-900 shadow-[inset_0_2px_0_rgba(255,255,255,0.3),0_18px_30px_-12px_rgba(30,41,59,0.7)]">
          {avatar ? (
            <AvatarImage
              value={avatar}
              alt="Selected avatar"
              sizes="96px"
              priority
              className="size-full object-cover"
            />
          ) : (
            <span
              aria-hidden
              className="grid size-full place-items-center text-3xl font-semibold text-white"
            >
              {initials(name) || "?"}
            </span>
          )}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-[18%] top-[4%] h-[30%] rounded-full bg-gradient-to-b from-white/40 to-transparent"
          />
        </div>
      </div>

      {/* Avatar picker */}
      <div>
        <p className="mb-2 text-center text-xs font-medium text-neutral-500">
          Or choose an avatar
        </p>

        <div
          role="radiogroup"
          aria-label="Choose an avatar"
          className="grid grid-cols-4 justify-items-center gap-3"
        >
          {AVATAR_OPTIONS.map((option) => {
            const selected = avatar === option.key;

            return (
              <button
                key={option.key}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={option.label}
                onClick={() => setAvatar(option.key)}
                className={`relative size-14 rounded-full border-2 border-white/80 bg-white/50 shadow-[inset_0_2px_0_rgba(255,255,255,0.9),0_10px_18px_-8px_rgba(60,70,160,0.5)] transition duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 motion-reduce:transition-none sm:size-16 ${
                  selected
                    ? "scale-105 ring-4 ring-blue-400/50"
                    : "hover:-translate-y-0.5 active:translate-y-0.5"
                }`}
              >
                <AvatarImage
                  value={option.key}
                  sizes="(min-width: 640px) 64px, 56px"
                  className="size-full rounded-full object-cover"
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-[20%] top-[4%] h-[28%] rounded-full bg-gradient-to-b from-white/50 to-transparent"
                />
                {selected && (
                  <span
                    aria-hidden
                    className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full border-2 border-white bg-gradient-to-b from-blue-400 to-blue-600 text-white shadow-[0_4px_8px_-2px_rgba(37,99,235,0.8)]"
                  >
                    <Check className="size-3" strokeWidth={3.5} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-3">
        <Field label="Full name" error={showError(errors.full_name)}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={2000}
            autoComplete="name"
            className={FIELD}
          />
        </Field>

        <Field
          label="Primary goal"
          error={showError(errors.goal)}
          hint={
            <span
              className={`font-normal tabular-nums ${
                goal.length > GOAL_MAX
                  ? "text-red-600"
                  : goal.length >= GOAL_MAX - 10
                    ? "text-amber-600"
                    : "text-neutral-400"
              }`}
            >
              {goal.length}/{GOAL_MAX}
            </span>
          }
        >
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            rows={2}
            maxLength={GOAL_MAX}
            className={`${FIELD} resize-none`}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Email" error={showError(errors.email)}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className={FIELD}
            />
          </Field>

          <Field label="Phone number" error={showError(errors.phone)}>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              className={FIELD}
            />
          </Field>
        </div>
      </div>

      {serverError && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700"
        >
          {serverError}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={mutation.isPending}
          className="rounded-xl border border-white/80 bg-gradient-to-b from-white to-neutral-100 px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-[inset_0_2px_0_rgba(255,255,255,1),inset_0_-3px_0_rgba(0,0,0,0.05),0_8px_14px_-8px_rgba(60,70,160,0.4)] transition active:translate-y-0.5 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={!dirty || mutation.isPending}
          className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-gradient-to-b from-blue-400 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.4),inset_0_-3px_0_rgba(30,58,138,0.35),0_10px_18px_-8px_rgba(37,99,235,0.8)] transition active:translate-y-0.5 disabled:opacity-50 disabled:grayscale"
        >
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          {mutation.isPending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Modal                                                                      */
/* -------------------------------------------------------------------------- */

export default function EditProfileModal({
  open,
  onOpenChange,
  profile,
}: EditProfileModalProps) {
  const isDesktop = useIsDesktop();
  const close = () => onOpenChange(false);

  // The form mounts fresh every time the modal opens, so it always starts
  // from the latest saved profile.
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={`max-h-[90dvh] overflow-y-auto rounded-3xl sm:max-w-lg ${PANEL_GLASS}`}
        >
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Pick an avatar and update your details.
            </DialogDescription>
          </DialogHeader>

          <EditProfileForm profile={profile} onClose={close} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={`max-h-[92dvh] overflow-y-auto rounded-t-3xl data-[state=closed]:duration-200 data-[state=open]:duration-300 ${PANEL_GLASS}`}
      >
        <span
          aria-hidden
          className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-neutral-400/50"
        />

        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>
            Pick an avatar and update your details.
          </SheetDescription>
        </SheetHeader>

        <EditProfileForm
          profile={profile}
          onClose={close}
          className="px-4 pb-6"
        />
      </SheetContent>
    </Sheet>
  );
}

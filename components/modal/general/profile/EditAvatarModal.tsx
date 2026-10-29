"use client";

import { useState, type FormEvent } from "react";
import { Check, Loader2 } from "lucide-react";

import { useToast } from "@/components/ui/toast";
import { useUpdateUserProfile } from "@/lib/queries/result-room";
import { getAvatarsByGender } from "@/lib/result-room/avatars";
import AvatarImage from "@/components/result-room/dashboard/AvatarImage";
import { ModalBody, ModalFooter, ResponsiveModal } from "./ResponsiveModal";

export interface AvatarProfile {
  full_name: string;
  gender: string | null;
  /** An avatar key ("male-1") or, for older accounts, a real URL. */
  avatar_url: string | null;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

function AvatarForm({
  profile,
  onClose,
}: {
  profile: AvatarProfile;
  onClose: () => void;
}) {
  const mutation = useUpdateUserProfile();
  const { toast } = useToast();

  const [avatar, setAvatar] = useState<string | null>(profile.avatar_url);
  const [error, setError] = useState<string | null>(null);

  const dirty = (avatar ?? null) !== (profile.avatar_url ?? null);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!dirty) return;
    setError(null);

    try {
      await mutation.mutateAsync({ avatar_url: avatar });
      toast({ title: "Profile picture updated", variant: "success" });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  return (
    <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
      <ModalBody>
        <div className="flex justify-center py-2">
          <div className="relative size-24 overflow-hidden rounded-full border-4 border-white bg-secondary-blue shadow-md">
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
                {initials(profile.full_name) || "?"}
              </span>
            )}
          </div>
        </div>

        <p className="mb-3 mt-2 text-center text-xs font-medium text-neutral-500">
          Choose an avatar
        </p>

        <div
          role="radiogroup"
          aria-label="Choose an avatar"
          className="grid grid-cols-4 justify-items-center gap-3"
        >
          {getAvatarsByGender(profile.gender).map((option) => {
            const selected = avatar === option.key;

            return (
              <button
                key={option.key}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={option.label}
                onClick={() => setAvatar(option.key)}
                className={`relative size-14 rounded-full border-2 border-white bg-neutral-100 transition duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-blue motion-reduce:transition-none sm:size-16 ${
                  selected
                    ? "scale-105 ring-4 ring-secondary-blue/40"
                    : "hover:-translate-y-0.5"
                }`}
              >
                <AvatarImage
                  value={option.key}
                  sizes="(min-width: 640px) 64px, 56px"
                  className="size-full rounded-full object-cover"
                />
                {selected && (
                  <span
                    aria-hidden
                    className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full border-2 border-white bg-secondary-blue text-white"
                  >
                    <Check className="size-3" strokeWidth={3.5} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}
      </ModalBody>

      <ModalFooter>
        <button
          type="button"
          onClick={onClose}
          disabled={mutation.isPending}
          className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!dirty || mutation.isPending}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-secondary-blue to-primary-blue px-5 py-2 text-sm font-semibold text-white transition disabled:opacity-50"
        >
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          {mutation.isPending ? "Saving…" : "Save picture"}
        </button>
      </ModalFooter>
    </form>
  );
}

export default function EditAvatarModal({
  open,
  onOpenChange,
  profile,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: AvatarProfile;
}) {
  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Profile picture"
      description="Pick the avatar that represents you."
    >
      {/* Mounted only while open, so it always starts from the saved profile. */}
      {open && (
        <AvatarForm profile={profile} onClose={() => onOpenChange(false)} />
      )}
    </ResponsiveModal>
  );
}

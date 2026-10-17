"use client";

import { useState } from "react";
import { AlertCircle, Info } from "lucide-react";

import GeneralButton from "@/components/miscelleneous/generalButton";
import SubmissionViewModal from "../modals/SubmissionViewModal";
import {
  useResultRoomPartnerDetails,
  type ResultRoomPartnerDetails,
} from "@/lib/queries/result-room";
import { GLASS } from "@/components/result-room/dashboard/submissions/submission-utils";

interface PartnerProfileCardProps {
  className?: string;
  date: string;
}

/** Used when a stored number starts with 0 (e.g. 0803…) and has no country code. */
const DEFAULT_COUNTRY_CODE = "234";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

/**
 * Builds a wa.me link that opens the partner's WhatsApp chat with a
 * message already typed in. Returns undefined if the number is unusable.
 */
function buildWhatsAppLink(phone: string | undefined, message: string) {
  if (!phone) return undefined;

  const raw = phone.trim();
  let digits = raw.replace(/\D/g, "");

  if (raw.startsWith("+")) {
    // already international
  } else if (digits.startsWith("00")) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0")) {
    digits = DEFAULT_COUNTRY_CODE + digits.slice(1);
  } else if (digits.length === 10) {
    digits = DEFAULT_COUNTRY_CODE + digits;
  }

  if (digits.length < 10) return undefined;

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/* -------------------------------------------------------------------------- */
/* Pieces                                                                     */
/* -------------------------------------------------------------------------- */

const CARD = `${GLASS} relative mx-auto w-full max-w-xl overflow-hidden rounded-3xl p-4 sm:p-5`;

/** Soft light sweep across the top of the glass. */
function Sheen() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/60 to-transparent"
    />
  );
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  return (
    <div className="relative size-16 shrink-0 overflow-hidden rounded-full border-[3px] border-white/80 bg-gradient-to-b from-neutral-700 to-neutral-900 shadow-[inset_0_2px_0_rgba(255,255,255,0.3),0_14px_24px_-10px_rgba(30,41,59,0.7)] sm:size-24">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={name}
          draggable={false}
          className="size-full object-cover"
        />
      ) : (
        <span
          aria-hidden
          className="grid size-full place-items-center text-lg font-semibold text-white sm:text-3xl"
        >
          {initials(name)}
        </span>
      )}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-[18%] top-[4%] h-[30%] rounded-full bg-gradient-to-b from-white/40 to-transparent"
      />
    </div>
  );
}

function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

/** Raised green 3D button that opens the partner's WhatsApp chat. */
function WhatsAppButton({ href, name }: { href?: string; name: string }) {
  const base =
    "relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/60 bg-gradient-to-b from-emerald-400 to-green-600 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.45),inset_0_-3px_0_rgba(21,128,61,0.4),0_8px_14px_-6px_rgba(22,163,74,0.8)] sm:size-11";

  const content = (
    <>
      <WhatsAppIcon className="relative z-10 size-5" />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-[14%] top-[6%] h-[34%] rounded-xl bg-gradient-to-b from-white/45 to-transparent"
      />
    </>
  );

  if (!href) {
    return (
      <span
        role="img"
        aria-label="WhatsApp unavailable, no valid phone number"
        title="No valid phone number"
        className={`${base} opacity-40 grayscale`}
      >
        {content}
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Message ${name} on WhatsApp`}
      title="Message on WhatsApp"
      className={`${base} transition duration-150 hover:-translate-y-0.5 active:translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 motion-reduce:transition-none`}
    >
      {content}
    </a>
  );
}

/* -------------------------------------------------------------------------- */
/* Card                                                                       */
/* -------------------------------------------------------------------------- */

function ProfileContent({
  partner,
  onViewSubmission,
}: {
  partner: ResultRoomPartnerDetails;
  onViewSubmission: () => void;
}) {
  const name = partner.full_name?.trim() || "Your partner";
  const firstName = partner.full_name?.trim().split(/\s+/)[0] || "there";
  const goal = partner.goal?.trim();
  const phone = partner.phone?.trim();
  const email = partner.email?.trim();

  const whatsappHref = buildWhatsAppLink(
    phone,
    `Hi ${firstName}! It's your Result Room partner. How's today going?`,
  );

  return (
    <article className={CARD} aria-label={`${name}, your partner`}>
      <Sheen />

      <h2 className="relative mb-3 flex items-center gap-2 border-b border-white/60 pb-2.5 text-sm font-semibold text-neutral-800">
        <span
          aria-hidden
          className="size-2.5 rounded-full bg-gradient-to-b from-blue-400 to-blue-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_0_0_3px_rgba(59,130,246,0.2),0_4px_6px_-1px_rgba(37,99,235,0.6)]"
        />
        Your partner
      </h2>

      <div className="relative flex items-start gap-3 sm:gap-5">
        <Avatar name={name} url={partner.avatar_url} />

        <div className="min-w-0 flex-1">
          {/* Name + WhatsApp */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-gray-800 font-semibold">
                {partner.seat_number && `Seat: ${partner.seat_number}`}
              </p>
              <h3 className="break-words text-xl font-bold leading-tight tracking-tight text-neutral-900 sm:text-2xl">
                {name}
              </h3>
              {email && (
                <p className="mt-0.5 break-all text-xs text-neutral-500">
                  {email}
                </p>
              )}
            </div>

            <WhatsAppButton href={whatsappHref} name={name} />
          </div>

          {/* Goal */}
          <div className="mt-2.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
              Goal
            </p>
            <p
              className={`mt-0.5 whitespace-pre-line break-words text-sm leading-relaxed ${
                goal ? "text-neutral-700" : "text-neutral-500"
              }`}
            >
              {goal || "No goal added yet."}
            </p>
          </div>

          {/* Footer */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2.5">
            {phone ? (
              <span className="text-xs text-neutral-500">
                <b className="font-semibold text-neutral-700">Phone</b>{" "}
                <span className="tabular-nums">{phone}</span>
              </span>
            ) : (
              <span className="text-xs text-neutral-400">No phone number</span>
            )}

            <GeneralButton onClick={onViewSubmission}>
              <span className="flex items-center gap-1.5 text-xs">
                <Info className="size-3.5" />
                View Partner&apos;s Submission
              </span>
            </GeneralButton>
          </div>
        </div>
      </div>
    </article>
  );
}

function ProfileSkeleton() {
  return (
    <div className={CARD} aria-busy>
      <div className="mb-3 border-b border-white/60 pb-2.5">
        <div className="h-4 w-24 animate-pulse rounded bg-white/70" />
      </div>
      <div className="flex items-start gap-3 sm:gap-5">
        <div className="size-16 shrink-0 animate-pulse rounded-full bg-white/70 sm:size-24" />
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="h-6 w-2/3 animate-pulse rounded bg-white/70" />
              <div className="h-3.5 w-1/2 animate-pulse rounded bg-white/50" />
            </div>
            <div className="size-10 animate-pulse rounded-xl bg-white/70 sm:size-11" />
          </div>
          <div className="h-4 w-full animate-pulse rounded bg-white/50" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-white/50" />
        </div>
      </div>
    </div>
  );
}

export default function PartnerProfileCard({
  className = "",
  date,
}: PartnerProfileCardProps) {
  const { data, isLoading, isError, error, refetch } =
    useResultRoomPartnerDetails();
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);

  return (
    <div className={className}>
      {isLoading ? (
        <ProfileSkeleton />
      ) : isError || !data ? (
        <div className={`${CARD} text-center`}>
          <AlertCircle className="mx-auto size-6 text-red-500" />
          <p className="mt-3 text-sm font-semibold text-neutral-900">
            We couldn&apos;t load your partner.
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            {error instanceof Error && error.message
              ? error.message
              : "Check your connection and try again."}
          </p>
          <div className="mt-5 flex justify-center">
            <GeneralButton
              text="Try again"
              variant="active"
              buttonFunction={() => refetch()}
            />
          </div>
        </div>
      ) : (
        <>
          <ProfileContent
            partner={data.partner}
            onViewSubmission={() => setSubmissionDialogOpen(true)}
          />
          <SubmissionViewModal
            isOpen={submissionDialogOpen}
            onClose={() => setSubmissionDialogOpen(false)}
            date={date}
            mode="partner"
          />
        </>
      )}
    </div>
  );
}

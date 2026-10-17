"use client";

import { useMemo, useState } from "react";
import {
  CalendarX,
  Check,
  CreditCard,
  Flame,
  HelpCircle,
  Lock,
  MessageSquareWarning,
  ReceiptText,
  Scale,
  Send,
  Upload,
  UserCog,
  UserX,
  type LucideIcon,
} from "lucide-react";

import {
  useResultRoomAdmins,
  useResultRoomDashboard,
  type ResultRoomAdmin,
} from "@/lib/queries/result-room";
import { buildWhatsAppUrl, toWhatsAppNumber } from "@/lib/result-room/WhatsApp";
import { FaWhatsapp } from "react-icons/fa";

// Adjust these paths to match your project.
import { Icon3D } from "@/components/result-room/dashboard/fines/icon-3d";
import { GLASS } from "@/components/result-room/dashboard/submissions/submission-utils";
import AvatarImage from "@/components/result-room/dashboard/AvatarImage";

/* -------------------------------------------------------------------------- */
/* Complaint types and who handles them                                       */
/* -------------------------------------------------------------------------- */

type AdminKind = "task" | "finance" | "room";

interface ComplaintType {
  id: string;
  label: string;
  icon: LucideIcon;
  admin: AdminKind;
}

/**
 * `keywords` are matched (case-insensitively) against the admin's
 * `admin_role` value in the database, e.g. "finance_admin" contains "finance".
 * Change them if your roles are named differently.
 */
const ADMIN_KINDS: Record<
  AdminKind,
  { title: string; group: string; keywords: string[]; tile: string }
> = {
  task: {
    title: "Task admin",
    group: "Tasks & submissions",
    keywords: ["task"],
    tile: "from-blue-400 to-blue-600 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.45),inset_0_-2px_0_rgba(30,58,138,0.35),0_6px_10px_-4px_rgba(37,99,235,0.8)]",
  },
  finance: {
    title: "Finance admin",
    group: "Fines & payments",
    keywords: ["finance", "financial", "treasur"],
    tile: "from-yellow-200 to-yellow-400 text-neutral-900 shadow-[inset_0_2px_0_rgba(255,255,255,0.7),inset_0_-2px_0_rgba(161,98,7,0.3),0_6px_10px_-4px_rgba(234,179,8,0.85)]",
  },
  room: {
    title: "Room manager",
    group: "Room, partner & everything else",
    keywords: ["room", "manager"],
    tile: "from-neutral-600 to-neutral-800 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.25),inset_0_-2px_0_rgba(0,0,0,0.4),0_6px_10px_-4px_rgba(38,38,38,0.8)]",
  },
};

/** Add, remove or re-route types here. Anything not task/finance goes to "room". */
const COMPLAINT_TYPES: ComplaintType[] = [
  {
    id: "submission",
    label: "Couldn't submit my task",
    icon: Upload,
    admin: "task",
  },
  {
    id: "record",
    label: "Missed or wrong submission record",
    icon: CalendarX,
    admin: "task",
  },
  {
    id: "streak",
    label: "Wrong streak or day count",
    icon: Flame,
    admin: "task",
  },

  {
    id: "fine-dispute",
    label: "Dispute a fine",
    icon: Scale,
    admin: "finance",
  },
  {
    id: "payment",
    label: "Payment didn't go through",
    icon: CreditCard,
    admin: "finance",
  },
  {
    id: "fine-amount",
    label: "Wrong fine amount",
    icon: ReceiptText,
    admin: "finance",
  },

  {
    id: "partner",
    label: "Problem with my partner",
    icon: UserX,
    admin: "room",
  },
  {
    id: "access",
    label: "Room locked or access issue",
    icon: Lock,
    admin: "room",
  },
  {
    id: "telegram",
    label: "Telegram session issue",
    icon: Send,
    admin: "room",
  },
  {
    id: "account",
    label: "Profile or account issue",
    icon: UserCog,
    admin: "room",
  },
  { id: "other", label: "Something else", icon: HelpCircle, admin: "room" },
];

const MIN_LENGTH = 10;
const MAX_LENGTH = 1000;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

const humanize = (value: string | null | undefined) => {
  if (!value) return "";
  const text = value.replace(/[_-]+/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/**
 * Finds the admin who should get this complaint:
 * 1. an admin whose role matches the complaint's category,
 * 2. otherwise the room manager,
 * 3. otherwise any admin with a usable phone number.
 * Admins without a valid WhatsApp number are skipped.
 */
function pickAdmin(admins: ResultRoomAdmin[], kind: AdminKind) {
  const reachable = admins.filter((admin) => toWhatsAppNumber(admin.phone));

  const find = (target: AdminKind) =>
    reachable.find((admin) => {
      const role = (admin.admin_role ?? "").toLowerCase();
      return ADMIN_KINDS[target].keywords.some((word) => role.includes(word));
    });

  const exact = find(kind);
  if (exact) return { admin: exact, fallback: false };

  const room = find("room");
  if (room) return { admin: room, fallback: kind !== "room" };

  return reachable[0] ? { admin: reachable[0], fallback: true } : null;
}

function buildMessage(
  typeLabel: string,
  senderName: string | null,
  text: string,
) {
  return [
    "*Result Room complaint*",
    "",
    `*Type:* ${typeLabel}`,
    senderName ? `*From:* ${senderName}` : null,
    "",
    "*Details:*",
    text.trim(),
  ]
    .filter((line) => line !== null)
    .join("\n");
}

const GLASS_INNER = "border border-white/70 bg-white/40 backdrop-blur-md";

/* -------------------------------------------------------------------------- */
/* Pieces                                                                     */
/* -------------------------------------------------------------------------- */

function AdminAvatar({ admin }: { admin: ResultRoomAdmin }) {
  const name = admin.full_name ?? "Admin";

  return (
    <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-white/80 bg-gradient-to-b from-neutral-700 to-neutral-900 text-sm font-semibold text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.3),0_10px_16px_-8px_rgba(30,41,59,0.8)]">
      {admin.avatar_url ? (
        <AvatarImage
          value={admin.avatar_url}
          alt={name}
          sizes="44px"
          className="size-full object-cover"
        />
      ) : (
        <span aria-hidden>{initials(name)}</span>
      )}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-[18%] top-[4%] h-[30%] rounded-full bg-gradient-to-b from-white/40 to-transparent"
      />
    </span>
  );
}

function TypeChip({
  type,
  selected,
  onSelect,
}: {
  type: ComplaintType;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = type.icon;

  return (
    <label className="relative block cursor-pointer">
      <input
        type="radio"
        name="complaint-type"
        value={type.id}
        checked={selected}
        onChange={onSelect}
        className="peer sr-only"
      />

      <span
        className={`flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 transition duration-150 peer-focus-visible:ring-4 peer-focus-visible:ring-blue-400/40 motion-reduce:transition-none ${
          selected
            ? "border-blue-300 bg-white/85 shadow-[inset_0_2px_0_rgba(255,255,255,1),inset_0_-3px_0_rgba(59,130,246,0.15),0_10px_18px_-8px_rgba(59,130,246,0.55)] ring-2 ring-blue-400/40"
            : "border-white/70 bg-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_12px_-8px_rgba(60,70,160,0.35)] hover:-translate-y-0.5"
        }`}
      >
        <span
          aria-hidden
          className={`relative grid size-8 shrink-0 place-items-center rounded-xl border border-white/40 bg-gradient-to-b ${ADMIN_KINDS[type.admin].tile}`}
        >
          <Icon className="size-4" />
        </span>

        <span className="min-w-0 flex-1 text-sm font-medium leading-tight text-neutral-900">
          {type.label}
        </span>

        {selected && (
          <span
            aria-hidden
            className="grid size-5 shrink-0 place-items-center rounded-full border-2 border-white bg-gradient-to-b from-blue-400 to-blue-600 text-white shadow-[0_4px_8px_-2px_rgba(37,99,235,0.8)]"
          >
            <Check className="size-3" strokeWidth={3.5} />
          </span>
        )}
      </span>
    </label>
  );
}

const SEND_BUTTON =
  "inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/50 bg-gradient-to-b from-emerald-400 to-green-600 px-5 py-3 text-sm font-semibold text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.45),inset_0_-4px_0_rgba(21,128,61,0.45),0_12px_20px_-10px_rgba(22,163,74,0.8)]";

/* -------------------------------------------------------------------------- */
/* Form                                                                       */
/* -------------------------------------------------------------------------- */

interface ComplaintFormProps {
  className?: string;
}

export default function ComplaintForm({ className = "" }: ComplaintFormProps) {
  const admins = useResultRoomAdmins();
  const dashboard = useResultRoomDashboard();
  const senderName = dashboard.data?.profile?.name ?? null;

  const [typeId, setTypeId] = useState<string | null>(null);
  const [text, setText] = useState("");

  const selected = COMPLAINT_TYPES.find((type) => type.id === typeId) ?? null;

  const routing = useMemo(
    () =>
      selected && admins.data
        ? pickAdmin(admins.data.admins, selected.admin)
        : null,
    [selected, admins.data],
  );

  const trimmed = text.trim();
  const tooShort = trimmed.length < MIN_LENGTH;

  const href =
    selected && routing && !tooShort
      ? buildWhatsAppUrl(
          routing.admin.phone,
          buildMessage(selected.label, senderName, trimmed),
        )
      : null;

  const hint = !selected
    ? "Choose the type of issue first."
    : admins.isLoading
      ? "Finding the right admin…"
      : !routing
        ? "No admin contact is available right now."
        : tooShort
          ? `Write at least ${MIN_LENGTH} characters so the admin can help.`
          : null;

  return (
    <section
      aria-label="Make a complaint"
      className={`relative mx-auto w-full max-w-lg overflow-hidden rounded-3xl p-4 sm:p-6 ${className}`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/60 to-transparent"
      />

      {/* Header */}
      <header className="relative flex items-start gap-3">
        <Icon3D icon={MessageSquareWarning} tone="amber" size="lg" />
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
            Make a complaint
          </h2>
          <p className="mt-0.5 text-sm text-neutral-600">
            Pick the issue and tell us what happened. We&apos;ll send it to the
            right admin on WhatsApp.
          </p>
        </div>
      </header>

      {/* 1. Type */}
      <div className="relative mt-5">
        <p className="mb-2 text-sm font-medium text-neutral-900">
          1. What kind of issue is it?
        </p>

        <div className="space-y-4">
          {(Object.keys(ADMIN_KINDS) as AdminKind[]).map((kind) => (
            <div key={kind}>
              <p className="mb-1.5 flex items-center justify-between gap-2 px-1 text-[11px] font-medium uppercase tracking-wide text-gray-700">
                <span>{ADMIN_KINDS[kind].group}</span>
                <span className="text-black normal-case tracking-normal">
                  {ADMIN_KINDS[kind].title}
                </span>
              </p>

              <div className="grid gap-2 sm:grid-cols-2">
                {COMPLAINT_TYPES.filter((type) => type.admin === kind).map(
                  (type) => (
                    <TypeChip
                      key={type.id}
                      type={type}
                      selected={type.id === typeId}
                      onSelect={() => setTypeId(type.id)}
                    />
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Details */}
      <div className="relative mt-5">
        <label
          htmlFor="complaint-details"
          className="mb-2 flex items-center justify-between text-sm font-medium text-neutral-900"
        >
          2. What happened?
          <span
            className={`text-xs font-normal tabular-nums ${
              text.length >= MAX_LENGTH - 50
                ? "text-amber-600"
                : "text-neutral-400"
            }`}
          >
            {text.length}/{MAX_LENGTH}
          </span>
        </label>

        <textarea
          id="complaint-details"
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={5}
          maxLength={MAX_LENGTH}
          placeholder="Explain the issue clearly: what happened, when, and what you need."
          className="w-full resize-none rounded-2xl border border-white/80 bg-white/60 px-3.5 py-3 text-sm leading-relaxed text-neutral-900 shadow-[inset_0_2px_4px_rgba(60,70,160,0.12),0_1px_0_rgba(255,255,255,1)] outline-none placeholder:text-neutral-400 focus-visible:ring-4 focus-visible:ring-blue-400/30"
        />
      </div>

      {/* Who it goes to */}
      {selected && (
        <div
          aria-live="polite"
          className={`relative mt-4 rounded-2xl p-3.5 ${GLASS_INNER} shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_16px_-10px_rgba(60,70,160,0.35)]`}
        >
          <p className="text-xs text-neutral-500">This goes to</p>

          {admins.isLoading ? (
            <div className="mt-2 flex items-center gap-3">
              <div className="size-11 animate-pulse rounded-full bg-white/70" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-1/2 animate-pulse rounded bg-white/70" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-white/50" />
              </div>
            </div>
          ) : admins.isError ? (
            <p className="mt-1 text-sm text-red-600">
              We couldn&apos;t load the admins.{" "}
              <button
                type="button"
                onClick={() => admins.refetch()}
                className="font-medium underline underline-offset-2"
              >
                Try again
              </button>
            </p>
          ) : routing ? (
            <>
              <div className="mt-2 flex items-center gap-3">
                <AdminAvatar admin={routing.admin} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-neutral-900">
                    {routing.admin.full_name ?? "Admin"}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {humanize(routing.admin.admin_role) ||
                      ADMIN_KINDS[selected.admin].title}
                  </p>
                </div>
              </div>

              {routing.fallback && (
                <p className="mt-2 text-xs text-amber-700">
                  No {ADMIN_KINDS[selected.admin].title.toLowerCase()} is
                  reachable right now, so this goes to the{" "}
                  {humanize(routing.admin.admin_role).toLowerCase() ||
                    "available admin"}
                  .
                </p>
              )}
            </>
          ) : (
            <p className="mt-1 text-sm text-neutral-600">
              No admin contact is available right now.
            </p>
          )}
        </div>
      )}

      {/* Send */}
      <div className="relative mt-5">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`${SEND_BUTTON} transition duration-150 hover:-translate-y-0.5 active:translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 motion-reduce:transition-none`}
          >
            <FaWhatsapp className="size-5" />
            Send on WhatsApp
          </a>
        ) : (
          <button
            type="button"
            disabled
            className={`${SEND_BUTTON} cursor-not-allowed opacity-50 grayscale`}
          >
            <FaWhatsapp className="size-5" />
            Send on WhatsApp
          </button>
        )}

        <p className="mt-2 text-center text-xs text-neutral-500">
          {hint ?? "WhatsApp will open with your complaint ready to send."}
        </p>
      </div>
    </section>
  );
}

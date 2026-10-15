"use client";

import { useMemo, useState } from "react";

import {
  AlertCircle,
  BadgeCheck,
  CalendarDays,
  CircleSlash,
  Clock,
  FileText,
  Loader2,
  ReceiptText,
  RefreshCw,
  Scale,
  ShieldAlert,
  StickyNote,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

import GeneralButton from "@/components/miscelleneous/generalButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// Adjust this path to wherever your hook lives.
import { useResultRoomFines } from "@/lib/queries/result-room";

/* -------------------------------------------------------------------------- */
/* Types (mirrors the GET /fines API response)                                */
/* -------------------------------------------------------------------------- */

export type FineStatus = "UNPAID" | "PAID" | "WAIVED";

export interface FineViolation {
  id: string;
  type: string;
  occurred_on: string | null;
  notes: string | null;
  consequence: string | null;
  resolved_at: string | null;
  resolution_note: string | null;
}

export interface Fine {
  id: string;
  participant_id: string;
  room_id: string;
  violation_id: string | null;
  source: string | null;
  reason: string | null;
  amount: number; // naira
  status: FineStatus;
  due_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  violation: FineViolation | null;
}

export interface FinePayment {
  id: string;
  fine_id: string;
  amount: number;
  status: string;
  paystack_reference: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinesResponse {
  fines: Fine[];
  payments: FinePayment[];
  summary: {
    totalFines: number;
    unpaidCount: number;
    paidCount: number;
    waivedCount: number;
    outstandingAmount: number;
    currency: string;
  };
}

interface FinesPageProps {
  /** Starts the payment flow for one fine (e.g. initialise Paystack). */
  onPay?: (fine: Fine) => void | Promise<void>;
  className?: string;
}

type Filter = "ALL" | FineStatus;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const money = (amount: number, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (value: string | null | undefined) =>
  value
    ? new Date(value).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

const humanize = (value: string | null | undefined) => {
  if (!value) return "";
  const text = value.replace(/[_-]+/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const daysUntil = (target: string) =>
  Math.ceil((new Date(target).getTime() - Date.now()) / 86_400_000);

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const fineTitle = (fine: Fine) =>
  fine.reason?.trim() ||
  humanize(fine.violation?.type) ||
  humanize(fine.source) ||
  "Fine";

const isOverdue = (fine: Fine) =>
  fine.status === "UNPAID" && !!fine.due_at && daysUntil(fine.due_at) < 0;

const isPendingPayment = (payment: FinePayment) =>
  ["PENDING", "INITIATED", "PROCESSING"].includes(payment.status.toUpperCase());

const STATUS: Record<FineStatus, { label: string; dot: string; text: string }> =
  {
    UNPAID: { label: "Unpaid", dot: "bg-amber-500", text: "text-amber-800" },
    PAID: { label: "Paid", dot: "bg-emerald-500", text: "text-emerald-800" },
    WAIVED: {
      label: "Waived",
      dot: "bg-neutral-400",
      text: "text-neutral-600",
    },
  };

/** What to say about timing, in plain words. */
function timingFor(fine: Fine): { text: string; urgent: boolean } | null {
  if (fine.status === "UNPAID" && fine.due_at) {
    const days = daysUntil(fine.due_at);

    if (days < 0) {
      return {
        text: `Overdue by ${plural(Math.abs(days), "day")}`,
        urgent: true,
      };
    }
    if (days === 0) return { text: "Due today", urgent: true };

    return {
      text: `Due ${formatDate(fine.due_at)} (in ${plural(days, "day")})`,
      urgent: false,
    };
  }

  if (fine.status === "PAID" && fine.paid_at) {
    return { text: `Paid ${formatDate(fine.paid_at)}`, urgent: false };
  }

  return null;
}

const GLASS =
  "border border-white/60 bg-white/40 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_32px_-8px_rgba(60,70,160,0.25)]";

const OUTLINE_BUTTON =
  "inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white/70 px-5 py-2.5 text-xs font-bold text-neutral-800 transition-colors hover:border-neutral-400 hover:bg-neutral-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/40 md:text-sm";

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function FinesPage({ onPay, className = "" }: FinesPageProps) {
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useResultRoomFines() as {
      data?: FinesResponse;
      isLoading: boolean;
      isError: boolean;
      error: unknown;
      refetch: () => void;
      isRefetching: boolean;
    };

  const [filter, setFilter] = useState<Filter>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  const fines = useMemo(() => data?.fines ?? [], [data]);
  const payments = useMemo(() => data?.payments ?? [], [data]);
  const summary = data?.summary;

  const pendingFineIds = useMemo(
    () => new Set(payments.filter(isPendingPayment).map((p) => p.fine_id)),
    [payments],
  );

  const visible = useMemo(
    () => (filter === "ALL" ? fines : fines.filter((f) => f.status === filter)),
    [fines, filter],
  );

  const overdueCount = useMemo(() => fines.filter(isOverdue).length, [fines]);

  // Derive from the list so the dialog stays fresh after a refetch.
  const selected = fines.find((f) => f.id === selectedId) ?? null;

  const openFine = (fine: Fine) => {
    setSelectedId(fine.id);
    setDialogOpen(true);
  };

  const handlePay = async (fine: Fine) => {
    if (!onPay || payingId) return;

    setPayError(null);
    setPayingId(fine.id);

    try {
      await onPay(fine);
    } catch (err) {
      setPayError(
        err instanceof Error && err.message
          ? err.message
          : "We couldn't start the payment. Please try again.",
      );
    } finally {
      setPayingId(null);
    }
  };

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: "ALL", label: "All", count: summary?.totalFines ?? 0 },
    { key: "UNPAID", label: "Unpaid", count: summary?.unpaidCount ?? 0 },
    { key: "PAID", label: "Paid", count: summary?.paidCount ?? 0 },
    { key: "WAIVED", label: "Waived", count: summary?.waivedCount ?? 0 },
  ];

  const owing = (summary?.unpaidCount ?? 0) > 0;

  return (
    <div className={`mx-auto w-full max-w-3xl space-y-6 ${className}`}>
      {/* Balance */}
      <section
        aria-label="Balance"
        className="flex items-end justify-between gap-4 rounded-2xl bg-secondary-blue px-5 py-6 text-white sm:px-7 sm:py-8"
      >
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-4 w-32 animate-pulse rounded bg-white/25" />
            <div className="h-12 w-56 animate-pulse rounded bg-white/25" />
          </div>
        ) : (
          <div>
            <h1 className="text-sm font-medium text-white/75">
              {owing ? "You owe" : "Fines"}
            </h1>
            <p className="mt-1 text-4xl font-semibold tabular-nums tracking-normal sm:text-5xl">
              {money(summary?.outstandingAmount ?? 0, summary?.currency)}
            </p>
            <p className="mt-2 text-sm text-white/80">
              {owing
                ? `${plural(summary!.unpaidCount, "unpaid fine")}${
                    overdueCount > 0 ? `, ${overdueCount} overdue.` : "."
                  }`
                : "Nothing to pay right now."}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isRefetching}
          aria-label="Refresh fines"
          className="mb-1 flex size-9 shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40 disabled:opacity-60"
        >
          <RefreshCw
            className={`size-4 ${isRefetching ? "animate-spin" : ""}`}
          />
        </button>
      </section>

      {payError && (
        <div
          role="alert"
          className="rounded-xl bg-red-500 px-3.5 py-3 text-sm text-white"
        >
          <p className="font-medium">We couldn&apos;t start that payment.</p>
          <p className="mt-0.5 text-xs leading-relaxed">{payError}</p>
        </div>
      )}

      {/* Ledger */}
      <section aria-label="Fines">
        <div
          role="tablist"
          aria-label="Filter fines"
          className="mb-4 flex gap-6 overflow-x-auto border-b border-neutral-200"
        >
          {tabs.map((tab) => {
            const active = filter === tab.key;

            return (
              <button
                key={tab.key}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setFilter(tab.key)}
                className={`-mb-px whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors focus:outline-none focus-visible:text-blue-600 ${
                  active
                    ? "border-secondary-blue text-secondary-blue"
                    : "border-transparent text-neutral-500 hover:text-neutral-900"
                }`}
              >
                {tab.label}
                <span className="ml-1.5 tabular-nums text-neutral-400">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <ul aria-busy className="space-y-3">
            {[0, 1, 2].map((n) => (
              <li key={n} className={`space-y-2.5 rounded-2xl p-5 ${GLASS}`}>
                <div className="h-4 w-2/5 animate-pulse rounded bg-white/70" />
                <div className="h-3 w-1/4 animate-pulse rounded bg-white/50" />
              </li>
            ))}
          </ul>
        ) : isError ? (
          <div className="py-14 text-center">
            <AlertCircle className="mx-auto size-6 text-red-500" />
            <p className="mt-3 text-sm font-semibold text-neutral-900">
              We couldn&apos;t load your fines.
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
        ) : visible.length === 0 ? (
          <div className="py-14 text-center">
            <ReceiptText className="mx-auto size-6 text-neutral-400" />
            <p className="mt-3 text-sm font-semibold text-neutral-900">
              {filter === "ALL"
                ? "You have no fines."
                : `No ${STATUS[filter].label.toLowerCase()} fines.`}
            </p>
            <p className="mt-1 text-sm text-neutral-600">
              {filter === "ALL"
                ? "If you get one, it will appear here."
                : "Switch to All to see every fine."}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {visible.map((fine) => (
              <FineRow
                key={fine.id}
                fine={fine}
                canPay={!!onPay}
                paying={payingId === fine.id}
                locked={!!payingId && payingId !== fine.id}
                paymentPending={pendingFineIds.has(fine.id)}
                onPay={() => void handlePay(fine)}
                onView={() => openFine(fine)}
              />
            ))}
          </ul>
        )}
      </section>

      <FineDialog
        fine={selected}
        open={dialogOpen && !!selected}
        onOpenChange={setDialogOpen}
        payments={payments.filter((p) => p.fine_id === selectedId)}
        canPay={!!onPay}
        paying={!!selected && payingId === selected.id}
        paymentPending={!!selected && pendingFineIds.has(selected.id)}
        onPay={() => selected && void handlePay(selected)}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Pay button (shared by the row and the dialog)                              */
/* -------------------------------------------------------------------------- */

interface PayButtonProps {
  fine: Fine;
  canPay: boolean;
  paying: boolean;
  locked?: boolean;
  paymentPending: boolean;
  onPay: () => void;
}

function PayButton({
  fine,
  canPay,
  paying,
  locked = false,
  paymentPending,
  onPay,
}: PayButtonProps) {
  const disabled = !canPay || paying || paymentPending || locked;

  return (
    <GeneralButton
      variant={disabled ? "disabled" : "active"}
      buttonFunction={onPay}
    >
      {paying ? (
        <>
          <Loader2 className="animate-spin" />
          Starting payment
        </>
      ) : paymentPending ? (
        "Payment in progress"
      ) : (
        `Pay ${money(fine.amount)}`
      )}
    </GeneralButton>
  );
}

/* -------------------------------------------------------------------------- */
/* Row                                                                        */
/* -------------------------------------------------------------------------- */

interface FineRowProps {
  fine: Fine;
  canPay: boolean;
  paying: boolean;
  locked: boolean;
  paymentPending: boolean;
  onPay: () => void;
  onView: () => void;
}

function FineRow({
  fine,
  canPay,
  paying,
  locked,
  paymentPending,
  onPay,
  onView,
}: FineRowProps) {
  const status = STATUS[fine.status];
  const timing = timingFor(fine);
  const unpaid = fine.status === "UNPAID";

  return (
    <li
      className={`rounded-2xl p-4 transition-transform duration-200 hover:-translate-y-0.5 sm:p-5 ${GLASS} ${
        timing?.urgent && unpaid ? "ring-1 ring-red-400/50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="line-clamp-2 text-base font-semibold leading-snug text-neutral-900">
            {fineTitle(fine)}
          </h2>

          <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span
              className={`inline-flex items-center gap-1.5 font-medium ${status.text}`}
            >
              <span
                aria-hidden
                className={`size-2 rounded-full ${status.dot}`}
              />
              {status.label}
            </span>

            {timing && (
              <span
                className={
                  timing.urgent
                    ? "font-medium text-red-600"
                    : "text-neutral-600"
                }
              >
                {timing.text}
              </span>
            )}
          </p>

          <p className="mt-1 text-xs text-neutral-500">
            Issued {formatDate(fine.created_at)}
          </p>
        </div>

        <p
          className={`shrink-0 text-xl font-semibold tabular-nums tracking-tight ${
            unpaid ? "text-neutral-900" : "text-neutral-400"
          }`}
        >
          {money(fine.amount)}
        </p>
      </div>
      <div className="mt-4 flex flex-col-reverse gap-2.5 border-t border-white/60 pt-4 sm:flex-row sm:justify-end">
        <GeneralButton onClick={onView}>View cause</GeneralButton>

        {unpaid && (
          <PayButton
            fine={fine}
            canPay={canPay}
            paying={paying}
            locked={locked}
            paymentPending={paymentPending}
            onPay={onPay}
          />
        )}
      </div>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* 3D icon tile                                                               */
/* -------------------------------------------------------------------------- */

type Tone = "blue" | "amber" | "emerald" | "red" | "violet" | "slate";

const TONES: Record<Tone, string> = {
  blue: "border-blue-400/80 from-blue-300 via-blue-500 to-blue-600 shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-3px_0_rgba(30,64,175,0.35),0_6px_12px_-4px_rgba(59,130,246,0.65)]",
  amber:
    "border-amber-300/80 from-amber-200 via-amber-400 to-amber-500 shadow-[inset_0_2px_0_rgba(255,255,255,0.55),inset_0_-3px_0_rgba(146,64,14,0.35),0_6px_12px_-4px_rgba(245,158,11,0.65)]",
  emerald:
    "border-emerald-400/80 from-emerald-300 via-emerald-500 to-emerald-600 shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-3px_0_rgba(6,78,59,0.35),0_6px_12px_-4px_rgba(16,185,129,0.65)]",
  red: "border-red-400/80 from-red-300 via-red-500 to-red-600 shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-3px_0_rgba(127,29,29,0.35),0_6px_12px_-4px_rgba(239,68,68,0.65)]",
  violet:
    "border-violet-400/80 from-violet-300 via-violet-500 to-violet-600 shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-3px_0_rgba(76,29,149,0.35),0_6px_12px_-4px_rgba(139,92,246,0.65)]",
  slate:
    "border-slate-400/80 from-slate-300 via-slate-500 to-slate-600 shadow-[inset_0_2px_0_rgba(255,255,255,0.45),inset_0_-3px_0_rgba(15,23,42,0.35),0_6px_12px_-4px_rgba(71,85,105,0.55)]",
};

const ICON_SIZES = {
  sm: { box: "size-9 rounded-xl", icon: "size-4" },
  md: { box: "size-11 rounded-xl", icon: "size-5" },
  lg: { box: "size-12 rounded-2xl", icon: "size-6" },
} as const;

/** A raised, glossy icon tile: top highlight, darker bottom edge, soft drop shadow. */
function Icon3D({
  icon: Icon,
  tone = "blue",
  size = "md",
}: {
  icon: LucideIcon;
  tone?: Tone;
  size?: keyof typeof ICON_SIZES;
}) {
  const s = ICON_SIZES[size];

  return (
    <span
      aria-hidden
      className={`relative flex shrink-0 items-center justify-center overflow-hidden border bg-gradient-to-b text-white ${s.box} ${TONES[tone]}`}
    >
      <span className="pointer-events-none absolute inset-x-1.5 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/55 to-transparent" />
      <Icon
        className={`relative drop-shadow-[0_1.5px_1px_rgba(0,0,0,0.35)] ${s.icon}`}
        strokeWidth={2.25}
      />
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Dialog (shadcn)                                                            */
/* -------------------------------------------------------------------------- */

const GLASS_INNER = "border border-white/70 bg-white/30 backdrop-blur-md";

interface FineDialogProps {
  fine: Fine | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payments: FinePayment[];
  canPay: boolean;
  paying: boolean;
  paymentPending: boolean;
  onPay: () => void;
}

function paymentVisual(status: string): { icon: LucideIcon; tone: Tone } {
  const value = status.toUpperCase();

  if (["SUCCESS", "SUCCESSFUL", "PAID", "COMPLETED"].includes(value)) {
    return { icon: BadgeCheck, tone: "emerald" };
  }
  if (["PENDING", "INITIATED", "PROCESSING"].includes(value)) {
    return { icon: Clock, tone: "amber" };
  }

  return { icon: AlertCircle, tone: "red" };
}

function FineDialog({
  fine,
  open,
  onOpenChange,
  payments,
  canPay,
  paying,
  paymentPending,
  onPay,
}: FineDialogProps) {
  if (!fine) return null;

  const violation = fine.violation;
  const status = STATUS[fine.status];
  const timing = timingFor(fine);
  const overdue = isOverdue(fine);

  const headerIcon: { icon: LucideIcon; tone: Tone } =
    fine.status === "PAID"
      ? { icon: BadgeCheck, tone: "emerald" }
      : fine.status === "WAIVED"
        ? { icon: CircleSlash, tone: "slate" }
        : { icon: ShieldAlert, tone: overdue ? "red" : "amber" };

  const details: {
    label: string;
    value: string | null;
    icon: LucideIcon;
    tone: Tone;
  }[] = [
    { label: "Reason", value: fine.reason, icon: FileText, tone: "blue" },
    {
      label: "What happened",
      value: humanize(violation?.type) || null,
      icon: ShieldAlert,
      tone: "amber",
    },
    {
      label: "Date it happened",
      value: formatDate(violation?.occurred_on),
      icon: CalendarDays,
      tone: "violet",
    },
    {
      label: "Consequence",
      value: violation?.consequence ?? null,
      icon: Scale,
      tone: "red",
    },
    {
      label: "Notes",
      value: violation?.notes ?? null,
      icon: StickyNote,
      tone: "slate",
    },
    {
      label: "Issued by",
      value: humanize(fine.source) || null,
      icon: UserCheck,
      tone: "blue",
    },
  ].filter((item) => item.value);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] gap-0 overflow-y-auto border border-white/60 bg-white/55 p-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_24px_60px_-12px_rgba(40,50,140,0.35)] backdrop-blur-2xl sm:max-w-md">
        <div className="space-y-4 p-4 sm:p-5">
          {/* Header */}
          <DialogHeader className="space-y-0 pr-8 text-left">
            <div className="flex items-start gap-3">
              <Icon3D icon={headerIcon.icon} tone={headerIcon.tone} size="lg" />

              <div className="min-w-0">
                <DialogTitle className="text-base font-semibold leading-snug tracking-tight text-secondary-blue sm:text-sm">
                  {fineTitle(fine)}
                </DialogTitle>
                <DialogDescription className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
                  <span
                    className={`inline-flex items-center gap-1.5 font-medium ${status.text}`}
                  >
                    <span
                      aria-hidden
                      className={`size-2 rounded-full ${status.dot}`}
                    />
                    {status.label}
                  </span>
                  {timing && (
                    <span
                      className={
                        timing.urgent ? "font-medium text-red-600" : ""
                      }
                    >
                      {timing.text}
                    </span>
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Amount */}
          <div
            className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3.5 ${GLASS_INNER}`}
          >
            <span className="text-xs font-medium text-neutral-600">
              {fine.status === "UNPAID" ? "Amount due" : "Fine amount"}
            </span>
            <span className="text-2xl font-semibold tabular-nums tracking-tight text-neutral-900">
              {money(fine.amount)}
            </span>
          </div>

          {/* Cause */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-neutral-900">
              Why this fine was issued
            </h3>

            {details.length > 0 ? (
              <dl
                className={`divide-y divide-white/60 rounded-2xl px-4 ${GLASS_INNER}`}
              >
                {details.map((item) => (
                  <div key={item.label} className="flex items-start gap-3 py-3">
                    <Icon3D icon={item.icon} tone={item.tone} size="sm" />
                    <div className="min-w-0 pt-0.5">
                      <dt className="text-xs text-neutral-500">{item.label}</dt>
                      <dd className="mt-0.5 whitespace-pre-line text-sm leading-relaxed text-neutral-900">
                        {item.value}
                      </dd>
                    </div>
                  </div>
                ))}
              </dl>
            ) : (
              <p
                className={`rounded-2xl px-4 py-3.5 text-sm text-neutral-600 ${GLASS_INNER}`}
              >
                No extra details were recorded for this fine.
              </p>
            )}
          </div>

          {/* Resolution */}
          {violation?.resolved_at && (
            <div
              className={`flex items-start gap-3 rounded-2xl px-4 py-3.5 ${GLASS_INNER}`}
            >
              <Icon3D icon={BadgeCheck} tone="emerald" size="sm" />
              <div className="min-w-0 pt-0.5">
                <p className="text-sm font-medium text-neutral-900">
                  Resolved on {formatDate(violation.resolved_at)}
                </p>
                {violation.resolution_note && (
                  <p className="mt-0.5 text-sm leading-relaxed text-neutral-600">
                    {violation.resolution_note}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Payments */}
          {payments.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-neutral-900">
                Payment attempts
              </h3>
              <ul
                className={`divide-y divide-white/60 rounded-2xl px-4 ${GLASS_INNER}`}
              >
                {payments.map((payment) => {
                  const visual = paymentVisual(payment.status);

                  return (
                    <li
                      key={payment.id}
                      className="flex items-center gap-3 py-3"
                    >
                      <Icon3D icon={visual.icon} tone={visual.tone} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-neutral-900">
                          {humanize(payment.status)}
                        </p>
                        <p className="truncate text-xs text-neutral-500">
                          {formatDate(payment.paid_at ?? payment.created_at)}
                          {payment.paystack_reference
                            ? `, ref ${payment.paystack_reference}`
                            : ""}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-medium tabular-nums text-neutral-900">
                        {money(payment.amount)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col-reverse gap-2.5 border-t border-white/60 p-4 sm:flex-row sm:items-center sm:justify-end sm:space-x-0 sm:p-5">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={OUTLINE_BUTTON}
          >
            Close
          </button>

          {fine.status === "UNPAID" && (
            <PayButton
              fine={fine}
              canPay={canPay}
              paying={paying}
              paymentPending={paymentPending}
              onPay={onPay}
            />
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import {
  AlertCircle,
  BadgeCheck,
  Clock,
  Loader2,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import GeneralButton from "@/components/miscelleneous/generalButton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetTitle,
} from "@/components/ui/sheet";

import { Icon3D, type Tone } from "./icon-3d";
import { money, type PayTarget, type PaymentPhase } from "./use-fine-payment";

/* -------------------------------------------------------------------------- */
/* Styles and small helpers                                                   */
/* -------------------------------------------------------------------------- */

const GLASS_INNER = "border border-white/70 bg-white/30 backdrop-blur-md";

const OUTLINE_BUTTON =
  "inline-flex w-full items-center justify-center rounded-full border border-neutral-300 bg-white/70 px-5 py-2.5 text-xs font-bold text-neutral-800 transition-colors hover:border-neutral-400 hover:bg-neutral-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/40 md:text-sm";

const SHEET_GLASS =
  "gap-0 border-white/60 bg-white/60 p-0 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_24px_60px_-12px_rgba(40,50,140,0.35)]";

/** Right-hand drawer on large screens, bottom sheet on smaller ones. */
function useIsDesktop(query = "(min-width: 1024px)") {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);

    update();
    media.addEventListener("change", update);

    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
}

/* -------------------------------------------------------------------------- */
/* Shared layout for every screen                                             */
/* -------------------------------------------------------------------------- */

interface StatusLayoutProps {
  icon: LucideIcon;
  tone: Tone;
  spin?: boolean;
  title: string;
  description: string;
  children?: ReactNode;
  actions?: ReactNode;
}

function StatusLayout({
  icon,
  tone,
  spin,
  title,
  description,
  children,
  actions,
}: StatusLayoutProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-6 pt-12 text-center">
        <Icon3D icon={icon} tone={tone} size="xl" spin={spin} />

        <SheetTitle className="mt-6 text-lg font-semibold tracking-tight text-secondary-blue">
          {title}
        </SheetTitle>
        <SheetDescription className="mt-1.5 max-w-xs text-sm leading-relaxed text-neutral-600">
          {description}
        </SheetDescription>

        {children && <div className="mt-6 w-full text-left">{children}</div>}
      </div>

      {actions && (
        <SheetFooter className="flex-col gap-2.5 border-t border-white/60 p-4 pb-6 sm:flex-col sm:space-x-0 sm:p-5">
          {actions}
        </SheetFooter>
      )}
    </div>
  );
}

function DetailRows({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <dl className={`divide-y divide-white/60 rounded-2xl px-4 ${GLASS_INNER}`}>
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-baseline justify-between gap-4 py-3 text-sm"
        >
          <dt className="shrink-0 text-neutral-500">{row.label}</dt>
          <dd className="min-w-0 truncate text-right font-medium text-neutral-900">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* -------------------------------------------------------------------------- */
/* 1. Confirm                                                                 */
/* -------------------------------------------------------------------------- */

export function PaymentConfirm({
  target,
  onConfirm,
  onCancel,
}: {
  target: PayTarget;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const paying =
    target.kind === "single" ? target.title : `${target.count} unpaid fines`;

  return (
    <StatusLayout
      icon={Wallet}
      tone="blue"
      title="Review your payment"
      description="You'll be taken to Paystack to pay securely. Afterwards you'll come back here and we'll confirm it."
      actions={
        <>
          <GeneralButton
            text={`Continue to Paystack`}
            variant="active"
            className="w-full"
            buttonFunction={onConfirm}
          />
          <button type="button" onClick={onCancel} className={OUTLINE_BUTTON}>
            Cancel
          </button>
        </>
      }
    >
      <DetailRows
        rows={[
          { label: "Paying for", value: paying },
          { label: "Amount", value: money(target.amountNaira) },
        ]}
      />
    </StatusLayout>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. Processing (creating checkout, redirecting, verifying)                  */
/* -------------------------------------------------------------------------- */

export function PaymentProcessing({
  title,
  description,
  reference,
}: {
  title: string;
  description: string;
  reference?: string;
}) {
  return (
    <StatusLayout
      icon={Loader2}
      tone="blue"
      spin
      title={title}
      description={description}
    >
      <div role="status" aria-live="polite" className="sr-only">
        {title}
      </div>

      {reference && (
        <p className="truncate text-center text-[11px] text-neutral-500">
          Reference {reference}
        </p>
      )}
    </StatusLayout>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. Pending (still processing after automatic checks)                       */
/* -------------------------------------------------------------------------- */

export function PaymentPending({
  message,
  reference,
  onCheckAgain,
  onClose,
}: {
  message: string;
  reference: string;
  onCheckAgain: () => void;
  onClose: () => void;
}) {
  return (
    <StatusLayout
      icon={Clock}
      tone="amber"
      title="Payment still processing"
      description={message}
      actions={
        <>
          <GeneralButton
            text="Check again"
            variant="active"
            className="w-full"
            buttonFunction={onCheckAgain}
          />
          <button type="button" onClick={onClose} className={OUTLINE_BUTTON}>
            Close
          </button>
        </>
      }
    >
      <div className={`rounded-2xl px-4 py-3.5 text-sm ${GLASS_INNER}`}>
        <p className="font-medium text-neutral-900">
          If you were charged, don&apos;t pay again.
        </p>
        <p className="mt-1 leading-relaxed text-neutral-600">
          Your fine will update on its own once Paystack confirms the payment.
        </p>
        <p className="mt-2 truncate text-[11px] text-neutral-500">
          Reference {reference}
        </p>
      </div>
    </StatusLayout>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. Success                                                                 */
/* -------------------------------------------------------------------------- */

export function PaymentSuccess({
  message,
  amountKobo,
  fineCount,
  reference,
  onDone,
}: {
  message: string;
  amountKobo?: number;
  fineCount?: number;
  reference: string;
  onDone: () => void;
}) {
  const rows = [
    ...(amountKobo != null
      ? [{ label: "Amount paid", value: money(amountKobo / 100) }]
      : []),
    ...(fineCount != null
      ? [
          {
            label: "Fines cleared",
            value: String(fineCount),
          },
        ]
      : []),
    { label: "Reference", value: reference },
  ];

  return (
    <StatusLayout
      icon={BadgeCheck}
      tone="emerald"
      title="Payment successful"
      description={message}
      actions={
        <GeneralButton
          text="Done"
          variant="active"
          className="w-full"
          buttonFunction={onDone}
        />
      }
    >
      <DetailRows rows={rows} />
    </StatusLayout>
  );
}

/* -------------------------------------------------------------------------- */
/* 5. Error                                                                   */
/* -------------------------------------------------------------------------- */

const ERROR_TITLES = {
  start: "We couldn't start your payment",
  verify: "We couldn't confirm your payment",
  failed: "The payment wasn't completed",
} as const;

export function PaymentError({
  kind,
  message,
  retryLabel,
  onRetry,
  onClose,
}: {
  kind: keyof typeof ERROR_TITLES;
  message: string;
  retryLabel: string;
  /** Leave undefined when there is nothing sensible to retry. */
  onRetry?: () => void;
  onClose: () => void;
}) {
  return (
    <StatusLayout
      icon={AlertCircle}
      tone="red"
      title={ERROR_TITLES[kind]}
      description={message}
      actions={
        <>
          {onRetry && (
            <GeneralButton
              text={retryLabel}
              variant="active"
              className="w-full"
              buttonFunction={onRetry}
            />
          )}
          <button type="button" onClick={onClose} className={OUTLINE_BUTTON}>
            Close
          </button>
        </>
      }
    >
      {kind === "verify" && (
        <p
          className={`rounded-2xl px-4 py-3.5 text-sm text-neutral-600 ${GLASS_INNER}`}
        >
          If money left your account, wait a moment and check again before
          paying a second time.
        </p>
      )}
    </StatusLayout>
  );
}

/* -------------------------------------------------------------------------- */
/* The sheet                                                                  */
/* -------------------------------------------------------------------------- */

interface FinePaymentSheetProps {
  phase: PaymentPhase;
  onProceed: (target: PayTarget) => void;
  onVerify: (reference: string, target?: PayTarget) => void;
  onClose: () => void;
}

export default function FinePaymentSheet({
  phase,
  onProceed,
  onVerify,
  onClose,
}: FinePaymentSheetProps) {
  const desktop = useIsDesktop();

  // Keep showing the last screen while the sheet slides out.
  const lastPhase = useRef<PaymentPhase>(phase);
  if (phase.step !== "idle") lastPhase.current = phase;
  const shown = lastPhase.current;

  const open = phase.step !== "idle";
  const locked = phase.step === "starting" || phase.step === "redirecting";

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next && !locked) onClose();
      }}
    >
      <SheetContent
        side={desktop ? "right" : "bottom"}
        className={`flex flex-col ${SHEET_GLASS} ${
          desktop
            ? "w-full border-l sm:max-w-md"
            : "max-h-[92dvh] overflow-y-auto rounded-t-3xl border-t"
        }`}
      >
        {renderStep(shown, { onProceed, onVerify, onClose })}
      </SheetContent>
    </Sheet>
  );
}

function renderStep(
  phase: PaymentPhase,
  actions: Pick<FinePaymentSheetProps, "onProceed" | "onVerify" | "onClose">,
) {
  const { onProceed, onVerify, onClose } = actions;

  switch (phase.step) {
    case "confirm":
      return (
        <PaymentConfirm
          target={phase.target}
          onConfirm={() => onProceed(phase.target)}
          onCancel={onClose}
        />
      );

    case "starting":
      return (
        <PaymentProcessing
          title="Preparing your payment"
          description="Setting up a secure checkout with Paystack."
        />
      );

    case "redirecting":
      return (
        <PaymentProcessing
          title="Taking you to Paystack"
          description="Please keep this page open. You'll be redirected in a moment."
        />
      );

    case "verifying":
      return (
        <PaymentProcessing
          title={
            phase.attempt > 1
              ? "Still confirming your payment"
              : "Confirming your payment"
          }
          description={
            phase.attempt > 1
              ? "This is taking a little longer than usual. We're checking again."
              : "This only takes a moment. Please keep this page open."
          }
          reference={phase.reference}
        />
      );

    case "pending":
      return (
        <PaymentPending
          message={phase.message}
          reference={phase.reference}
          onCheckAgain={() => onVerify(phase.reference, phase.target)}
          onClose={onClose}
        />
      );

    case "success":
      return (
        <PaymentSuccess
          message={phase.message}
          amountKobo={phase.amountKobo}
          fineCount={phase.fineCount}
          reference={phase.reference}
          onDone={onClose}
        />
      );

    case "error": {
      const { kind, target, reference } = phase;

      const onRetry =
        (kind === "start" || kind === "failed") && target
          ? () => onProceed(target)
          : kind === "verify" && reference
            ? () => onVerify(reference, target)
            : undefined;

      return (
        <PaymentError
          kind={kind}
          message={phase.message}
          retryLabel={
            kind === "start"
              ? "Try again"
              : kind === "verify"
                ? "Check again"
                : "Pay again"
          }
          onRetry={onRetry}
          onClose={onClose}
        />
      );
    }

    default:
      return null;
  }
}

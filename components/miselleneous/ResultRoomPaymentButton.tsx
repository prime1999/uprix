"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import ContinuePaymentModal from "@/components/payment/ContinuePaymentModal";
import PaymentCompletedCard from "@/components/payment/PaymentComplete";
import PaymentModal from "@/components/payment/paymentModal";
import type { ResultRoomStatus } from "@/lib/supabase/result-room";

type PaymentButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> & {
  children: ReactNode;
  disable?: boolean;
  status: ResultRoomStatus;
  /** Optional: force the round icon shape if you ever need to. Normally detected automatically. */
  iconOnly?: boolean;
};

const ResultRoomPaymentButton = forwardRef<
  HTMLButtonElement,
  PaymentButtonProps
>(
  (
    {
      children,
      disable = false,
      disabled,
      iconOnly = false,
      type = "button",
      className = "",
      status,
      ...props
    },
    ref,
  ) => {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <button
            ref={ref}
            type={type}
            disabled={disable || disabled}
            className={`group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-full border border-yellow-400/80 bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-600 px-4 py-1.5 text-sm font-semibold text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_8px_16px_-6px_rgba(234,179,8,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_12px_22px_-6px_rgba(234,179,8,0.7)] active:translate-y-0.5 active:shadow-[inset_0_2px_0_rgba(255,255,255,0.3),0_3px_8px_-3px_rgba(234,179,8,0.5)] focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400/40 disabled:cursor-not-allowed disabled:border-slate-400 disabled:from-slate-300 disabled:via-slate-400 disabled:to-slate-500 disabled:text-slate-100 disabled:shadow-[inset_0_2px_0_rgba(255,255,255,0.35),0_4px_10px_-4px_rgba(71,85,105,0.45)] disabled:opacity-100 disabled:hover:translate-y-0 disabled:hover:brightness-100 [&:has(>span>svg:only-child)]:size-8 [&:has(>span>svg:only-child)]:p-0 ${
              iconOnly ? "!size-8 !p-0" : ""
            } ${className}`}
            {...props}
          >
            {/* glossy highlight on the top half */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-[10%] top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/50 to-transparent"
            />
            {/* light sweep on hover */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-full -skew-x-12 bg-white/30 transition-transform duration-700 group-hover:translate-x-[400%]"
            />
            {/* content layer: icons get a default size unless they set their own size-* class */}
            <span className="relative inline-flex items-center justify-center gap-2 [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
              {children}
            </span>
          </button>
        </DialogTrigger>
        <DialogContent className="w-[400px]">
          {!status.startedPayment ? (
            <PaymentModal />
          ) : !status.hasPaid ? (
            <ContinuePaymentModal status={status} />
          ) : (
            <PaymentCompletedCard status={status} />
          )}
        </DialogContent>
      </Dialog>
    );
  },
);

ResultRoomPaymentButton.displayName = "ResultRoomPaymentButton";

export default ResultRoomPaymentButton;

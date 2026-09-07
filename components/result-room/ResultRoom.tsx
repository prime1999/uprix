"use client";

import Link from "next/link";
import { ArrowLeft, TrendingUp, Star } from "lucide-react";
import Faq from "@/components/result-room/Faq";
import PaymentModal from "@/components/payment/paymentModal";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import ContinuePaymentModal from "@/components/payment/ContinuePaymentModal";
import PaymentCompletedCard from "@/components/payment/PaymentComplete";
import type { ResultRoomStatus } from "@/lib/supabase/result-room";

export default function ResultRoom({ status }: { status: ResultRoomStatus }) {
  return (
    <div className="min-h-screen w-full md:w-11/12 mx-auto flex items-center justify-center p-4">
      <div className="relative w-full overflow-hidden grid grid-cols-1 md:grid-cols-[1.15fr_0.85fr]">
        <div className="relative z-10 px-7 sm:px-10 py-8 sm:py-10 flex flex-col justify-center">
          <Link
            href="/"
            className="w-36 h-10 p-2 rounded-xl bg-white border border-neutral-200 shadow-sm text-sm flex gap-2 items-center justify-center mb-8"
          >
            <ArrowLeft size={16} className="text-neutral-700" /> Back to home
          </Link>

          <h1 className="text-4xl sm:text-[2.6rem] font-extrabold text-neutral-900 leading-[1.1] tracking-tight mb-4">
            The Result
            <span className="inline-flex align-middle w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary-blue to-secondary-blue items-center justify-center shadow-lg shadow-primary-blue mx-0.5 -translate-y-1">
              <TrendingUp size={18} className="text-white" strokeWidth={2.5} />
            </span>{" "}
            Room: <br />
            Second edition is here
          </h1>

          <p className="text-[14px] text-neutral-500 leading-relaxed max-w-sm mb-7">
            A strict, 90-day execution and accountability space. We run this
            room every 3 months for people who are ready to break the cycle of
            procrastination and finally get results.
          </p>

          <div className="flex items-center gap-3 mb-10">
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  disabled={!status.roomAvailable}
                  className="inline-flex items-center gap-2 bg-secondary-blue text-white py-3 px-4 rounded-lg text-xs font-semibold font-heading duration-500 transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status.roomAvailable
                    ? "Join the Result Room"
                    : "No upcoming room"}
                </button>
              </DialogTrigger>
              <DialogContent className="w-[400px]">
                {!status.startedPayment ? (
                  <PaymentModal />
                ) : !status.hasPaid ? (
                  <ContinuePaymentModal participant={status.participant!} />
                ) : (
                  <PaymentCompletedCard participant={status.participant!} />
                )}
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center gap-8">
            <div>
              <p className="text-[10px] font-semibold tracking-wide text-neutral-400 mb-2">
                TRUSTED PARTNERS
              </p>
              <div className="flex -space-x-2.5">
                {[
                  "from-rose-300 to-orange-400",
                  "from-sky-300 to-indigo-400",
                  "from-emerald-300 to-teal-400",
                ].map((gradient, index) => (
                  <div
                    key={index}
                    className={`w-8 h-8 rounded-full border-2 border-neutral-50 bg-gradient-to-br ${gradient}`}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-wide text-neutral-400 mb-2">
                RATED EXCELLENT: 5/5
              </p>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    size={16}
                    className="fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        <Faq />
      </div>
    </div>
  );
}

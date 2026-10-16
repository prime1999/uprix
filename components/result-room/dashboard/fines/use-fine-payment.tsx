"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  useInitializeFinePayment,
  useVerifyFinePayment,
} from "@/lib/queries/result-room";

/* -------------------------------------------------------------------------- */
/* Shared                                                                     */
/* -------------------------------------------------------------------------- */

export const money = (amount: number, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

/** What the person is paying for. Amounts are in naira. */
export type PayTarget =
  | { kind: "single"; fineId: string; title: string; amountNaira: number }
  | { kind: "all"; count: number; amountNaira: number };

/**
 * Every screen the payment sheet can show.
 *
 *   idle -> confirm -> starting -> redirecting -> (Paystack) -> verifying
 *                                                    |-> success
 *                                                    |-> pending (still processing)
 *                                                    |-> error
 *
 * Error kinds:
 *   start  - we couldn't create the checkout
 *   verify - we couldn't reach the verification service (try checking again)
 *   failed - Paystack says the payment didn't go through (offer to pay again)
 */
export type PaymentPhase =
  | { step: "idle" }
  | { step: "confirm"; target: PayTarget }
  | { step: "starting"; target: PayTarget }
  | { step: "redirecting"; target: PayTarget }
  | {
      step: "verifying";
      reference: string;
      target?: PayTarget;
      attempt: number;
    }
  | { step: "pending"; reference: string; target?: PayTarget; message: string }
  | {
      step: "success";
      reference: string;
      message: string;
      amountKobo?: number;
      fineCount?: number;
    }
  | {
      step: "error";
      kind: "start" | "verify" | "failed";
      message: string;
      reference?: string;
      target?: PayTarget;
    };

/** How many times we re-check a "pending" payment on our own. */
const AUTO_CHECKS = 6;
const AUTO_CHECK_DELAY_MS = 3000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const messageFrom = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

/* -------------------------------------------------------------------------- */
/* Hook                                                                       */
/* -------------------------------------------------------------------------- */

export function useFinePayment() {
  const { mutateAsync: initializePayment } = useInitializeFinePayment();
  const { mutateAsync: verifyPayment } = useVerifyFinePayment();

  const [phase, setPhase] = useState<PaymentPhase>({ step: "idle" });

  const runId = useRef(0);
  const mounted = useRef(false);
  const returnHandled = useRef(false);

  // Must stay above the effect that handles the Paystack return.
  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  /** A run is stale if the sheet was closed, another run started, or we unmounted. */
  const isCurrent = useCallback(
    (id: number) => mounted.current && runId.current === id,
    [],
  );

  /** Open the sheet on the confirm screen. */
  const begin = useCallback((target: PayTarget) => {
    runId.current += 1;
    setPhase({ step: "confirm", target });
  }, []);

  const close = useCallback(() => {
    runId.current += 1;
    setPhase({ step: "idle" });
  }, []);

  /** Create the Paystack checkout, then send the person there. */
  const proceed = useCallback(
    async (target: PayTarget) => {
      const id = ++runId.current;

      setPhase({ step: "starting", target });

      try {
        const result = await initializePayment(
          target.kind === "single"
            ? { fineId: target.fineId }
            : { payAll: true },
        );

        if (!isCurrent(id)) return;

        setPhase({ step: "redirecting", target });
        window.location.assign(result.authorizationUrl);
      } catch (error) {
        if (!isCurrent(id)) return;

        setPhase({
          step: "error",
          kind: "start",
          target,
          message: messageFrom(
            error,
            "We couldn't start your payment. Please try again.",
          ),
        });
      }
    },
    [initializePayment, isCurrent],
  );

  /**
   * Ask the server to confirm a payment with Paystack.
   * While the answer is "pending" we re-check a few times, then hand
   * control back to the person ("Check again").
   */
  const verify = useCallback(
    async (reference: string, target?: PayTarget) => {
      const id = ++runId.current;

      for (let attempt = 1; attempt <= AUTO_CHECKS; attempt++) {
        setPhase({ step: "verifying", reference, target, attempt });

        try {
          const result = await verifyPayment({ reference });

          if (!isCurrent(id)) return;

          if (result.status === "success") {
            setPhase({
              step: "success",
              reference,
              message: result.message,
              amountKobo: result.amount,
              fineCount: result.fineCount,
            });
            return;
          }

          if (result.status === "error") {
            setPhase({
              step: "error",
              kind: "failed",
              reference,
              target,
              message: result.message,
            });
            return;
          }

          // status === "pending"
          if (attempt === AUTO_CHECKS) {
            setPhase({
              step: "pending",
              reference,
              target,
              message: result.message,
            });
            return;
          }

          await sleep(AUTO_CHECK_DELAY_MS);

          if (!isCurrent(id)) return;
        } catch (error) {
          if (!isCurrent(id)) return;

          setPhase({
            step: "error",
            kind: "verify",
            reference,
            target,
            message: messageFrom(
              error,
              "We couldn't confirm your payment. Please try again.",
            ),
          });
          return;
        }
      }
    },
    [verifyPayment, isCurrent],
  );

  /**
   * Paystack sends the person back to this page with ?reference=...
   * (callback_url). Pick it up once, clean the URL, and verify.
   */
  useEffect(() => {
    if (returnHandled.current) return;
    returnHandled.current = true;

    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference") ?? params.get("trxref");

    if (!reference || !/^FINE-/i.test(reference)) return;

    params.delete("reference");
    params.delete("trxref");

    const query = params.toString();

    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`,
    );

    void verify(reference);
  }, [verify]);

  return { phase, begin, proceed, verify, close };
}

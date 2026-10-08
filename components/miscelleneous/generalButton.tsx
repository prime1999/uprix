"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

export type ButtonVariant = "default" | "active" | "delete" | "disabled";

type Prop = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  text: string;
  /** default = yellow, active = blue, delete = red, disabled = gray */
  variant?: ButtonVariant;
  /** Click handler. Works the same as onClick, so use either one. */
  buttonFunction?: () => void;
};

// lift on hover, press down on click (not used by the disabled style)
const MOTION =
  "hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0.5";

const VARIANTS: Record<ButtonVariant, string> = {
  default: `${MOTION} border-yellow-300/80 bg-gradient-to-b from-yellow-200 via-yellow-300 to-yellow-400 text-amber-950 shadow-[inset_0_2px_0_rgba(255,255,255,0.75),0_10px_20px_-6px_rgba(250,204,21,0.55)] hover:shadow-[inset_0_2px_0_rgba(255,255,255,0.75),0_14px_26px_-6px_rgba(250,204,21,0.65)] active:shadow-[inset_0_2px_0_rgba(255,255,255,0.5),0_4px_10px_-4px_rgba(250,204,21,0.5)] focus-visible:ring-yellow-300/50`,

  active: `${MOTION} border-blue-400/80 bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_8px_16px_-6px_rgba(59,130,246,0.6)] hover:shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_12px_22px_-6px_rgba(59,130,246,0.7)] active:shadow-[inset_0_2px_0_rgba(255,255,255,0.3),0_3px_8px_-3px_rgba(59,130,246,0.5)] focus-visible:ring-blue-400/40`,

  delete: `${MOTION} border-red-400/80 bg-gradient-to-b from-red-400 via-red-500 to-red-600 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_8px_16px_-6px_rgba(239,68,68,0.6)] hover:shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_12px_22px_-6px_rgba(239,68,68,0.7)] active:shadow-[inset_0_2px_0_rgba(255,255,255,0.3),0_3px_8px_-3px_rgba(239,68,68,0.5)] focus-visible:ring-red-400/40`,

  // deeper gray: flat, no lift, no glow, no hover sweep
  disabled:
    "cursor-not-allowed border-neutral-500/70 bg-gradient-to-b from-neutral-400 via-neutral-500 to-neutral-600 text-white/90 shadow-[inset_0_2px_0_rgba(255,255,255,0.35)]",
};

const GeneralButton = forwardRef<HTMLButtonElement, Prop>(
  (
    {
      text,
      buttonFunction,
      onClick,
      variant = "default",
      disabled = false,
      type = "button",
      className = "",
      ...props
    },
    ref,
  ) => {
    // the native `disabled` prop and variant="disabled" mean the same thing
    const isDisabled = disabled || variant === "disabled";
    const style = VARIANTS[isDisabled ? "disabled" : variant];

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        onClick={(event) => {
          onClick?.(event);
          buttonFunction?.();
        }}
        className={`group relative overflow-hidden rounded-full border px-6 py-2.5 text-xs font-bold transition-all duration-200 focus:outline-none focus-visible:ring-4 md:text-sm ${style} ${className}`}
        {...props}
      >
        {/* glossy highlight on the top half */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-3 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/50 to-transparent"
        />
        {/* light sweep on hover (skipped when disabled) */}
        {!isDisabled && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-full -skew-x-12 bg-white/35 transition-transform duration-700 group-hover:translate-x-[400%]"
          />
        )}
        <span className="relative">{text}</span>
      </button>
    );
  },
);

GeneralButton.displayName = "GeneralButton";

export default GeneralButton;

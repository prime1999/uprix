import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type SecondaryButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> & {
  children: ReactNode;
  /** Optional: force the round icon shape if you ever need to. Normally detected automatically. */
  iconOnly?: boolean;
};

const SecondaryButton = forwardRef<HTMLButtonElement, SecondaryButtonProps>(
  (
    { children, iconOnly = false, type = "button", className = "", ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={`group relative inline-flex min-h-8 items-center justify-center overflow-hidden rounded-full border border-blue-400/80 bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 px-4 py-1.5 text-sm font-semibold text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_8px_16px_-6px_rgba(59,130,246,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_12px_22px_-6px_rgba(59,130,246,0.7)] active:translate-y-0.5 active:shadow-[inset_0_2px_0_rgba(255,255,255,0.3),0_3px_8px_-3px_rgba(59,130,246,0.5)] focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:brightness-100 [&:has(>span>svg:only-child)]:size-8 [&:has(>span>svg:only-child)]:p-0 ${
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
    );
  },
);

SecondaryButton.displayName = "SecondaryButton";

export default SecondaryButton;

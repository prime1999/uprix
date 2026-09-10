"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ToastVariant = "default" | "success" | "info" | "destructive";

type ToastProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: ToastVariant;
};

type ToastItem = ToastProps & { id: string };

type ToastContextValue = {
  toast: (props: ToastProps) => void;
};

const ToastContext = React.createContext<ToastContextValue | undefined>(
  undefined,
);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = React.useCallback(
    (props: ToastProps) => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { ...props, id }].slice(-3));
      window.setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4">
        <div className="flex w-full max-w-sm flex-col gap-3">
          {toasts.map((item) => (
            <div
              key={item.id}
              role="status"
              className={cn(
                "pointer-events-auto relative rounded-xl border px-4 py-3 pr-10 shadow-lg backdrop-blur-xl",
                item.variant === "success" &&
                  "border-emerald-200 bg-emerald-50/95 text-emerald-950",
                item.variant === "info" &&
                  "border-blue-200 bg-blue-50/95 text-blue-950",
                item.variant === "destructive" &&
                  "border-red-200 bg-red-50/95 text-red-950",
                (!item.variant || item.variant === "default") &&
                  "border-neutral-200 bg-white/95 text-neutral-950",
              )}
            >
              {item.title && (
                <p className="text-sm font-semibold">{item.title}</p>
              )}
              {item.description && (
                <p className="mt-1 text-sm opacity-80">{item.description}</p>
              )}
              {item.action && <div className="mt-3">{item.action}</div>}
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => dismiss(item.id)}
                className="absolute right-3 top-2 text-lg leading-none opacity-60 hover:opacity-100"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

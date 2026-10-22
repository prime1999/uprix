"use client";

import { useTransition, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Loader2 } from "lucide-react";

export default function JoinButton({
  href = "/auth/sign-up",
  children = "Join Us",
}: {
  href?: string;
  children?: ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    if (pending) return;

    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <Link
      href={href}
      onClick={onClick}
      prefetch
      aria-busy={pending}
      className="relative z-30 inline-flex select-none touch-manipulation items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg transition-[transform,box-shadow] duration-150 hover:shadow-xl active:scale-95 aria-busy:pointer-events-none aria-busy:opacity-80"
    >
      {pending ? "Opening..." : children}
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <ArrowUpRight size={16} />
      )}
    </Link>
  );
}

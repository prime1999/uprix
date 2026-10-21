"use client";

import { useTransition, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Loader2 } from "lucide-react";

/**
 * A link that reacts the instant it is tapped.
 *
 * Navigating to a page that has to be rendered on the server (like a sign-up
 * page that checks your session) can take a moment, and a plain Link shows
 * nothing while it waits. This one switches to "Opening..." straight away,
 * so the tap never feels ignored.
 */
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
    // Leave new-tab, new-window and download clicks to the browser.
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

    // isPending stays true until the new page has actually arrived.
    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <Link
      href={href}
      onClick={onClick}
      // Start loading the page as soon as the button is on screen.
      prefetch
      aria-busy={pending}
      className="flex touch-manipulation items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg transition-[transform,box-shadow] duration-150 hover:shadow-xl active:scale-95 aria-busy:pointer-events-none aria-busy:opacity-80"
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

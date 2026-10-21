"use client";

import { useTransition, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * A link that reacts the instant it is tapped.
 *
 * Navigating to a page that has to be rendered on the server (like a sign-up
 * page that checks your session) can take a moment, and a plain Link shows
 * nothing while it waits. This one switches to "Opening..." straight away,
 * so the tap never feels ignored.
 */
export default function BecomeButton({
  href = "/auth/sign-up",
  children = "Become an Uprizer",
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
      className="flex items-center justify-center touch-manipulation rounded-full bg-primary-blue px-6 py-3 mt-8 text-xs font-bold text-white shadow-md shadow-primary-blue transition duration-500 hover:bg-secondary-blue"
    >
      {pending ? "Opening..." : children}
      {pending ? <Loader2 className="size-4 animate-spin" /> : <></>}
    </Link>
  );
}

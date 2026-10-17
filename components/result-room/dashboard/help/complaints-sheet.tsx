"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";

// Adjust this path to wherever ComplaintForm lives.
import ComplaintForm from "@/components/result-room/dashboard/help/complaintForm";

interface ComplaintSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * The Help Center on phones: a glass sheet that slides up from the bottom
 * and holds the complaint form.
 *
 * The form only mounts while the sheet is open, so its admin and dashboard
 * queries don't run until someone opens the Help Center.
 */
export default function ComplaintSheet({
  open,
  onOpenChange,
}: ComplaintSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={[
          // The sheet itself doesn't scroll. It only clips to its rounded
          // corners; the scrolling happens in the wrapper below.
          "gap-0 overflow-hidden rounded-t-3xl p-0",

          // Glass: frosted panel, white edge, soft highlight on top.
          "border-white/60 bg-white/60 backdrop-blur-2xl",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_-24px_60px_-12px_rgba(40,50,140,0.35)]",

          // Keep the form's header clear of the close button.
          "[&_header]:pr-8",
        ].join(" ")}
      >
        {/* Radix needs a title and description. The form has its own visible heading. */}
        <SheetTitle className="sr-only">Help Center</SheetTitle>
        <SheetDescription className="sr-only">
          Make a complaint. Choose the type of issue, describe it, and send it
          to the right admin on WhatsApp.
        </SheetDescription>

        <div className="max-h-[92dvh] overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
          <ComplaintForm className="!border-transparent !bg-transparent !shadow-none !backdrop-blur-none" />
        </div>
      </SheetContent>
    </Sheet>
  );
}

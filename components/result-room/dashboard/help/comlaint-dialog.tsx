"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

// Adjust this path to wherever ComplaintForm lives.
import ComplaintForm from "@/components/result-room/dashboard/help/complaintForm";

interface ComplaintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * The Help Center: a glass dialog that holds the complaint form.
 *
 * The form only mounts while the dialog is open, so its admin and dashboard
 * queries don't run until someone actually opens the Help Center.
 */
export default function ComplaintDialog({
  open,
  onOpenChange,
}: ComplaintDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={[
          // Size and scrolling: tall forms scroll inside the dialog.
          "max-h-[90dvh] w-[calc(100%-1.5rem)] gap-0 overflow-y-auto rounded-3xl p-0 sm:max-w-xl",

          // Glass: frosted panel, white edge, soft highlight on top.
          "border border-white/60 bg-white/55 backdrop-blur-2xl",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_24px_60px_-12px_rgba(40,50,140,0.35)]",

          // Keep the form's header clear of the close button.
          "[&_header]:pr-8",
        ].join(" ")}
      >
        {/* Radix needs a title and description. The form has its own visible heading. */}
        <DialogTitle className="sr-only">Help Center</DialogTitle>
        <DialogDescription className="sr-only">
          Make a complaint. Choose the type of issue, describe it, and send it
          to the right admin on WhatsApp.
        </DialogDescription>

        {/*
          The form is already a glass card. Inside the dialog it drops its own
          border, background and shadow so you don't get glass on glass.
        */}
        <ComplaintForm className="!border-transparent !bg-transparent !shadow-none !backdrop-blur-none" />
      </DialogContent>
    </Dialog>
  );
}

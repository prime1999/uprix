"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, CircleDollarSign, Settings, Pencil } from "lucide-react";
import goGetter from "@/app/assets/images/goGetter.jpg";
import { useResultRoomDashboard } from "@/lib/queries/result-room";
import SecondaryButton from "@/components/miscelleneous/secondaryButton";
import GeneralButton from "@/components/miscelleneous/generalButton";
import EditProfileModal from "@/components/result-room/dashboard/modals/EditProfileModal";
import AvatarImage from "@/components/result-room/dashboard/AvatarImage";

const FINES_HREF = "/result-room/dashboard/fines";

/** The fines icon and its count turn red from this many fines (more than 1). */
const RED_FROM = 2;

/** unpaidFineCount is what you want to show; totalFineCount is the fallback. */
type Accountability = {
  unpaidFineCount?: number;
  totalFineCount?: number;
};

const Topbar = () => {
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [popoverOpen, setPopoverOpen] = useState<boolean>(false);
  const { data: dashboardData } = useResultRoomDashboard();
  const router = useRouter();

  /* Fines */
  const accountability = dashboardData?.accountability as
    | Accountability
    | undefined;

  const fineCount =
    accountability?.unpaidFineCount ?? accountability?.totalFineCount ?? 0;

  const finesRed = fineCount >= RED_FROM;
  const badgeText = fineCount > 9 ? "9+" : String(fineCount);

  const finesLabel =
    fineCount === 0
      ? "Fines: none"
      : `Fines: ${fineCount} ${fineCount === 1 ? "fine" : "fines"}`;

  return (
    <nav className="flex items-center justify-between w-full gap-2">
      <h2 className="text-md font-semibold font-heading">Dashboard</h2>
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Fines: visible on every screen size (unlike Bell and Settings), with a count when there are any */}
        <Link
          href={FINES_HREF}
          aria-label={finesLabel}
          title={finesLabel}
          className={`relative flex items-center transition-colors ${
            finesRed ? "text-red-600" : "hover:text-secondary-blue"
          }`}
        >
          <CircleDollarSign size={15} />

          {fineCount > 0 && (
            <span
              aria-hidden
              className={`absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full border px-1 text-[10px] font-bold leading-none tabular-nums text-white ${
                finesRed
                  ? "border-red-400/80 bg-gradient-to-b from-red-400 to-red-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_2px_6px_-1px_rgba(239,68,68,0.55)]"
                  : "border-blue-400/80 bg-gradient-to-b from-blue-400 to-blue-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_2px_6px_-1px_rgba(59,130,246,0.5)]"
              }`}
            >
              {badgeText}
            </span>
          )}
        </Link>

        <button
          type="button"
          aria-label="Notifications"
          className="hidden md:block"
        >
          <Bell size={15} />
        </button>
        <button type="button" aria-label="Settings" className="hidden md:block">
          <Settings size={15} />
        </button>
        {/* The divider stays on small screens too, between the fines icon and the avatar */}
        <p aria-hidden className="font-bold">
          |
        </p>
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger className="flex items-center gap-1">
            <h3 className="text-sm font-medium">Go Getter</h3>
            {/* avatar_url is a built-in key ("male-1"), a URL, or empty */}
            <AvatarImage
              value={dashboardData?.profile?.avatar_url}
              fallback={goGetter}
              alt={dashboardData?.profile?.name ?? "Go Getter"}
              sizes="32px"
              className="size-8 rounded-full border border-white object-cover"
            />
          </PopoverTrigger>
          <PopoverContent className="backdrop-blur-3xl bg-transparent border-2 border-white mr-4">
            <PopoverHeader>
              <PopoverTitle className="text-sm font-semibold capitalize flex items-center justify-between">
                {/* A span, not an h1: the title is already a heading */}
                <span>{dashboardData && dashboardData.profile?.name}</span>
                <SecondaryButton
                  onClick={() => {
                    // Close the popover first so its heavy blur isn't
                    // stacked underneath the modal.
                    setPopoverOpen(false);
                    setEditOpen(true);
                  }}
                >
                  <Pencil className="text-white" />
                </SecondaryButton>
              </PopoverTitle>
              {dashboardData && dashboardData !== null ? (
                // A div, not PopoverDescription: that renders a <p>, and
                // <div>s can't go inside a <p>.
                <div className="text-sm text-muted-foreground">
                  <div className="w-full flex flex-col gap-2">
                    <div>
                      <p className="text-xs text-gray-800">Goal</p>
                      <h6 className="text-xs font-normal">
                        {dashboardData?.participant?.goal}
                      </h6>
                    </div>

                    <div>
                      <p className="text-xs text-gray-800">Email</p>
                      <h6 className="text-xs font-normal">
                        {dashboardData?.participant?.email}
                      </h6>
                    </div>

                    <div>
                      <p className="text-xs text-gray-800">Phone-Number</p>
                      <h6 className="text-xs font-normal">
                        {dashboardData?.participant?.phone}
                      </h6>
                    </div>
                  </div>
                  <div className="mt-4">
                    <GeneralButton
                      text="View Profile"
                      onClick={() => router.push("/protected")}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm font-normal">Loading...</p>
              )}
            </PopoverHeader>
          </PopoverContent>
        </Popover>
        <EditProfileModal
          open={editOpen}
          onOpenChange={setEditOpen}
          profile={{
            full_name: dashboardData?.profile?.name ?? null,
            avatar_url: dashboardData?.profile?.avatar_url ?? null,
            goal: dashboardData?.participant?.goal ?? null,
            email: dashboardData?.participant?.email ?? null,
            phone: dashboardData?.participant?.phone ?? null,
            gender: dashboardData?.profile?.gender ?? null,
          }}
        />
      </div>
    </nav>
  );
};

export default Topbar;

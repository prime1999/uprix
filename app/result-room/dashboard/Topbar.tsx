"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, Settings, Pencil } from "lucide-react";
import goGetter from "@/app/assets/images/goGetter.jpg";
import { useResultRoomDashboard } from "@/lib/queries/result-room";
import SecondaryButton from "@/components/miscelleneous/secondaryButton";
import GeneralButton from "@/components/miscelleneous/generalButton";
import EditProfileModal from "@/components/result-room/dashboard/modals/EditProfileModal";
import AvatarImage from "@/components/result-room/dashboard/AvatarImage";

const Topbar = () => {
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [popoverOpen, setPopoverOpen] = useState<boolean>(false);
  const { data: dashboardData } = useResultRoomDashboard();
  const router = useRouter();

  return (
    <nav className="flex items-center justify-between w-full gap-2">
      <h2 className="text-md font-semibold font-heading">Dashboard</h2>
      <div className="flex items-center gap-6">
        <button className="hidden md:block">
          <Bell size={15} />
        </button>
        <button className="hidden md:block">
          <Settings size={15} />
        </button>
        <p className="hidden md:block font-bold">|</p>
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
                <h1>{dashboardData && dashboardData.profile?.name}</h1>
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
                <PopoverDescription>
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
                    {" "}
                    <GeneralButton
                      text="View Profile"
                      onClick={() => router.push("/protected")}
                    />
                  </div>
                </PopoverDescription>
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

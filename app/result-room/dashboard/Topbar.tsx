"use client";

import Image from "next/image";
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

const Topbar = () => {
  const { data: dashboardData } = useResultRoomDashboard();
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
        <Popover>
          <PopoverTrigger className="flex items-center gap-1">
            <h3 className="text-sm font-medium">Go Getter</h3>
            <Image
              src={goGetter}
              alt="Go Getter"
              className="size-8 rounded-full border border-white"
            />
          </PopoverTrigger>
          <PopoverContent className="backdrop-blur-3xl bg-transparent border-2 border-white mr-4">
            <PopoverHeader>
              <PopoverTitle className="text-sm font-semibold capitalize flex items-center justify-between">
                <h1>{dashboardData && dashboardData.profile?.name}</h1>
                <SecondaryButton
                  onClick={() => console.log("edit button clicked")}
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
                      onClick={() => console.log("view profile button clicked")}
                    />
                  </div>
                </PopoverDescription>
              ) : (
                <p className="text-sm font-normal">Loading...</p>
              )}
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      </div>
    </nav>
  );
};

export default Topbar;

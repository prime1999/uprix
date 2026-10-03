import type { ReactNode } from "react";
import Image from "next/image";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import goGetter from "@/app/assets/images/goGetter.jpg";
import dashboardBackground from "@/app/assets/images/dashboardBackground.png";
import ResultRoomSidebar from "@/components/result-room/dashboard/result-room-sidebar";
import { Bell, Settings } from "lucide-react";
import { ResultRoomStoreHydrator } from "@/components/result-room/result-room-store-hydrator";

export default function ResultRoomDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SidebarProvider
      className="bg-cover bg-center bg-fixed p-4"
      style={{ backgroundImage: `url(${dashboardBackground.src})` }}
    >
      <ResultRoomSidebar />
      <SidebarInset className="min-w-0 bg-transparent">
        <header className="flex h-14 items-center border-b px-4 border-3 border-white rounded-lg backdrop-blur-3xl shadow-sm">
          <SidebarTrigger />
          <div className="flex items-center justify-between w-full gap-2">
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
                <PopoverContent className="backdrop-blur-3xl bg-transparent border-2 border-white">
                  <PopoverHeader>
                    <PopoverTitle>Title</PopoverTitle>
                    <PopoverDescription>
                      Description text here.
                    </PopoverDescription>
                  </PopoverHeader>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </header>
        <div className="min-w-0 flex-1 min-h-0 p-2">
          <ResultRoomStoreHydrator />
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

import type { ReactNode } from "react";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import ResultRoomSidebar from "@/components/result-room/dashboard/result-room-sidebar";
import { Bell, Settings } from "lucide-react";

export default function ResultRoomDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SidebarProvider>
      <ResultRoomSidebar />
      <SidebarInset>
        <header className="flex h-14 items-center border-b px-4">
          <SidebarTrigger />
          <div className="flex items-center justify-between w-full gap-2">
            <h2 className="text-md font-semibold font-heading">Dashboard</h2>
            <div className="flex items-center gap-6">
              <Bell size={15} />
              <Settings size={15} />
            </div>
          </div>
        </header>
        <div className="flex-1 min-h-0 p-2">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

import type { ReactNode } from "react";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import ResultRoomSidebar from "@/components/result-room/dashboard/result-room-sidebar";
import { Bell } from "lucide-react";

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
          <Bell />
        </header>
        <div className="flex-1 min-h-0 p-2">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

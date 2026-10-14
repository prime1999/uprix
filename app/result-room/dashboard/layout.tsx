import type { ReactNode } from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import dashboardBackground from "@/app/assets/images/dashboardBackground.png";
import ResultRoomSidebar from "@/components/result-room/dashboard/result-room-sidebar";
import { ResultRoomStoreHydrator } from "@/components/result-room/result-room-store-hydrator";
import Topbar from "./Topbar";

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
        <header className="sticky top-3 z-50 flex h-14 items-center border-b px-4 border-3 border-white rounded-lg backdrop-blur-3xl shadow-sm">
          <SidebarTrigger />
          <Topbar />
        </header>
        <div className="min-w-0 flex-1 min-h-0 p-2">
          <ResultRoomStoreHydrator />
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

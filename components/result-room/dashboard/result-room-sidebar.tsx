"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import {
  CircleDollarSign,
  ChevronsLeft,
  FileCheck,
  Headset,
  LayoutDashboard,
  ShieldCheck,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import logo from "@/app/assets/images/mobileLogo.png";

import { useResultRoomStore } from "@/lib/stores/result-room-store";
import { useResultRoomDashboard } from "@/lib/queries/result-room";

/**
 * ==========================================================================
 * TYPES
 * ==========================================================================
 */

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;

  /**
   * Indicates that the user currently has an action
   * or issue that needs their attention.
   */
  attention?: boolean;

  /**
   * Accessible description for the attention indicator.
   */
  attentionLabel?: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

/**
 * ==========================================================================
 * NAVIGATION
 * ==========================================================================
 *
 * Result Room participant navigation.
 *
 * IMPORTANT:
 *
 * Result Room does not assign tasks.
 *
 * Participants decide what they want to work on and submit
 * evidence of what they worked on.
 *
 * Therefore:
 *
 * - "Daily Submission" is used instead of "Daily Tasks".
 * - Attention indicators come from React Query server data.
 * - Room progress comes from Zustand's client-derived state.
 * - Zustand is NOT used as a copy of the dashboard API response.
 */
function getNavigation({
  needsSubmission,
  needsReport,
  hasOutstandingFine,
}: {
  needsSubmission: boolean;
  needsReport: boolean;
  hasOutstandingFine: boolean;
}): NavSection[] {
  return [
    {
      label: "Workspace",

      items: [
        {
          title: "Dashboard",
          url: "/result-room/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },

    {
      label: "Execution",

      items: [
        {
          title: "Daily Submission",
          url: "/result-room/dashboard/submissions",
          icon: FileCheck,
          attention: needsSubmission,
          attentionLabel: "Today's submission is required",
        },
      ],
    },

    {
      label: "Accountability",

      items: [
        {
          title: "Partner",
          url: "/result-room/dashboard/partner",
          icon: Users,
        },

        {
          title: "Reports",
          url: "/result-room/dashboard/reports",
          icon: ShieldCheck,
          attention: needsReport,
          attentionLabel: "Partner report requires attention",
        },

        {
          title: "Fines",
          url: "/result-room/dashboard/fines",
          icon: CircleDollarSign,
          attention: hasOutstandingFine,
          attentionLabel: "You have an outstanding fine",
        },
      ],
    },

    {
      label: "Support",

      items: [
        {
          title: "Help Center",
          url: "/result-room/dashboard/help",
          icon: Headset,
        },

        {
          title: "Complaints",
          url: "/result-room/dashboard/complain",
          icon: Headset,
        },
      ],
    },
  ];
}

/**
 * ==========================================================================
 * HELPERS
 * ==========================================================================
 */

const OVERVIEW_URL = "/result-room/dashboard";

/**
 * Determines whether a navigation item is currently active.
 *
 * Dashboard requires an exact match so:
 *
 * /result-room/dashboard/submissions
 *
 * does not make:
 *
 * /result-room/dashboard
 *
 * appear active.
 */
function isItemActive(url: string, pathname: string): boolean {
  if (url === OVERVIEW_URL) {
    return pathname === url;
  }

  return pathname.startsWith(url);
}

/**
 * ==========================================================================
 * SIDEBAR SECTION LABEL
 * ==========================================================================
 */

function SectionLabel({
  title,
  collapsed,
}: {
  title: string;
  collapsed: boolean;
}) {
  /**
   * In collapsed mode, section names disappear.
   *
   * Small separators are used instead so the icon rail
   * still has visual grouping.
   */
  if (collapsed) {
    return <div aria-hidden className="mx-3 my-2 h-px bg-sidebar-border" />;
  }

  return (
    <div className="px-3 pb-2 pt-6 first:pt-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </p>
    </div>
  );
}

/**
 * ==========================================================================
 * ATTENTION INDICATOR
 * ==========================================================================
 */

function AttentionIndicator({ label }: { label?: string }) {
  return (
    <span
      aria-label={label}
      title={label}
      className="size-2 shrink-0 rounded-full bg-red-500 animate-pulse"
    />
  );
}

/**
 * ==========================================================================
 * NAVIGATION ITEM
 * ==========================================================================
 */

function NavigationItem({
  item,
  pathname,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const active = isItemActive(item.url, pathname);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={active}
        tooltip={collapsed ? item.title : undefined}
        className={[
          /**
           * Base dimensions.
           */
          "relative h-10 rounded-xl text-sm font-medium",

          /**
           * Smooth interaction.
           */
          "transition-colors duration-200",

          /**
           * Normal state.
           */
          "text-muted-foreground",

          /**
           * Hover state.
           */
          "hover:bg-sidebar-accent",
          "hover:text-sidebar-foreground",

          /**
           * Active state.
           */
          "data-[active=true]:bg-primary/10",
          "data-[active=true]:font-semibold",
          "data-[active=true]:text-primary",

          /**
           * Prevent active item from changing appearance
           * on hover.
           */
          "hover:backdrop-blur-3xl",
          "data-[active=true]:hover:text-primary",

          /**
           * Collapsed layout.
           */
          collapsed ? "justify-center px-0" : "justify-start px-3",
        ].join(" ")}
      >
        <Link
          href={item.url}
          onClick={onNavigate}
          className={`flex ${collapsed ? "flex-col" : "flex-row"} h-full w-full items-center gap-3`}
        >
          {/* Navigation icon */}
          <item.icon
            className={[
              "size-[18px] shrink-0",
              "transition-transform duration-200",
              "group-hover:scale-[1.04]",
              active ? "text-primary" : "text-muted-foreground",
            ].join(" ")}
          />

          {/* Navigation label */}
          {!collapsed && <span className="truncate">{item.title}</span>}

          {/* Attention indicator */}
          {item.attention && <AttentionIndicator label={item.attentionLabel} />}

          {/* Active indicator */}
          {!collapsed && active && !item.attention && (
            <span
              aria-hidden
              className="ml-auto size-1.5 shrink-0 rounded-full bg-secondary-blue"
            />
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

/**
 * ==========================================================================
 * PROGRESS CARD
 * ==========================================================================
 *
 * IMPORTANT:
 *
 * The sidebar does NOT calculate room progress.
 *
 * calculateDashboardState()
 *          ↓
 * Zustand
 *          ↓
 * ProgressCard
 *
 * This keeps the sidebar purely presentational.
 */
function ProgressCard({ collapsed }: { collapsed: boolean }) {
  /**
   * Read only the calculated room progress from Zustand.
   */
  const roomProgress = useResultRoomStore((state) => state.roomProgress);

  /**
   * Safe fallback while the dashboard data is
   * still loading.
   */
  const currentDay = roomProgress?.currentDay ?? 0;

  const totalDays = roomProgress?.totalDays ?? 90;

  const progressPercentage = roomProgress?.roomProgress ?? 0;

  const daysRemaining = roomProgress?.daysRemaining ?? 0;

  /**
   * ------------------------------------------------------------------------
   * COLLAPSED
   * ------------------------------------------------------------------------
   */

  if (collapsed) {
    return (
      <div
        aria-label={`Room progress: Day ${currentDay} of ${totalDays}`}
        title={`Day ${currentDay} of ${totalDays}`}
        className="mx-auto flex size-10 items-center justify-center rounded-xl border border-sidebar-border bg-sidebar-accent text-primary"
      >
        <Target className="size-[18px]" />
      </div>
    );
  }

  /**
   * ------------------------------------------------------------------------
   * EXPANDED
   * ------------------------------------------------------------------------
   */

  return (
    <div className="p-3">
      <div className="min-w-0">
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-xl font-bold tracking-tight text-sidebar-foreground">
            Day {currentDay}
          </span>

          <span className="text-xs text-muted-foreground">/ {totalDays}</span>
        </div>

        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {daysRemaining > 0
            ? `${daysRemaining} ${
                daysRemaining === 1 ? "day" : "days"
              } remaining`
            : "Result Room complete"}
        </p>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-medium text-muted-foreground">
            {totalDays}-day progress
          </span>

          <span className="text-[10px] font-semibold text-sidebar-foreground">
            {Math.round(progressPercentage)}%
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-sidebar-border bg-blue-300">
          <div
            className="h-full rounded-full bg-secondary-blue transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.max(0, progressPercentage))}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * ==========================================================================
 * SIDEBAR
 * ==========================================================================
 */

export default function ResultRoomSidebar() {
  const pathname = usePathname();

  const { state, isMobile, setOpenMobile, toggleSidebar } = useSidebar();

  /**
   * ------------------------------------------------------------------------
   * RESULT ROOM DASHBOARD QUERY
   * ------------------------------------------------------------------------
   *
   * React Query remains the source of truth for server data.
   *
   * The sidebar uses this for attention indicators only.
   */
  const { data: dashboardData } = useResultRoomDashboard();

  /**
   * ------------------------------------------------------------------------
   * ATTENTION STATE
   * ------------------------------------------------------------------------
   */

  /**
   * Participant has not submitted today's work.
   */
  const needsSubmission = dashboardData?.today?.submissionCompleted === false;

  /**
   * Partner report/review is needed only after
   * today's submission has been completed.
   */
  const needsReport =
    dashboardData?.today?.submissionCompleted === true &&
    dashboardData?.today?.partnerReviewSubmitted === false;

  /**
   * A fine requires attention when it is either:
   *
   * - pending
   * - overdue
   */
  const hasOutstandingFine =
    dashboardData?.accountability?.hasPendingFine === true ||
    dashboardData?.accountability?.hasOverdueFine === true;

  /**
   * ------------------------------------------------------------------------
   * NAVIGATION
   * ------------------------------------------------------------------------
   */

  const navigation = getNavigation({
    needsSubmission,
    needsReport,
    hasOutstandingFine,
  });

  /**
   * ------------------------------------------------------------------------
   * SIDEBAR STATE
   * ------------------------------------------------------------------------
   */

  const collapsed = state === "collapsed" && !isMobile;

  /**
   * Close mobile sidebar after navigation.
   */
  const handleNavigation = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar
      collapsible="icon"
      className="m-2 rounded-lg border-3 border-white bg-white/20 shadow-xl backdrop-blur-xl backdrop-saturate-150"
    >
      <div className="flex h-full min-h-0 flex-col bg-transparent">
        {/* ================================================================
            HEADER
            ================================================================ */}

        <SidebarHeader
          className={[
            "border-b border-sidebar-border",
            collapsed ? "px-2.5 py-4" : "px-4 py-4",
          ].join(" ")}
        >
          <div
            className={[
              "flex items-center",
              collapsed ? "justify-center" : "justify-between",
            ].join(" ")}
          >
            <Link
              href="/result-room/dashboard"
              onClick={handleNavigation}
              className={[
                "group flex min-w-0 items-start",
                collapsed ? "justify-center" : "gap-3",
              ].join(" ")}
            >
              {/* Result Room brand mark */}
              <Image src={logo} alt="Logo" className="size-6" />

              {/* Brand text */}
              {!collapsed && (
                <span className="min-w-0">
                  <span className="block truncate text-md font-bold text-secondary-blue tracking-tight text-sidebar-foreground">
                    Result Room
                  </span>

                  <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                    Participant Workspace
                  </span>
                </span>
              )}
            </Link>

            {/* Desktop collapse button */}
            {!isMobile && !collapsed && (
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label="Collapse sidebar"
                className="ml-2 flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                <ChevronsLeft className="size-4" />
              </button>
            )}

            {/* Desktop expand button */}
            {!isMobile && collapsed && (
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label="Expand sidebar"
                className="absolute -right-3 top-5 z-20 flex size-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-muted-foreground shadow-sm transition-colors duration-200 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                <ChevronsLeft className="size-3.5 rotate-180" />
              </button>
            )}
          </div>
        </SidebarHeader>

        {/* ================================================================
            MAIN NAVIGATION
            ================================================================ */}

        <SidebarContent className="min-h-0">
          <div className="px-2.5 py-4">
            {navigation.map((section) => {
              /**
               * Don't render empty sections.
               */
              if (section.items.length === 0) {
                return null;
              }

              return (
                <div key={section.label}>
                  <SectionLabel title={section.label} collapsed={collapsed} />

                  <SidebarMenu className="gap-1">
                    {section.items.map((item) => (
                      <NavigationItem
                        key={item.url}
                        item={item}
                        pathname={pathname}
                        collapsed={collapsed}
                        onNavigate={handleNavigation}
                      />
                    ))}
                  </SidebarMenu>
                </div>
              );
            })}
          </div>
        </SidebarContent>

        {/* ================================================================
            FOOTER / ROOM PROGRESS
            ================================================================ */}

        <SidebarFooter
          className={[
            "border-t border-sidebar-border",
            collapsed ? "p-2.5" : "p-3",
          ].join(" ")}
        >
          <ProgressCard collapsed={collapsed} />
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}

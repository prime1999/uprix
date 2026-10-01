"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  CircleDollarSign,
  FileCheck,
  Headset,
  LayoutDashboard,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
  ChevronsLeft,
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

import { useResultRoomStore } from "@/lib/stores/result-room-store";

/* ==========================================================================
   Types
   ========================================================================== */

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

/* ==========================================================================
   Navigation
   ========================================================================== */

/**
 * Result Room participant navigation.
 *
 * IMPORTANT:
 *
 * Result Room does not assign tasks.
 *
 * Participants decide what they want to work on and submit evidence
 * of what they worked on.
 *
 * Therefore "Daily Submission" is used instead of "Daily Tasks".
 */
const NAVIGATION: NavSection[] = [
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
      },
      {
        title: "Fines",
        url: "/result-room/dashboard/fines",
        icon: CircleDollarSign,
      },
    ],
  },
  {
    label: "Progress",
    items: [],
  },
  {
    label: "Support",
    items: [
      {
        title: "Help Center",
        url: "/result-room/dashboard/help",
        icon: Headset,
      },
    ],
  },
];

/* ==========================================================================
   Helpers
   ========================================================================== */

const OVERVIEW_URL = "/result-room/dashboard";

/**
 * Determines whether a navigation item is currently active.
 *
 * Dashboard requires an exact match.
 *
 * Otherwise:
 *
 * /result-room/dashboard/submissions
 *
 * would also cause:
 *
 * /result-room/dashboard
 *
 * to appear active.
 */
function isItemActive(url: string, pathname: string) {
  if (url === OVERVIEW_URL) {
    return pathname === url;
  }

  return pathname.startsWith(url);
}

/* ==========================================================================
   Sidebar Section Label
   ========================================================================== */

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
   * Small separators are used instead so the icon rail still
   * has visual grouping.
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

/* ==========================================================================
   Navigation Item
   ========================================================================== */

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
          "relative h-10 rounded-xl",

          /**
           * Typography.
           */
          "text-sm font-medium",

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
           *
           * We intentionally use a soft primary background rather
           * than a heavy filled pill.
           */
          "data-[active=true]:bg-primary/10",
          "data-[active=true]:font-semibold",
          "data-[active=true]:text-primary",

          /**
           * Prevent active item from changing appearance on hover.
           */
          "data-[active=true]:hover:bg-primary/10",
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
          className="flex h-full w-full items-center gap-3"
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

          {/* Small active indicator */}
          {!collapsed && active && (
            <span
              aria-hidden
              className="ml-auto size-1.5 shrink-0 rounded-full bg-primary"
            />
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

/* ==========================================================================
   Progress Card
   ========================================================================== */

/**
 * Displays the participant's current streak.
 *
 * The streak comes from Zustand rather than being hardcoded.
 *
 * IMPORTANT:
 *
 * Zustand is not storing the participant's entire server record.
 * It only exposes the derived presentation value that the sidebar
 * needs.
 */
function ProgressCard({ collapsed }: { collapsed: boolean }) {
  const currentStreak = useResultRoomStore((state) => state.currentStreak);

  /**
   * Collapsed sidebar:
   *
   * Only show the progress icon.
   */
  if (collapsed) {
    return (
      <Link
        href="/result-room/dashboard"
        aria-label={`Current streak: ${currentStreak} days`}
        className="mx-auto flex size-10 items-center justify-center rounded-xl border border-sidebar-border bg-sidebar-accent text-primary transition-colors duration-200 hover:bg-primary/10"
      >
        <TrendingUp className="size-[18px]" />
      </Link>
    );
  }

  /**
   * Expanded sidebar:
   *
   * Show the complete streak card.
   */
  return (
    <Link
      href="/result-room/dashboard"
      className="group block rounded-2xl border border-sidebar-border bg-sidebar-accent/60 p-3.5 transition-colors duration-200 hover:bg-sidebar-accent"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          {/* Card heading */}
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="size-3.5 text-primary" />
            </span>

            <p className="text-xs font-semibold text-sidebar-foreground">
              Current Streak
            </p>
          </div>

          {/* Streak value */}
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-sidebar-foreground">
              {currentStreak}
            </span>

            <span className="text-xs text-muted-foreground">
              {currentStreak === 1 ? "day" : "days"}
            </span>
          </div>

          {/* Supporting message */}
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {currentStreak > 0
              ? "Keep showing up every day."
              : "Submit your first day of work."}
          </p>
        </div>
      </div>

      {/* Navigation to progress */}
      <div className="mt-3 flex items-center justify-between text-xs font-medium text-primary">
        <span>View progress</span>

        <span className="transition-transform duration-200 group-hover:translate-x-0.5">
          →
        </span>
      </div>
    </Link>
  );
}

/* ==========================================================================
   Sidebar
   ========================================================================== */

export default function ResultRoomSidebar() {
  const pathname = usePathname();

  const { state, isMobile, setOpenMobile, toggleSidebar } = useSidebar();

  /**
   * The sidebar is considered collapsed only on desktop.
   *
   * On mobile it behaves as a drawer, regardless of its desktop
   * collapsed state.
   */
  const collapsed = state === "collapsed" && !isMobile;

  /**
   * Close the mobile sidebar after navigating.
   *
   * Desktop navigation does nothing here.
   */
  const handleNavigation = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border bg-white"
    >
      <div className="flex h-full min-h-0 flex-col bg-sidebar">
        {/* ================================================================
            Header
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
                "group flex min-w-0 items-center",
                collapsed ? "justify-center" : "gap-3",
              ].join(" ")}
            >
              {/* Result Room brand mark */}
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary shadow-sm transition-transform duration-200 group-hover:scale-[1.03]">
                <Target
                  className="size-5 text-primary-foreground"
                  strokeWidth={2.2}
                />
              </span>

              {/* Brand text */}
              {!collapsed && (
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold tracking-tight text-sidebar-foreground">
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
            Main Navigation
            ================================================================ */}

        <SidebarContent className="min-h-0">
          <div className="px-2.5 py-4">
            {NAVIGATION.map((section) => {
              /**
               * We don't render empty sections.
               *
               * "Progress" currently has no navigation item because
               * the streak is already represented by the progress
               * card in the sidebar.
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
            Footer / Progress
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

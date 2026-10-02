import { useQuery } from "@tanstack/react-query";

import {
  resultRoomDashboardSchema,
  type ResultRoomDashboard,
} from "@/lib/validations/result-room";

/**
 * --------------------------------------------------------------------------
 * API ENDPOINT
 * --------------------------------------------------------------------------
 *
 * This endpoint provides the authenticated user's Result Room dashboard
 * information.
 *
 * The response currently contains:
 *
 * - Profile information
 * - Participant information
 * - Result Room information
 *
 * More dashboard-related server data can be introduced through additional
 * queries as the UI grows.
 */
const RESULT_ROOM_DASHBOARD_ENDPOINT = "/api/result/dashboard";

/**
 * --------------------------------------------------------------------------
 * QUERY KEY
 * --------------------------------------------------------------------------
 *
 * React Query uses this key to identify the dashboard query in its cache.
 *
 * Any component that uses this exact same query key will share the same
 * cached result.
 *
 * Example:
 *
 *   Dashboard
 *       ↓
 *   ["result-room", "dashboard"]
 *
 *   Sidebar
 *       ↓
 *   ["result-room", "dashboard"]
 *
 * Both components use the same React Query cache.
 *
 * This key is also important when we need to invalidate or refetch the
 * dashboard after a mutation.
 */
export const resultRoomDashboardQueryKey = [
  "result-room",
  "dashboard",
] as const;

/**
 * --------------------------------------------------------------------------
 * FETCH FUNCTION
 * --------------------------------------------------------------------------
 *
 * Fetches the latest dashboard data from the Next.js API route.
 *
 * This function is responsible for:
 *
 * 1. Making the HTTP request.
 * 2. Checking whether the request succeeded.
 * 3. Reading the JSON response.
 * 4. Validating the response with Zod.
 *
 * React Query is responsible for:
 *
 * - caching
 * - loading state
 * - error state
 * - retries
 * - refetching
 * - query invalidation
 * - request deduplication
 *
 * IMPORTANT:
 *
 * `cache: "no-store"` disables the browser/Next.js HTTP cache for this
 * request.
 *
 * That is intentional because this is authenticated, user-specific data.
 *
 * React Query remains responsible for the application-level cache.
 */
async function fetchResultRoomDashboard(): Promise<ResultRoomDashboard> {
  const response = await fetch(RESULT_ROOM_DASHBOARD_ENDPOINT, {
    cache: "no-store",
  });

  console.log(
    "fetchResultRoomDashboard response:",
    response.status,
    response.ok,
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load Result Room dashboard (${response.status})`,
    );
  }

  const data: unknown = await response.json();

  console.log("fetchResultRoomDashboard data:", data);

  const parsedData = resultRoomDashboardSchema.parse(data);

  console.log("fetchResultRoomDashboard parsed data:", parsedData);

  return parsedData;
}

/**
 * --------------------------------------------------------------------------
 * RESULT ROOM DASHBOARD QUERY
 * --------------------------------------------------------------------------
 *
 * Main hook for accessing Result Room dashboard server state.
 *
 * IMPORTANT:
 *
 * The returned object from useQuery includes useful controls such as:
 *
 *   data
 *   isLoading
 *   isFetching
 *   error
 *   refetch
 *
 * This means a component can manually request fresh data when a specific
 * functionality requires it.
 *
 * Example:
 *
 *   const { refetch } = useResultRoomDashboard();
 *
 *   await refetch();
 *
 * `refetch()` can request the server again even when the cached data is
 * still within its staleTime.
 */
export function useResultRoomDashboard() {
  return useQuery({
    /**
     * React Query stores the response under this key.
     */
    queryKey: resultRoomDashboardQueryKey,

    /**
     * Function React Query executes whenever it needs to obtain
     * fresh dashboard data.
     */
    queryFn: fetchResultRoomDashboard,

    /**
     * ----------------------------------------------------------------------
     * STALE TIME
     * ----------------------------------------------------------------------
     *
     * Dashboard data is considered fresh for 15 minutes.
     *
     * During this period, normal component usage will reuse the cached
     * result instead of unnecessarily requesting the server again.
     *
     * IMPORTANT:
     *
     * This does NOT lock the query for 15 minutes.
     *
     * If a feature needs fresh data immediately, we can still:
     *
     *   1. call `refetch()`
     *
     * or, more commonly after a mutation:
     *
     *   2. call `queryClient.invalidateQueries()`
     *
     * Therefore:
     *
     *   staleTime = normal caching behavior
     *   refetch/invalidate = explicit freshness when required
     */
    staleTime: 15 * 60 * 1000,

    /**
     * ----------------------------------------------------------------------
     * GARBAGE COLLECTION TIME
     * ----------------------------------------------------------------------
     *
     * If no component is currently using this query, React Query keeps
     * the unused cached data in memory for up to 30 minutes.
     *
     * This is useful when navigating between Result Room pages.
     *
     * Example:
     *
     *   Dashboard
     *       ↓
     *   Partner
     *       ↓
     *   Dashboard
     *
     * The dashboard query may still be available in cache when returning
     * to the dashboard.
     *
     * NOTE:
     *
     * gcTime does NOT determine when fresh data is fetched.
     * staleTime handles freshness.
     */
    gcTime: 30 * 60 * 1000,

    /**
     * ----------------------------------------------------------------------
     * RETRIES
     * ----------------------------------------------------------------------
     *
     * If a request fails temporarily, React Query will retry it twice
     * before exposing the error to the UI.
     */
    retry: 2,

    /**
     * ----------------------------------------------------------------------
     * WINDOW FOCUS
     * ----------------------------------------------------------------------
     *
     * Do not automatically refetch this query simply because the user
     * switches away from the browser and comes back.
     *
     * We can still explicitly refetch or invalidate the query whenever
     * a Result Room action requires fresh information.
     */
    refetchOnWindowFocus: false,
  });
}

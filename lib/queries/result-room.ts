import { useQuery } from "@tanstack/react-query";

import {
  resultRoomDashboardSchema,
  type ResultRoomDashboard,
} from "@/lib/validations/result-room";

/**
 * ---------------------------------------------------------
 * API ENDPOINT
 * ---------------------------------------------------------
 *
 * This is the endpoint that provides the data needed by the
 * Result Room dashboard.
 */
const RESULT_ROOM_DASHBOARD_ENDPOINT = "/api/result/dashboard";

/**
 * ---------------------------------------------------------
 * QUERY KEY
 * ---------------------------------------------------------
 *
 * React Query uses this key to identify the cached dashboard
 * data.
 *
 * Every component that uses this same key will share the
 * cached result instead of making separate requests.
 *
 * Example:
 *
 * Component A
 *     ↓
 * ["result-room", "dashboard"]
 *
 * Component B
 *     ↓
 * ["result-room", "dashboard"]
 *
 * Both use the SAME cache.
 */
export const resultRoomDashboardQueryKey = [
  "result-room",
  "dashboard",
] as const;

/**
 * ---------------------------------------------------------
 * FETCH FUNCTION
 * ---------------------------------------------------------
 *
 * Fetches the dashboard data from our Next.js API route.
 *
 * This function is responsible for:
 *
 * 1. Making the HTTP request.
 * 2. Checking whether the request succeeded.
 * 3. Parsing the JSON response.
 * 4. Validating the response with Zod.
 *
 * React Query is responsible for:
 *
 * - caching
 * - loading state
 * - error state
 * - retries
 * - refetching
 * - cache invalidation
 */
async function fetchResultRoomDashboard(): Promise<ResultRoomDashboard> {
  const response = await fetch(RESULT_ROOM_DASHBOARD_ENDPOINT, {
    /**
     * This is authenticated, user-specific information.
     *
     * We don't want the browser's normal HTTP cache to return
     * an old response independently of React Query.
     *
     * React Query will handle the application-level cache.
     */
    cache: "no-store",
  });

  /**
   * HTTP errors are not automatically thrown by fetch().
   *
   * Therefore we explicitly throw when the API returns a
   * non-success status.
   */
  if (!response.ok) {
    throw new Error(
      `Failed to load Result Room dashboard (${response.status})`,
    );
  }

  /**
   * Don't immediately cast this response to our TypeScript type.
   *
   * Runtime API data should be treated as unknown until Zod
   * validates it.
   */
  const data: unknown = await response.json();

  /**
   * Zod validates the complete API response.
   *
   * If something is wrong with the response structure,
   * .parse() throws and React Query handles it as a query error.
   */
  return resultRoomDashboardSchema.parse(data);
}

/**
 * ---------------------------------------------------------
 * RESULT ROOM DASHBOARD QUERY
 * ---------------------------------------------------------
 *
 * This is the main hook used by the dashboard.
 */
export function useResultRoomDashboard() {
  return useQuery({
    /**
     * React Query stores the response under this key.
     */
    queryKey: resultRoomDashboardQueryKey,

    /**
     * Function used whenever React Query needs fresh data.
     */
    queryFn: fetchResultRoomDashboard,

    /**
     * -----------------------------------------------------
     * STALE TIME
     * -----------------------------------------------------
     *
     * Participant information, profile information, and room
     * information don't change frequently.
     *
     * We therefore consider this data "fresh" for 15 minutes.
     *
     * During those 15 minutes:
     *
     * - Components can mount without another API request.
     * - React Query serves the cached data immediately.
     * - Multiple components share the same cached response.
     *
     * IMPORTANT:
     *
     * "stale" does NOT mean "deleted".
     *
     * After 15 minutes React Query can fetch fresh data, but
     * the existing cached data can still be displayed while
     * that happens.
     */
    staleTime: 15 * 60 * 1000,

    /**
     * -----------------------------------------------------
     * GARBAGE COLLECTION TIME
     * -----------------------------------------------------
     *
     * React Query keeps unused query data in memory for
     * another 30 minutes after there are no components using it.
     *
     * This is useful when the participant navigates between
     * Result Room pages.
     *
     * Example:
     *
     * Dashboard
     *    ↓
     * Partner
     *    ↓
     * Dashboard
     *
     * The dashboard data can still be available from cache
     * instead of immediately requiring another request.
     */
    gcTime: 30 * 60 * 1000,

    /**
     * -----------------------------------------------------
     * RETRIES
     * -----------------------------------------------------
     *
     * If the request temporarily fails, React Query will
     * automatically try again twice.
     */
    retry: 2,

    /**
     * -----------------------------------------------------
     * WINDOW FOCUS
     * -----------------------------------------------------
     *
     * We don't want the dashboard request firing every time
     * the participant switches browser tabs.
     *
     * Since our stale time is 15 minutes, the data is already
     * reasonably fresh.
     */
    refetchOnWindowFocus: false,
  });
}

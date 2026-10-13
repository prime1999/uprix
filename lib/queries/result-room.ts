import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

/* -------------------------------------------------------------------------- */
/* CREATE SUBMISSION                                                          */
/* -------------------------------------------------------------------------- */

export interface CreateSubmissionInput {
  timezone: string;
  description: string;
  files: {
    publicId: string;
    secureUrl: string;
  }[];
}

interface CreateSubmissionResponse {
  success: boolean;
  message?: string;
  error?: string;
  code?: string;
}

/**
 * Sends the participant's submission to the API.
 */
async function createResultRoomSubmission(
  input: CreateSubmissionInput,
): Promise<CreateSubmissionResponse> {
  const response = await fetch("/api/result/submissions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    const errorData = data as {
      error?: string;
      code?: string;
    };

    throw new Error(
      errorData.error || `Failed to submit evidence (${response.status}).`,
    );
  }

  const result = data as CreateSubmissionResponse;

  if (!result.success) {
    throw new Error(result.error || "Your submission could not be saved.");
  }

  return result;
}

/**
 * React Query mutation for submitting daily evidence.
 */
export function useCreateResultRoomSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createResultRoomSubmission,

    onSuccess: async () => {
      // Refresh the dashboard so today's submission status updates.
      await queryClient.invalidateQueries({
        queryKey: resultRoomDashboardQueryKey,
      });

      // Refresh cached own-submission queries for every date.
      await queryClient.invalidateQueries({
        queryKey: ["result-room", "my-submission"],
      });
    },
  });
}

/* -------------------------------------------------------------------------- */
/* PARTNER SUBMISSION                                                         */
/* -------------------------------------------------------------------------- */

/**
 * The partner-submission API returns either:
 * - submission: null when the partner has not submitted for the date
 * - submission details and images when a submission exists
 */

export interface PartnerSubmission {
  id: string;
  description: string | null;
  submissionDate: string;
  submittedAt: string;
  status: string;
  images: {
    id: string;
    url: string;
  }[];
}

interface PartnerSubmissionResponse {
  success: boolean;
  submission: PartnerSubmission | null;
  error?: string;
}

/**
 * React Query cache key for a partner's submission.
 *
 * Including the date ensures that different dates have separate cache entries.
 */
export const resultRoomPartnerSubmissionQueryKey = (date: string) =>
  ["result-room", "partner-submission", date] as const;

/**
 * Fetch the authenticated participant's partner submission.
 */
async function fetchResultRoomPartnerSubmission(
  date: string,
): Promise<PartnerSubmissionResponse> {
  const response = await fetch(
    `/api/result/partner-submission?date=${encodeURIComponent(date)}`,
    {
      cache: "no-store",
    },
  );

  const data: unknown = await response.json();

  if (!response.ok) {
    const errorData = data as { error?: string };

    throw new Error(
      errorData.error ||
        `Failed to load partner submission (${response.status}).`,
    );
  }

  const result = data as PartnerSubmissionResponse;

  if (!result.success) {
    throw new Error(result.error || "Failed to load partner submission.");
  }

  return result;
}

/**
 * Hook for retrieving the partner's submission for a specific date.
 *
 * Example:
 *
 * const {
 *   data,
 *   isLoading,
 *   error,
 *   refetch,
 * } = useResultRoomPartnerSubmission(selectedDate);
 *
 * data?.submission === null means no submission exists for that date.
 */
export function useResultRoomPartnerSubmission(date: string, enabled = true) {
  return useQuery({
    queryKey: resultRoomPartnerSubmissionQueryKey(date),

    queryFn: () => fetchResultRoomPartnerSubmission(date),

    enabled: enabled && /^\d{4}-\d{2}-\d{2}$/.test(date),

    staleTime: 0,

    gcTime: 30 * 60 * 1000,

    retry: 2,

    refetchOnWindowFocus: false,
  });
}

/* -------------------------------------------------------------------------- */
/* CREATE PARTNER REPORT                                                      */
/* -------------------------------------------------------------------------- */

export interface CreatePartnerReportInput {
  date: string;
  comment?: string;
  submittedOnTime: boolean;
}

interface CreatePartnerReportResponse {
  success: boolean;
  message?: string;
  report?: {
    id: string;
    reviewer_id: string;
    partner_id: string;
    partner_pair_id: string;
    review_date: string;
    submitted_on_time: boolean;
    comment: string | null;
    reviewed_at: string;
    created_at: string;
  };
}

/**
 * Sends the participant's partner report to the API.
 */
async function createPartnerReport(
  input: CreatePartnerReportInput,
): Promise<CreatePartnerReportResponse> {
  const response = await fetch("/api/result/partner-report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    const errorData = data as {
      message?: string;
      error?: string;
    };

    throw new Error(
      errorData.message ||
        errorData.error ||
        `Failed to submit partner report (${response.status}).`,
    );
  }

  const result = data as CreatePartnerReportResponse;

  if (!result.success) {
    throw new Error(
      result.message || "Your partner report could not be saved.",
    );
  }

  return result;
}

/**
 * React Query mutation for submitting a partner report.
 *
 * On success, invalidate the dashboard so the partner-review status
 * is refreshed from the server.
 */
export function useCreatePartnerReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPartnerReport,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: resultRoomDashboardQueryKey,
      });
    },
  });
}

/* -------------------------------------------------------------------------- */
/* MY SUBMISSION                                                              */
/* -------------------------------------------------------------------------- */

/**
 * The my-submission API returns either:
 * - submission: null when the participant has not submitted for the date
 * - submission details and images when a submission exists
 */

export interface MySubmission {
  id: string;
  description: string | null;
  submissionDate: string;
  submittedAt: string;
  status: string;
  images: {
    id: string;
    url: string;
  }[];
}

interface MySubmissionResponse {
  success: boolean;
  submission: MySubmission | null;
  error?: string;
}

/**
 * React Query cache key for the authenticated participant's own submission.
 *
 * Including the date gives each day's submission its own cache entry.
 */
export const resultRoomMySubmissionQueryKey = (date: string) =>
  ["result-room", "my-submission", date] as const;

/**
 * Fetch the authenticated participant's own submission.
 *
 * The server identifies the participant through the authenticated session.
 * The client only supplies the requested date.
 */
async function fetchResultRoomMySubmission(
  date: string,
): Promise<MySubmissionResponse> {
  const response = await fetch(
    `/api/result/my-submission?date=${encodeURIComponent(date)}`,
    {
      cache: "no-store",
    },
  );

  const data: unknown = await response.json();

  if (!response.ok) {
    const errorData = data as { error?: string };

    throw new Error(
      errorData.error || `Failed to load your submission (${response.status}).`,
    );
  }

  const result = data as MySubmissionResponse;

  if (!result.success) {
    throw new Error(result.error || "Failed to load your submission.");
  }

  return result;
}

/**
 * Hook for retrieving the authenticated participant's own submission
 * for a specific date.
 *
 * Example:
 *
 * const {
 *   data,
 *   isLoading,
 *   isFetching,
 *   error,
 *   refetch,
 * } = useResultRoomMySubmission(selectedDate);
 *
 * data?.submission === null means no submission exists for that date.
 */
export function useResultRoomMySubmission(date: string, enabled = true) {
  return useQuery({
    queryKey: resultRoomMySubmissionQueryKey(date),

    queryFn: () => fetchResultRoomMySubmission(date),

    enabled: enabled && /^\d{4}-\d{2}-\d{2}$/.test(date),

    // Submission details should be refreshed when explicitly requested
    // or when their query is invalidated after a successful mutation.
    staleTime: 0,

    gcTime: 30 * 60 * 1000,

    retry: 2,

    refetchOnWindowFocus: false,
  });
}

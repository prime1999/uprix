import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  resultRoomDashboardSchema,
  type ResultRoomDashboard,
} from "@/lib/validations/result-room";

/**
 * --------------------------------------------------------------------------
 * TIMEZONE
 * --------------------------------------------------------------------------
 *
 * Use the participant's current browser/device timezone.
 *
 * This follows the device's current timezone if the participant moves to
 * another timezone. It does not permanently lock the participant to Lagos
 * or any other timezone.
 *
 * The server reads this value from the `x-time-zone` request header.
 */
function getBrowserTimezone(): string {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return timezone || "Africa/Lagos";
  } catch {
    return "Africa/Lagos";
  }
}

/**
 * Headers shared by requests that need the participant's current timezone.
 *
 * Keep Content-Type in the individual request when sending JSON.
 */
function getTimezoneHeaders(): Record<string, string> {
  return {
    "x-time-zone": getBrowserTimezone(),
  };
}

/**
 * --------------------------------------------------------------------------
 * API ENDPOINT
 * --------------------------------------------------------------------------
 */
const RESULT_ROOM_DASHBOARD_ENDPOINT = "/api/result/dashboard";

/**
 * --------------------------------------------------------------------------
 * QUERY KEY
 * --------------------------------------------------------------------------
 */
export const resultRoomDashboardQueryKey = [
  "result-room",
  "dashboard",
] as const;

/**
 * --------------------------------------------------------------------------
 * FETCH DASHBOARD
 * --------------------------------------------------------------------------
 *
 * Sends the participant's current timezone to the dashboard API.
 *
 * The server can use this timezone to calculate today's local date instead
 * of relying on the server's timezone.
 */
async function fetchResultRoomDashboard(): Promise<ResultRoomDashboard> {
  const response = await fetch(RESULT_ROOM_DASHBOARD_ENDPOINT, {
    method: "GET",
    headers: getTimezoneHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to load Result Room dashboard (${response.status})`,
    );
  }

  const data: unknown = await response.json();

  return resultRoomDashboardSchema.parse(data);
}

/**
 * --------------------------------------------------------------------------
 * RESULT ROOM DASHBOARD QUERY
 * --------------------------------------------------------------------------
 */
export function useResultRoomDashboard() {
  return useQuery({
    queryKey: resultRoomDashboardQueryKey,
    queryFn: fetchResultRoomDashboard,

    // Dashboard data is considered fresh for 15 minutes.
    staleTime: 15 * 60 * 1000,

    // Keep unused dashboard data in memory for up to 30 minutes.
    gcTime: 30 * 60 * 1000,

    retry: 2,

    // Explicit refetching and query invalidation remain available.
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
 *
 * The submission API already receives the timezone in the JSON body.
 * Preserve that contract.
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
      await queryClient.invalidateQueries({
        queryKey: resultRoomDashboardQueryKey,
      });

      await queryClient.invalidateQueries({
        queryKey: ["result-room", "my-submission"],
      });
    },
  });
}

/* -------------------------------------------------------------------------- */
/* PARTNER SUBMISSION                                                         */
/* -------------------------------------------------------------------------- */

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
 * Including the date gives each date its own cache entry.
 */
export const resultRoomPartnerSubmissionQueryKey = (date: string) =>
  ["result-room", "partner-submission", date] as const;

/**
 * Fetches the partner's submission for a particular date.
 *
 * The timezone header allows the server to interpret timezone-sensitive
 * rules using the participant's current device timezone.
 */
async function fetchResultRoomPartnerSubmission(
  date: string,
): Promise<PartnerSubmissionResponse> {
  const response = await fetch(
    `/api/result/partner-submission?date=${encodeURIComponent(date)}`,
    {
      method: "GET",
      headers: getTimezoneHeaders(),
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
 *
 * IMPORTANT:
 *
 * The server needs the timezone header to determine:
 * - the participant's local date;
 * - whether the report deadline has passed in that timezone.
 *
 * The submitted date remains in the JSON body because the report refers
 * to a particular review date.
 */
async function createPartnerReport(
  input: CreatePartnerReportInput,
): Promise<CreatePartnerReportResponse> {
  const response = await fetch("/api/result/partner-report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getTimezoneHeaders(),
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
 * Each requested date has a separate cache entry.
 */
export const resultRoomMySubmissionQueryKey = (date: string) =>
  ["result-room", "my-submission", date] as const;

/**
 * Fetches the authenticated participant's own submission.
 *
 * The server identifies the participant through their authenticated session.
 * The client only supplies the requested date.
 */
async function fetchResultRoomMySubmission(
  date: string,
): Promise<MySubmissionResponse> {
  const response = await fetch(
    `/api/result/my-submission?date=${encodeURIComponent(date)}`,
    {
      method: "GET",
      headers: getTimezoneHeaders(),
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
 */
export function useResultRoomMySubmission(date: string, enabled = true) {
  return useQuery({
    queryKey: resultRoomMySubmissionQueryKey(date),
    queryFn: () => fetchResultRoomMySubmission(date),

    enabled: enabled && /^\d{4}-\d{2}-\d{2}$/.test(date),

    staleTime: 0,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ZodError } from "zod";
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

  try {
    return resultRoomDashboardSchema.parse(data);
  } catch (error) {
    console.error("[Result Room dashboard] Response validation failed", {
      status: response.status,
      issues: error instanceof ZodError ? error.issues : error,
    });

    throw error;
  }
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
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: resultRoomDashboardQueryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: ["result-room", "my-submission"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["result-room", "submission-history"],
        }),
      ]);
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
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: resultRoomDashboardQueryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: ["result-room", "partner-report-history"],
        }),
      ]);
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

/* -------------------------------------------------------------------------- */
/* FINES                                                                       */
/* -------------------------------------------------------------------------- */

export interface ResultRoomFine {
  id: string;
  participant_id: string;
  room_id: string;
  violation_id: string | null;
  source: "AUTOMATIC" | "MANUAL";
  reason: string | null;
  amount: number; // Naira
  status: "UNPAID" | "PAID" | "WAIVED";
  due_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  violation: {
    id: string;
    type: string;
    occurred_on: string;
    notes: string | null;
    consequence: string | null;
    resolved_at: string | null;
    resolution_note: string | null;
  } | null;
}

export interface FinePayment {
  id: string;
  fine_id: string;
  amount: number; // Kobo
  status: "PENDING" | "SUCCESS" | "FAILED" | "ABANDONED";
  paystack_reference: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResultRoomFinesResponse {
  fines: ResultRoomFine[];
  payments: FinePayment[];
  summary: {
    totalFines: number;
    unpaidCount: number;
    paidCount: number;
    waivedCount: number;
    outstandingAmount: number; // Naira
    currency: "NGN";
  };
}

export const resultRoomFinesQueryKey = ["result-room", "fines"] as const;

async function fetchResultRoomFines(): Promise<ResultRoomFinesResponse> {
  const response = await fetch("/api/result/fines", {
    method: "GET",
    headers: getTimezoneHeaders(),
    cache: "no-store",
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    const errorData = data as { error?: string };

    throw new Error(
      errorData.error || `Failed to load fines (${response.status}).`,
    );
  }

  return data as ResultRoomFinesResponse;
}

export function useResultRoomFines(enabled = true) {
  return useQuery({
    queryKey: resultRoomFinesQueryKey,
    queryFn: fetchResultRoomFines,
    enabled,
    staleTime: 30 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: true,
  });
}

/* -------------------------------------------------------------------------- */
/* INITIALIZE FINE PAYMENT                                                     */
/* -------------------------------------------------------------------------- */

export type InitializeFinePaymentInput =
  | {
      fineId: string;
      payAll?: never;
    }
  | {
      payAll: true;
      fineId?: never;
    };

export interface InitializeFinePaymentResponse {
  authorizationUrl: string;
  reference: string;
  amount: number; // Kobo
  currency: "NGN";
  fineCount: number;
  fineIds: string[];
}

async function initializeFinePayment(
  input: InitializeFinePaymentInput,
): Promise<InitializeFinePaymentResponse> {
  const response = await fetch("/api/result/fines/payment/initialize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    const errorData = data as { error?: string };

    throw new Error(
      errorData.error ||
        `Failed to initialize fine payment (${response.status}).`,
    );
  }

  const result = data as InitializeFinePaymentResponse;

  if (!result.authorizationUrl || !result.reference) {
    throw new Error("The payment service returned an invalid response.");
  }

  return result;
}

export function useInitializeFinePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: initializeFinePayment,

    onSuccess: async () => {
      // Refresh fines and payment history when the participant returns.
      await queryClient.invalidateQueries({
        queryKey: resultRoomFinesQueryKey,
      });
    },
  });
}

/* -------------------------------------------------------------------------- */
/* VERIFY FINE PAYMENT                                                        */
/* -------------------------------------------------------------------------- */

export interface VerifyFinePaymentInput {
  reference: string;
}

export type VerifyFinePaymentStatus = "success" | "pending" | "error";

export interface VerifyFinePaymentResponse {
  status: VerifyFinePaymentStatus;
  message: string;
  reference?: string;
  amount?: number; // Kobo
  currency?: "NGN";
  fineCount?: number;
}

async function verifyFinePayment(
  input: VerifyFinePaymentInput,
): Promise<VerifyFinePaymentResponse> {
  const response = await fetch("/api/result/fines/payment/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
    cache: "no-store",
  });

  const data: unknown = await response.json();

  const result = data as Partial<VerifyFinePaymentResponse> & {
    error?: string;
  };

  // The API can return a pending or error status even when its HTTP
  // response is successful, so inspect the response body as well.
  if (
    result.status === "success" ||
    result.status === "pending" ||
    result.status === "error"
  ) {
    if (!response.ok && result.status === "success") {
      throw new Error(
        `Payment verification request failed (${response.status}).`,
      );
    }

    return result as VerifyFinePaymentResponse;
  }

  throw new Error(
    result.error ||
      result.message ||
      `Failed to verify fine payment (${response.status}).`,
  );
}

export function useVerifyFinePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verifyFinePayment,

    onSuccess: async (result) => {
      if (result.status === "success") {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: resultRoomFinesQueryKey,
          }),
          queryClient.invalidateQueries({
            queryKey: resultRoomDashboardQueryKey,
          }),
        ]);
      }
    },
  });
}

/* -------------------------------------------------------------------------- */
/* SUBMISSION HISTORY                                                         */
/* -------------------------------------------------------------------------- */

export interface ResultRoomSubmissionHistoryFile {
  id: string;
  submission_id: string;
  cloudinary_public_id: string;
  cloudinary_url: string;
  google_drive_file_id: string | null;
  google_drive_url: string | null;
  google_drive_status: string;
  created_at: string;
}

export interface ResultRoomSubmissionHistoryItem {
  id: string;
  participant_id: string;
  room_id: string;
  submission_date: string;
  description: string | null;
  submitted_at: string;
  created_at: string;
  updated_at: string;
  status: string;
  files: ResultRoomSubmissionHistoryFile[];
}

export interface ResultRoomSubmissionHistoryResponse {
  submissions: ResultRoomSubmissionHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

const RESULT_ROOM_SUBMISSION_HISTORY_ENDPOINT =
  "/api/result/submissions/history";

/**
 * Each page and page size have their own cache entry.
 */
export const resultRoomSubmissionHistoryQueryKey = (page: number, limit = 10) =>
  ["result-room", "submission-history", page, limit] as const;

/**
 * Fetches one page of the authenticated participant's submission history.
 */
async function fetchResultRoomSubmissionHistory(
  page: number,
  limit: number,
): Promise<ResultRoomSubmissionHistoryResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const response = await fetch(
    `${RESULT_ROOM_SUBMISSION_HISTORY_ENDPOINT}?${params.toString()}`,
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
        `Failed to load submission history (${response.status}).`,
    );
  }

  return data as ResultRoomSubmissionHistoryResponse;
}

/**
 * React Query hook for paginated submission history.
 *
 * Defaults to 10 submissions per page.
 */
export function useResultRoomSubmissionHistory(
  page = 1,
  limit = 10,
  enabled = true,
) {
  return useQuery({
    queryKey: resultRoomSubmissionHistoryQueryKey(page, limit),
    queryFn: () => fetchResultRoomSubmissionHistory(page, limit),

    enabled:
      enabled &&
      Number.isSafeInteger(page) &&
      page >= 1 &&
      Number.isSafeInteger(limit) &&
      limit >= 1 &&
      limit <= 50,

    staleTime: 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/* -------------------------------------------------------------------------- */
/* PARTNER REPORT HISTORY                                                     */
/* -------------------------------------------------------------------------- */

export interface PartnerReportHistoryItem {
  id: string;
  reviewer_id: string;
  partner_id: string;
  partner_pair_id: string;
  review_date: string;
  submitted_on_time: boolean;
  comment: string | null;
  reviewed_at: string;
  created_at: string;
}

export interface PartnerReportHistoryResponse {
  reports: PartnerReportHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Each page and page size have their own cache entry.
 */
export const resultRoomPartnerReportHistoryQueryKey = (
  page: number,
  limit = 10,
) => ["result-room", "partner-report-history", page, limit] as const;

/**
 * Fetches one page of partner reports submitted by the authenticated
 * participant.
 */
async function fetchResultRoomPartnerReportHistory(
  page: number,
  limit: number,
): Promise<PartnerReportHistoryResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const response = await fetch(
    `/api/result/submissions/history/reports?${params.toString()}`,
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
        `Failed to load partner report history (${response.status}).`,
    );
  }

  return data as PartnerReportHistoryResponse;
}

/**
 * React Query hook for paginated partner report history.
 */
export function useResultRoomPartnerReportHistory(
  page = 1,
  limit = 10,
  enabled = true,
) {
  return useQuery({
    queryKey: resultRoomPartnerReportHistoryQueryKey(page, limit),
    queryFn: () => fetchResultRoomPartnerReportHistory(page, limit),

    enabled:
      enabled &&
      Number.isSafeInteger(page) &&
      page >= 1 &&
      Number.isSafeInteger(limit) &&
      limit >= 1 &&
      limit <= 50,

    staleTime: 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/* -------------------------------------------------------------------------- */
/* PARTNER DETAILS                                                            */
/* -------------------------------------------------------------------------- */

export interface ResultRoomPartnerDetails {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  goal: string | null;
  seat_number: string | null;
}

interface ResultRoomPartnerDetailsResponse {
  partner: ResultRoomPartnerDetails;
}

export const resultRoomPartnerDetailsQueryKey = [
  "result-room",
  "partner-details",
] as const;

async function fetchResultRoomPartnerDetails(): Promise<ResultRoomPartnerDetailsResponse> {
  const response = await fetch("/api/result/partner-details", {
    method: "GET",
    headers: getTimezoneHeaders(),
    cache: "no-store",
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    const errorData = data as { error?: string };

    throw new Error(
      errorData.error || `Failed to load partner details (${response.status}).`,
    );
  }

  return data as ResultRoomPartnerDetailsResponse;
}

export function useResultRoomPartnerDetails(enabled = true) {
  return useQuery({
    queryKey: resultRoomPartnerDetailsQueryKey,
    queryFn: fetchResultRoomPartnerDetails,
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/* -------------------------------------------------------------------------- */
/* UPDATE USER PROFILE                                                        */
/* -------------------------------------------------------------------------- */

export interface UpdateMyProfileInput {
  full_name?: string | null;
  avatar_url?: string | null;
  goal?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface UpdateMyProfileResponse {
  message: string;
  success: boolean;
  profile_updated: boolean;
  participant_updated: boolean;
}

const UPDATE_MY_PROFILE_ENDPOINT = "/api/profile";

/**
 * Updates the authenticated user's profile.
 *
 * Supported fields:
 * - user_profiles: full_name, avatar_url
 * - participants: goal, phone, email
 *
 * Fields can be updated individually or together.
 * Only supplied fields are sent to the API.
 */
async function updateMyProfile(
  input: UpdateMyProfileInput,
): Promise<UpdateMyProfileResponse> {
  const fields = Object.keys(input);

  if (fields.length === 0) {
    throw new Error("Provide at least one field to update.");
  }

  const response = await fetch(UPDATE_MY_PROFILE_ENDPOINT, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
    cache: "no-store",
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    const errorData = data as { error?: string };

    throw new Error(
      errorData.error || `Failed to update your profile (${response.status}).`,
    );
  }

  const result = data as UpdateMyProfileResponse;

  if (
    result.success !== true ||
    typeof result.profile_updated !== "boolean" ||
    typeof result.participant_updated !== "boolean"
  ) {
    throw new Error("The profile API returned an invalid response.");
  }

  return result;
}

/**
 * React Query mutation for updating profile information.
 *
 * Refreshes dashboard data after a successful update.
 */
export function useUpdateMyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMyProfile,

    // onSettled runs after success AND failure, so the dashboard is
    // always revalidated once a profile update finishes.
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: resultRoomDashboardQueryKey,
      });
    },
  });
}

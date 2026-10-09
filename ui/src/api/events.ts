import axiosInstance, { ApiError } from "./axiosInstance";
import type {
  AdminEventDto,
  EventAttendanceDto,
  EventDto,
  EventInput,
  MemberEventDto,
  MyAttendance,
} from "../../../src/types/event.types";

// Rejected requests arrive as the ApiError produced by axiosInstance's interceptor.
export const apiErrorCode = (error: unknown): string | undefined =>
  (error as ApiError)?.error?.code;

export const apiErrorMessage = (error: unknown, fallback: string): string =>
  (error as ApiError)?.message || fallback;

// An unknown API path falls through to the SSR page (HTML, 200); treat anything
// without an items array as a failure instead of "no events".
const itemsOf = <T,>(response: { data: any }): T[] => {
  const items = response.data?.data?.items;
  if (!Array.isArray(items)) throw new Error("Unexpected response from the events API");
  return items;
};

export const getEvents = async (signal?: AbortSignal): Promise<MemberEventDto[]> =>
  itemsOf(await axiosInstance.get("/events", { signal }));

// No sign-in needed: all events (upcoming and past) without attendance data (Events page for visitors).
export const getPublicEvents = async (signal?: AbortSignal): Promise<EventDto[]> =>
  itemsOf(await axiosInstance.get("/events/public", { signal }));

export type ConfirmAttendanceResult = MyAttendance & { kind: "created" | "exists" };

// A 409 ALREADY_ATTENDING resolves with the existing attendance; every other error rejects
// (EVENT_FULL and EVENT_PAST included, so the caller can tell them apart via apiErrorCode).
export const confirmAttendance = async (id: string): Promise<ConfirmAttendanceResult> => {
  try {
    const response = await axiosInstance.post(`/events/${encodeURIComponent(id)}/attendance`);
    return { kind: "created", ...response.data.data };
  } catch (error) {
    if (apiErrorCode(error) === "ALREADY_ATTENDING") {
      return { kind: "exists", ...(error as ApiError).error.details };
    }
    throw error;
  }
};

// --- Admin ---

export const adminListEvents = async (): Promise<AdminEventDto[]> => {
  const response = await axiosInstance.get("/admin/events");
  return response.data?.data?.items ?? [];
};

export const adminCreateEvent = async (input: EventInput): Promise<AdminEventDto> => {
  const response = await axiosInstance.post("/admin/events", input);
  return response.data.data;
};

export const adminUpdateEvent = async (id: string, input: EventInput): Promise<AdminEventDto> => {
  const response = await axiosInstance.put(`/admin/events/${encodeURIComponent(id)}`, input);
  return response.data.data;
};

export const adminDeleteEvent = async (id: string): Promise<{ deletedAttendances: number }> => {
  const response = await axiosInstance.delete(`/admin/events/${encodeURIComponent(id)}`);
  return response.data.data;
};

/** Field errors of a 400 VALIDATION_ERROR / CAPACITY_BELOW_CONFIRMED response, if any. */
export const apiFieldErrors = (error: unknown): Record<string, string> | null => {
  const details = (error as ApiError)?.error?.details;
  return details && typeof details === "object" && !Array.isArray(details) ? details : null;
};

export const adminListAttendances = async (
  params: { eventId?: string; status?: "confirmed" | "cancelled" | "all" } = {}
): Promise<EventAttendanceDto[]> => {
  const response = await axiosInstance.get("/admin/event-attendances", { params });
  return response.data?.data?.items ?? [];
};

export interface AttendanceActionResult {
  message: string;
  attendance: EventAttendanceDto;
}

export const adminResendConfirmation = async (id: string): Promise<AttendanceActionResult> => {
  const response = await axiosInstance.post(
    `/admin/event-attendances/${encodeURIComponent(id)}/resend-confirmation`
  );
  return { message: response.data.message, attendance: response.data.data };
};

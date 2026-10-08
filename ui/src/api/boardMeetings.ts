import axiosInstance, { ApiError } from "./axiosInstance";
import type {
  AdminBoardMeetingDto,
  BoardMeetingInput,
  BoardMeetingRequestDto,
  BoardMeetingRequestStatus,
  MemberBoardMeetingDto,
  MyBoardMeetingRequest,
} from "../../../src/types/boardMeeting.types";

// Rejected requests arrive as the ApiError produced by axiosInstance's interceptor.
export const apiErrorCode = (error: unknown): string | undefined =>
  (error as ApiError)?.error?.code;

export const apiErrorMessage = (error: unknown, fallback: string): string =>
  (error as ApiError)?.message || fallback;

export const getBoardMeetings = async (signal?: AbortSignal): Promise<MemberBoardMeetingDto[]> => {
  const response = await axiosInstance.get("/board-meetings", { signal });
  return response.data?.data?.items ?? [];
};

export type JoinRequestResult = MyBoardMeetingRequest & { kind: "created" | "exists" };

// A 409 ALREADY_REQUESTED resolves with the existing request; every other error rejects.
export const requestToJoin = async (id: string): Promise<JoinRequestResult> => {
  try {
    const response = await axiosInstance.post(`/board-meetings/${encodeURIComponent(id)}/requests`);
    return { kind: "created", ...response.data.data };
  } catch (error) {
    if (apiErrorCode(error) === "ALREADY_REQUESTED") {
      return { kind: "exists", ...(error as ApiError).error.details };
    }
    throw error;
  }
};

// --- Admin ---

export const adminListMeetings = async (): Promise<AdminBoardMeetingDto[]> => {
  const response = await axiosInstance.get("/admin/board-meetings");
  return response.data?.data?.items ?? [];
};

export const adminCreateMeeting = async (input: BoardMeetingInput): Promise<AdminBoardMeetingDto> => {
  const response = await axiosInstance.post("/admin/board-meetings", input);
  return response.data.data;
};

export const adminUpdateMeeting = async (id: string, input: BoardMeetingInput): Promise<AdminBoardMeetingDto> => {
  const response = await axiosInstance.put(`/admin/board-meetings/${encodeURIComponent(id)}`, input);
  return response.data.data;
};

export const adminDeleteMeeting = async (id: string): Promise<{ deletedRequests: number }> => {
  const response = await axiosInstance.delete(`/admin/board-meetings/${encodeURIComponent(id)}`);
  return response.data.data;
};

/** Field errors of a 400 VALIDATION_ERROR / CAPACITY_BELOW_APPROVED response, if any. */
export const apiFieldErrors = (error: unknown): Record<string, string> | null => {
  const details = (error as ApiError)?.error?.details;
  return details && typeof details === "object" && !Array.isArray(details) ? details : null;
};

export const adminListRequests = async (
  params: { status?: BoardMeetingRequestStatus; meetingId?: string } = {}
): Promise<BoardMeetingRequestDto[]> => {
  const response = await axiosInstance.get("/admin/board-meeting-requests", { params });
  return response.data?.data?.items ?? [];
};

export interface RequestActionResult {
  message: string;
  request: BoardMeetingRequestDto;
}

const requestAction = async (id: string, action: "approve" | "decline" | "resend-invitation"): Promise<RequestActionResult> => {
  const response = await axiosInstance.post(`/admin/board-meeting-requests/${encodeURIComponent(id)}/${action}`);
  return { message: response.data.message, request: response.data.data };
};

export const adminApproveRequest = (id: string) => requestAction(id, "approve");
export const adminDeclineRequest = (id: string) => requestAction(id, "decline");
export const adminResendInvitation = (id: string) => requestAction(id, "resend-invitation");

export type BoardMeetingRequestStatus = "pending" | "approved" | "declined";
export type NotificationStatus = "not_sent" | "pending" | "sent" | "failed";

export const REQUEST_STATUS_LABELS: Record<BoardMeetingRequestStatus, string> = {
    pending: "Pending",
    approved: "Approved",
    declined: "Declined",
};

export interface BoardMeetingDto {
    id: string;
    title: string;
    /** Plain text; "" when unset. */
    description: string;
    /** ISO UTC. */
    startsAt: string;
    /** "YYYY-MM-DD" in Asia/Dubai. */
    date: string;
    /** "HH:mm" in Asia/Dubai. */
    time: string;
    venue: string;
    location: string;
    /** "/uploads/<file>" or null. */
    imageUrl: string | null;
    capacity: number;
    isPast: boolean;
}

export interface MyBoardMeetingRequest {
    reference: string;
    status: BoardMeetingRequestStatus;
    createdAt: string;
}

/** Member view: includes the caller's own request, if any. */
export interface MemberBoardMeetingDto extends BoardMeetingDto {
    myRequest: MyBoardMeetingRequest | null;
}

export interface BoardMeetingRequestCounts {
    pending: number;
    approved: number;
    declined: number;
}

export interface AdminBoardMeetingDto extends BoardMeetingDto {
    counts: BoardMeetingRequestCounts;
    createdAt: string;
    updatedAt: string;
}

export interface NotificationOutcomeDto {
    status: NotificationStatus;
    attemptedAt: string | null;
}

export interface BoardMeetingRequestDto {
    id: string;
    reference: string;
    status: BoardMeetingRequestStatus;
    requester: { name: string; email: string; phone: string };
    meeting: Pick<BoardMeetingDto, "id" | "title" | "startsAt" | "date" | "time" | "venue" | "location"> | null;
    decision: { by: string | null; byName: string | null; at: string | null };
    notifications: {
        leadership: NotificationOutcomeDto;
        receipt: NotificationOutcomeDto;
        invitation: NotificationOutcomeDto;
    };
    createdAt: string;
}

/** Create and update body (full replace). Date and time are Asia/Dubai. */
export interface BoardMeetingInput {
    title: string;
    description?: string;
    /** "YYYY-MM-DD" */
    date: string;
    /** "HH:mm" (24h) */
    time: string;
    venue: string;
    location: string;
    imageUrl?: string | null;
    capacity?: number;
}

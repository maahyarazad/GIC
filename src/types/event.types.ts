export type AttendanceStatus = "confirmed" | "cancelled";
export type NotificationStatus = "not_sent" | "pending" | "sent" | "failed";

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
    confirmed: "Confirmed",
    cancelled: "Cancelled",
};

export interface EventDto {
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
    /** max(capacity − confirmed attendees, 0). */
    seatsLeft: number;
    isFull: boolean;
    isPast: boolean;
}

export interface MyAttendance {
    reference: string;
    status: AttendanceStatus;
    createdAt: string;
}

/** Member view: includes the caller's own attendance, if any. */
export interface MemberEventDto extends EventDto {
    myAttendance: MyAttendance | null;
}

export interface AdminEventDto extends EventDto {
    confirmedCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface NotificationOutcomeDto {
    status: NotificationStatus;
    attemptedAt: string | null;
}

export interface EventAttendanceDto {
    id: string;
    reference: string;
    status: AttendanceStatus;
    requester: { name: string; email: string; phone: string };
    event: Pick<EventDto, "id" | "title" | "startsAt" | "date" | "time" | "venue" | "location"> | null;
    notifications: {
        leadership: NotificationOutcomeDto;
        confirmation: NotificationOutcomeDto;
    };
    /** Confirmation time. */
    createdAt: string;
}

/** Create and update body (full replace). Date and time are Asia/Dubai. */
export interface EventInput {
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

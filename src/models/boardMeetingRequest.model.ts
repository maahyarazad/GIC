import { Schema, model } from "mongoose";
import { ObjectId } from "mongodb";
import {
  BoardMeetingRequestDto,
  NotificationOutcomeDto,
} from "../types/boardMeeting.types";
import { mapBoardMeeting } from "./boardMeeting.model";

// Nested path definition (not a sub-schema) so Mongoose's type inference stays simple.
const notificationOutcome = (defaultStatus: "pending" | "not_sent") => ({
  status: {
    type: String,
    enum: ["not_sent", "pending", "sent", "failed"],
    default: defaultStatus,
  },
  attemptedAt: { type: Date, default: null },
  error: { type: String, default: null },
});

const BoardMeetingRequestSchema = new Schema(
  {
    reference: { type: String, required: true, unique: true, index: true },
    meetingId: { type: Schema.Types.ObjectId, ref: "BoardMeeting", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    requester: {
      name: { type: String, required: true, trim: true, maxlength: 120 },
      email: { type: String, required: true, trim: true, lowercase: true },
      phone: { type: String, default: "", trim: true, maxlength: 40 },
    },
    status: {
      type: String,
      enum: ["pending", "approved", "declined"],
      default: "pending",
    },
    decision: {
      by: { type: Schema.Types.ObjectId, ref: "User", default: null },
      at: { type: Date, default: null },
    },
    notifications: {
      leadership: notificationOutcome("pending"),
      receipt: notificationOutcome("pending"),
      invitation: notificationOutcome("not_sent"),
    },
  },
  {
    timestamps: true,
  }
);

// One request per user per meeting.
BoardMeetingRequestSchema.index({ meetingId: 1, userId: 1 }, { unique: true });
BoardMeetingRequestSchema.index({ status: 1, createdAt: -1 });
BoardMeetingRequestSchema.index({ userId: 1, createdAt: -1 });

export const BoardMeetingRequestModel = model(
  "BoardMeetingRequest",
  BoardMeetingRequestSchema
);

export const buildBoardMeetingReference = (id: ObjectId): string => {
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `BM-${ymd}-${id.toHexString().slice(-6).toUpperCase()}`;
};

const toIso = (value: unknown): string | null =>
  value ? new Date(value as any).toISOString() : null;

const mapOutcome = (value: any, fallback: "pending" | "not_sent"): NotificationOutcomeDto => ({
  status: value?.status ?? fallback,
  attemptedAt: toIso(value?.attemptedAt),
});

// Expects `meetingId` populated with the meeting and, optionally, `decision.by` populated with `name`.
export const mapBoardMeetingRequest = (doc: any): BoardMeetingRequestDto => {
  const meetingDoc = doc.meetingId && doc.meetingId.startsAt ? doc.meetingId : null;
  const meeting = meetingDoc ? mapBoardMeeting(meetingDoc) : null;
  const decidedBy = doc.decision?.by;

  return {
    id: doc._id?.toString?.() || doc.id,
    reference: doc.reference,
    status: doc.status,
    requester: {
      name: doc.requester?.name ?? "",
      email: doc.requester?.email ?? "",
      phone: doc.requester?.phone || "",
    },
    meeting: meeting && {
      id: meeting.id,
      title: meeting.title,
      startsAt: meeting.startsAt,
      date: meeting.date,
      time: meeting.time,
      venue: meeting.venue,
      location: meeting.location,
    },
    decision: {
      by: decidedBy ? (decidedBy._id ?? decidedBy).toString() : null,
      byName: decidedBy?.name ?? null,
      at: toIso(doc.decision?.at),
    },
    notifications: {
      leadership: mapOutcome(doc.notifications?.leadership, "pending"),
      receipt: mapOutcome(doc.notifications?.receipt, "pending"),
      invitation: mapOutcome(doc.notifications?.invitation, "not_sent"),
    },
    createdAt: new Date(doc.createdAt).toISOString(),
  };
};

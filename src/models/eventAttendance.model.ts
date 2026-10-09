import { Schema, model } from "mongoose";
import { ObjectId } from "mongodb";
import {
  AttendanceStatus,
  EventAttendanceDto,
  MyAttendance,
  NotificationOutcomeDto,
} from "../types/event.types";
import { mapEvent } from "./event.model";

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

const EventAttendanceSchema = new Schema(
  {
    reference: { type: String, required: true, unique: true, index: true },
    // Stored name kept from feature 003; exposed as `eventId` / `event` in DTOs.
    meetingId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    requester: {
      name: { type: String, required: true, trim: true, maxlength: 120 },
      email: { type: String, required: true, trim: true, lowercase: true },
      phone: { type: String, default: "", trim: true, maxlength: 40 },
    },
    status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed",
    },
    notifications: {
      leadership: notificationOutcome("pending"),
      confirmation: notificationOutcome("pending"),
    },
  },
  {
    timestamps: true,
  }
);

// One attendance per user per event.
EventAttendanceSchema.index({ meetingId: 1, userId: 1 }, { unique: true });
EventAttendanceSchema.index({ meetingId: 1, status: 1, createdAt: -1 });
EventAttendanceSchema.index({ userId: 1, createdAt: -1 });

// Collection name kept from feature 003 so no data has to move.
export const EventAttendanceModel = model(
  "EventAttendance",
  EventAttendanceSchema,
  "boardmeetingrequests"
);

export const buildEventReference = (id: ObjectId): string => {
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `EV-${ymd}-${id.toHexString().slice(-6).toUpperCase()}`;
};

const toIso = (value: unknown): string | null =>
  value ? new Date(value as any).toISOString() : null;

/**
 * Rows written by feature 003 may still carry its statuses until migrate_events_004.ts runs:
 * an approved request was already invited, so it counts as confirmed; anything else is not attending.
 */
export const normalizeAttendanceStatus = (status: unknown): AttendanceStatus =>
  status === "confirmed" || status === "approved" ? "confirmed" : "cancelled";

const mapOutcome = (value: any, fallback: "pending" | "not_sent"): NotificationOutcomeDto => ({
  status: value?.status ?? fallback,
  attemptedAt: toIso(value?.attemptedAt),
});

export const toMyAttendance = (doc: any): MyAttendance => ({
  reference: doc.reference,
  status: normalizeAttendanceStatus(doc.status),
  createdAt: new Date(doc.createdAt).toISOString(),
});

// Expects `meetingId` populated with the event.
export const mapEventAttendance = (doc: any): EventAttendanceDto => {
  const eventDoc = doc.meetingId && doc.meetingId.startsAt ? doc.meetingId : null;
  const event = eventDoc ? mapEvent(eventDoc) : null;

  return {
    id: doc._id?.toString?.() || doc.id,
    reference: doc.reference,
    status: normalizeAttendanceStatus(doc.status),
    requester: {
      name: doc.requester?.name ?? "",
      email: doc.requester?.email ?? "",
      phone: doc.requester?.phone || "",
    },
    event: event && {
      id: event.id,
      title: event.title,
      startsAt: event.startsAt,
      date: event.date,
      time: event.time,
      venue: event.venue,
      location: event.location,
    },
    notifications: {
      leadership: mapOutcome(doc.notifications?.leadership, "pending"),
      // Before the migration, an approved 003 row only has the invitation outcome.
      confirmation: mapOutcome(
        doc.notifications?.confirmation ?? doc.notifications?.invitation,
        "not_sent"
      ),
    },
    createdAt: new Date(doc.createdAt).toISOString(),
  };
};

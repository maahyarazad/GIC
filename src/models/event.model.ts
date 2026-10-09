import { Schema, model } from "mongoose";
import { AdminEventDto, EventDto } from "../types/event.types";
import {
  EVENT_TIMEZONE,
  DUBAI_UTC_OFFSET_HOURS,
} from "../config/eventConfig";

const EventSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, default: "", trim: true, maxlength: 2000 },
    startsAt: { type: Date, required: true },
    venue: { type: String, required: true, trim: true, maxlength: 160 },
    location: { type: String, required: true, trim: true, maxlength: 300 },
    imageUrl: { type: String, default: null },
    capacity: { type: Number, min: 1, max: 50, default: 10 },
    // Seat counter: changed only by the attendance create ($inc) and the migration.
    confirmedCount: { type: Number, min: 0, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  {
    timestamps: true,
  }
);

EventSchema.index({ startsAt: -1 });

// Collection name kept from feature 003 so no data has to move.
export const EventModel = model("Event", EventSchema, "boardmeetings");

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_HH_MM = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const isValidEventDate = (date: string): boolean => {
  const match = DATE_ONLY.exec(date);
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  const probe = new Date(Date.UTC(y, m - 1, d));
  // Reject overflow such as 2026-02-31.
  return probe.getUTCMonth() === m - 1 && probe.getUTCDate() === d;
};

export const isValidEventTime = (time: string): boolean => TIME_HH_MM.test(time);

/** Converts a date and time entered in Gulf Standard Time to a UTC Date. */
export const toStartsAt = (date: string, time: string): Date | null => {
  if (!isValidEventDate(date) || !isValidEventTime(time)) return null;
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh - DUBAI_UTC_OFFSET_HOURS, mm));
};

const dubaiPartsFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: EVENT_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Date ("YYYY-MM-DD") and time ("HH:mm") of an instant in Gulf Standard Time. */
export const toDubaiParts = (startsAt: Date): { date: string; time: string } => {
  const parts = Object.fromEntries(
    dubaiPartsFormat.formatToParts(startsAt).map((part) => [part.type, part.value])
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
};

/** e.g. "Thu, 15 Oct 2026" */
export const formatEventDateForEmail = (startsAt: Date): string =>
  new Date(startsAt).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: EVENT_TIMEZONE,
  });

/** e.g. "18:30 (GST)" */
export const formatEventTimeForEmail = (startsAt: Date): string =>
  `${toDubaiParts(new Date(startsAt)).time} (GST)`;

export const mapEvent = (doc: any, now: Date = new Date()): EventDto => {
  const startsAt = new Date(doc.startsAt);
  const { date, time } = toDubaiParts(startsAt);
  const capacity = doc.capacity ?? 10;
  const confirmed = doc.confirmedCount ?? 0;
  return {
    id: doc._id?.toString?.() || doc.id,
    title: doc.title,
    description: doc.description || "",
    startsAt: startsAt.toISOString(),
    date,
    time,
    venue: doc.venue,
    location: doc.location,
    imageUrl: doc.imageUrl || null,
    capacity,
    seatsLeft: Math.max(capacity - confirmed, 0),
    isFull: confirmed >= capacity,
    isPast: startsAt.getTime() <= now.getTime(),
  };
};

export const mapAdminEvent = (doc: any): AdminEventDto => ({
  ...mapEvent(doc),
  confirmedCount: doc.confirmedCount ?? 0,
  createdAt: new Date(doc.createdAt).toISOString(),
  updatedAt: new Date(doc.updatedAt).toISOString(),
});

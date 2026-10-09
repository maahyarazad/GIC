import { EventModel, formatEventDateForEmail, formatEventTimeForEmail } from "../models/event.model";
import { EventAttendanceModel } from "../models/eventAttendance.model";
import {
  EVENT_CC,
  EVENT_NOTIFY_TO,
  EVENT_TEMPLATES,
} from "../config/eventConfig";
import { sendDynamicEmailDoc } from "./emailService";
import { escapeHtml } from "../utils/helpers";
import { NotificationStatus } from "../types/event.types";

const EMPTY = "—";
const DEFAULT_DESCRIPTION = "Further details will be shared with attendees ahead of the event.";

type Outcome = { status: NotificationStatus; attemptedAt: Date; error: string | null };

const toOutcome = (result: PromiseSettledResult<unknown>): Outcome => ({
  status: result.status === "fulfilled" ? "sent" : "failed",
  attemptedAt: new Date(),
  error:
    result.status === "rejected"
      ? String((result.reason as any)?.message ?? result.reason).slice(0, 500)
      : null,
});

const dashboardUrl = (): string => {
  const origin =
    process.env.NODE_ENV === "PRODUCTION"
      ? process.env.CLIENT_ORIGIN_PROD
      : process.env.CLIENT_ORIGIN_DEV;
  return `${origin ?? ""}/dashboard?tab=manage_events`;
};

/** Raw template variables shared by all event emails (subject and text body). */
export const buildEmailVariables = (attendance: any, event: any): Record<string, string> => ({
  REFERENCE: attendance.reference ?? "",
  REQUESTER_NAME: attendance.requester?.name ?? "",
  REQUESTER_EMAIL: attendance.requester?.email ?? "",
  REQUESTER_PHONE: attendance.requester?.phone?.trim() || EMPTY,
  EVENT_TITLE: event.title ?? "",
  EVENT_DATE: formatEventDateForEmail(event.startsAt),
  EVENT_TIME: formatEventTimeForEmail(event.startsAt),
  EVENT_VENUE: event.venue ?? "",
  EVENT_LOCATION: event.location ?? "",
  EVENT_DESCRIPTION: event.description?.trim() || DEFAULT_DESCRIPTION,
  CONFIRMED_AT: new Date(attendance.createdAt).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dubai",
  }),
  SEATS_LEFT: String(Math.max((event.capacity ?? 10) - (event.confirmedCount ?? 0), 0)),
  DASHBOARD_URL: dashboardUrl(),
});

/** HTML-escaped copy of the variables, for the HTML body. */
const escapeVariables = (variables: Record<string, string>): Record<string, string> => ({
  ...Object.fromEntries(Object.entries(variables).map(([key, value]) => [key, escapeHtml(value)])),
  // Escaped first, then line breaks become <br />.
  EVENT_DESCRIPTION: escapeHtml(variables.EVENT_DESCRIPTION).replace(/\r?\n/g, "<br />"),
});

const loadAttendanceAndEvent = async (attendanceId: unknown) => {
  const attendance: any = await EventAttendanceModel.findById(attendanceId).lean();
  const event: any = attendance
    ? await EventModel.findById(attendance.meetingId).lean()
    : null;
  return { attendance, event };
};

const sendConfirmationEmail = (attendance: any, variables: Record<string, string>, htmlVariables: Record<string, string>) =>
  sendDynamicEmailDoc(
    EVENT_TEMPLATES.confirmation,
    { ...variables, email: attendance.requester.email },
    { sender: "info", replyTo: EVENT_NOTIFY_TO, htmlData: htmlVariables }
  );

/**
 * Sends the leadership notification (info@ + CC) and the member's confirmation at the same time,
 * then records both outcomes on the attendance. Never throws.
 */
export async function notifyAttendanceConfirmed(attendanceId: unknown): Promise<void> {
  try {
    const { attendance, event } = await loadAttendanceAndEvent(attendanceId);
    if (!attendance || !event) {
      console.error(`Event attendance notification skipped: attendance or event ${String(attendanceId)} not found`);
      return;
    }

    const variables = buildEmailVariables(attendance, event);
    const htmlVariables = escapeVariables(variables);

    // sendDynamicEmailDoc sends to `email`; all event emails go from info@.
    const [leadership, confirmation] = await Promise.allSettled([
      sendDynamicEmailDoc(
        EVENT_TEMPLATES.notification,
        { ...variables, email: EVENT_NOTIFY_TO },
        { sender: "info", cc: EVENT_CC, replyTo: attendance.requester.email, htmlData: htmlVariables }
      ),
      sendConfirmationEmail(attendance, variables, htmlVariables),
    ]);

    if (leadership.status === "rejected") {
      console.error(`Event attendance notification failed for ${attendance.reference}:`, leadership.reason);
    }
    if (confirmation.status === "rejected") {
      console.error(`Event attendance confirmation failed for ${attendance.reference}:`, confirmation.reason);
    }

    try {
      await EventAttendanceModel.updateOne(
        { _id: attendance._id },
        {
          $set: {
            "notifications.leadership": toOutcome(leadership),
            "notifications.confirmation": toOutcome(confirmation),
          },
        }
      );
    } catch (updateError) {
      console.error("Failed to record event attendance notification status:", updateError);
    }
  } catch (error) {
    console.error("Event attendance notification error:", error);
  }
}

/** Sends (or resends) the member's confirmation and records the outcome. Never throws. */
export async function sendConfirmation(attendanceId: unknown): Promise<NotificationStatus> {
  let outcome: Outcome;
  try {
    await EventAttendanceModel.updateOne(
      { _id: attendanceId },
      { $set: { "notifications.confirmation.status": "pending" } }
    );

    const { attendance, event } = await loadAttendanceAndEvent(attendanceId);
    if (!attendance || !event) throw new Error("Attendance or event not found");

    const variables = buildEmailVariables(attendance, event);
    await sendConfirmationEmail(attendance, variables, escapeVariables(variables));

    outcome = { status: "sent", attemptedAt: new Date(), error: null };
  } catch (error: any) {
    console.error(`Event attendance confirmation failed for ${String(attendanceId)}:`, error);
    outcome = {
      status: "failed",
      attemptedAt: new Date(),
      error: String(error?.message ?? error).slice(0, 500),
    };
  }

  try {
    await EventAttendanceModel.updateOne(
      { _id: attendanceId },
      { $set: { "notifications.confirmation": outcome } }
    );
  } catch (updateError) {
    console.error("Failed to record event attendance confirmation status:", updateError);
  }

  return outcome.status;
}

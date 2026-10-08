import { BoardMeetingModel, formatMeetingDateForEmail, formatMeetingTimeForEmail } from "../models/boardMeeting.model";
import { BoardMeetingRequestModel } from "../models/boardMeetingRequest.model";
import {
  BOARD_MEETING_CC,
  BOARD_MEETING_NOTIFY_TO,
  BOARD_MEETING_TEMPLATES,
} from "../config/boardMeetingConfig";
import { renderTemplateByName, sendInfoEmail } from "./emailService";
import { escapeHtml } from "../utils/helpers";
import { NotificationStatus } from "../types/boardMeeting.types";

const EMPTY = "—";

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
  return `${origin ?? ""}/dashboard?tab=board_meetings`;
};

/** Raw template variables shared by all board meeting emails (subject and text body). */
export const buildEmailVariables = (request: any, meeting: any): Record<string, string> => ({
  REFERENCE: request.reference ?? "",
  REQUESTER_NAME: request.requester?.name ?? "",
  REQUESTER_EMAIL: request.requester?.email ?? "",
  REQUESTER_PHONE: request.requester?.phone?.trim() || EMPTY,
  MEETING_TITLE: meeting.title ?? "",
  MEETING_DATE: formatMeetingDateForEmail(meeting.startsAt),
  MEETING_TIME: formatMeetingTimeForEmail(meeting.startsAt),
  MEETING_VENUE: meeting.venue ?? "",
  MEETING_LOCATION: meeting.location ?? "",
  SUBMITTED_AT: new Date(request.createdAt).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dubai",
  }),
  DASHBOARD_URL: dashboardUrl(),
});

/** HTML-escaped copy of the variables, for the HTML body. */
const escapeVariables = (variables: Record<string, string>): Record<string, string> =>
  Object.fromEntries(Object.entries(variables).map(([key, value]) => [key, escapeHtml(value)]));

const loadRequestAndMeeting = async (requestId: unknown) => {
  const request: any = await BoardMeetingRequestModel.findById(requestId).lean();
  const meeting: any = request
    ? await BoardMeetingModel.findById(request.meetingId).lean()
    : null;
  return { request, meeting };
};

/**
 * Sends the new-request notification (info@ + leadership CC) and the requester's receipt,
 * then records both outcomes on the request. Never throws.
 */
export async function notifyRequestCreated(requestId: unknown): Promise<void> {
  try {
    const { request, meeting } = await loadRequestAndMeeting(requestId);
    if (!request || !meeting) {
      console.error(`Board meeting notification skipped: request or meeting ${String(requestId)} not found`);
      return;
    }

    const variables = buildEmailVariables(request, meeting);
    const htmlVariables = escapeVariables(variables);

    const [leadership, receipt] = await Promise.allSettled([
      renderTemplateByName(BOARD_MEETING_TEMPLATES.notification, variables, htmlVariables).then((email) =>
        sendInfoEmail({
          to: BOARD_MEETING_NOTIFY_TO,
          cc: BOARD_MEETING_CC,
          replyTo: request.requester.email,
          ...email,
        })
      ),
      renderTemplateByName(BOARD_MEETING_TEMPLATES.receipt, variables, htmlVariables).then((email) =>
        sendInfoEmail({
          to: request.requester.email,
          replyTo: BOARD_MEETING_NOTIFY_TO,
          ...email,
        })
      ),
    ]);

    if (leadership.status === "rejected") {
      console.error(`Board meeting notification failed for ${request.reference}:`, leadership.reason);
    }
    if (receipt.status === "rejected") {
      console.error(`Board meeting receipt failed for ${request.reference}:`, receipt.reason);
    }

    try {
      await BoardMeetingRequestModel.updateOne(
        { _id: request._id },
        {
          $set: {
            "notifications.leadership": toOutcome(leadership),
            "notifications.receipt": toOutcome(receipt),
          },
        }
      );
    } catch (updateError) {
      console.error("Failed to record board meeting notification status:", updateError);
    }
  } catch (error) {
    console.error("Board meeting notification error:", error);
  }
}

/** Sends the invitation to an approved requester and records the outcome. Never throws. */
export async function sendInvitation(requestId: unknown): Promise<NotificationStatus> {
  let outcome: Outcome;
  try {
    await BoardMeetingRequestModel.updateOne(
      { _id: requestId },
      { $set: { "notifications.invitation.status": "pending" } }
    );

    const { request, meeting } = await loadRequestAndMeeting(requestId);
    if (!request || !meeting) throw new Error("Request or meeting not found");

    const description = meeting.description?.trim() ?? "";
    const variables = { ...buildEmailVariables(request, meeting), MEETING_DESCRIPTION: description };
    const htmlVariables = {
      ...escapeVariables(variables),
      // Escaped first, then line breaks become <br />.
      MEETING_DESCRIPTION: escapeHtml(description).replace(/\r?\n/g, "<br />"),
    };

    const email = await renderTemplateByName(BOARD_MEETING_TEMPLATES.invitation, variables, htmlVariables);
    await sendInfoEmail({
      to: request.requester.email,
      replyTo: BOARD_MEETING_NOTIFY_TO,
      ...email,
    });

    outcome = { status: "sent", attemptedAt: new Date(), error: null };
  } catch (error: any) {
    console.error(`Board meeting invitation failed for ${String(requestId)}:`, error);
    outcome = {
      status: "failed",
      attemptedAt: new Date(),
      error: String(error?.message ?? error).slice(0, 500),
    };
  }

  try {
    await BoardMeetingRequestModel.updateOne(
      { _id: requestId },
      { $set: { "notifications.invitation": outcome } }
    );
  } catch (updateError) {
    console.error("Failed to record board meeting invitation status:", updateError);
  }

  return outcome.status;
}

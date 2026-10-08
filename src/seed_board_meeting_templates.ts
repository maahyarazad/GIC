/**
 * Inserts the board meeting email templates into `emailtemplates` when they are missing.
 *
 * Idempotent: an existing template (possibly edited in Dashboard → Email Templates)
 * is never overwritten.
 *
 *   npx tsx src/seed_board_meeting_templates.ts
 */
import { connectToDatabase, closeDatabaseConnection, getCollection } from "./db";
import { BOARD_MEETING_TEMPLATES } from "./config/boardMeetingConfig";

const layout = (heading: string, body: string): string => `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>${heading}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f4f4f4">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;margin:40px auto;">
            <tr>
              <td bgcolor="#D9B144" style="color:#ffffff;text-align:center;padding:20px;font-size:22px;font-weight:bold;">
                ${heading}
              </td>
            </tr>
            <tr>
              <td style="color:#333333;font-size:15px;line-height:1.6;padding:30px;">
                ${body}
              </td>
            </tr>
            <tr>
              <td style="font-size:13px;color:#777777;text-align:center;padding:20px;border-top:1px solid #dddddd;">
                &copy; {{CURRENT_YEAR}} German Industry Club. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

const row = (label: string, value: string): string =>
  `<tr><td style="padding:6px 12px 6px 0;color:#777777;white-space:nowrap;vertical-align:top;">${label}</td><td style="padding:6px 0;color:#333333;">${value}</td></tr>`;

const detailsTable = (rows: [string, string][]): string =>
  `<table cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;font-size:15px;">${rows
    .map(([label, value]) => row(label, value))
    .join("")}</table>`;

const meetingRows: [string, string][] = [
  ["Meeting", "{{MEETING_TITLE}}"],
  ["Date", "{{MEETING_DATE}}"],
  ["Time", "{{MEETING_TIME}}"],
  ["Venue", "{{MEETING_VENUE}}"],
  ["Location", "{{MEETING_LOCATION}}"],
];

const templates = [
  {
    name: BOARD_MEETING_TEMPLATES.notification,
    subject: "Board meeting request – {{MEETING_TITLE}} – {{REQUESTER_NAME}}",
    html: layout(
      "New Board Meeting Request",
      `<p>A member has requested to join a board meeting.</p>
       ${detailsTable([
         ["Reference", "{{REFERENCE}}"],
         ["Name", "{{REQUESTER_NAME}}"],
         ["Email", "{{REQUESTER_EMAIL}}"],
         ["Phone", "{{REQUESTER_PHONE}}"],
         ...meetingRows,
         ["Submitted at", "{{SUBMITTED_AT}}"],
       ])}
       <p><a href="{{DASHBOARD_URL}}" style="color:#D9B144;font-weight:bold;">Review in the dashboard</a></p>`
    ),
    text:
      "New board meeting request {{REFERENCE}} from {{REQUESTER_NAME}} ({{REQUESTER_EMAIL}}, {{REQUESTER_PHONE}}) " +
      "for {{MEETING_TITLE}} on {{MEETING_DATE}} at {{MEETING_TIME}}, {{MEETING_VENUE}}, {{MEETING_LOCATION}}. " +
      "Submitted at {{SUBMITTED_AT}}. Review: {{DASHBOARD_URL}}",
    variables: [
      "REFERENCE",
      "REQUESTER_NAME",
      "REQUESTER_EMAIL",
      "REQUESTER_PHONE",
      "MEETING_TITLE",
      "MEETING_DATE",
      "MEETING_TIME",
      "MEETING_VENUE",
      "MEETING_LOCATION",
      "SUBMITTED_AT",
      "DASHBOARD_URL",
    ],
  },
  {
    name: BOARD_MEETING_TEMPLATES.receipt,
    subject: "Your board meeting request – {{MEETING_TITLE}}",
    html: layout(
      "Request Received",
      `<p>Dear {{REQUESTER_NAME}},</p>
       <p>Your request to join the board meeting has been sent to the board. We will contact you once it has been reviewed.</p>
       ${detailsTable([...meetingRows, ["Reference", "{{REFERENCE}}"]])}
       <p>Kind regards,<br />German Industry Club</p>`
    ),
    text:
      "Dear {{REQUESTER_NAME}}, your request to join {{MEETING_TITLE}} on {{MEETING_DATE}} at {{MEETING_TIME}} " +
      "({{MEETING_VENUE}}, {{MEETING_LOCATION}}) has been sent to the board. Reference: {{REFERENCE}}.",
    variables: [
      "REQUESTER_NAME",
      "REFERENCE",
      "MEETING_TITLE",
      "MEETING_DATE",
      "MEETING_TIME",
      "MEETING_VENUE",
      "MEETING_LOCATION",
    ],
  },
  {
    name: BOARD_MEETING_TEMPLATES.invitation,
    subject: "Invitation: {{MEETING_TITLE}} – {{MEETING_DATE}}",
    html: layout(
      "Board Meeting Invitation",
      `<p>Dear {{REQUESTER_NAME}},</p>
       <p>We are pleased to invite you to the following board meeting.</p>
       ${detailsTable(meetingRows)}
       <p>{{MEETING_DESCRIPTION}}</p>
       <p style="color:#777777;font-size:13px;">Reference: {{REFERENCE}}</p>
       <p>We look forward to welcoming you.<br />German Industry Club</p>`
    ),
    text:
      "Dear {{REQUESTER_NAME}}, you are invited to {{MEETING_TITLE}} on {{MEETING_DATE}} at {{MEETING_TIME}}, " +
      "{{MEETING_VENUE}}, {{MEETING_LOCATION}}. Reference: {{REFERENCE}}.",
    variables: [
      "REQUESTER_NAME",
      "REFERENCE",
      "MEETING_TITLE",
      "MEETING_DATE",
      "MEETING_TIME",
      "MEETING_VENUE",
      "MEETING_LOCATION",
      "MEETING_DESCRIPTION",
    ],
  },
];

async function main() {
  await connectToDatabase();
  const collection = getCollection("emailtemplates");

  for (const template of templates) {
    const existing = await collection.findOne({ name: template.name });
    if (existing) {
      console.log(`${template.name}: exists – skipped`);
      continue;
    }
    const now = new Date();
    await collection.insertOne({ ...template, createdAt: now, updatedAt: now } as any);
    console.log(`${template.name}: created`);
  }
}

main()
  .catch((error) => {
    console.error("Seeding board meeting templates failed:", error);
    process.exitCode = 1;
  })
  .finally(() => closeDatabaseConnection());

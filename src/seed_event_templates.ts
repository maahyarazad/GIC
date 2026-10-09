/**
 * Inserts the event email templates into `emailtemplates` when they are missing.
 *
 * Idempotent: an existing template (possibly edited in Dashboard → Email Templates)
 * is never overwritten, unless it is named in --update. --remove-legacy deletes the
 * feature 003 board meeting templates, which are no longer used.
 *
 *   npx tsx src/seed_event_templates.ts [--update=…] [--remove-legacy]
 *   npx tsx src/seed_event_templates.ts --update=event_attendance_confirmation
 */
import { connectToDatabase, closeDatabaseConnection, getCollection } from "./db";
import { EVENT_TEMPLATES, LEGACY_BOARD_MEETING_TEMPLATES } from "./config/eventConfig";

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

// ── GIC email theme (same look as the business letter emails) ──
const ORANGE = "#C8541A";
const GOLD = "#D9B144";

const themedLayout = (heading: string, sections: string): string => `<!DOCTYPE html>
<html>

<head>
  <meta charset="UTF-8" />
  <title>${heading}</title>
</head>

<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f4f4f4">
    <tbody>
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" border="0"
            style="background-color: #ffffff; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); overflow: hidden; margin: 5px auto;">
            <tr>
              <td bgcolor="${ORANGE}"
                style="color: #ffffff; text-align: center; padding: 20px; font-size: 22px; font-weight: bold; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                ${heading}
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" border="0"
            style="background-color: #ffffff; padding: 30px;">
${sections}
            <tr>
              <td
                style="font-size: 13px; color: #777777; text-align: center; padding: 20px; border-top: 1px solid #dddddd;">
                &copy; {{CURRENT_YEAR}} German Industry Club. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</body>

</html>`;

const textSection = (paragraphs: string[], top = 0): string => `
            <tr>
              <td style="color: #333333; font-size: 16px; line-height: 1.6; padding: ${top}px 20px 0 20px;">
${paragraphs.map((p) => `                <p style="color: #333333;">${p}</p>`).join("\n")}
              </td>
            </tr>`;

const referenceSection = `
            <tr>
              <td style="color: #333333; font-size: 16px; line-height: 1.6; padding: 0 20px;">
                <p style="text-align: center; margin: 30px 0; color: #333333;">
                  <span style="display: block; font-size: 13px; color: #777777; letter-spacing: 1px; text-transform: uppercase;">Reference</span>
                  <span style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: ${GOLD};">{{REFERENCE}}</span>
                </p>
              </td>
            </tr>`;

const sectionTitle = (title: string) =>
  `<p style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: ${ORANGE}; text-transform: uppercase; letter-spacing: 1px;">
                  ${title}
                </p>`;

const detailsSection = (title: string, rows: [string, string][], top = 0): string => `
            <tr>
              <td style="padding: ${top}px 20px 0 20px;">
                ${sectionTitle(title)}
                <table width="100%" cellpadding="0" cellspacing="0" border="0"
                  style="font-size: 15px; color: #333333; line-height: 1.5; border-collapse: collapse;">
${rows
  .map(
    ([label, value], i) => `                  <tr>
                    <td${i === 0 ? ' width="38%"' : ""} style="padding: 6px 0; color: #777777; border-bottom: 1px solid #eeeeee;">${label}</td>
                    <td style="padding: 6px 0; border-bottom: 1px solid #eeeeee;">${value}</td>
                  </tr>`
  )
  .join("\n")}
                </table>
              </td>
            </tr>`;

const noteSection = (title: string, body: string, top = 24): string => `
            <tr>
              <td style="padding: ${top}px 20px 0 20px;">
                ${sectionTitle(title)}
                <div
                  style="font-size: 15px; color: #333333; line-height: 1.6; background-color: #faf7f2; border-left: 4px solid ${GOLD}; padding: 12px 16px;">
                  ${body}
                </div>
              </td>
            </tr>`;

const themedEventRows: [string, string][] = [
  ["Event", "<strong>{{EVENT_TITLE}}</strong>"],
  ["Date", `<strong style="color: ${ORANGE};">{{EVENT_DATE}}</strong>`],
  ["Time", "{{EVENT_TIME}}"],
  ["Venue", "{{EVENT_VENUE}}"],
  ["Location", "{{EVENT_LOCATION}}"],
];

const templates = [
  {
    name: EVENT_TEMPLATES.notification,
    subject: "Event attendance confirmed – {{EVENT_TITLE}} – {{REQUESTER_NAME}}",
    html: layout(
      "Event Attendance Confirmed",
      `<p>A member has confirmed their attendance at an event.</p>
       ${detailsTable([
         ["Reference", "{{REFERENCE}}"],
         ["Name", "{{REQUESTER_NAME}}"],
         ["Email", "{{REQUESTER_EMAIL}}"],
         ["Phone", "{{REQUESTER_PHONE}}"],
         ["Event", "{{EVENT_TITLE}}"],
         ["Date", "{{EVENT_DATE}}"],
         ["Time", "{{EVENT_TIME}}"],
         ["Venue", "{{EVENT_VENUE}}"],
         ["Location", "{{EVENT_LOCATION}}"],
         ["Confirmed at", "{{CONFIRMED_AT}}"],
         ["Seats left", "{{SEATS_LEFT}}"],
       ])}
       <p><a href="{{DASHBOARD_URL}}" style="color:#D9B144;font-weight:bold;">View attendees in the dashboard</a></p>`
    ),
    text:
      "{{REQUESTER_NAME}} ({{REQUESTER_EMAIL}}, {{REQUESTER_PHONE}}) has confirmed attendance at {{EVENT_TITLE}} " +
      "on {{EVENT_DATE}} at {{EVENT_TIME}}, {{EVENT_VENUE}}, {{EVENT_LOCATION}}. Reference {{REFERENCE}}. " +
      "Confirmed at {{CONFIRMED_AT}}. Seats left: {{SEATS_LEFT}}. Attendees: {{DASHBOARD_URL}}",
    variables: [
      "REFERENCE",
      "REQUESTER_NAME",
      "REQUESTER_EMAIL",
      "REQUESTER_PHONE",
      "EVENT_TITLE",
      "EVENT_DATE",
      "EVENT_TIME",
      "EVENT_VENUE",
      "EVENT_LOCATION",
      "CONFIRMED_AT",
      "SEATS_LEFT",
      "DASHBOARD_URL",
    ],
  },
  {
    name: EVENT_TEMPLATES.confirmation,
    subject: "Your attendance is confirmed – {{EVENT_TITLE}}, {{EVENT_DATE}}",
    html: themedLayout(
      "Attendance Confirmed",
      [
        textSection([
          "Dear {{REQUESTER_NAME}},",
          "Thank you for confirming. Your place at the following event is reserved.",
        ]),
        referenceSection,
        detailsSection("Event Details", themedEventRows),
        noteSection("About the Event", "{{EVENT_DESCRIPTION}}"),
        textSection(
          [
            "Seating is limited. If you can no longer attend, please reply to this email so we can offer your seat to another member, quoting reference <strong>{{REFERENCE}}</strong>. You can also see this event under <strong>Events → My Events</strong> in your GIC Dashboard.",
            "We look forward to welcoming you.<br />The German Industry Club Team",
          ],
          24
        ),
      ].join("")
    ),
    text:
      "Dear {{REQUESTER_NAME}}, your attendance is confirmed. Your place at {{EVENT_TITLE}} on {{EVENT_DATE}} " +
      "at {{EVENT_TIME}} ({{EVENT_VENUE}}, {{EVENT_LOCATION}}) is reserved. {{EVENT_DESCRIPTION}} " +
      "If you can no longer attend, please reply to this email. Reference: {{REFERENCE}}.",
    variables: [
      "REQUESTER_NAME",
      "REFERENCE",
      "EVENT_TITLE",
      "EVENT_DATE",
      "EVENT_TIME",
      "EVENT_VENUE",
      "EVENT_LOCATION",
      "EVENT_DESCRIPTION",
    ],
  },
];

// --update=<name,name>: overwrite these existing templates (e.g. after a redesign).
const parseUpdateNames = (): Set<string> => {
  const arg = process.argv.find((a) => a.startsWith("--update="));
  const names = (arg?.slice("--update=".length) ?? "").split(",").map((n) => n.trim()).filter(Boolean);
  const known = new Set<string>(templates.map((t) => t.name));
  const unknown = names.filter((n) => !known.has(n));
  if (unknown.length > 0) throw new Error(`Unknown template name(s) in --update: ${unknown.join(", ")}`);
  return new Set(names);
};

async function main() {
  const updateNames = parseUpdateNames();
  await connectToDatabase();
  const collection = getCollection("emailtemplates");

  for (const template of templates) {
    const existing = await collection.findOne({ name: template.name });
    if (existing && updateNames.has(template.name)) {
      const { name, ...fields } = template;
      await collection.updateOne({ name }, { $set: { ...fields, updatedAt: new Date() } });
      console.log(`${template.name}: updated`);
      continue;
    }
    if (existing) {
      console.log(`${template.name}: exists – skipped`);
      continue;
    }
    const now = new Date();
    await collection.insertOne({ ...template, createdAt: now, updatedAt: now } as any);
    console.log(`${template.name}: created`);
  }

  if (process.argv.includes("--remove-legacy")) {
    const { deletedCount } = await collection.deleteMany({ name: { $in: [...LEGACY_BOARD_MEETING_TEMPLATES] } });
    console.log(`Legacy board meeting templates removed: ${deletedCount}`);
  }
}

main()
  .catch((error) => {
    console.error("Seeding event templates failed:", error);
    process.exitCode = 1;
  })
  .finally(() => closeDatabaseConnection());

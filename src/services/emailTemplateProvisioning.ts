/**
 * Makes sure an email template exists in the `emailtemplates` collection before it is used.
 *
 * New templates used to need a manual seed script, which deploys never run (the event emails
 * failed in production for that reason after PR #28). A template is now inserted from its HTML
 * file in src/email_templates the first time it is needed. An existing template (possibly edited
 * in Dashboard → Email Templates) is never overwritten.
 */
import fs from "fs/promises";
import path from "path";
import { getCollection } from "../db";
import { DELIVERY_TEMPLATE_NAME } from "../config/recommendationLetterConfig";

export interface EmailTemplateDefinition {
  name: string;
  subject: string;
  /** File name in src/email_templates (copied to dist/email_templates by `npm run copy-assets`). */
  htmlFile: string;
  text: string;
  variables: string[];
}

const ensured = new Map<string, Promise<void>>();

async function insertIfMissing(definition: EmailTemplateDefinition): Promise<void> {
  const html = await fs.readFile(path.join(__dirname, "..", "email_templates", definition.htmlFile), "utf-8");
  const now = new Date();
  const { upsertedCount } = await getCollection("emailtemplates").updateOne(
    { name: definition.name },
    {
      $setOnInsert: {
        name: definition.name,
        subject: definition.subject,
        html,
        text: definition.text,
        variables: definition.variables,
        createdAt: now,
        updatedAt: now,
      },
    },
    { upsert: true }
  );
  if (upsertedCount > 0) console.log(`Email template created: ${definition.name}`);
}

/** Once per process and template; a failed attempt is retried on the next call. */
export function ensureEmailTemplate(definition: EmailTemplateDefinition): Promise<void> {
  let pending = ensured.get(definition.name);
  if (!pending) {
    pending = insertIfMissing(definition).catch((error) => {
      ensured.delete(definition.name);
      throw error;
    });
    ensured.set(definition.name, pending);
  }
  return pending;
}

export const RECOMMENDATION_LETTER_DELIVERY: EmailTemplateDefinition = {
  name: DELIVERY_TEMPLATE_NAME,
  subject: "Your Letter of Recommendation – {{COMPANY_NAME}} ({{REFERENCE}})",
  htmlFile: "recommendation_letter_delivery.html",
  text:
    "Dear {{REQUESTER_NAME}}, please find attached the Letter of Recommendation from the German Industry Club " +
    "for {{COMPANY_NAME}} regarding {{PROJECT_NAME}} (dated {{LETTER_DATE}}). Reference: {{REFERENCE}}. " +
    "If you have any questions, simply reply to this email.",
  variables: ["REQUESTER_NAME", "COMPANY_NAME", "REFERENCE", "PROJECT_NAME", "LETTER_DATE"],
};

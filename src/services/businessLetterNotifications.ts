/**
 * Business-letter request emails (feature 010): the GIC leadership notification and the requester
 * receipt. Shared by the create controller (on submit of a new request) and the member letter
 * controller (when a member submits their edited letter for the admin group to finalise).
 *
 * Both functions are fire-and-forget: they never throw, and they record their outcome on the request.
 */
import { BusinessLetterRequestModel } from "../models/businessLetterRequest.model";
import { BusinessLetterLanguage, LANGUAGE_LABELS } from "../types/businessLetter.types";
import {
  BUSINESS_LETTER_RECIPIENTS,
  businessLetterDashboardUrl,
} from "../config/businessLetterConfig";
import { sendDynamicEmailDoc } from "./emailService";
import {
  BUSINESS_LETTER_RECEIPT,
  BUSINESS_LETTER_REQUEST,
  ensureEmailTemplate,
} from "./emailTemplateProvisioning";
import { escapeHtml } from "../utils/helpers";

const EMPTY = "—";

const formatNeededBy = (value: any): string =>
  new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

const formatSubmittedAt = (value: any): string =>
  new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dubai",
  });

/** The addressee "person" line and multi-line address for the request emails. */
function addresseeLines(doc: any): { name: string; attn: string; address: string; reference: string } {
  const t = (value?: string | null) => (value ?? "").toString().trim();
  const name = [t(doc.addressee?.title), t(doc.addressee?.fullName)].filter(Boolean).join(" ");
  const address = [t(doc.addressee?.address), [t(doc.addressee?.city), t(doc.addressee?.country)].filter(Boolean).join(", ")]
    .filter(Boolean)
    .join("\n");
  return { name, attn: t(doc.addressee?.attn), address, reference: t(doc.addressee?.reference) };
}

/** HTML-escapes every value; `multiline` keys keep line breaks as <br />. */
function toHtmlData(data: Record<string, string>, multiline: string[] = []): Record<string, string> {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => {
      const safe = escapeHtml(value || EMPTY);
      return [key, multiline.includes(key) ? safe.replace(/\r?\n/g, "<br />") : safe];
    })
  );
}

/** Sends the request email to the GIC leadership team and records the outcome. Never throws. */
export async function notifyLeadership(doc: any): Promise<void> {
  try {
    const addressee = addresseeLines(doc);
    const data: Record<string, string> = {
      REFERENCE: doc.reference,
      REQUESTER_NAME: doc.requester.name,
      REQUESTER_EMAIL: doc.requester.email,
      REQUESTER_PHONE: doc.requester.phone || EMPTY,
      REQUESTER_COMPANY: doc.requester.company || EMPTY,
      ADDRESSEE_NAME: addressee.name || EMPTY,
      ADDRESSEE_ATTN: addressee.attn || EMPTY,
      ADDRESSEE_ADDRESS: addressee.address || EMPTY,
      ADDRESSEE_REFERENCE: addressee.reference || EMPTY,
      LANGUAGE: LANGUAGE_LABELS[doc.language as BusinessLetterLanguage] ?? doc.language,
      NEEDED_BY: formatNeededBy(doc.neededBy),
      SUBMITTED_AT: formatSubmittedAt(doc.createdAt),
      PURPOSE: doc.purpose,
      DASHBOARD_URL: businessLetterDashboardUrl(),
    };

    await ensureEmailTemplate(BUSINESS_LETTER_REQUEST);
    await sendDynamicEmailDoc(
      BUSINESS_LETTER_REQUEST.name,
      { ...data, email: BUSINESS_LETTER_RECIPIENTS.join(", ") },
      { htmlData: { ...toHtmlData(data, ["ADDRESSEE_ADDRESS", "PURPOSE"]), DASHBOARD_URL: data.DASHBOARD_URL } }
    );

    await BusinessLetterRequestModel.updateOne(
      { _id: doc._id },
      { $set: { "notification.status": "sent", "notification.attemptedAt": new Date() } }
    );
  } catch (error: any) {
    console.error(`Business letter notification failed for ${doc.reference}:`, error);
    try {
      await BusinessLetterRequestModel.updateOne(
        { _id: doc._id },
        {
          $set: {
            "notification.status": "failed",
            "notification.attemptedAt": new Date(),
            "notification.error": String(error?.message ?? error).slice(0, 500),
          },
        }
      );
    } catch (updateError) {
      console.error("Failed to record notification status:", updateError);
    }
  }
}

/** Sends the confirmation receipt to the requester and records the outcome. Never throws. */
export async function sendReceipt(doc: any): Promise<void> {
  try {
    const addressee = addresseeLines(doc);
    const data: Record<string, string> = {
      REQUESTER_NAME: doc.requester.name,
      REFERENCE: doc.reference,
      ADDRESSEE_NAME: addressee.name || EMPTY,
      NEEDED_BY: formatNeededBy(doc.neededBy),
      SUBMITTED_AT: formatSubmittedAt(doc.createdAt),
    };

    await ensureEmailTemplate(BUSINESS_LETTER_RECEIPT);
    await sendDynamicEmailDoc(
      BUSINESS_LETTER_RECEIPT.name,
      { ...data, email: doc.requester.email },
      { sender: "info", replyTo: process.env.SMTP_INFO_SENDER, htmlData: toHtmlData(data) }
    );

    await BusinessLetterRequestModel.updateOne(
      { _id: doc._id },
      { $set: { "receipt.status": "sent", "receipt.attemptedAt": new Date() } }
    );
  } catch (error: any) {
    console.error(`Business letter receipt failed for ${doc.reference}:`, error);
    try {
      await BusinessLetterRequestModel.updateOne(
        { _id: doc._id },
        {
          $set: {
            "receipt.status": "failed",
            "receipt.attemptedAt": new Date(),
            "receipt.error": String(error?.message ?? error).slice(0, 500),
          },
        }
      );
    } catch (updateError) {
      console.error("Failed to record receipt status:", updateError);
    }
  }
}

/**
 * Letter of recommendation wording, defaults, validation and DTO mappers.
 *
 * The body sentences come from "Draft_Template for Letter of Recommendation - v2.docx" (feature 009);
 * this is the only place they live (the PDF builder and the controller import them). v2 is flowing
 * paragraphs (no numbered sections). Verbatim v2 body paragraphs, with placeholders:
 *   1. On behalf of the German Industry Club Dubai and its German business community, we are pleased
 *      to recommend {company} as a trusted and reliable business partner.
 *   2. Based on the positive feedback and recommendations received from its customers over the years,
 *      {company} has established a strong reputation for professionalism, reliability, and commitment
 *      to high business standards. Its customers consistently recognize the company as a dependable
 *      and trustworthy business partner, valuing its dedication to quality, integrity, and customer
 *      satisfaction.
 *   3. As an active member of the German Industry Club Dubai, {company} represents the values
 *      traditionally associated with German business excellence, including quality, integrity,
 *      technical competence, and long-term commitment.
 *   4. With specific reference to {project}, we are pleased to endorse {company}'s participation and
 *      support its efforts to contribute to the successful realization of this opportunity.
 *   5. Based on our longstanding positive experience with the company, we are confident in
 *      recommending {company} for consideration as a reliable business partner for this initiative.
 * Paragraphs 6–7 (the closing lines) live in the editable `closing` field (see DEFAULT_CLOSING).
 */
import { LETTER_TIMEZONE } from "../config/recommendationLetterConfig";
import {
  ApprovalStatus,
  DEFAULT_BODY_CLOSING,
  LetterFields,
  LetterRequestDetail,
  LetterRequestListItem,
  LetterStatus,
  defaultBodyIntro,
  defaultBodyMain,
} from "../types/recommendationLetter.types";

// Re-exported for back-compat with existing imports from this module.
export { DEFAULT_BODY_CLOSING, defaultBodyIntro, defaultBodyMain };

export const LIMITS: Record<Exclude<keyof LetterFields, "letterDate">, number> = {
  recipientTitle: 120,
  recipientFullName: 160,
  recipientAttn: 160,
  recipientAddress: 300,
  recipientCity: 120,
  recipientCountry: 120,
  companyName: 160,
  reference: 200,
  salutation: 160,
  companyLocation: 80,
  industry: 200,
  productsServices: 300,
  projectName: 200,
  bodyIntro: 600,
  bodyMain: 4000,
  bodyClosing: 1000,
  closing: 1000,
};

const LABELS: Record<keyof LetterFields, string> = {
  recipientTitle: "Title",
  recipientFullName: "Full name",
  recipientAttn: "Attn",
  recipientAddress: "Address",
  recipientCity: "City",
  recipientCountry: "Country",
  letterDate: "Date",
  companyName: "Company name",
  reference: "Reference",
  salutation: "Salutation",
  companyLocation: "Company location",
  industry: "Industry / business sector",
  productsServices: "Products / services",
  projectName: "Project / business opportunity",
  bodyIntro: "Intro paragraph",
  bodyMain: "Body",
  bodyClosing: "Closing line",
  closing: "Closing (legacy)",
};

/** Required in every mode (preview included). */
const ALWAYS_REQUIRED: (keyof LetterFields)[] = [
  "companyName",
  "salutation",
  "projectName",
  "bodyIntro",
  "bodyMain",
  "bodyClosing",
];

/**
 * Required to save or send; a preview may leave them empty. The v2 addressee block plus the subject
 * reference. (companyLocation/industry/productsServices are v1-only and no longer required.)
 */
const REQUIRED_TO_SAVE: (keyof LetterFields)[] = [
  "recipientTitle",
  "recipientFullName",
  "recipientAttn",
  "recipientAddress",
  "recipientCity",
  "recipientCountry",
  "reference",
];

/** @deprecated v2 (feature 009) single closing field; superseded by the three body parts below. */
export const DEFAULT_CLOSING =
  "We welcome the opportunity to strengthen cooperation between the German industry and the organizations in the MEA region and remain available for any further information. Please do not hesitate to contact us in case any further questions may arise.";

// ── Feature 010: three editable body parts (intro bold / main / closing) ──

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

const isValidDate = (value: string): boolean => {
  const match = DATE_ONLY.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  const probe = new Date(Date.UTC(y, m - 1, d));
  // Reject overflow such as 2026-02-31.
  return probe.getUTCMonth() === m - 1 && probe.getUTCDate() === d;
};

/** Today in Gulf Standard Time, "YYYY-MM-DD". */
export const todayInDubai = (): string =>
  new Intl.DateTimeFormat("en-CA", { timeZone: LETTER_TIMEZONE }).format(new Date());

/** Prefill for a request without a saved draft (research R3). */
export function buildDefaultLetter(request: any): LetterFields {
  const addressee = request.addressee ?? {};
  const trim = (value: unknown) => String(value ?? "").trim();

  // v2 requests carry the structured addressee; legacy ones only have a single `address` string —
  // split that on newlines/commas so old requests still prefill sensibly.
  const hasStructured = Boolean(
    addressee.title || addressee.fullName || addressee.attn || addressee.city || addressee.country
  );
  const legacy = trim(addressee.address);
  const byLine = legacy.split(/\r?\n/).map((p: string) => p.trim()).filter(Boolean);
  const parts = byLine.length > 1 ? byLine : legacy.split(/,/).map((p: string) => p.trim()).filter(Boolean);

  const recipient = hasStructured
    ? {
        recipientTitle: trim(addressee.title),
        recipientFullName: trim(addressee.fullName),
        recipientAttn: trim(addressee.attn),
        recipientAddress: trim(addressee.address),
        recipientCity: trim(addressee.city),
        recipientCountry: trim(addressee.country),
      }
    : {
        recipientTitle: "",
        recipientFullName: parts[0] ?? "",
        recipientAttn: "",
        recipientAddress: parts[1] ?? "",
        recipientCity: parts[2] ?? "",
        recipientCountry: parts.slice(3).join(", "),
      };

  const company = trim(request.requester?.company);
  const projectName = trim(request.purpose).split(/\r?\n/)[0].slice(0, LIMITS.projectName);

  return {
    ...recipient,
    letterDate: todayInDubai(),
    companyName: company,
    reference: trim(addressee.reference),
    salutation: "Dear Sir or Madam,",
    companyLocation: "",
    industry: "",
    productsServices: "",
    projectName,
    bodyIntro: defaultBodyIntro(company),
    bodyMain: defaultBodyMain(company, projectName),
    bodyClosing: DEFAULT_BODY_CLOSING,
    closing: "",
  };
}

export function validateLetter(
  input: Partial<Record<keyof LetterFields, unknown>> | null | undefined,
  mode: "preview" | "save"
): { value?: LetterFields; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const value = {} as LetterFields;

  for (const key of Object.keys(LABELS) as (keyof LetterFields)[]) {
    const raw = input?.[key];
    value[key] = typeof raw === "string" ? raw.trim() : "";
  }

  for (const [key, max] of Object.entries(LIMITS) as [keyof typeof LIMITS, number][]) {
    if (value[key].length > max) errors[key] = `${LABELS[key]} must be at most ${max} characters`;
  }

  const required = mode === "save" ? [...ALWAYS_REQUIRED, ...REQUIRED_TO_SAVE] : ALWAYS_REQUIRED;
  for (const key of required) {
    if (!value[key] && !errors[key]) errors[key] = `${LABELS[key]} is required`;
  }
  if (!errors.companyName && value.companyName.length === 1) {
    errors.companyName = "Company name must be at least 2 characters";
  }

  if (!isValidDate(value.letterDate)) errors.letterDate = "Date is invalid";

  return Object.keys(errors).length > 0 ? { errors } : { value, errors };
}

/** A rendered body paragraph plus whether it is emphasised (the intro). */
export interface BodyParagraph {
  text: string;
  bold: boolean;
}

/**
 * The three editable body parts as renderable paragraphs: the intro (bold), then each blank-line
 * separated paragraph of the main body, then the closing line. Defaults fill any empty part so a
 * preview of an incomplete draft still reads sensibly.
 */
export function buildBody(f: LetterFields): BodyParagraph[] {
  const company = f.companyName || "";
  const project = f.projectName || "";
  const intro = f.bodyIntro?.trim() || defaultBodyIntro(company);
  const main = f.bodyMain?.trim() || defaultBodyMain(company, project);
  const closing = f.bodyClosing?.trim() || f.closing?.trim() || DEFAULT_BODY_CLOSING;

  const paragraphs: BodyParagraph[] = [{ text: intro, bold: true }];
  for (const part of main.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)) {
    paragraphs.push({ text: part, bold: false });
  }
  paragraphs.push({ text: closing, bold: false });
  return paragraphs;
}

// ── DTO mappers ──

const toIso = (value: unknown): string | null => (value ? new Date(value as any).toISOString() : null);

export function letterStatus(doc: any): LetterStatus {
  if (doc.delivery?.status === "failed") return "failed";
  if (doc.delivery?.status === "sent") return "sent";
  if (doc.approval?.status === "approved") return "approved";
  return doc.letter ? "draft" : "new";
}

/** Saved letter fields of a document, or undefined when it has no draft. */
const savedLetter = (doc: any): LetterFields | undefined => {
  if (!doc.letter) return undefined;
  const fields = {} as LetterFields;
  for (const key of Object.keys(LABELS) as (keyof LetterFields)[]) fields[key] = doc.letter[key] ?? "";
  // Back-compat: a draft saved before feature 010 has only the legacy `closing`; seed the three
  // body parts (closing text preserved) so it opens cleanly in the new editor.
  if (!fields.bodyIntro && !fields.bodyMain && !fields.bodyClosing) {
    const defaults = buildDefaultLetter(doc);
    fields.bodyIntro = defaults.bodyIntro;
    fields.bodyMain = defaults.bodyMain;
    fields.bodyClosing = fields.closing || defaults.bodyClosing;
  }
  return fields;
};

export function toListItem(doc: any): LetterRequestListItem {
  const savedAt = doc.letter?.savedAt ? new Date(doc.letter.savedAt).getTime() : 0;
  const sentAt = doc.delivery?.sentAt ? new Date(doc.delivery.sentAt).getTime() : 0;
  return {
    id: doc._id.toString(),
    reference: doc.reference,
    requester: {
      name: doc.requester?.name ?? "",
      email: doc.requester?.email ?? "",
      company: doc.requester?.company ?? "",
    },
    purpose: doc.purpose ?? "",
    neededBy: new Date(doc.neededBy).toISOString().slice(0, 10),
    language: doc.language === "de" ? "de" : "en",
    createdAt: new Date(doc.createdAt).toISOString(),
    letterStatus: letterStatus(doc),
    approvalStatus: (doc.approval?.status === "approved" ? "approved" : "pending") as ApprovalStatus,
    approvedAt: toIso(doc.approval?.approvedAt),
    sentAt: toIso(doc.delivery?.sentAt),
    sendCount: doc.delivery?.count ?? 0,
    editedSinceSent: !!(savedAt && sentAt && savedAt > sentAt),
  };
}

/** Expects `letter.savedBy` populated with `name` (or an ObjectId when the user no longer exists). */
export function toDetail(doc: any): LetterRequestDetail {
  const item = toListItem(doc);
  const savedBy = doc.letter?.savedBy;
  return {
    ...item,
    requester: { ...item.requester, phone: doc.requester?.phone ?? "" },
    addresseeAddress: doc.addressee?.address ?? "",
    letter: savedLetter(doc) ?? buildDefaultLetter(doc),
    isDraftSaved: !!doc.letter,
    savedBy: savedBy
      ? { id: (savedBy._id ?? savedBy).toString(), name: savedBy.name ?? "" }
      : null,
    savedAt: toIso(doc.letter?.savedAt),
    approvedBy: (() => {
      const approver = doc.approval?.approvedBy;
      return approver
        ? { id: (approver._id ?? approver).toString(), name: approver.name ?? "" }
        : null;
    })(),
    delivery: doc.delivery?.status
      ? {
          status: doc.delivery.status,
          sentAt: toIso(doc.delivery.sentAt),
          attemptedAt: toIso(doc.delivery.attemptedAt) ?? "",
          sentTo: doc.delivery.sentTo ?? "",
          count: doc.delivery.count ?? 0,
          error: doc.delivery.error ?? null,
        }
      : null,
  };
}

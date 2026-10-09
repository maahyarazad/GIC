/**
 * Letter of recommendation wording, defaults, validation and DTO mappers.
 *
 * The section sentences come verbatim from "Draft_Template for Letter of Recommendation.docx";
 * this is the only place they live (the PDF builder and the controller import them).
 */
import { LETTER_TIMEZONE } from "../config/recommendationLetterConfig";
import {
  LetterFields,
  LetterRequestDetail,
  LetterRequestListItem,
  LetterStatus,
} from "../types/recommendationLetter.types";

export const LIMITS: Record<Exclude<keyof LetterFields, "letterDate">, number> = {
  recipientCompany: 160,
  recipientStreet: 200,
  recipientCity: 120,
  recipientCountry: 120,
  companyName: 160,
  reference: 200,
  salutation: 160,
  companyLocation: 80,
  industry: 200,
  productsServices: 300,
  projectName: 200,
  closing: 1000,
};

const LABELS: Record<keyof LetterFields, string> = {
  recipientCompany: "Recipient company",
  recipientStreet: "Street",
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
  closing: "Closing",
};

/** Required in every mode. */
const ALWAYS_REQUIRED: (keyof LetterFields)[] = [
  "companyName",
  "salutation",
  "companyLocation",
  "projectName",
  "closing",
];

/** Required to save or send; a preview may leave them empty. */
const REQUIRED_TO_SAVE: (keyof LetterFields)[] = ["industry", "productsServices"];

export const DEFAULT_CLOSING =
  "We wish the company every success in pursuing this opportunity and its future business development.";

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
  // One address line per field. A single-line address is split on commas instead,
  // so "Acme, Main St 1, Dubai, UAE" still fills all four lines.
  const address = String(request.addressee?.address ?? "");
  const split = (separator: RegExp) =>
    address.split(separator).map((part) => part.trim()).filter(Boolean);
  const lines = split(/\r?\n/);
  const parts = lines.length > 1 ? lines : split(/,/);

  return {
    recipientCompany: parts[0] ?? "",
    recipientStreet: parts[1] ?? "",
    recipientCity: parts[2] ?? "",
    recipientCountry: parts.slice(3).join(", "),
    letterDate: todayInDubai(),
    companyName: String(request.requester?.company ?? "").trim(),
    reference: "RFQ, Tender, Project",
    salutation: "Dear Sir or Madam,",
    companyLocation: "Dubai-based",
    industry: "",
    productsServices: "",
    projectName: String(request.purpose ?? "").split(/\r?\n/)[0].trim().slice(0, LIMITS.projectName),
    closing: DEFAULT_CLOSING,
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

/** The template's three numbered sections with the values filled in. */
export function buildSections(f: LetterFields): { heading: string; paragraphs: string[] }[] {
  // A preview may lack these; keep the gap visible instead of printing an empty phrase.
  const industry = f.industry || "[industry/business sector]";
  const products = f.productsServices || "[products/services/solutions]";

  return [
    {
      heading: "1. Company Introduction & Business Relationship",
      paragraphs: [
        `On behalf of the German Industry Club, we are pleased to provide this letter of recommendation for ${f.companyName}, a ${f.companyLocation} company operating in the ${industry} across the Middle East and Africa (MEA) region.`,
        `The company specializes in ${products} and demonstrates a strong commitment to professional business practices, customer-oriented solutions, and the development of sustainable international business relationships.`,
      ],
    },
    {
      heading: "2. German Emirates Club Membership & German Quality Standards",
      paragraphs: [
        `As a valued member of the German Emirates Club, ${f.companyName} is part of an established business network connecting German and international companies, industry professionals, and decision-makers across the UAE and the wider MEA region.`,
        `Through its membership, ${f.companyName} demonstrates its commitment to these principles and to fostering professional cooperation, international knowledge exchange, and sustainable business development.`,
      ],
    },
    {
      heading: "3. Project Reference & Recommendation",
      paragraphs: [
        `With regard to ${f.projectName}, we are pleased to support ${f.companyName} in its efforts to contribute its expertise and capabilities to this initiative.`,
        `Based on our professional relationship and understanding of the company's business activities, we consider ${f.companyName} a suitable organization for consideration in connection with this project.`,
        `We welcome the opportunity for ${f.companyName} to contribute to the successful implementation of this initiative and further strengthen business cooperation within the region.`,
      ],
    },
  ];
}

// ── DTO mappers ──

const toIso = (value: unknown): string | null => (value ? new Date(value as any).toISOString() : null);

export function letterStatus(doc: any): LetterStatus {
  if (doc.delivery?.status === "failed") return "failed";
  if (doc.delivery?.status === "sent") return "sent";
  return doc.letter ? "draft" : "new";
}

/** Saved letter fields of a document, or undefined when it has no draft. */
const savedLetter = (doc: any): LetterFields | undefined => {
  if (!doc.letter) return undefined;
  const fields = {} as LetterFields;
  for (const key of Object.keys(LABELS) as (keyof LetterFields)[]) fields[key] = doc.letter[key] ?? "";
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

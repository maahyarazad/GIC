export type LetterStatus = "new" | "draft" | "approved" | "sent" | "failed";

export const LETTER_STATUS_LABELS: Record<LetterStatus, string> = {
    new: "New",
    draft: "Draft",
    approved: "Approved",
    sent: "Sent",
    failed: "Send failed",
};

export type ApprovalStatus = "pending" | "approved";

/**
 * The editable values of a letter of recommendation
 * ("Draft_Template for Letter of Recommendation - v2.docx").
 *
 * The recipient block is the structured addressee (v2). The body is three editable parts
 * (`bodyIntro` bold / `bodyMain` / `bodyClosing`) — feature 010. `companyLocation`, `industry`,
 * `productsServices` and the legacy single `closing` are retained for back-compat with older
 * saved drafts but are no longer rendered or shown in the editor.
 */
export interface LetterFields {
    recipientTitle: string;
    recipientFullName: string;
    recipientAttn: string;
    recipientAddress: string;
    recipientCity: string;
    recipientCountry: string;
    /** "YYYY-MM-DD" */
    letterDate: string;
    companyName: string;
    /** Subject reference: Project Name / Tender Number or Name / Business Initiative. */
    reference: string;
    salutation: string;
    /** @deprecated v1 only — not used by the v2 body. */
    companyLocation: string;
    /** @deprecated v1 only — not used by the v2 body. */
    industry: string;
    /** @deprecated v1 only — not used by the v2 body. */
    productsServices: string;
    projectName: string;
    /** Opening recommendation line, rendered bold in the PDF. */
    bodyIntro: string;
    /** Main body; blank lines separate paragraphs. */
    bodyMain: string;
    /** Closing line (e.g. "We wish the company every success …"). */
    bodyClosing: string;
    /** @deprecated legacy single closing field (feature 009); mapped into `bodyClosing`. */
    closing: string;
}

/** Form order. */
export const LETTER_FIELD_KEYS: (keyof LetterFields)[] = [
    "recipientTitle",
    "recipientFullName",
    "recipientAttn",
    "recipientAddress",
    "recipientCity",
    "recipientCountry",
    "letterDate",
    "companyName",
    "reference",
    "salutation",
    "companyLocation",
    "industry",
    "productsServices",
    "projectName",
    "bodyIntro",
    "bodyMain",
    "bodyClosing",
    "closing",
];

// ── Default letter wording (feature 010) ──
// The template body from "Draft_Template for Letter of Recommendation - v2.docx". Lives here (a
// dependency-free module) so both the server (PDF + prefill) and the client (member request form
// presets) use the identical text.

export const COMPANY_PLACEHOLDER = "[Company Name]";
export const PROJECT_PLACEHOLDER = "[Project Name / Tender Number / Business Initiative]";

export const defaultBodyIntro = (company: string): string =>
    `On behalf of the German Industry Club Dubai and its German business community, we are pleased to recommend ${company || COMPANY_PLACEHOLDER} as a trusted and reliable business partner.`;

export const defaultBodyMain = (company: string, project: string): string => {
    const c = company || COMPANY_PLACEHOLDER;
    const p = project || PROJECT_PLACEHOLDER;
    return [
        `Based on the positive feedback and recommendations received from its customers over the years, ${c} has established a strong reputation for professionalism, reliability, and commitment to high business standards. Its customers consistently recognize the company as a dependable and trustworthy business partner, valuing its dedication to quality, integrity, and customer satisfaction.`,
        `As an active member of the German Industry Club Dubai, ${c} represents the values traditionally associated with German business excellence, including quality, integrity, technical competence, and long-term commitment.`,
        `With specific reference to ${p}, we are pleased to endorse ${c}'s participation and support its efforts to contribute to the successful realization of this opportunity.`,
        `Based on our longstanding positive experience with the company, we are confident in recommending ${c} for consideration as a reliable business partner for this initiative.`,
    ].join("\n\n");
};

export const DEFAULT_BODY_CLOSING =
    "We wish the company every success in pursuing this opportunity and its future business development.";

/** Default greeting used when the letter is addressed generically. */
export const DEFAULT_SALUTATION = "Dear Sir or Madam,";

export interface LetterRequestListItem {
    id: string;
    reference: string;
    requester: { name: string; email: string; company: string };
    purpose: string;
    /** "YYYY-MM-DD" */
    neededBy: string;
    language: "en" | "de";
    createdAt: string;
    letterStatus: LetterStatus;
    approvalStatus: ApprovalStatus;
    approvedAt: string | null;
    sentAt: string | null;
    sendCount: number;
    editedSinceSent: boolean;
}

export interface LetterDelivery {
    status: "sent" | "failed";
    sentAt: string | null;
    attemptedAt: string;
    sentTo: string;
    count: number;
    error: string | null;
}

export interface LetterRequestDetail extends Omit<LetterRequestListItem, "requester"> {
    requester: { name: string; email: string; phone: string; company: string };
    addresseeAddress: string;
    /** Always complete: the saved draft or the defaults. */
    letter: LetterFields;
    isDraftSaved: boolean;
    savedBy: { id: string; name: string } | null;
    savedAt: string | null;
    approvedBy: { id: string; name: string } | null;
    delivery: LetterDelivery | null;
}

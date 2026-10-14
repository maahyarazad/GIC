export type LetterStatus = "new" | "draft" | "sent" | "failed";

export const LETTER_STATUS_LABELS: Record<LetterStatus, string> = {
    new: "New",
    draft: "Draft",
    sent: "Sent",
    failed: "Send failed",
};

/**
 * The editable values of a letter of recommendation
 * ("Draft_Template for Letter of Recommendation - v2.docx").
 *
 * The recipient block is the structured addressee (v2). `companyLocation`, `industry` and
 * `productsServices` are retained for back-compat with older saved drafts but are no longer
 * rendered by the v2 body or shown in the editor.
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
    "closing",
];

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
    delivery: LetterDelivery | null;
}

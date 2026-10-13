/**
 * Letter of recommendation configuration (Draft_Template for Letter of Recommendation.docx).
 */

/**
 * A signature drawn above a signatory's name, from a file in file_storage (the server's
 * uploads folder, kept out of git). Two kinds are supported:
 *  - PDF: page 1 is embedded, cropped to `box` (PDF points, origin bottom-left). Re-measure
 *    the box if the file is replaced.
 *  - Image (.png / .jpg / .jpeg): the whole image is embedded as-is, so `box` is omitted
 *    (crop the image file itself to just the signature).
 */
export interface SignatureSource {
  file: string;
  box?: { left: number; bottom: number; right: number; top: number };
}

export interface Signatory {
  name: string;
  title: string;
  signature?: SignatureSource;
}

export const SIGNATORIES: readonly Signatory[] = [
  {
    name: "Jan A Hussing",
    title: "Chairman",
    // Image signature — embedded whole (no box crop); crop the JPEG itself if needed.
    signature: { file: "Jan_signiture.jpeg" },
  },
  {
    name: "Thomas Hochberger",
    title: "General Manager",
    // Signature content measured at left 190, bottom 694, right 447, top 774; padded by 4 pt.
    signature: { file: "Thomas_Signature.pdf", box: { left: 186, bottom: 690, right: 451, top: 778 } },
  },
];

export const SENDER_LINES = [
  "German Industry Club",
  "Building C1, Office 1208",
  "Ajman FreeZone, Ajman, UAE",
  "E-Mail: info@german-industry-club.com",
];

export const RUNNING_HEADER =
  "German Industry Club – Building C1, Office 1208, Ajman FreeZone, Ajman, UAE";

/** emailtemplates record used when emailing a letter to the requester. */
export const DELIVERY_TEMPLATE_NAME = "recommendation_letter_delivery";

export const LETTER_TIMEZONE = "Asia/Dubai";

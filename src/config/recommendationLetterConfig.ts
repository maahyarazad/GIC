/**
 * Letter of recommendation configuration (Draft_Template for Letter of Recommendation.docx).
 */

export const SIGNATORIES = [
  { name: "Jan A Hussing", title: "Chairman" },
  { name: "Thomas Hochberger", title: "General Manager" },
] as const;

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

// Types for the Manage Presentations feature (feature 011).
// A presentation is a member-uploaded file attached to one event (one event → many presentations).

/** Hard upload cap: 50 MB. */
export const MAX_PRESENTATION_BYTES = 50 * 1024 * 1024;

/** Allowed MIME types: PDF + PowerPoint (see research.md FR-015). */
export const ALLOWED_PRESENTATION_TYPES = [
  "application/pdf",
  "application/vnd.ms-powerpoint", // .ppt
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
] as const;

/** Allowed extensions, kept in sync with ALLOWED_PRESENTATION_TYPES. */
export const ALLOWED_PRESENTATION_EXTENSIONS = ["pdf", "ppt", "pptx"] as const;

export interface PresentationDto {
  id: string;
  title: string;
  eventId: string;
  uploadedBy: string;
  originalName: string;
  contentType: string;
  extension: string;
  size: number;
  /** ISO UTC. */
  createdAt: string;
  /** Protected view route, e.g. "/api/v1/presentations/<id>/view". */
  viewUrl: string;
}

export interface CreatePresentationResponse {
  presentation: PresentationDto;
}

export interface ListPresentationsResponse {
  presentations: PresentationDto[];
}

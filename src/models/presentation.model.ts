import { Schema, model } from "mongoose";
import { PresentationDto } from "../types/presentation.types";

// Feature 011: a member-uploaded presentation file attached to one event.
// One event has many presentations (eventId is the many-to-one back-reference).
const PresentationSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // Original client filename (basename only — never a path).
    originalName: { type: String, required: true, trim: true, maxlength: 260 },
    // On-disk name in file_storage, e.g. "<_id>.<ext>" — unguessable, never public.
    storedName: { type: String, required: true },
    contentType: { type: String, required: true },
    extension: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
  },
  {
    timestamps: true,
  }
);

export const PresentationModel = model("Presentation", PresentationSchema, "presentations");

/** Public view route for a presentation; files are served only through this protected route. */
export const presentationViewUrl = (id: string): string =>
  `/api/v1/presentations/${id}/view`;

export const mapPresentation = (doc: any): PresentationDto => {
  const id = doc._id?.toString?.() || doc.id;
  return {
    id,
    title: doc.title,
    eventId: doc.eventId?.toString?.() || doc.eventId,
    uploadedBy: doc.uploadedBy?.toString?.() || doc.uploadedBy,
    originalName: doc.originalName,
    contentType: doc.contentType,
    extension: doc.extension,
    size: doc.size,
    createdAt: new Date(doc.createdAt).toISOString(),
    viewUrl: presentationViewUrl(id),
  };
};

import { EmailTemplate } from "../types/email.types";
import { mapId } from "./objectId.mapper";

export const mapEmailTemplate = (doc: any): EmailTemplate => ({
  _id: mapId(doc?._id),
  name: doc.name,
  subject: doc.subject,
  html: doc.html,
  text: doc.text,
  variables: doc.variables,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

export const mapEmailTemplates = (docs: any[] = []): EmailTemplate[] => docs.map(mapEmailTemplate);

import { BaseModel } from "./base.types";

export interface EmailTemplate extends BaseModel {
  name: string;
  subject: string;
  html: string;
  text?: string;
  variables?: string[];
}

export interface CreateEmailTemplateRequest {
  name: string;
  subject: string;
  html: string;
  text?: string;
  variables?: string[];
}

export interface UpdateEmailTemplateRequest extends Partial<CreateEmailTemplateRequest> {}

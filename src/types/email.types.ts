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

export type VariableType = "G" | "NG";

export interface EmailTemplateVariable {
  name: string;          // e.g. USER_NAME
  type: VariableType;    // G = global, NG = user input
  defaultValue?: string; // optional fallback
}


export interface EmailTemplatePayload {
  _id?: string;

  name: string;
  subject: string;
  html: string;
  text?: string;

  // Variable definition (schema)
  variables: EmailTemplateVariable[];

  createdAt?: string;
  updatedAt?: string;
}

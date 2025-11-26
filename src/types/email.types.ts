export interface IEmailTemplate {
  name: string;             // Unique identifier (e.g., "otp_verification")
  subject: string;          // Email subject with placeholders like {{EVENT_NAME}}
  html: string;             // HTML content with placeholders
  text?: string;            // Optional plain-text version
  variables?: string[];     // Optional array of expected placeholder variables
  createdAt?: Date;
  updatedAt?: Date;
}

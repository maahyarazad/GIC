import nodemailer, { SendMailOptions } from "nodemailer";
import dotenv from "dotenv";
import {EmailTemplateDoc} from '../controllers/email.controller';
import pLimit from "p-limit";

dotenv.config();
import { NewsletterSubscriber } from "../types/newsletterSubscriber.types";
import { getCollection } from "../db";
import { generateUnsubscribeToken } from "../utils/helpers";

 

/** Request body for sending OTP */
export interface EmailOtpRequest {
  email: string;
  event: string;
  otp: string;
  message?: string;
}

export interface EmailAttachment {
  filename?: string;
  path?: string;
  content?: any;
  contentType?: string;
}

export interface SendRawEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
  bcc?: string | string[];
  
}

function slugToTitle(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
async function sendRawEmailWithAttachments({
  to,
  subject,
  html,
  text = "",
  attachments = [],
  bcc = [],
}: SendRawEmailParams) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT!),
    secure: false,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });

  const mailOptions: SendMailOptions = {
    from: process.env.SMTP_SENDER!,
    to,
    subject,
    html,
    text,
    attachments,
    bcc,
  };

  try {
    const response = await transporter.sendMail(mailOptions);
    console.log("Email sent:", response.messageId);
    return response;
  } catch (error) {
    console.error("SMTP send error:", error);
    throw error;
  }
}

/**
 * Replaces all {{KEY}} placeholders in a template string with values from variables object
 */
function replacePlaceholders(
  template: string,
  variables: Record<string, string | number>
): string {
  return template.replace(/{{(.*?)}}/g, (_, key) => {
    const trimmedKey = key.trim();
    return variables[trimmedKey] !== undefined
      ? String(variables[trimmedKey])
      : "";
  });
}



export async function emailOtp(reqBody: EmailOtpRequest) {
  const { email, event, otp, message } = reqBody;

  try {
    const templateCollection = getCollection("email_templates");
    // Fetch template from DB
    const template = await templateCollection.findOne({
      name: "otp_verification",
    });
    if (!template) throw new Error("Email template not found");

    const currentYear = new Date().getFullYear();
    const event_name = slugToTitle(event);
    const sectionMessage = message || `To complete your registration for`;

    // Create a dynamic variables object
    const variables = {
      EVENT_NAME: event_name,
      SECTION_MESSAGE: sectionMessage,
      OTP: otp,
      CURRENT_YEAR: currentYear,
      // You can add more dynamically if needed
      // USER_NAME: "John Doe",
    };

    const htmlBody = replacePlaceholders(template.html, variables);
    const textBody = replacePlaceholders(template.text || "", variables);
    const subject = replacePlaceholders(template.subject, variables);

    return await sendRawEmailWithAttachments({
      to: email,
      subject,
      html: htmlBody,
      text: textBody,
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
}



function getGlobalEmailVariables(extra: Record<string, any> = {}) {
  return {
    CURRENT_YEAR: new Date().getFullYear(),
    EVENT_NAME: "GIC", 
    ...extra
  };
}




export async function sendMassDynamicEmailDoc(
  doc: EmailTemplateDoc,
  data: Record<string, any>
) {
  try {
    const collection = getCollection<NewsletterSubscriber>("newsletter_subscribers");

    const subscribers = await collection
      .find({ active: true })
      .toArray();

    const emails = subscribers.map((subscriber) => {
      const unsubscribeToken = generateUnsubscribeToken(
        subscriber._id.toString()
      );



        const UNSUBSCRIBE_BASE_URL = `${process.env.NODE_ENV === "PRODUCTION" ? process.env.CLIENT_ORIGIN_PROD : process.env.CLIENT_ORIGIN_DEV}/unsubscribe?token={{SUBSCRIBER_TOKEN}}`;

        // 🔁 VARIABLES PER SUBSCRIBER
        const variables : Record<string, any> = {
        ...getGlobalEmailVariables(data),
        ...data,
        SUBSCRIBER_TOKEN: unsubscribeToken, // token string
        EMAIL: subscriber.email,
        };

        delete variables.UNSUBSCRIBE_LINK;
        // Replace `{{SUBSCRIBER_TOKEN}}` placeholder inside the URL with the actual token
        const _variables = {
        ...variables,
        UNSUBSCRIBE_LINK: replacePlaceholders(UNSUBSCRIBE_BASE_URL, variables),
        };

        
      return {
        email: subscriber.email,
        subject: replacePlaceholders(doc.subject, _variables),
        htmlBody: replacePlaceholders(doc.html, _variables),
        textBody: replacePlaceholders(doc.text || "", _variables),
      };
    });

    const result = await sendMassEmail({
      recipients: emails,
    });

    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
}




export async function sendDynamicEmailDoc(doc: string, data: Record<string, any>) {
  try {
    
        const templateCollection = getCollection("email_templates");
    // Fetch template from DB
    const template = await templateCollection.findOne({
      name: doc,
    });

    // Merge global variables + template-specific variables
    const variables = {
      ...getGlobalEmailVariables(data),
      ...data, // data overrides global if needed
    };

    const htmlBody = replacePlaceholders(template.html, variables);
    const textBody = replacePlaceholders(template.text || "", variables);
    const subject = replacePlaceholders(template.subject, variables);

   const result =  await sendRawEmailWithAttachments({
      to: data.email,
      subject,
      html: htmlBody,
      text: textBody,
    });

    return result;
    
  } catch (error) {
    console.error(error);
    throw error;
  }
}





export interface MassEmailRecipient {
  email: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

export interface SendMassEmailParams {
  recipients: MassEmailRecipient[];
  batchSize?: number;
  concurrency?: number;
}

export async function sendMassEmail({
  recipients,
  batchSize = 50,
  concurrency = 5,
}: SendMassEmailParams) {
  const limit = pLimit(concurrency);
  let totalSuccess = 0;

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);

    console.log(
      `Sending batch ${Math.floor(i / batchSize) + 1} (${batch.length} recipients)`
    );

    const results = await Promise.all(
      batch.map((recipient) =>
        limit(async () => {
          try {
            await sendRawEmailWithAttachments({
              to: recipient.email,
              subject: recipient.subject,
              html: recipient.htmlBody,
              text: recipient.textBody || "",
            });

            console.log(`✅ Email sent to ${recipient.email}`);
            return { success: true };
          } catch (error) {
            console.error(
              `❌ Failed to send email to ${recipient.email}:`,
              error
            );
            return { success: false };
          }
        })
      )
    );

    const batchSuccess = results.filter(r => r.success).length;
    totalSuccess += batchSuccess;

    console.log(
      `Batch ${Math.floor(i / batchSize) + 1} summary: ${batchSuccess} succeeded`
    );
  }

  console.log(`✅ All batches processed. Total successful emails: ${totalSuccess}`);
  return totalSuccess;
}



// /** Send OTP email */
// export async function emailOtp(reqBody: EmailOtpRequest) {
//   const { email, event, otp, message } = reqBody;

//   try {
//     const currentYear = new Date().getFullYear();
//     const event_name = slugToTitle(event);
//     const sectionMessage = message || `To complete your registration for`;

//     const htmlBody = `
//   <!DOCTYPE html>
//   <html>
//     <head>
//       <meta charset="UTF-8" />
//       <title>${event_name} - OTP Verification</title>
//     </head>
//     <body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;">
//       <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f4f4f4">
//         <thead>
//           <tr>
//             <td align="center">
//               <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:8px;box-shadow:0 0 10px rgba(0,0,0,0.1);overflow:hidden;margin:40px auto;">
//                 <tr>
//                   <td bgcolor="#D9B144" style="color:#ffffff;text-align:center;padding:20px;font-size:22px;font-weight:bold;border-top-left-radius:8px;border-top-right-radius:8px;">
//                     ${event_name} - OTP Verification
//                   </td>
//                 </tr>
//               </table>
//             </td>
//           </tr>
//         </thead>
//         <tbody>
//           <tr>
//             <td align="center">
//               <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;padding:30px;">
//                 <tr>
//                   <td style="color:#333333;font-size:16px;line-height:1.6;padding:0 20px;">
//                     <p style="color:#333333;">
//                       ${sectionMessage} <strong>${event_name}</strong>, please use the following One-Time Password (OTP):
//                     </p>
//                     <p style="text-align:center;margin:30px 0;color:#333333;">
//                       <span style="font-size:28px;font-weight:bold;letter-spacing:4px;color:#D9B144;">${otp}</span>
//                     </p>
//                     <p style="color:#333333;">
//                       This OTP is valid for the next <strong>5 minutes</strong>. Please do not share it with anyone.
//                     </p>
//                     <p style="color:#333333;">
//                       If you did not request this OTP, please ignore this email.
//                     </p>
//                   </td>
//                 </tr>
//                 <tr>
//                   <td style="font-size:13px;color:#777777;text-align:center;padding:20px;border-top:1px solid #dddddd;">
//                     &copy; ${currentYear} German Emirates Club. All rights reserved.
//                   </td>
//                 </tr>
//               </table>
//             </td>
//           </tr>
//         </tbody>
//       </table>
//     </body>
//   </html>
// `;

//     return await sendRawEmailWithAttachments({
//       to: email,
//       subject: `Your OTP Code – ${event_name}`,
//       html: htmlBody,
//       text: `Your OTP code is: ${otp}. It is valid for 5 minutes.`,
//     });
//   } catch (error) {
//     console.error(error);
//     throw error;
//   }
// }

import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

/** Request body for sending OTP */
export interface EmailOtpRequest {
  email: string;
  event: string;
  otp: string;
  message?: string;
}

/** Parameters for sending a raw email */
export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Initialize transporter (example using SMTP, replace with your provider)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

/** Converts slug to human-readable title */
function slugToTitle(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/** Send raw email with nodemailer */
export async function sendRawEmailWithAttachments(params: SendEmailParams) {
  const mailOptions = {
    from: process.env.SES_FROM_EMAIL,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text || "",
  };

  try {
    const response = await transporter.sendMail(mailOptions);
    console.log("Email sent:", response.messageId);
    return response;
  } catch (error) {
    console.error("Email send error:", error);
    throw error;
  }
}

/** Send OTP email */
export async function emailOtp(reqBody: EmailOtpRequest) {
  const { email, event, otp, message } = reqBody;

  try {
    const currentYear = new Date().getFullYear();
    const event_name = slugToTitle(event);
    const sectionMessage = message || `To complete your registration for`;

    const htmlBody = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>${event_name} - OTP Verification</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f4f4f4">
      <thead>
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:8px;box-shadow:0 0 10px rgba(0,0,0,0.1);overflow:hidden;margin:40px auto;">
              <tr>
                <td bgcolor="#D9B144" style="color:#ffffff;text-align:center;padding:20px;font-size:22px;font-weight:bold;border-top-left-radius:8px;border-top-right-radius:8px;">
                  ${event_name} - OTP Verification
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;padding:30px;">
              <tr>
                <td style="color:#333333;font-size:16px;line-height:1.6;padding:0 20px;">
                  <p style="color:#333333;">
                    ${sectionMessage} <strong>${event_name}</strong>, please use the following One-Time Password (OTP):
                  </p>
                  <p style="text-align:center;margin:30px 0;color:#333333;">
                    <span style="font-size:28px;font-weight:bold;letter-spacing:4px;color:#D9B144;">${otp}</span>
                  </p>
                  <p style="color:#333333;">
                    This OTP is valid for the next <strong>5 minutes</strong>. Please do not share it with anyone.
                  </p>
                  <p style="color:#333333;">
                    If you did not request this OTP, please ignore this email.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#777777;text-align:center;padding:20px;border-top:1px solid #dddddd;">
                  &copy; ${currentYear} German Emirates Club. All rights reserved.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>
`;

    return await sendRawEmailWithAttachments({
      to: email,
      subject: `Your OTP Code – ${event_name}`,
      html: htmlBody,
      text: `Your OTP code is: ${otp}. It is valid for 5 minutes.`,
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
}

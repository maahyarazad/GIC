require('dotenv').config();
const sgMail = require('@sendgrid/mail');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const ATTACHMENT_DIR = path.join(__dirname, '..', 'uploads');

const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

async function sendRequestConfirmationEmail(reqBody) {

    const filePath = path.join(__dirname, '..','assets' , `palmx.png`);
    const { name, email } = reqBody;
    const currentYear = new Date().getFullYear();
    let attachment;

  fs.readFile(filePath, async (err, fileBuffer) => {
    if (err) {
      throw err;
    }

    try {
      const base64Image = fileBuffer.toString("base64");

      

      attachment = {
        content: base64Image,
        filename: `palmx-logo.jpeg`,
        type: "image/jpeg",
        disposition: "inline",
        content_id: "companylogo",
      };



const htmlBody = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>PalmX – Application Request Received</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #f4f4f4;
        font-family: Arial, sans-serif;
      }
      table.container {
        max-width: 600px;
        margin: 40px auto;
        background: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        padding: 0;
        border-collapse: separate;
        border-spacing: 0;
      }
      td.header {
        background-color: #191919;
        color: #ffffff;
        padding: 20px;
        font-size: 22px;
        font-weight: bold;
        vertical-align: middle;
      }
      td.header img {
        border-radius: 50%;
        display: inline-block;
        vertical-align: middle;
        margin-right: 40px;
        width: 100px;
        height: 100px;
      }
      td.header div {
        display: inline-block;
        vertical-align: middle;
      }
      td.content {
        padding: 20px;
        color: #333333;
        line-height: 1.6;
        font-size: 16px;
      }
      ul.steps {
        list-style: none;
        margin: 20px 0 0 20px;
        padding: 0;
      }
      ul.steps li {
        margin-bottom: 10px;
      }
      td.footer {
        font-size: 13px;
        background: #777777;
        color: #dddddd;
        text-align: center;
        padding: 20px;
        border-top: 1px solid #dddddd;
      }
      a {
        color: #1a73e8;
        text-decoration: none;
      }
      p {
        color: #333333;
      }
      li{
        color: #333333;
      }
    </style>
  </head>
  <body>
    <table class="container" width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td class="header">
          <img 
            src="cid:companylogo" 
            alt="PalmX Logo"
            width="100" 
            height="100"
          />
          <div>Thank You for Reaching Out</div>
        </td>
      </tr>
      <tr>
        <td class="content">
          <p>Dear ${name},</p>
          <p>
            Thank you for submitting your request to <strong>PalmX – Empowering Innovation</strong>. We're excited to learn more about your project and look forward to collaborating with you.
          </p>
          <p>Here’s what happens next:</p>
          <ul class="steps">
            <li><strong>1.</strong> We review your submitted requirements.</li>
            <li><strong>2.</strong> Our experts will analyze your needs in detail.</li>
            <li><strong>3.</strong> You’ll receive a comprehensive proposal tailored to your goals.</li>
            <li><strong>4.</strong> Upon your approval, we kick off the project!</li>
          </ul>
          <p>
            If you have any questions in the meantime, feel free to reach out to us at</br>
            <a href="mailto:hallo@palm-x.com">hallo@palm-x.com</a>.
          </p>
          <p>Warm regards,<br />The PalmX Team</p>
        </td>
      </tr>
      <tr>
        <td class="footer">
          &copy; ${currentYear} PalmX – Empowering Innovation. All rights reserved.
        </td>
      </tr>
    </table>
  </body>
</html>
`;


const mailOptions = {
    from: process.env.EMAIL_SENDER,
    to: email,
    subject: 'PalmX – Application Request Received',
    html: htmlBody,
    attachments: [
      {
        filename: 'palmx-logo.jpeg',
        content: fileBuffer,
        cid: 'companylogo', // same as in HTML image src
        contentType: 'image/jpeg',
      },
    ],
  };

      const info = await transporter.sendMail(mailOptions);
      console.log(info);
    
      return info;
    } catch (error) {
      console.err(error);
      throw error;
    }
  });
}



async function sendAdminNotificationEmail(reqBody) {
const { name, email, message, timestamp, attachment } = reqBody;

  

const htmlBody = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>New Application Request</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #f4f4f4;
        font-family: Arial, sans-serif;
      }
      table.container {
        max-width: 600px;
        margin: 40px auto;
        background: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        padding: 0;
        border-collapse: separate;
        border-spacing: 0;
      }
      td.header {
        background-color: #191919;
        color: #ffffff;
        padding: 20px;
        font-size: 22px;
        font-weight: bold;
        text-align: center;
      }
      td.content {
        padding: 20px;
        color: #333333;
        font-size: 16px;
        line-height: 1.6;
      }
      td.footer {
        font-size: 13px;
        background: #777777;
        color: #dddddd;
        text-align: center;
        padding: 20px;
        border-top: 1px solid #dddddd;
      }
      strong {
        color: #000000;
      }
      a {
        color: #1a73e8;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <table class="container" width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td class="header">
          New Application Request Received
        </td>
      </tr>
      <tr>
        <td class="content">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong><br/>${message}</p>
          <p><strong>Submitted At:</strong> ${new Date(timestamp).toLocaleString()}</p>
        </td>
      </tr>
      <tr>
        <td class="footer">
          &copy; ${new Date().getFullYear()} PalmX – Empowering Innovation
        </td>
      </tr>
    </table>
  </body>
</html>
`;


  const mailOptions = {
    from: `"PalmX Bot" ${process.env.EMAIL_SENDER}>`,
    // to: `${process.env.EMAIL_SENDER}`,
    to: `maahyarazad@gmail.com`,
    subject: 'New Application Request Submitted',
    html: htmlBody,
    replyTo: email, // allows admin to reply directly
    attachments: [], 
  };

  try {

    if (attachment && attachment.storedName) {
      // Read the uploaded file from the file system
      const filePath = path.join(ATTACHMENT_DIR, attachment.storedName);
      const fileBuffer = fs.readFileSync(filePath);

      mailOptions.attachments.push({
        filename: attachment.originalname || 'attachment',
        content: fileBuffer,
        contentType: attachment.mimetype || 'application/octet-stream',
      });
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('Admin notification sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Failed to send admin email:', error);
    throw error;
  }
}

module.exports = { sendRequestConfirmationEmail, sendAdminNotificationEmail };


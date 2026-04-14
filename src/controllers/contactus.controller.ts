import {
  Controller,
  Route,
  Tags,
  Post,
  FormField,
  UploadedFile,
  Consumes,
} from "tsoa";
import type { File } from "tsoa";
import {
  ApiResponse,
  createErrorResponse,
  createSuccessResponse,
} from "../utils/helpers";
import { ContactUsModel, mapContactUsSubmission } from "../models/contactus.model";


// @Route("api/v1/contact-us")
// @Tags("contact-us")
// export class ContactUsController extends Controller {
//   @Post("/")
//   @Consumes("multipart/form-data")
//   public async createContactUsSubmission(
//     @FormField() fullName: string,
//     @FormField() email: string,
//     @FormField() industry: string,
//     @FormField() meaObjective: string,
//     @FormField() company?: string,
//     @FormField() phone?: string,
//     @FormField() countryOfInterest?: string,
//     @FormField() referredBy?: string,
//     @UploadedFile("attachment") attachment?: File
//   ): Promise<ApiResponse<any>> {
//     try {
//       const normalizedFullName = fullName?.trim();
//       const normalizedEmail = email?.trim().toLowerCase();
//       const normalizedIndustry = industry?.trim();
//       const normalizedMeaObjective = meaObjective?.trim();
//       const normalizedCompany = company?.trim() || "";
//       const normalizedPhone = phone?.trim() || "";
//       const normalizedCountryOfInterest = countryOfInterest?.trim() || "";
//       const normalizedReferredBy = referredBy?.trim() || "";

//       if (!normalizedFullName) {
//         this.setStatus(400);
//         return createErrorResponse("Full Name is required", "FULL_NAME_REQUIRED");
//       }

//       if (!normalizedEmail) {
//         this.setStatus(400);
//         return createErrorResponse("Email is required", "EMAIL_REQUIRED");
//       }

//       const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//       if (!emailRegex.test(normalizedEmail)) {
//         this.setStatus(400);
//         return createErrorResponse("Invalid email address", "INVALID_EMAIL");
//       }

//       if (!normalizedIndustry) {
//         this.setStatus(400);
//         return createErrorResponse("Industry / Sector is required", "INDUSTRY_REQUIRED");
//       }

//       if (!normalizedMeaObjective) {
//         this.setStatus(400);
//         return createErrorResponse("Your MEA Objective is required", "MEA_OBJECTIVE_REQUIRED");
//       }

//       let attachmentMeta: any = null;

//       if (attachment) {
//         attachmentMeta = {
//           fieldname: attachment.fieldname,
//           originalname: attachment.originalname,
//           mimetype: attachment.mimetype,
//           size: attachment.size,
//           filename: (attachment as any).filename || null,
//           path: (attachment as any).path || null,
//         };
//       }

//       const submission = await ContactUsModel.create({
//         fullName: normalizedFullName,
//         email: normalizedEmail,
//         industry: normalizedIndustry,
//         meaObjective: normalizedMeaObjective,
//         company: normalizedCompany,
//         phone: normalizedPhone,
//         countryOfInterest: normalizedCountryOfInterest,
//         referredBy: normalizedReferredBy,
//         attachment: attachmentMeta,
//       });

//       this.setStatus(201);
//       return createSuccessResponse(
//         mapContactUsSubmission(submission.toObject()),
//         "Application submitted successfully"
//       );
//     } catch (err: any) {
//       this.setStatus(500);
//       return createErrorResponse(
//         "Failed to submit application",
//         "CREATE_ERROR",
//         err
//       );
//     }
//   }
// }
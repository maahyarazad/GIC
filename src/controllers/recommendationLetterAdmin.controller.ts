import {
  Body,
  Controller,
  Get,
  Middlewares,
  Path,
  Post,
  Put,
  Query,
  Request,
  Route,
  Tags,
} from "tsoa";
import { Request as ExpressRequest } from "express";
import { Readable } from "stream";
import { adminOnlyMiddleware } from "../middleware/adminauth.middleware";
import { BusinessLetterRequestModel } from "../models/businessLetterRequest.model";
import { toDetail, toListItem, validateLetter } from "../services/recommendationLetterText";
import { buildRecommendationLetterPdf } from "../services/recommendationLetterPdf";
import { sendDynamicEmailDoc } from "../services/emailService";
import {
  RECOMMENDATION_LETTER_DELIVERY,
  ensureEmailTemplate,
} from "../services/emailTemplateProvisioning";
import { LetterFields } from "../types/recommendationLetter.types";
import { createErrorResponse, createSuccessResponse, escapeHtml } from "../utils/helpers";
import { toObjectId } from "../mappers/objectId.mapper";

const LIST_LIMIT = 500;

const adminId = (req: ExpressRequest) => toObjectId((req as any).user?.userId);

const loadDetail = async (id: unknown) => {
  const doc = await BusinessLetterRequestModel.findById(id)
    .populate("letter.savedBy", "name")
    .lean();
  return doc ? toDetail(doc) : null;
};

@Route("api/v1/admin/letter-requests")
@Tags("Recommendation Letters Admin")
export class RecommendationLetterAdminController extends Controller {
  @Get("/")
  @Middlewares(adminOnlyMiddleware)
  public async listLetterRequests(): Promise<any> {
    try {
      const docs = await BusinessLetterRequestModel.find()
        .sort({ createdAt: -1 })
        .limit(LIST_LIMIT)
        .lean();

      const items = docs.map(toListItem);
      this.setStatus(200);
      return createSuccessResponse({ items, total: items.length }, "Letter requests fetched");
    } catch (error) {
      console.error("Error listing letter requests:", error);
      this.setStatus(500);
      return createErrorResponse("Failed to fetch letter requests", "INTERNAL_ERROR");
    }
  }

  @Get("/{id}")
  @Middlewares(adminOnlyMiddleware)
  public async getLetterRequest(@Path() id: string): Promise<any> {
    try {
      const requestId = toObjectId(id);
      if (!requestId) {
        this.setStatus(400);
        return createErrorResponse("Invalid request id", "INVALID_ID");
      }

      const detail = await loadDetail(requestId);
      if (!detail) {
        this.setStatus(404);
        return createErrorResponse("Letter request not found", "NOT_FOUND");
      }

      this.setStatus(200);
      return createSuccessResponse(detail, "Letter request fetched");
    } catch (error) {
      console.error("Error fetching letter request:", error);
      this.setStatus(500);
      return createErrorResponse("Failed to fetch the letter request", "INTERNAL_ERROR");
    }
  }

  @Put("/{id}/letter")
  @Middlewares(adminOnlyMiddleware)
  public async saveLetter(
    @Path() id: string,
    @Body() body: LetterFields,
    @Request() req: ExpressRequest
  ): Promise<any> {
    try {
      const requestId = toObjectId(id);
      if (!requestId) {
        this.setStatus(400);
        return createErrorResponse("Invalid request id", "INVALID_ID");
      }

      const { value, errors } = validateLetter(body, "save");
      if (!value) {
        this.setStatus(400);
        return createErrorResponse("Validation failed", "VALIDATION_ERROR", errors);
      }

      const { matchedCount } = await BusinessLetterRequestModel.updateOne(
        { _id: requestId },
        { $set: { letter: { ...value, savedBy: adminId(req), savedAt: new Date() } } }
      );
      if (!matchedCount) {
        this.setStatus(404);
        return createErrorResponse("Letter request not found", "NOT_FOUND");
      }

      this.setStatus(200);
      return createSuccessResponse(await loadDetail(requestId), "Letter saved");
    } catch (error) {
      console.error("Error saving letter:", error);
      this.setStatus(500);
      return createErrorResponse("Failed to save the letter", "INTERNAL_ERROR");
    }
  }

  /** PDF of the posted (possibly unsaved) letter values; used by both View and Download. */
  @Post("/{id}/letter/pdf")
  @Middlewares(adminOnlyMiddleware)
  public async letterPdf(
    @Path() id: string,
    @Body() body: LetterFields,
    @Query() disposition?: string
  ): Promise<any> {
    try {
      const requestId = toObjectId(id);
      if (!requestId) {
        this.setStatus(400);
        return createErrorResponse("Invalid request id", "INVALID_ID");
      }

      const doc: any = await BusinessLetterRequestModel.findById(requestId).select("reference").lean();
      if (!doc) {
        this.setStatus(404);
        return createErrorResponse("Letter request not found", "NOT_FOUND");
      }

      const { value, errors } = validateLetter(body, "preview");
      if (!value) {
        this.setStatus(400);
        return createErrorResponse("Validation failed", "VALIDATION_ERROR", errors);
      }

      const bytes = await buildRecommendationLetterPdf(value, doc.reference);

      this.setStatus(200);
      this.setHeader("Content-Type", "application/pdf");
      this.setHeader(
        "Content-Disposition",
        `${disposition === "inline" ? "inline" : "attachment"}; filename="${doc.reference}.pdf"`
      );
      // tsoa pipes readable streams; a Buffer would be serialised as JSON.
      return Readable.from(Buffer.from(bytes));
    } catch (error) {
      console.error("Error generating recommendation letter PDF:", error);
      this.setStatus(500);
      return createErrorResponse("Failed to generate the PDF", "PDF_ERROR");
    }
  }

  /** Emails the saved letter as a PDF attachment from info@ to the requester. */
  @Post("/{id}/letter/send")
  @Middlewares(adminOnlyMiddleware)
  public async sendLetter(@Path() id: string, @Request() req: ExpressRequest): Promise<any> {
    const requestId = toObjectId(id);
    if (!requestId) {
      this.setStatus(400);
      return createErrorResponse("Invalid request id", "INVALID_ID");
    }

    let doc: any;
    try {
      doc = await BusinessLetterRequestModel.findById(requestId).lean();
    } catch (error) {
      console.error("Error loading letter request for sending:", error);
      this.setStatus(500);
      return createErrorResponse("Failed to send the letter", "INTERNAL_ERROR");
    }
    if (!doc) {
      this.setStatus(404);
      return createErrorResponse("Letter request not found", "NOT_FOUND");
    }
    // The defaults leave required fields empty, so only a saved letter can be sent.
    if (!doc.letter) {
      this.setStatus(409);
      return createErrorResponse("Complete and save the letter before sending", "LETTER_NOT_SAVED");
    }

    const { value, errors } = validateLetter(doc.letter, "save");
    if (!value) {
      this.setStatus(400);
      return createErrorResponse("The saved letter is incomplete", "VALIDATION_ERROR", errors);
    }

    const sentTo = String(doc.requester?.email ?? "");
    const sentBy = adminId(req);

    try {
      const bytes = await buildRecommendationLetterPdf(value, doc.reference);
      await ensureEmailTemplate(RECOMMENDATION_LETTER_DELIVERY);

      const variables: Record<string, string> = {
        REQUESTER_NAME: doc.requester?.name ?? "",
        COMPANY_NAME: value.companyName,
        REFERENCE: doc.reference,
        PROJECT_NAME: value.projectName,
        LETTER_DATE: value.letterDate,
      };
      const htmlData = Object.fromEntries(
        Object.entries(variables).map(([key, text]) => [key, escapeHtml(text)])
      );

      await sendDynamicEmailDoc(
        RECOMMENDATION_LETTER_DELIVERY.name,
        { ...variables, email: sentTo },
        {
          sender: "info",
          replyTo: process.env.SMTP_INFO_SENDER,
          htmlData,
          attachments: [
            { filename: `${doc.reference}.pdf`, content: Buffer.from(bytes), contentType: "application/pdf" },
          ],
        }
      );
    } catch (error: any) {
      console.error(`Error sending recommendation letter ${doc.reference}:`, error);
      const message = String(error?.message ?? error).slice(0, 500);
      try {
        await BusinessLetterRequestModel.updateOne(
          { _id: requestId },
          {
            $set: {
              "delivery.status": "failed",
              "delivery.attemptedAt": new Date(),
              "delivery.sentBy": sentBy,
              "delivery.sentTo": sentTo,
              "delivery.error": message,
            },
          }
        );
      } catch (updateError) {
        console.error("Failed to record the letter send failure:", updateError);
      }
      this.setStatus(502);
      return createErrorResponse(`Failed to send the letter: ${message}`, "SEND_FAILED", { error: message });
    }

    try {
      const now = new Date();
      await BusinessLetterRequestModel.updateOne(
        { _id: requestId },
        {
          $set: {
            "delivery.status": "sent",
            "delivery.sentAt": now,
            "delivery.attemptedAt": now,
            "delivery.sentBy": sentBy,
            "delivery.sentTo": sentTo,
            "delivery.error": null,
          },
          $inc: { "delivery.count": 1 },
        }
      );
    } catch (error) {
      // The email went out; only the record failed. Report success with what we have.
      console.error("Failed to record the letter delivery:", error);
    }

    this.setStatus(200);
    return createSuccessResponse(await loadDetail(requestId), `Letter sent to ${sentTo}`);
  }
}

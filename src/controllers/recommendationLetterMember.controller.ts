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
import { authMiddleware } from "../middleware/auth.middleware";
import { BusinessLetterRequestModel } from "../models/businessLetterRequest.model";
import { toDetail, toListItem, validateLetter } from "../services/recommendationLetterText";
import { buildRecommendationLetterPdf } from "../services/recommendationLetterPdf";
import { notifyLeadership } from "../services/businessLetterNotifications";
import { LetterFields } from "../types/recommendationLetter.types";
import { createErrorResponse, createSuccessResponse } from "../utils/helpers";
import { toObjectId } from "../mappers/objectId.mapper";

const LIST_LIMIT = 200;

const memberId = (req: ExpressRequest) => toObjectId((req as any).user?.userId);

const loadOwnDetail = async (id: unknown, userId: unknown) => {
  const doc = await BusinessLetterRequestModel.findOne({ _id: id, userId })
    .populate("letter.savedBy", "name")
    .populate("approval.approvedBy", "name")
    .lean();
  return doc ? toDetail(doc) : null;
};

/**
 * Member-facing recommendation letters (feature 010). Mirrors the admin editor/preview, but every
 * handler is scoped to the authenticated caller's own requests, and the preview PDF is always a
 * DRAFT (watermarked, no signatures). There is intentionally no send or approve route here — those
 * stay admin-only.
 */
@Route("api/v1/letter-requests")
@Tags("Recommendation Letters (Member)")
export class RecommendationLetterMemberController extends Controller {
  @Get("/")
  @Middlewares(authMiddleware)
  public async listMyLetterRequests(@Request() req: ExpressRequest): Promise<any> {
    try {
      const userId = memberId(req);
      if (!userId) {
        this.setStatus(401);
        return createErrorResponse("Not authenticated", "UNAUTHORIZED");
      }

      const docs = await BusinessLetterRequestModel.find({ userId })
        .sort({ createdAt: -1 })
        .limit(LIST_LIMIT)
        .lean();

      const items = docs.map(toListItem);
      this.setStatus(200);
      return createSuccessResponse({ items, total: items.length }, "Letter requests fetched");
    } catch (error) {
      console.error("Error listing member letter requests:", error);
      this.setStatus(500);
      return createErrorResponse("Failed to fetch letter requests", "INTERNAL_ERROR");
    }
  }

  @Get("/{id}")
  @Middlewares(authMiddleware)
  public async getMyLetterRequest(@Path() id: string, @Request() req: ExpressRequest): Promise<any> {
    try {
      const userId = memberId(req);
      const requestId = toObjectId(id);
      if (!userId || !requestId) {
        this.setStatus(400);
        return createErrorResponse("Invalid request", "INVALID_ID");
      }

      const detail = await loadOwnDetail(requestId, userId);
      if (!detail) {
        this.setStatus(404);
        return createErrorResponse("Letter request not found", "NOT_FOUND");
      }

      this.setStatus(200);
      return createSuccessResponse(detail, "Letter request fetched");
    } catch (error) {
      console.error("Error fetching member letter request:", error);
      this.setStatus(500);
      return createErrorResponse("Failed to fetch the letter request", "INTERNAL_ERROR");
    }
  }

  @Put("/{id}/letter")
  @Middlewares(authMiddleware)
  public async saveMyLetter(
    @Path() id: string,
    @Body() body: LetterFields,
    @Request() req: ExpressRequest
  ): Promise<any> {
    try {
      const userId = memberId(req);
      const requestId = toObjectId(id);
      if (!userId || !requestId) {
        this.setStatus(400);
        return createErrorResponse("Invalid request", "INVALID_ID");
      }

      const { value, errors } = validateLetter(body, "save");
      if (!value) {
        this.setStatus(400);
        return createErrorResponse("Validation failed", "VALIDATION_ERROR", errors);
      }

      const { matchedCount } = await BusinessLetterRequestModel.updateOne(
        { _id: requestId, userId },
        { $set: { letter: { ...value, savedBy: userId, savedAt: new Date() } } }
      );
      if (!matchedCount) {
        this.setStatus(404);
        return createErrorResponse("Letter request not found", "NOT_FOUND");
      }

      this.setStatus(200);
      return createSuccessResponse(await loadOwnDetail(requestId, userId), "Letter saved");
    } catch (error) {
      console.error("Error saving member letter:", error);
      this.setStatus(500);
      return createErrorResponse("Failed to save the letter", "INTERNAL_ERROR");
    }
  }

  /**
   * Saves the member's edited letter and notifies the GIC admin group to finalise and send it.
   * This is the member's "Submit" action (the admin remains the only one who sends the signed letter).
   */
  @Post("/{id}/submit")
  @Middlewares(authMiddleware)
  public async submitMyLetter(
    @Path() id: string,
    @Body() body: LetterFields,
    @Request() req: ExpressRequest
  ): Promise<any> {
    try {
      const userId = memberId(req);
      const requestId = toObjectId(id);
      if (!userId || !requestId) {
        this.setStatus(400);
        return createErrorResponse("Invalid request", "INVALID_ID");
      }

      const { value, errors } = validateLetter(body, "save");
      if (!value) {
        this.setStatus(400);
        return createErrorResponse("Validation failed", "VALIDATION_ERROR", errors);
      }

      const updated: any = await BusinessLetterRequestModel.findOneAndUpdate(
        { _id: requestId, userId },
        { $set: { letter: { ...value, savedBy: userId, savedAt: new Date() } } },
        { new: true }
      ).lean();
      if (!updated) {
        this.setStatus(404);
        return createErrorResponse("Letter request not found", "NOT_FOUND");
      }

      // Fire-and-forget: the submit succeeds regardless of the email outcome.
      void notifyLeadership(updated);

      this.setStatus(200);
      return createSuccessResponse(await loadOwnDetail(requestId, userId), "Submitted to the GIC team");
    } catch (error) {
      console.error("Error submitting member letter:", error);
      this.setStatus(500);
      return createErrorResponse("Failed to submit the letter", "INTERNAL_ERROR");
    }
  }

  /** DRAFT preview of the posted letter values for the caller's own request (watermark, no signatures). */
  @Post("/{id}/letter/pdf")
  @Middlewares(authMiddleware)
  public async myLetterPdf(
    @Path() id: string,
    @Body() body: LetterFields,
    @Request() req: ExpressRequest,
    @Query() disposition?: string
  ): Promise<any> {
    try {
      const userId = memberId(req);
      const requestId = toObjectId(id);
      if (!userId || !requestId) {
        this.setStatus(400);
        return createErrorResponse("Invalid request", "INVALID_ID");
      }

      const doc: any = await BusinessLetterRequestModel.findOne({ _id: requestId, userId })
        .select("reference")
        .lean();
      if (!doc) {
        this.setStatus(404);
        return createErrorResponse("Letter request not found", "NOT_FOUND");
      }

      const { value, errors } = validateLetter(body, "preview");
      if (!value) {
        this.setStatus(400);
        return createErrorResponse("Validation failed", "VALIDATION_ERROR", errors);
      }

      // Member preview: no signatures (not finalised) and no DRAFT watermark.
      const bytes = await buildRecommendationLetterPdf(value, doc.reference, { draft: false, signatures: false });

      this.setStatus(200);
      this.setHeader("Content-Type", "application/pdf");
      this.setHeader(
        "Content-Disposition",
        `${disposition === "attachment" ? "attachment" : "inline"}; filename="${doc.reference}.pdf"`
      );
      // tsoa pipes readable streams; a Buffer would be serialised as JSON.
      return Readable.from(Buffer.from(bytes));
    } catch (error) {
      console.error("Error generating member recommendation letter PDF:", error);
      this.setStatus(500);
      return createErrorResponse("Failed to generate the PDF", "PDF_ERROR");
    }
  }
}

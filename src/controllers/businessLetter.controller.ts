import {
  Body,
  Controller,
  Get,
  Middlewares,
  Path,
  Post,
  Query,
  Request,
  Route,
  SuccessResponse,
  Tags,
} from "tsoa";
import { Request as ExpressRequest } from "express";
import { ObjectId } from "mongodb";
import { Readable } from "stream";
import { authMiddleware } from "../middleware/auth.middleware";
import { strictLimiter } from "../middleware/ratelimiter.middleware";
import { Model } from "mongoose";
import { UserDocument, UserModel } from "../models/user.model";
import {
  BusinessLetterRequestModel,
  mapBusinessLetterRequest,
} from "../models/businessLetterRequest.model";
import {
  BusinessLetterLanguage,
  BusinessLetterType,
  CreateBusinessLetterRequest,
  LANGUAGE_LABELS,
  LETTER_TYPE_LABELS,
  formatLetterType,
} from "../types/businessLetter.types";
import {
  BUSINESS_LETTER_EMAIL_TEMPLATE_ID,
  BUSINESS_LETTER_RECIPIENTS,
} from "../config/businessLetterConfig";
import { sendDynamicEmailToUser } from "../services/emailService";
import { buildBusinessLetterPdf } from "../services/businessLetterPdf";
import {
  createErrorResponse,
  createSuccessResponse,
  escapeHtml,
} from "../utils/helpers";
import { toObjectId } from "../mappers/objectId.mapper";

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const EMPTY = "—";

const str = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const parseDateOnly = (value: string): Date | null => {
  const match = DATE_ONLY.exec(value);
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  // Reject overflow such as 2026-02-31.
  return date.getUTCMonth() === m - 1 && date.getUTCDate() === d ? date : null;
};

function validateCreate(body: CreateBusinessLetterRequest): Record<string, string> {
  const errors: Record<string, string> = {};

  const checkLength = (field: string, value: string, min: number, max: number, label: string) => {
    if (value.length < min) {
      errors[field] = min <= 1 ? `${label} is required` : `${label} must be at least ${min} characters`;
    } else if (value.length > max) {
      errors[field] = `${label} must be at most ${max} characters`;
    }
  };

  checkLength("requester.name", str(body.requester?.name), 1, 120, "Name");
  checkLength("requester.phone", str(body.requester?.phone), 0, 40, "Phone");
  checkLength("requester.company", str(body.requester?.company), 0, 160, "Company");

  if (!Object.keys(LETTER_TYPE_LABELS).includes(body.letterType)) {
    errors.letterType = "Letter type is invalid";
  }

  checkLength("addressee.address", str(body.addressee?.address), 0, 500, "Address");
  checkLength("purpose", str(body.purpose), 10, 2000, "Purpose");

  const neededBy = parseDateOnly(str(body.neededBy));
  if (!neededBy) {
    errors.neededBy = "Needed-by date is required";
  } else {
    // Allow one day of tolerance for users in timezones behind UTC.
    const now = new Date();
    const yesterdayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1);
    if (neededBy.getTime() < yesterdayUtc) {
      errors.neededBy = "Needed-by date cannot be in the past";
    }
  }

  if (!Object.keys(LANGUAGE_LABELS).includes(body.language)) {
    errors.language = "Language is invalid";
  }

  return errors;
}

const buildReference = (id: ObjectId): string => {
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `BL-${ymd}-${id.toHexString().slice(-6).toUpperCase()}`;
};

/** Sends the new-request email to the GIC leadership team and records the outcome. Never throws. */
async function notifyLeadership(doc: any): Promise<void> {
  const orEmpty = (value?: string | null) => escapeHtml(value?.trim() || EMPTY);

  try {
    const data = {
      REFERENCE: escapeHtml(doc.reference),
      REQUESTER_NAME: escapeHtml(doc.requester.name),
      REQUESTER_EMAIL: escapeHtml(doc.requester.email),
      REQUESTER_PHONE: orEmpty(doc.requester.phone),
      REQUESTER_COMPANY: orEmpty(doc.requester.company),
      LETTER_TYPE: escapeHtml(formatLetterType(doc.letterType)),
      ADDRESSEE_ADDRESS: orEmpty(doc.addressee?.address),
      LANGUAGE: escapeHtml(LANGUAGE_LABELS[doc.language as BusinessLetterLanguage] ?? doc.language),
      NEEDED_BY: new Date(doc.neededBy).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }),
      SUBMITTED_AT: new Date(doc.createdAt).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Dubai",
      }),
      PURPOSE: escapeHtml(doc.purpose).replace(/\r?\n/g, "<br />"),
    };

    await sendDynamicEmailToUser({
      template_id: BUSINESS_LETTER_EMAIL_TEMPLATE_ID,
      email: BUSINESS_LETTER_RECIPIENTS.join(", "),
      data,
    });

    await BusinessLetterRequestModel.updateOne(
      { _id: doc._id },
      { $set: { "notification.status": "sent", "notification.attemptedAt": new Date() } }
    );
  } catch (error: any) {
    console.error(`Business letter notification failed for ${doc.reference}:`, error);
    try {
      await BusinessLetterRequestModel.updateOne(
        { _id: doc._id },
        {
          $set: {
            "notification.status": "failed",
            "notification.attemptedAt": new Date(),
            "notification.error": String(error?.message ?? error).slice(0, 500),
          },
        }
      );
    } catch (updateError) {
      console.error("Failed to record notification status:", updateError);
    }
  }
}

@Route("api/v1/business-letters")
@Tags("Business Letters")
export class BusinessLetterController extends Controller {
  @Post("/")
  @Middlewares<Function>(strictLimiter, authMiddleware)
  @SuccessResponse("201", "Business letter request submitted")
  public async createBusinessLetterRequest(
    @Body() body: CreateBusinessLetterRequest,
    @Request() req: ExpressRequest
  ): Promise<any> {
    try {
      const userId = toObjectId((req as any).user?.userId);
      const user = userId
        ? await (UserModel as Model<UserDocument>).findById(userId).lean()
        : null;
      if (!user) {
        this.setStatus(404);
        return createErrorResponse("User not found", "USER_NOT_FOUND");
      }

      const errors = validateCreate(body);
      if (Object.keys(errors).length > 0) {
        this.setStatus(400);
        return createErrorResponse("Validation failed", "VALIDATION_ERROR", errors);
      }

      const letterType = body.letterType as BusinessLetterType;
      const fields = {
        userId,
        requester: {
          name: str(body.requester.name),
          email: String(user.email).trim().toLowerCase(),
          phone: str(body.requester.phone),
          company: str(body.requester.company),
        },
        letterType,
        addressee: {
          address: str(body.addressee?.address),
        },
        purpose: str(body.purpose),
        neededBy: parseDateOnly(str(body.neededBy)),
        language: body.language,
      };

      let doc: any;
      for (let attempt = 0; ; attempt++) {
        const _id = new ObjectId();
        try {
          doc = await BusinessLetterRequestModel.create({
            _id,
            reference: buildReference(_id),
            ...fields,
          });
          break;
        } catch (error: any) {
          if (error?.code === 11000 && attempt === 0) continue;
          throw error;
        }
      }

      // Fire and forget: the request is saved regardless of the email outcome.
      void notifyLeadership(doc.toObject());

      this.setStatus(201);
      return createSuccessResponse(
        mapBusinessLetterRequest(doc),
        "Business letter request submitted"
      );
    } catch (error: any) {
      console.error("Error creating business letter request:", error);
      this.setStatus(500);
      return createErrorResponse("Failed to submit business letter request", "INTERNAL_ERROR");
    }
  }

  @Get("/")
  @Middlewares(authMiddleware)
  public async getMyBusinessLetterRequests(
    @Request() req: ExpressRequest,
    @Query() limit: number = 20,
    @Query() skip: number = 0
  ): Promise<any> {
    try {
      const userId = toObjectId((req as any).user?.userId);
      if (!userId) {
        this.setStatus(401);
        return createErrorResponse("Unauthorized", "UNAUTHORIZED");
      }

      const limitNum = Math.min(Math.max(Number(limit) || 20, 1), 100);
      const skipNum = Math.max(Number(skip) || 0, 0);
      const filter = { userId };

      const [docs, total] = await Promise.all([
        BusinessLetterRequestModel.find(filter)
          .sort({ createdAt: -1 })
          .skip(skipNum)
          .limit(limitNum)
          .lean(),
        BusinessLetterRequestModel.countDocuments(filter),
      ]);

      this.setStatus(200);
      return createSuccessResponse(
        {
          items: docs.map(mapBusinessLetterRequest),
          total,
          page: Math.floor(skipNum / limitNum) + 1,
          pages: Math.ceil(total / limitNum),
        },
        "Business letter requests fetched"
      );
    } catch (error) {
      console.error("Error fetching business letter requests:", error);
      this.setStatus(500);
      return createErrorResponse("Failed to fetch business letter requests", "INTERNAL_ERROR");
    }
  }

  @Get("/{id}/pdf")
  @Middlewares(authMiddleware)
  public async downloadBusinessLetterPdf(
    @Path() id: string,
    @Request() req: ExpressRequest
  ): Promise<any> {
    try {
      const userId = toObjectId((req as any).user?.userId);
      const requestId = toObjectId(id);
      // Requests owned by other users are reported as not found.
      const doc =
        userId && requestId
          ? await BusinessLetterRequestModel.findOne({ _id: requestId, userId }).lean()
          : null;

      if (!doc) {
        this.setStatus(404);
        return createErrorResponse("Business letter request not found", "NOT_FOUND");
      }

      const bytes = await buildBusinessLetterPdf(mapBusinessLetterRequest(doc));

      this.setStatus(200);
      this.setHeader("Content-Type", "application/pdf");
      this.setHeader("Content-Disposition", `attachment; filename="${(doc as any).reference}.pdf"`);
      // tsoa pipes readable streams; a Buffer would be serialised as JSON.
      return Readable.from(Buffer.from(bytes));
    } catch (error) {
      console.error("Error generating business letter PDF:", error);
      this.setStatus(500);
      return createErrorResponse("Failed to generate PDF", "PDF_ERROR");
    }
  }
}

import {
  Controller,
  FormField,
  Get,
  Middlewares,
  Path,
  Post,
  Patch,
  Query,
  Request,
  Route,
  SuccessResponse,
  Tags,
  UploadedFile,
} from "tsoa";
import { Request as ExpressRequest } from "express";
import fs from "fs";
import path from "path";
import { Types } from "mongoose";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminOnlyMiddleware } from "../middleware/adminauth.middleware";
import { strictLimiter } from "../middleware/ratelimiter.middleware";
import { UserModel } from "../models/user.model";
import { TenderModel, deriveTenderStatus, mapTenderToListItem } from "../models/tender.model";
import { isIndustrySector } from "../config/industrySectors";
import { createErrorResponse, createSuccessResponse } from "../utils/helpers";
import { notifyTenderPublished } from "../services/tenderNotifications";

const str = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

const SECTOR_GATED_ROLES = ["admin", "procurement"];

@Route("api/v1/tenders")
@Tags("Tenders")
export class TenderController extends Controller {
  @Post("/")
  @Middlewares<Function>(strictLimiter, authMiddleware)
  @SuccessResponse("201", "Tender created")
  public async createTender(
    @Request() req: ExpressRequest,
    @FormField() sector: string,
    @FormField() publisher: string,
    @FormField() announcement: string,
    @FormField() publishedAt: string,
    @FormField() deadline: string,
    @UploadedFile("file") file?: Express.Multer.File
  ): Promise<any> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId || !Types.ObjectId.isValid(userId)) {
        this.setStatus(401);
        return createErrorResponse("Unauthorized", "UNAUTHORIZED");
      }

      //@ts-ignore
      const user = await UserModel.findById(userId).lean();
      if (!user) {
        this.setStatus(404);
        return createErrorResponse("User not found", "USER_NOT_FOUND");
      }

      sector = str(sector);
      publisher = str(publisher);
      announcement = str(announcement);
      publishedAt = str(publishedAt);
      deadline = str(deadline);

      if (!sector || !publisher || !announcement || !publishedAt || !deadline) {
        this.setStatus(400);
        return createErrorResponse(
          "Publisher, announcement, publish date and deadline are all required.",
          "MISSING_FIELD"
        );
      }

      if (!isIndustrySector(sector)) {
        this.setStatus(400);
        return createErrorResponse("Unknown industry sector.", "MISSING_FIELD");
      }

      const role = (user as any).role;
      const canUseAnySector = SECTOR_GATED_ROLES.includes(role);
      const ownSectors: string[] = (user as any).industrySectors ?? [];
      if (!canUseAnySector && !ownSectors.includes(sector)) {
        this.setStatus(403);
        return createErrorResponse(
          "You can only create a tender under one of your own industry sectors.",
          "SECTOR_NOT_OWNED"
        );
      }

      let attachment: { filename: string; originalName: string; mimetype: string; size: number } | null = null;
      if (file) {
        const safeName = `${Date.now()}-${path.basename(file.originalname)}`;
        fs.writeFileSync(path.join("file_storage", safeName), file.buffer);
        attachment = {
          filename: safeName,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        };
      }

      const doc = await TenderModel.create({
        sector,
        publisher,
        announcement,
        publishedAt: new Date(publishedAt),
        deadline: new Date(deadline),
        closedByAdminAt: null,
        attachment,
        creator: {
          userId: (user as any)._id,
          name: (user as any).name,
          email: (user as any).email,
        },
      });

      void notifyTenderPublished(doc.toObject());

      this.setStatus(201);
      return createSuccessResponse(mapTenderToListItem(doc.toObject()), "Tender created");
    } catch (error: any) {
      console.error("Error creating tender:", error);
      this.setStatus(500);
      return createErrorResponse("Failed to create tender", "INTERNAL_ERROR");
    }
  }

  @Get("/")
  @Middlewares(authMiddleware)
  public async listTenders(
    @Request() req: ExpressRequest,
    @Query() sector?: string
  ): Promise<any> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId || !Types.ObjectId.isValid(userId)) {
        this.setStatus(401);
        return createErrorResponse("Unauthorized", "UNAUTHORIZED");
      }

      //@ts-ignore
      const user = await UserModel.findById(userId).lean();
      if (!user) {
        this.setStatus(404);
        return createErrorResponse("User not found", "USER_NOT_FOUND");
      }

      const role = (user as any).role;
      const isSectorGatedRole = SECTOR_GATED_ROLES.includes(role);

      let filter: Record<string, any>;
      if (isSectorGatedRole) {
        if (!sector) {
          this.setStatus(400);
          return createErrorResponse("A sector is required.", "SECTOR_REQUIRED");
        }
        if (!isIndustrySector(sector)) {
          this.setStatus(400);
          return createErrorResponse("Unknown industry sector.", "SECTOR_REQUIRED");
        }
        filter = { sector };
      } else {
        const ownSectors: string[] = (user as any).industrySectors ?? [];
        if (sector) {
          if (!ownSectors.includes(sector)) {
            this.setStatus(400);
            return createErrorResponse(
              "You can only view tenders from your own industry sectors.",
              "SECTOR_NOT_ASSIGNED"
            );
          }
          filter = { sector };
        } else {
          filter = { sector: { $in: ownSectors } };
        }
      }

      //@ts-ignore
      const docs = await TenderModel.find(filter).sort({ createdAt: -1 }).lean();
      return createSuccessResponse(docs.map(mapTenderToListItem), "Tenders fetched");
    } catch (error: any) {
      console.error("Error fetching tenders:", error);
      this.setStatus(500);
      return createErrorResponse("Failed to fetch tenders", "INTERNAL_ERROR");
    }
  }

  @Patch("{id}/close")
  @Middlewares(adminOnlyMiddleware)
  public async closeTender(@Path() id: string): Promise<any> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        this.setStatus(400);
        return createErrorResponse("Invalid tender ID");
      }

      //@ts-ignore
      const doc = await TenderModel.findById(id);
      if (!doc) {
        this.setStatus(404);
        return createErrorResponse("Tender not found", "NOT_FOUND");
      }

      if (deriveTenderStatus(doc as any) === "closed") {
        this.setStatus(409);
        return createErrorResponse("This tender is already closed.", "ALREADY_CLOSED");
      }

      doc.closedByAdminAt = new Date();
      await doc.save();

      return createSuccessResponse(mapTenderToListItem(doc.toObject()), "Tender closed");
    } catch (error: any) {
      console.error("Error closing tender:", error);
      this.setStatus(500);
      return createErrorResponse("Failed to close tender", "INTERNAL_ERROR");
    }
  }
}

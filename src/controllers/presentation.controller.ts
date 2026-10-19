import {
  Controller,
  Route,
  Tags,
  Post,
  Get,
  Delete,
  Path,
  Query,
  Request,
  FormField,
  UploadedFile,
  Middlewares,
} from "tsoa";
import { Request as ExpressRequest } from "express";
import { ObjectId } from "mongodb";
import fs from "fs";
import path from "path";
import mime from "mime-types";
import { authMiddleware } from "../middleware/auth.middleware";
import { EventModel } from "../models/event.model";
import { PresentationModel, mapPresentation } from "../models/presentation.model";
import { toObjectId } from "../mappers/objectId.mapper";
import { createErrorResponse, createSuccessResponse } from "../utils/helpers";
import {
  ALLOWED_PRESENTATION_EXTENSIONS,
  ALLOWED_PRESENTATION_TYPES,
  MAX_PRESENTATION_BYTES,
} from "../types/presentation.types";

// File bytes live in a DEDICATED directory that is NOT mounted statically. The existing
// `file_storage` directory is served publicly at /uploads, so presentations are deliberately
// kept out of it and served ONLY through the protected view route below (feature 011, FR-007).
const STORAGE_DIR = "presentation_storage";

const ensureStorageDir = () => {
  if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true });
};

const isAllowed = (contentType: string, extension: string): boolean =>
  (ALLOWED_PRESENTATION_TYPES as readonly string[]).includes(contentType) &&
  (ALLOWED_PRESENTATION_EXTENSIONS as readonly string[]).includes(extension.toLowerCase());

@Route("api/v1/presentations")
@Tags("Presentations")
export class PresentationController extends Controller {
  /**
   * Upload a presentation file and attach it to an event. Max 50 MB (also enforced by the
   * request's multer limit). Only PDF / PPT / PPTX are accepted.
   */
  @Post("/")
  @Middlewares(authMiddleware)
  public async uploadPresentation(
    @Request() req: ExpressRequest,
    @FormField() eventId: string,
    @FormField() title: string,
    @UploadedFile("file") file?: Express.Multer.File
  ): Promise<any> {
    try {
      const userId = toObjectId((req as any).user?.userId);
      if (!userId) {
        this.setStatus(401);
        return createErrorResponse("Unauthorized", "UNAUTHORIZED");
      }

      if (!file) {
        this.setStatus(400);
        return createErrorResponse("No file provided", "NO_FILE");
      }

      if (!title || !title.trim()) {
        this.setStatus(400);
        return createErrorResponse("Title is required", "MISSING_TITLE");
      }

      const eventObjectId = toObjectId(eventId);
      if (!eventObjectId) {
        this.setStatus(400);
        return createErrorResponse("Valid eventId is required", "INVALID_EVENT");
      }
      const event = await EventModel.findById(eventObjectId).select("_id").lean();
      if (!event) {
        this.setStatus(400);
        return createErrorResponse("Event not found", "INVALID_EVENT");
      }

      const extension = (mime.extension(file.mimetype) || "").toString();
      if (!isAllowed(file.mimetype, extension)) {
        this.setStatus(400);
        return createErrorResponse(
          "Only PDF and PowerPoint files are allowed",
          "INVALID_FILE_TYPE"
        );
      }

      if (file.size > MAX_PRESENTATION_BYTES) {
        this.setStatus(413);
        return createErrorResponse("File exceeds the 50 MB limit", "FILE_TOO_LARGE");
      }

      // Generate the id up front so the stored file can be named by it (unguessable, outside
      // /uploads) and storedName is set at create time — it's a required field.
      const presentationId = new ObjectId();
      const storedName = `${presentationId.toString()}.${extension}`;
      const targetPath = path.join(STORAGE_DIR, storedName);

      ensureStorageDir();
      fs.writeFileSync(targetPath, file.buffer);

      let doc;
      try {
        doc = await PresentationModel.create({
          _id: presentationId,
          title: title.trim(),
          eventId: eventObjectId,
          uploadedBy: userId,
          originalName: path.basename(file.originalname),
          storedName,
          contentType: file.mimetype,
          extension,
          size: file.size,
        });
      } catch (createErr) {
        // Don't leave a file on disk without its record.
        fs.promises.unlink(targetPath).catch(() => {});
        throw createErr;
      }

      this.setStatus(201);
      return createSuccessResponse(
        { presentation: mapPresentation(doc.toObject()) },
        "Presentation uploaded"
      );
    } catch (error) {
      console.error("Error uploading presentation:", error);
      this.setStatus(500);
      return createErrorResponse("Failed to upload presentation", "UPLOAD_ERROR");
    }
  }

  /** All presentations attached to an event. Any signed-in member may read (FR-010). */
  @Get("/")
  @Middlewares(authMiddleware)
  public async listByEvent(
    @Request() req: ExpressRequest,
    @Query() eventId: string
  ): Promise<any> {
    try {
      const eventObjectId = toObjectId(eventId);
      if (!eventObjectId) {
        this.setStatus(400);
        return createErrorResponse("Valid eventId is required", "INVALID_EVENT");
      }

      const docs = await PresentationModel.find({ eventId: eventObjectId })
        .sort({ createdAt: -1 })
        .lean();

      this.setStatus(200);
      return createSuccessResponse(
        { presentations: docs.map(mapPresentation) },
        "Presentations fetched"
      );
    } catch (error) {
      console.error("Error listing presentations:", error);
      this.setStatus(500);
      return createErrorResponse("Failed to fetch presentations", "INTERNAL_ERROR");
    }
  }

  /**
   * Protected file view. authMiddleware rejects unauthenticated callers with 401 before this
   * runs, so no bytes ever leak. Streams the stored file with its recorded content type.
   */
  @Get("{id}/view")
  @Middlewares(authMiddleware)
  public async viewPresentation(
    @Path() id: string,
    @Request() req: ExpressRequest
  ): Promise<any> {
    const presentationId = toObjectId(id);
    const doc = presentationId
      ? await PresentationModel.findById(presentationId).lean()
      : null;

    const filePath = doc ? path.join(STORAGE_DIR, (doc as any).storedName) : null;
    if (!doc || !filePath || !fs.existsSync(filePath)) {
      this.setStatus(404);
      return createErrorResponse("Presentation not found", "NOT_FOUND");
    }

    this.setStatus(200);
    this.setHeader("Content-Type", (doc as any).contentType);
    this.setHeader(
      "Content-Disposition",
      `inline; filename="${(doc as any).originalName.replace(/"/g, "")}"`
    );
    return fs.createReadStream(filePath);
  }

  /** Delete a presentation. Uploader or admin only (FR-011). */
  @Delete("{id}")
  @Middlewares(authMiddleware)
  public async deletePresentation(
    @Path() id: string,
    @Request() req: ExpressRequest
  ): Promise<any> {
    try {
      const userId = toObjectId((req as any).user?.userId);
      const role = (req as any).user?.role;
      if (!userId) {
        this.setStatus(401);
        return createErrorResponse("Unauthorized", "UNAUTHORIZED");
      }

      const presentationId = toObjectId(id);
      const doc = presentationId
        ? await PresentationModel.findById(presentationId)
        : null;
      if (!doc) {
        this.setStatus(404);
        return createErrorResponse("Presentation not found", "NOT_FOUND");
      }

      const isOwner = doc.uploadedBy?.toString() === userId.toString();
      if (!isOwner && role !== "admin") {
        this.setStatus(403);
        return createErrorResponse("Not allowed to delete this presentation", "FORBIDDEN");
      }

      const filePath = path.join(STORAGE_DIR, (doc as any).storedName);
      await PresentationModel.deleteOne({ _id: doc._id });
      fs.promises.unlink(filePath).catch(() => {
        /* file already gone — nothing to clean up */
      });

      this.setStatus(200);
      return createSuccessResponse(undefined, "Presentation deleted");
    } catch (error) {
      console.error("Error deleting presentation:", error);
      this.setStatus(500);
      return createErrorResponse("Failed to delete presentation", "INTERNAL_ERROR");
    }
  }
}

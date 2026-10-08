import {
  Body,
  Controller,
  Delete,
  Get,
  Middlewares,
  Path,
  Post,
  Put,
  Query,
  Request,
  Route,
  SuccessResponse,
  Tags,
} from "tsoa";
import { Request as ExpressRequest } from "express";
import { adminOnlyMiddleware } from "../middleware/adminauth.middleware";
import {
  BoardMeetingModel,
  isValidMeetingDate,
  isValidMeetingTime,
  mapBoardMeeting,
  toStartsAt,
} from "../models/boardMeeting.model";
import {
  BoardMeetingRequestModel,
  mapBoardMeetingRequest,
} from "../models/boardMeetingRequest.model";
import { sendInvitation } from "../services/boardMeetingNotifications";
import {
  AdminBoardMeetingDto,
  BoardMeetingInput,
  BoardMeetingRequestCounts,
  BoardMeetingRequestStatus,
} from "../types/boardMeeting.types";
import { createErrorResponse, createSuccessResponse } from "../utils/helpers";
import { toObjectId } from "../mappers/objectId.mapper";

const IMAGE_URL = /^\/uploads\/[A-Za-z0-9._-]{1,128}$/;
const REQUEST_STATUSES: BoardMeetingRequestStatus[] = ["pending", "approved", "declined"];
const REQUEST_LIST_LIMIT = 500;

const str = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const zeroCounts = (): BoardMeetingRequestCounts => ({ pending: 0, approved: 0, declined: 0 });

const adminId = (req: ExpressRequest) => toObjectId((req as any).user?.userId);

function validateMeetingInput(body: BoardMeetingInput) {
  const errors: Record<string, string> = {};

  const checkLength = (field: string, value: string, min: number, max: number, label: string) => {
    if (value.length < min) {
      errors[field] = min <= 1 ? `${label} is required` : `${label} must be at least ${min} characters`;
    } else if (value.length > max) {
      errors[field] = `${label} must be at most ${max} characters`;
    }
  };

  const title = str(body.title);
  const description = str(body.description);
  const venue = str(body.venue);
  const location = str(body.location);
  const date = str(body.date);
  const time = str(body.time);
  const imageUrl = str(body.imageUrl) || null;
  const capacity = body.capacity ?? 10;

  checkLength("title", title, 3, 160, "Title");
  checkLength("description", description, 0, 2000, "Description");
  checkLength("venue", venue, 2, 160, "Venue");
  checkLength("location", location, 2, 300, "Location");

  if (!isValidMeetingDate(date)) errors.date = "Date is invalid";
  if (!isValidMeetingTime(time)) errors.time = "Time must be HH:mm (24h)";
  if (imageUrl && !IMAGE_URL.test(imageUrl)) {
    errors.imageUrl = "Image must be a File Management path like /uploads/<file>";
  }
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 50) {
    errors.capacity = "Capacity must be a whole number between 1 and 50";
  }

  if (Object.keys(errors).length > 0) return { errors };

  return {
    errors,
    value: {
      title,
      description,
      venue,
      location,
      startsAt: toStartsAt(date, time)!,
      imageUrl,
      capacity,
    },
  };
}

const countsByMeeting = async (meetingIds?: unknown[]): Promise<Map<string, BoardMeetingRequestCounts>> => {
  const match = meetingIds ? [{ $match: { meetingId: { $in: meetingIds } } }] : [];
  const rows: any[] = await BoardMeetingRequestModel.aggregate([
    ...match,
    { $group: { _id: { meetingId: "$meetingId", status: "$status" }, n: { $sum: 1 } } },
  ]);

  const counts = new Map<string, BoardMeetingRequestCounts>();
  for (const row of rows) {
    const key = row._id.meetingId.toString();
    const entry = counts.get(key) ?? zeroCounts();
    entry[row._id.status as BoardMeetingRequestStatus] = row.n;
    counts.set(key, entry);
  }
  return counts;
};

const toAdminDto = (doc: any, counts: BoardMeetingRequestCounts = zeroCounts()): AdminBoardMeetingDto => ({
  ...mapBoardMeeting(doc),
  counts,
  createdAt: new Date(doc.createdAt).toISOString(),
  updatedAt: new Date(doc.updatedAt).toISOString(),
});

const loadRequestDto = async (id: unknown) => {
  const doc = await BoardMeetingRequestModel.findById(id)
    .populate("meetingId")
    .populate("decision.by", "name")
    .lean();
  return doc ? mapBoardMeetingRequest(doc) : null;
};

@Route("api/v1/admin/board-meetings")
@Tags("Board Meetings Admin")
export class BoardMeetingAdminController extends Controller {
  @Get("/")
  @Middlewares(adminOnlyMiddleware)
  public async listMeetings(): Promise<any> {
    try {
      const [meetings, counts] = await Promise.all([
        BoardMeetingModel.find().sort({ startsAt: -1 }).lean(),
        countsByMeeting(),
      ]);

      const items = meetings.map((meeting: any) =>
        toAdminDto(meeting, counts.get(meeting._id.toString()))
      );

      this.setStatus(200);
      return createSuccessResponse({ items }, "Board meetings fetched");
    } catch (error) {
      console.error("Error listing board meetings:", error);
      this.setStatus(500);
      return createErrorResponse("Failed to fetch board meetings", "INTERNAL_ERROR");
    }
  }

  @Post("/")
  @Middlewares(adminOnlyMiddleware)
  @SuccessResponse("201", "Meeting created")
  public async createMeeting(
    @Body() body: BoardMeetingInput,
    @Request() req: ExpressRequest
  ): Promise<any> {
    try {
      const { errors, value } = validateMeetingInput(body);
      if (!value) {
        this.setStatus(400);
        return createErrorResponse("Validation failed", "VALIDATION_ERROR", errors);
      }

      const doc = await BoardMeetingModel.create({
        ...value,
        createdBy: adminId(req),
        updatedBy: adminId(req),
      });

      this.setStatus(201);
      return createSuccessResponse(toAdminDto(doc.toObject()), "Meeting created");
    } catch (error) {
      console.error("Error creating board meeting:", error);
      this.setStatus(500);
      return createErrorResponse("Failed to create meeting", "INTERNAL_ERROR");
    }
  }

  @Put("/{id}")
  @Middlewares(adminOnlyMiddleware)
  public async updateMeeting(
    @Path() id: string,
    @Body() body: BoardMeetingInput,
    @Request() req: ExpressRequest
  ): Promise<any> {
    try {
      const meetingId = toObjectId(id);
      if (!meetingId) {
        this.setStatus(400);
        return createErrorResponse("Invalid meeting id", "INVALID_ID");
      }

      const { errors, value } = validateMeetingInput(body);
      if (!value) {
        this.setStatus(400);
        return createErrorResponse("Validation failed", "VALIDATION_ERROR", errors);
      }

      const exists = await BoardMeetingModel.exists({ _id: meetingId });
      if (!exists) {
        this.setStatus(404);
        return createErrorResponse("Meeting not found", "MEETING_NOT_FOUND");
      }

      const approved = await BoardMeetingRequestModel.countDocuments({ meetingId, status: "approved" });
      if (value.capacity < approved) {
        this.setStatus(400);
        return createErrorResponse(
          "Capacity is below the number of approved attendees",
          "CAPACITY_BELOW_APPROVED",
          { capacity: `Capacity cannot be below the ${approved} approved attendees` }
        );
      }

      const doc = await BoardMeetingModel.findByIdAndUpdate(
        meetingId,
        { $set: { ...value, updatedBy: adminId(req) } },
        { new: true, runValidators: true }
      ).lean();
      if (!doc) {
        this.setStatus(404);
        return createErrorResponse("Meeting not found", "MEETING_NOT_FOUND");
      }

      const counts = await countsByMeeting([meetingId]);
      this.setStatus(200);
      return createSuccessResponse(toAdminDto(doc, counts.get(id)), "Meeting updated");
    } catch (error) {
      console.error("Error updating board meeting:", error);
      this.setStatus(500);
      return createErrorResponse("Failed to update meeting", "INTERNAL_ERROR");
    }
  }

  @Delete("/{id}")
  @Middlewares(adminOnlyMiddleware)
  public async deleteMeeting(@Path() id: string): Promise<any> {
    try {
      const meetingId = toObjectId(id);
      if (!meetingId) {
        this.setStatus(400);
        return createErrorResponse("Invalid meeting id", "INVALID_ID");
      }

      const { deletedCount } = await BoardMeetingModel.deleteOne({ _id: meetingId });
      if (!deletedCount) {
        this.setStatus(404);
        return createErrorResponse("Meeting not found", "MEETING_NOT_FOUND");
      }

      const requests = await BoardMeetingRequestModel.deleteMany({ meetingId });

      this.setStatus(200);
      return createSuccessResponse(
        { deletedRequests: requests.deletedCount ?? 0 },
        "Meeting deleted"
      );
    } catch (error) {
      console.error("Error deleting board meeting:", error);
      this.setStatus(500);
      return createErrorResponse("Failed to delete meeting", "INTERNAL_ERROR");
    }
  }
}

@Route("api/v1/admin/board-meeting-requests")
@Tags("Board Meetings Admin")
export class BoardMeetingRequestAdminController extends Controller {
  @Get("/")
  @Middlewares(adminOnlyMiddleware)
  public async listRequests(
    @Query() status?: string,
    @Query() meetingId?: string
  ): Promise<any> {
    try {
      const filter: Record<string, unknown> = {};

      if (status) {
        if (!REQUEST_STATUSES.includes(status as BoardMeetingRequestStatus)) {
          this.setStatus(400);
          return createErrorResponse("Invalid status", "VALIDATION_ERROR");
        }
        filter.status = status;
      }
      if (meetingId) {
        const id = toObjectId(meetingId);
        if (!id) {
          this.setStatus(400);
          return createErrorResponse("Invalid meeting id", "INVALID_ID");
        }
        filter.meetingId = id;
      }

      const docs = await BoardMeetingRequestModel.find(filter)
        .sort({ createdAt: -1 })
        .limit(REQUEST_LIST_LIMIT)
        .populate("meetingId")
        .populate("decision.by", "name")
        .lean();

      const items = docs.map(mapBoardMeetingRequest);
      this.setStatus(200);
      return createSuccessResponse({ items, total: items.length }, "Board meeting requests fetched");
    } catch (error) {
      console.error("Error listing board meeting requests:", error);
      this.setStatus(500);
      return createErrorResponse("Failed to fetch requests", "INTERNAL_ERROR");
    }
  }

  @Post("/{id}/approve")
  @Middlewares(adminOnlyMiddleware)
  public async approveRequest(
    @Path() id: string,
    @Request() req: ExpressRequest
  ): Promise<any> {
    try {
      const requestId = toObjectId(id);
      if (!requestId) {
        this.setStatus(400);
        return createErrorResponse("Invalid request id", "INVALID_ID");
      }

      const request: any = await BoardMeetingRequestModel.findById(requestId).lean();
      if (!request) {
        this.setStatus(404);
        return createErrorResponse("Request not found", "REQUEST_NOT_FOUND");
      }
      if (request.status !== "pending") {
        this.setStatus(409);
        return createErrorResponse("This request has already been decided", "NOT_PENDING");
      }

      const meeting: any = await BoardMeetingModel.findById(request.meetingId).lean();
      if (!meeting) {
        this.setStatus(404);
        return createErrorResponse("Meeting not found", "MEETING_NOT_FOUND");
      }
      if (new Date(meeting.startsAt).getTime() <= Date.now()) {
        this.setStatus(409);
        return createErrorResponse("This meeting has already taken place", "MEETING_PAST");
      }

      const approved = await BoardMeetingRequestModel.countDocuments({
        meetingId: request.meetingId,
        status: "approved",
      });
      if (approved >= (meeting.capacity ?? 10)) {
        this.setStatus(409);
        return createErrorResponse("Meeting is full", "MEETING_FULL");
      }

      const updated = await BoardMeetingRequestModel.findOneAndUpdate(
        { _id: requestId, status: "pending" },
        { $set: { status: "approved", "decision.by": adminId(req), "decision.at": new Date() } }
      );
      if (!updated) {
        this.setStatus(409);
        return createErrorResponse("This request has already been decided", "NOT_PENDING");
      }

      const invitation = await sendInvitation(requestId);

      this.setStatus(200);
      return createSuccessResponse(
        await loadRequestDto(requestId),
        invitation === "sent"
          ? "Request approved"
          : "Request approved, but the invitation email failed"
      );
    } catch (error) {
      console.error("Error approving board meeting request:", error);
      this.setStatus(500);
      return createErrorResponse("Failed to approve request", "INTERNAL_ERROR");
    }
  }

  @Post("/{id}/decline")
  @Middlewares(adminOnlyMiddleware)
  public async declineRequest(
    @Path() id: string,
    @Request() req: ExpressRequest
  ): Promise<any> {
    try {
      const requestId = toObjectId(id);
      if (!requestId) {
        this.setStatus(400);
        return createErrorResponse("Invalid request id", "INVALID_ID");
      }

      const exists = await BoardMeetingRequestModel.exists({ _id: requestId });
      if (!exists) {
        this.setStatus(404);
        return createErrorResponse("Request not found", "REQUEST_NOT_FOUND");
      }

      // No email on decline.
      const updated = await BoardMeetingRequestModel.findOneAndUpdate(
        { _id: requestId, status: "pending" },
        { $set: { status: "declined", "decision.by": adminId(req), "decision.at": new Date() } }
      );
      if (!updated) {
        this.setStatus(409);
        return createErrorResponse("This request has already been decided", "NOT_PENDING");
      }

      this.setStatus(200);
      return createSuccessResponse(await loadRequestDto(requestId), "Request declined");
    } catch (error) {
      console.error("Error declining board meeting request:", error);
      this.setStatus(500);
      return createErrorResponse("Failed to decline request", "INTERNAL_ERROR");
    }
  }

  @Post("/{id}/resend-invitation")
  @Middlewares(adminOnlyMiddleware)
  public async resendInvitation(@Path() id: string): Promise<any> {
    try {
      const requestId = toObjectId(id);
      if (!requestId) {
        this.setStatus(400);
        return createErrorResponse("Invalid request id", "INVALID_ID");
      }

      const request: any = await BoardMeetingRequestModel.findById(requestId).lean();
      if (!request) {
        this.setStatus(404);
        return createErrorResponse("Request not found", "REQUEST_NOT_FOUND");
      }
      if (request.status !== "approved") {
        this.setStatus(409);
        return createErrorResponse("Only approved requests can be invited", "NOT_APPROVED");
      }
      if (request.notifications?.invitation?.status === "sent") {
        this.setStatus(409);
        return createErrorResponse("The invitation has already been sent", "ALREADY_SENT");
      }

      const invitation = await sendInvitation(requestId);

      this.setStatus(200);
      return createSuccessResponse(
        await loadRequestDto(requestId),
        invitation === "sent" ? "Invitation sent" : "Invitation email failed"
      );
    } catch (error) {
      console.error("Error resending board meeting invitation:", error);
      this.setStatus(500);
      return createErrorResponse("Failed to resend invitation", "INTERNAL_ERROR");
    }
  }
}

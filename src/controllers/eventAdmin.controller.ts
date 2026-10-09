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
  EventModel,
  isValidEventDate,
  isValidEventTime,
  mapAdminEvent,
  toStartsAt,
} from "../models/event.model";
import {
  EventAttendanceModel,
  mapEventAttendance,
  normalizeAttendanceStatus,
} from "../models/eventAttendance.model";
import { sendConfirmation } from "../services/eventNotifications";
import { EventInput } from "../types/event.types";
import { createErrorResponse, createSuccessResponse } from "../utils/helpers";
import { toObjectId } from "../mappers/objectId.mapper";

const IMAGE_URL = /^\/uploads\/[A-Za-z0-9._-]{1,128}$/;
const ATTENDANCE_STATUS_FILTERS = ["confirmed", "cancelled", "all"] as const;
const ATTENDANCE_LIST_LIMIT = 500;

const str = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const adminId = (req: ExpressRequest) => toObjectId((req as any).user?.userId);

const capacityBelowConfirmed = (confirmed: number) =>
  createErrorResponse(
    "Capacity is below the number of confirmed attendees",
    "CAPACITY_BELOW_CONFIRMED",
    { capacity: `Capacity cannot be below the ${confirmed} confirmed attendees` }
  );

function validateEventInput(body: EventInput) {
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

  if (!isValidEventDate(date)) errors.date = "Date is invalid";
  if (!isValidEventTime(time)) errors.time = "Time must be HH:mm (24h)";
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

const loadAttendanceDto = async (id: unknown) => {
  const doc = await EventAttendanceModel.findById(id).populate("meetingId").lean();
  return doc ? mapEventAttendance(doc) : null;
};

@Route("api/v1/admin/events")
@Tags("Events Admin")
export class EventAdminController extends Controller {
  @Get("/")
  @Middlewares(adminOnlyMiddleware)
  public async listEvents(): Promise<any> {
    try {
      const events = await EventModel.find().sort({ startsAt: -1 }).lean();

      this.setStatus(200);
      return createSuccessResponse({ items: events.map(mapAdminEvent) }, "Events fetched");
    } catch (error) {
      console.error("Error listing events:", error);
      this.setStatus(500);
      return createErrorResponse("Failed to fetch events", "INTERNAL_ERROR");
    }
  }

  @Post("/")
  @Middlewares(adminOnlyMiddleware)
  @SuccessResponse("201", "Event created")
  public async createEvent(
    @Body() body: EventInput,
    @Request() req: ExpressRequest
  ): Promise<any> {
    try {
      const { errors, value } = validateEventInput(body);
      if (!value) {
        this.setStatus(400);
        return createErrorResponse("Validation failed", "VALIDATION_ERROR", errors);
      }

      // confirmedCount is never taken from input; it starts at 0.
      const doc = await EventModel.create({
        ...value,
        createdBy: adminId(req),
        updatedBy: adminId(req),
      });

      this.setStatus(201);
      return createSuccessResponse(mapAdminEvent(doc.toObject()), "Event created");
    } catch (error) {
      console.error("Error creating event:", error);
      this.setStatus(500);
      return createErrorResponse("Failed to create event", "INTERNAL_ERROR");
    }
  }

  @Put("/{id}")
  @Middlewares(adminOnlyMiddleware)
  public async updateEvent(
    @Path() id: string,
    @Body() body: EventInput,
    @Request() req: ExpressRequest
  ): Promise<any> {
    try {
      const eventId = toObjectId(id);
      if (!eventId) {
        this.setStatus(400);
        return createErrorResponse("Invalid event id", "INVALID_ID");
      }

      const { errors, value } = validateEventInput(body);
      if (!value) {
        this.setStatus(400);
        return createErrorResponse("Validation failed", "VALIDATION_ERROR", errors);
      }

      const event: any = await EventModel.findById(eventId).select("confirmedCount").lean();
      if (!event) {
        this.setStatus(404);
        return createErrorResponse("Event not found", "EVENT_NOT_FOUND");
      }

      const confirmed = event.confirmedCount ?? 0;
      if (value.capacity < confirmed) {
        this.setStatus(400);
        return capacityBelowConfirmed(confirmed);
      }

      // Conditional on the counter, so a seat taken in between can't leave it above capacity.
      const doc = await EventModel.findOneAndUpdate(
        { _id: eventId, confirmedCount: { $lte: value.capacity } },
        { $set: { ...value, updatedBy: adminId(req) } },
        { new: true, runValidators: true }
      ).lean();
      if (!doc) {
        const current: any = await EventModel.findById(eventId).select("confirmedCount").lean();
        if (!current) {
          this.setStatus(404);
          return createErrorResponse("Event not found", "EVENT_NOT_FOUND");
        }
        this.setStatus(409);
        return capacityBelowConfirmed(current.confirmedCount ?? 0);
      }

      this.setStatus(200);
      return createSuccessResponse(mapAdminEvent(doc), "Event updated");
    } catch (error) {
      console.error("Error updating event:", error);
      this.setStatus(500);
      return createErrorResponse("Failed to update event", "INTERNAL_ERROR");
    }
  }

  @Delete("/{id}")
  @Middlewares(adminOnlyMiddleware)
  public async deleteEvent(@Path() id: string): Promise<any> {
    try {
      const eventId = toObjectId(id);
      if (!eventId) {
        this.setStatus(400);
        return createErrorResponse("Invalid event id", "INVALID_ID");
      }

      const { deletedCount } = await EventModel.deleteOne({ _id: eventId });
      if (!deletedCount) {
        this.setStatus(404);
        return createErrorResponse("Event not found", "EVENT_NOT_FOUND");
      }

      const attendances = await EventAttendanceModel.deleteMany({ meetingId: eventId });

      this.setStatus(200);
      return createSuccessResponse(
        { deletedAttendances: attendances.deletedCount ?? 0 },
        "Event deleted"
      );
    } catch (error) {
      console.error("Error deleting event:", error);
      this.setStatus(500);
      return createErrorResponse("Failed to delete event", "INTERNAL_ERROR");
    }
  }
}

@Route("api/v1/admin/event-attendances")
@Tags("Events Admin")
export class EventAttendanceAdminController extends Controller {
  @Get("/")
  @Middlewares(adminOnlyMiddleware)
  public async listAttendances(
    @Query() status?: string,
    @Query() eventId?: string
  ): Promise<any> {
    try {
      const statusFilter = status || "confirmed";
      if (!ATTENDANCE_STATUS_FILTERS.includes(statusFilter as any)) {
        this.setStatus(400);
        return createErrorResponse("Invalid status", "VALIDATION_ERROR");
      }

      const filter: Record<string, unknown> = {};
      // Until migrate_events_004.ts runs, feature 003 rows carry approved/pending/declined.
      if (statusFilter === "confirmed") filter.status = { $in: ["confirmed", "approved"] };
      if (statusFilter === "cancelled") filter.status = { $nin: ["confirmed", "approved"] };

      if (eventId) {
        const id = toObjectId(eventId);
        if (!id) {
          this.setStatus(400);
          return createErrorResponse("Invalid event id", "INVALID_ID");
        }
        filter.meetingId = id;
      }

      const docs = await EventAttendanceModel.find(filter)
        .sort({ createdAt: -1 })
        .limit(ATTENDANCE_LIST_LIMIT)
        .populate("meetingId")
        .lean();

      const items = docs.map(mapEventAttendance);
      this.setStatus(200);
      return createSuccessResponse({ items, total: items.length }, "Attendees fetched");
    } catch (error) {
      console.error("Error listing event attendances:", error);
      this.setStatus(500);
      return createErrorResponse("Failed to fetch attendees", "INTERNAL_ERROR");
    }
  }

  @Post("/{id}/resend-confirmation")
  @Middlewares(adminOnlyMiddleware)
  public async resendConfirmation(@Path() id: string): Promise<any> {
    try {
      const attendanceId = toObjectId(id);
      if (!attendanceId) {
        this.setStatus(400);
        return createErrorResponse("Invalid attendance id", "INVALID_ID");
      }

      const attendance: any = await EventAttendanceModel.findById(attendanceId).lean();
      if (!attendance) {
        this.setStatus(404);
        return createErrorResponse("Attendance not found", "ATTENDANCE_NOT_FOUND");
      }
      if (normalizeAttendanceStatus(attendance.status) !== "confirmed") {
        this.setStatus(409);
        return createErrorResponse("Only confirmed attendees can be sent a confirmation", "NOT_CONFIRMED");
      }
      if (attendance.notifications?.confirmation?.status === "sent") {
        this.setStatus(409);
        return createErrorResponse("The confirmation has already been sent", "ALREADY_SENT");
      }

      const result = await sendConfirmation(attendanceId);

      this.setStatus(200);
      return createSuccessResponse(
        await loadAttendanceDto(attendanceId),
        result === "sent" ? "Confirmation sent" : "Confirmation email failed"
      );
    } catch (error) {
      console.error("Error resending event confirmation:", error);
      this.setStatus(500);
      return createErrorResponse("Failed to resend the confirmation", "INTERNAL_ERROR");
    }
  }
}

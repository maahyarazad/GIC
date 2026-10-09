import {
  Controller,
  Get,
  Middlewares,
  Path,
  Post,
  Request,
  Route,
  SuccessResponse,
  Tags,
} from "tsoa";
import { Request as ExpressRequest } from "express";
import { ObjectId } from "mongodb";
import { Model } from "mongoose";
import { authMiddleware } from "../middleware/auth.middleware";
import { strictLimiter } from "../middleware/ratelimiter.middleware";
import { UserDocument, UserModel } from "../models/user.model";
import { EventModel, mapEvent } from "../models/event.model";
import {
  EventAttendanceModel,
  buildEventReference,
  toMyAttendance,
} from "../models/eventAttendance.model";
import { notifyAttendanceConfirmed } from "../services/eventNotifications";
import { EventDto, MemberEventDto } from "../types/event.types";
import { createErrorResponse, createSuccessResponse } from "../utils/helpers";
import { toObjectId } from "../mappers/objectId.mapper";

const ATTENDANCE_CONFIRMED = "Your attendance is confirmed";
const ALREADY_ATTENDING = "You're already attending this event";

/** Gives back a seat reserved by a confirmation that was not stored. */
const releaseSeat = (eventId: ObjectId) =>
  EventModel.updateOne(
    { _id: eventId, confirmedCount: { $gt: 0 } },
    { $inc: { confirmedCount: -1 } }
  );

@Route("api/v1/events")
@Tags("Events")
export class EventController extends Controller {
  // Public (Events page for visitors): all events, upcoming and past, without attendance data.
  @Get("/public")
  public async getPublicEvents(): Promise<any> {
    try {
      const now = new Date();
      const events = await EventModel.find().sort({ startsAt: 1 }).lean();

      const items: EventDto[] = events.map((event: any) => mapEvent(event, now));

      this.setStatus(200);
      return createSuccessResponse({ items }, "Events fetched");
    } catch (error) {
      console.error("Error fetching public events:", error);
      this.setStatus(500);
      return createErrorResponse("Failed to fetch events", "INTERNAL_ERROR");
    }
  }

  @Get("/")
  @Middlewares(authMiddleware)
  public async getEvents(@Request() req: ExpressRequest): Promise<any> {
    try {
      const userId = toObjectId((req as any).user?.userId);
      if (!userId) {
        this.setStatus(401);
        return createErrorResponse("Unauthorized", "UNAUTHORIZED");
      }

      const [events, attendances] = await Promise.all([
        EventModel.find().sort({ startsAt: 1 }).lean(),
        EventAttendanceModel.find({ userId })
          .select("meetingId reference status createdAt")
          .lean(),
      ]);

      const attendanceByEvent = new Map(
        attendances.map((attendance: any) => [attendance.meetingId.toString(), attendance])
      );
      const now = new Date();

      const items: MemberEventDto[] = events.map((event: any) => {
        const row = attendanceByEvent.get(event._id.toString());
        const myAttendance = row ? toMyAttendance(row) : null;
        return {
          ...mapEvent(event, now),
          myAttendance: myAttendance?.status === "confirmed" ? myAttendance : null,
        };
      });

      this.setStatus(200);
      return createSuccessResponse({ items }, "Events fetched");
    } catch (error) {
      console.error("Error fetching events:", error);
      this.setStatus(500);
      return createErrorResponse("Failed to fetch events", "INTERNAL_ERROR");
    }
  }

  @Post("/{id}/attendance")
  @Middlewares<Function>(strictLimiter, authMiddleware)
  @SuccessResponse("201", ATTENDANCE_CONFIRMED)
  public async confirmAttendance(
    @Path() id: string,
    @Request() req: ExpressRequest
  ): Promise<any> {
    try {
      const eventId = toObjectId(id);
      if (!eventId) {
        this.setStatus(400);
        return createErrorResponse("Invalid event id", "INVALID_ID");
      }

      const userId = toObjectId((req as any).user?.userId);
      const user = userId
        ? await (UserModel as Model<UserDocument>).findById(userId).lean()
        : null;
      if (!user) {
        this.setStatus(404);
        return createErrorResponse("User not found", "USER_NOT_FOUND");
      }

      // Checked before reserving a seat, so a repeated click never touches the counter.
      const existing = await EventAttendanceModel.findOne({ meetingId: eventId, userId }).lean();
      if (existing) {
        this.setStatus(409);
        return createErrorResponse(ALREADY_ATTENDING, "ALREADY_ATTENDING", toMyAttendance(existing));
      }

      // Atomic seat reservation: only an upcoming event with a free seat matches.
      const reserved = await EventModel.findOneAndUpdate(
        {
          _id: eventId,
          startsAt: { $gt: new Date() },
          $expr: { $lt: ["$confirmedCount", "$capacity"] },
        },
        { $inc: { confirmedCount: 1 } },
        { new: true }
      ).lean();

      if (!reserved) {
        const event: any = await EventModel.findById(eventId).select("startsAt").lean();
        if (!event) {
          this.setStatus(404);
          return createErrorResponse("Event not found", "EVENT_NOT_FOUND");
        }
        this.setStatus(409);
        return new Date(event.startsAt).getTime() <= Date.now()
          ? createErrorResponse("This event has already taken place", "EVENT_PAST")
          : createErrorResponse("This event is fully booked", "EVENT_FULL");
      }

      // Identity and contact details come from the user record, never from the client.
      const fields = {
        meetingId: eventId,
        userId,
        requester: {
          name: String(user.name ?? "").trim() || String(user.email).split("@")[0],
          email: String(user.email).trim().toLowerCase(),
          phone: String(user.phone ?? "").trim(),
        },
      };

      let doc: any;
      try {
        for (let attempt = 0; ; attempt++) {
          const _id = new ObjectId();
          try {
            doc = await EventAttendanceModel.create({
              _id,
              reference: buildEventReference(_id),
              ...fields,
            });
            break;
          } catch (error: any) {
            // Reference collision: retry once with a new id.
            if (error?.code === 11000 && !error.keyPattern?.meetingId && attempt === 0) continue;
            throw error;
          }
        }
      } catch (error: any) {
        await releaseSeat(eventId);

        // The member's other tab confirmed in between.
        if (error?.code === 11000 && error.keyPattern?.meetingId) {
          const other = await EventAttendanceModel.findOne({ meetingId: eventId, userId }).lean();
          this.setStatus(409);
          return createErrorResponse(
            ALREADY_ATTENDING,
            "ALREADY_ATTENDING",
            other ? toMyAttendance(other) : undefined
          );
        }
        throw error;
      }

      // Both emails start now; the attendance stands regardless of their outcome.
      void notifyAttendanceConfirmed(doc._id);

      this.setStatus(201);
      return createSuccessResponse(toMyAttendance(doc), ATTENDANCE_CONFIRMED);
    } catch (error) {
      console.error("Error confirming event attendance:", error);
      this.setStatus(500);
      return createErrorResponse("Failed to confirm your attendance", "INTERNAL_ERROR");
    }
  }
}

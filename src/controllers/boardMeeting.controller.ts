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
import { BoardMeetingModel, mapBoardMeeting } from "../models/boardMeeting.model";
import {
  BoardMeetingRequestModel,
  buildBoardMeetingReference,
} from "../models/boardMeetingRequest.model";
import { notifyRequestCreated } from "../services/boardMeetingNotifications";
import { MemberBoardMeetingDto } from "../types/boardMeeting.types";
import { createErrorResponse, createSuccessResponse } from "../utils/helpers";
import { toObjectId } from "../mappers/objectId.mapper";

const REQUEST_SENT = "Your request has been sent to the board meeting";

const toMyRequest = (doc: any) => ({
  reference: doc.reference,
  status: doc.status,
  createdAt: new Date(doc.createdAt).toISOString(),
});

@Route("api/v1/board-meetings")
@Tags("Board Meetings")
export class BoardMeetingController extends Controller {
  @Get("/")
  @Middlewares(authMiddleware)
  public async getBoardMeetings(@Request() req: ExpressRequest): Promise<any> {
    try {
      const userId = toObjectId((req as any).user?.userId);
      if (!userId) {
        this.setStatus(401);
        return createErrorResponse("Unauthorized", "UNAUTHORIZED");
      }

      const [meetings, requests] = await Promise.all([
        BoardMeetingModel.find().sort({ startsAt: 1 }).lean(),
        BoardMeetingRequestModel.find({ userId })
          .select("meetingId reference status createdAt")
          .lean(),
      ]);

      const requestByMeeting = new Map(
        requests.map((request: any) => [request.meetingId.toString(), request])
      );
      const now = new Date();

      const items: MemberBoardMeetingDto[] = meetings.map((meeting: any) => {
        const request = requestByMeeting.get(meeting._id.toString());
        return {
          ...mapBoardMeeting(meeting, now),
          myRequest: request ? toMyRequest(request) : null,
        };
      });

      this.setStatus(200);
      return createSuccessResponse({ items }, "Board meetings fetched");
    } catch (error) {
      console.error("Error fetching board meetings:", error);
      this.setStatus(500);
      return createErrorResponse("Failed to fetch board meetings", "INTERNAL_ERROR");
    }
  }

  @Post("/{id}/requests")
  @Middlewares<Function>(strictLimiter, authMiddleware)
  @SuccessResponse("201", REQUEST_SENT)
  public async createJoinRequest(
    @Path() id: string,
    @Request() req: ExpressRequest
  ): Promise<any> {
    try {
      const meetingId = toObjectId(id);
      if (!meetingId) {
        this.setStatus(400);
        return createErrorResponse("Invalid meeting id", "INVALID_ID");
      }

      const userId = toObjectId((req as any).user?.userId);
      const user = userId
        ? await (UserModel as Model<UserDocument>).findById(userId).lean()
        : null;
      if (!user) {
        this.setStatus(404);
        return createErrorResponse("User not found", "USER_NOT_FOUND");
      }

      const meeting: any = await BoardMeetingModel.findById(meetingId).lean();
      if (!meeting) {
        this.setStatus(404);
        return createErrorResponse("Meeting not found", "MEETING_NOT_FOUND");
      }
      if (new Date(meeting.startsAt).getTime() <= Date.now()) {
        this.setStatus(409);
        return createErrorResponse("This meeting has already taken place", "MEETING_PAST");
      }

      // Identity and contact details come from the user record, never from the client.
      const fields = {
        meetingId,
        userId,
        requester: {
          name: String(user.name ?? "").trim() || String(user.email).split("@")[0],
          email: String(user.email).trim().toLowerCase(),
          phone: String(user.phone ?? "").trim(),
        },
      };

      let doc: any;
      for (let attempt = 0; ; attempt++) {
        const _id = new ObjectId();
        try {
          doc = await BoardMeetingRequestModel.create({
            _id,
            reference: buildBoardMeetingReference(_id),
            ...fields,
          });
          break;
        } catch (error: any) {
          if (error?.code !== 11000) throw error;

          if (error.keyPattern?.meetingId) {
            const existing = await BoardMeetingRequestModel.findOne({ meetingId, userId }).lean();
            this.setStatus(409);
            return createErrorResponse(
              "You have already requested to join this meeting",
              "ALREADY_REQUESTED",
              existing ? toMyRequest(existing) : undefined
            );
          }
          // Reference collision: retry once with a new id.
          if (attempt === 0) continue;
          throw error;
        }
      }

      // Fire and forget: the request is saved regardless of the email outcome.
      void notifyRequestCreated(doc._id);

      this.setStatus(201);
      return createSuccessResponse(toMyRequest(doc), REQUEST_SENT);
    } catch (error) {
      console.error("Error creating board meeting request:", error);
      this.setStatus(500);
      return createErrorResponse("Failed to send your request", "INTERNAL_ERROR");
    }
  }
}

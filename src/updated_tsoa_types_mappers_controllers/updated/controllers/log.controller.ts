import { ObjectId } from "mongodb";
import { createSuccessResponse, createErrorResponse } from "../utils/helpers";
import { getCollection } from "../db";
import { Get, Path, Middlewares, Controller, Tags, Route } from "tsoa";
import { authMiddleware } from "../middleware/auth.middleware";
import { LogChangeDbModel } from "../types/db.types";
import { mapLogChange } from "../mappers/log.mapper";

@Route("api/v1/logs")
@Tags("Logs")
export class LogController extends Controller {
  @Get("{id}")
  @Middlewares(authMiddleware)
  public async getUserProfile(@Path() id: string): Promise<any> {
    try {
      if (!ObjectId.isValid(id)) {
        this.setStatus(400);
        return createErrorResponse("Invalid user ID");
      }

      const logsCollection = getCollection<LogChangeDbModel>("log_change");
      const targetId = new ObjectId(id);
      const logs = await logsCollection.find({ targetId }).toArray();

      if (logs.length === 0) {
        this.setStatus(200);
        return createSuccessResponse({ logs: [] });
      }

      const result = await logsCollection
        .aggregate([
          { $match: { targetId } },
          {
            $lookup: {
              from: "users",
              localField: "lastModifiedBy",
              foreignField: "_id",
              as: "userDetails",
            },
          },
          { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 1,
              targetId: 1,
              lastModifiedBy: 1,
              collection: 1,
              message: 1,
              createdAt: 1,
              "userDetails.name": 1,
              "userDetails.email": 1,
              "userDetails.role": 1,
            },
          },
        ])
        .toArray();

      this.setStatus(200);
      return createSuccessResponse({ logs: result.map(mapLogChange) });
    } catch (error) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse("Failed to fetch logs", undefined, error);
    }
  }
}

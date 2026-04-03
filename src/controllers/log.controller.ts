import { Types } from "mongoose";
import { createSuccessResponse, createErrorResponse } from "../utils/helpers";
import { Get, Path, Middlewares, Controller, Tags, Route } from "tsoa";
import { authMiddleware } from "../middleware/auth.middleware";
import { LogChangeModel } from "../models/logChange.model";
import { mapLogChange } from "../mappers/log.mapper";
import dotenv from "dotenv";
dotenv.config();

@Route("api/v1/logs")
@Tags("Logs")
export class LogController extends Controller {
  @Get("{id}")
  @Middlewares(authMiddleware)
  public async getUserProfile(@Path() id: string): Promise<any> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        this.setStatus(400);
        return createErrorResponse("Invalid user ID");
      }

      const logs = await LogChangeModel.aggregate([
        { $match: { targetId: new Types.ObjectId(id) } },
        {
          $lookup: {
            from: "users",
            localField: "lastModifiedBy",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $unwind: {
            path: "$userDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
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
        { $sort: { createdAt: -1 } },
      ]);

      return createSuccessResponse(
        { logs: logs.map(mapLogChange) },
        "Logs fetched successfully"
      );
    } catch (error) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse("Failed to fetch logs", undefined, error);
    }
  }
}

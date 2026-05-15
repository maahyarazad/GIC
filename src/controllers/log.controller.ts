import { Types } from "mongoose";
import { createSuccessResponse, createErrorResponse } from "../utils/helpers";
import { Get, Path, Middlewares, Controller, Tags, Route } from "tsoa";
import { authMiddleware } from "../middleware/auth.middleware";
import { LogChangeModel } from "../models/logChange.model";
import dotenv from "dotenv";
dotenv.config();

@Route("api/v1/logs")
@Tags("Logs")
export class LogController extends Controller {
  @Get("{id}")
  @Middlewares(authMiddleware)
  public async getLogsByTargetId(@Path() id: string): Promise<any> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        this.setStatus(400);
        return createErrorResponse("Invalid target ID");
      }

      const targetObjectId = new Types.ObjectId(id);

      const logs = await LogChangeModel.aggregate([
        {
          $match: {
            targetId: targetObjectId,
          },
        },
        {
          $lookup: {
            from: "users", // change this if your real collection name is different
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
            userDetails: {
              _id: "$userDetails._id",
              name: "$userDetails.name",
              email: "$userDetails.email",
              role: "$userDetails.role",
            },
          },
        },
        {
          $sort: { createdAt: -1 },
        },
      ]);

      return createSuccessResponse(
        { logs },
        "Logs fetched successfully"
      );
    } catch (error) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse("Failed to fetch logs", undefined, error);
    }
  }
}
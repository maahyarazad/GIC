import { ObjectId } from "mongodb";
import { User } from "../types/user.types";
import { createSuccessResponse, createErrorResponse } from "../utils/helpers";
import { getCollection } from "../db";
import { Get, Path, Middlewares, Controller, Tags, Route } from "tsoa";
import { authMiddleware } from "../middleware/auth.middleware";
import { LogChangeModel } from "../types/base.types";
import dotenv from "dotenv";
dotenv.config();

const getDistinctLastModifiedBy = (logs: LogChangeModel[]): ObjectId[] => {
  const uniqueMap = new Map<string, ObjectId>();

  logs.forEach((log) => {
    uniqueMap.set(log.lastModifiedBy.toHexString(), log.lastModifiedBy);
  });

  return Array.from(uniqueMap.values());
};

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

      const logsCollection = getCollection<LogChangeModel>("log_change");

      const logs = await logsCollection
        .find({ targetId: new ObjectId(id) })
        .toArray();

      if (!logs) {
        this.setStatus(404);
        return createErrorResponse("logs not found");
      }
      if (logs.length === 0) {
       this.setStatus(200);
      return createSuccessResponse<{ logs: Array<any> }>({
        logs: [],
      });
      }

      const result = await logsCollection
.aggregate([
    
  {
    $lookup: {
      from: "users",
      localField: "lastModifiedBy",
      foreignField: "_id",
      as: "userDetails",
    },
  },
  { $unwind: "$userDetails" }, // flatten array
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
  
const _logs = result.filter((x) => x.targetId.toString() === id);

      this.setStatus(200);
      return createSuccessResponse<{ logs: Array<any> }>({
        logs: _logs
      });
    } catch (error) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse("Failed to update user", undefined, error);
    }
  }
}

import { Controller, Get, Middlewares, Query, Route, Tags } from "tsoa";
import { EmailLogModel, mapEmailLog } from "../models/emailLog.model";
import { adminOnlyMiddleware } from "../middleware/adminauth.middleware";
import { createSuccessResponse, createErrorResponse } from "../utils/helpers";
import { EmailLogSortKey, EmailLogStatus } from "../types/emailLog.types";

type FilterOperator = "contains" | "startsWith" | "endsWith" | "equals";

interface FilterModel {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

const allowedFilterFields = ["recipient", "subject", "kind", "runId"];
const allowedStatuses: EmailLogStatus[] = ["pending", "sent", "failed"];
const allowedSortKeys: EmailLogSortKey[] = ["createdAt", "subject", "kind", "status", "sender"];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildCondition(operator: FilterOperator, value: string): any {
  switch (operator) {
    case "contains":
      return { $regex: new RegExp(escapeRegExp(value), "i") };
    case "startsWith":
      return { $regex: new RegExp(`^${escapeRegExp(value)}`, "i") };
    case "endsWith":
      return { $regex: new RegExp(`${escapeRegExp(value)}$`, "i") };
    case "equals":
      return value;
    default:
      return null;
  }
}

@Route("api/v1/email-logs")
@Tags("Email Logs")
export class EmailLogController extends Controller {
  /** Read-only list of email log records (admin only). */
  @Get("/")
  @Middlewares(adminOnlyMiddleware)
  public async getEmailLogs(
    @Query("filters") filtersJson?: string,
    @Query() status?: string,
    @Query() from?: string,
    @Query() to?: string,
    @Query() limit: number = 20,
    @Query() skip: number = 0,
    @Query() sortBy: EmailLogSortKey = "createdAt",
    @Query() sortOrder: "asc" | "desc" = "desc"
  ): Promise<any> {
    try {
      const filterParts: any[] = [];

      if (filtersJson) {
        let filters: FilterModel[] = [];
        try {
          filters = JSON.parse(filtersJson);
        } catch {
          this.setStatus(400);
          return createErrorResponse("Invalid filters JSON");
        }
        if (!Array.isArray(filters)) {
          this.setStatus(400);
          return createErrorResponse("Invalid filters JSON");
        }

        for (const item of filters) {
          if (
            !item ||
            typeof item.field !== "string" ||
            !allowedFilterFields.includes(item.field) ||
            item.value === undefined ||
            item.value === null ||
            String(item.value) === ""
          ) {
            continue;
          }
          const condition = buildCondition(item.operator, String(item.value));
          if (condition === null) continue;

          if (item.field === "recipient") {
            filterParts.push({ $or: [{ to: condition }, { cc: condition }, { bcc: condition }] });
          } else {
            filterParts.push({ [item.field]: condition });
          }
        }
      }

      if (status) {
        if (!allowedStatuses.includes(status as EmailLogStatus)) {
          this.setStatus(400);
          return createErrorResponse("Invalid status");
        }
        filterParts.push({ status });
      }

      const fromDate = from ? new Date(from) : null;
      const toDate = to ? new Date(to) : null;
      if (
        (fromDate && isNaN(fromDate.getTime())) ||
        (toDate && isNaN(toDate.getTime())) ||
        (fromDate && toDate && fromDate >= toDate)
      ) {
        this.setStatus(400);
        return createErrorResponse("Invalid date range");
      }
      if (fromDate || toDate) {
        filterParts.push({
          createdAt: {
            ...(fromDate ? { $gte: fromDate } : {}),
            ...(toDate ? { $lt: toDate } : {}),
          },
        });
      }

      const filter: Record<string, any> = filterParts.length > 0 ? { $and: filterParts } : {};

      const limitNum = Math.min(Math.max(Number(limit) || 20, 1), 100);
      const skipNum = Math.max(Number(skip) || 0, 0);
      const sortKey: EmailLogSortKey = allowedSortKeys.includes(sortBy) ? sortBy : "createdAt";
      const direction = sortOrder === "asc" ? 1 : -1;
      const sort = { [sortKey]: direction, _id: direction } as Record<string, 1 | -1>;

      const [logs, total] = await Promise.all([
        EmailLogModel.find(filter).sort(sort).skip(skipNum).limit(limitNum).lean(),
        EmailLogModel.countDocuments(filter),
      ]);

      this.setStatus(200);
      return createSuccessResponse({
        logs: logs.map(mapEmailLog),
        total,
        page: Math.floor(skipNum / limitNum) + 1,
        limit: limitNum,
      });
    } catch (error) {
      console.error("Error fetching email logs:", error);
      this.setStatus(500);
      return createErrorResponse("Failed to fetch email logs");
    }
  }
}

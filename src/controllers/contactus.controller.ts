import {
  Controller,
  Get,
  Middlewares,
  Query,
  Route,
  Tags,
} from "tsoa";
import { ContactUsModel, mapContactUsSubmission } from "../models/contactus.model";
import { adminAuthMiddleware } from "../middleware/adminauth.middleware";
import { createErrorResponse, createSuccessResponse } from "../utils/helpers";

type FilterOperator = "contains" | "startsWith" | "endsWith" | "equals";

interface FilterModel<T> {
  field: keyof T | string;
  operator: FilterOperator;
  value: unknown;
}

type ContactUsSortKey =
  | "fullName"
  | "company"
  | "email"
  | "industry"
  | "countryOfInterest"
  | "meaObjective"
  | "referredBy"
  | "createdAt"
  | "updatedAt";

interface ContactUsFilterShape {
  fullName?: string;
  company?: string;
  email?: string;
  phone?: string;
  industry?: string;
  countryOfInterest?: string;
  meaObjective?: string;
  referredBy?: string;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

@Route("api/v1/contact-us")
@Tags("Contact Us")
export class ContactUsController extends Controller {
  @Get("/")
  @Middlewares(adminAuthMiddleware)
  public async getAllContactUsSubmissions(
    @Query("filters") filtersJson?: string,
    @Query() limit: number = 20,
    @Query() skip: number = 0,
    @Query() sortBy: ContactUsSortKey = "createdAt",
    @Query() sortOrder: "asc" | "desc" = "desc"
  ): Promise<any> {
    try {
      let filter: any = {};

      if (filtersJson) {
        let filters: FilterModel<ContactUsFilterShape>[] = [];

        try {
          filters = JSON.parse(filtersJson);
        } catch {
          this.setStatus(400);
          return createErrorResponse("Invalid filters JSON");
        }

        const allowedFilterFields = [
          "fullName",
          "company",
          "email",
          "phone",
          "industry",
          "countryOfInterest",
          "meaObjective",
          "referredBy",
        ];

        const filterParts = filters
          .filter(
            (item) =>
              item &&
              typeof item.field === "string" &&
              allowedFilterFields.includes(item.field) &&
              item.operator &&
              item.value !== undefined &&
              item.value !== null
          )
          .map(({ field, operator, value }) => {
            const safeValue = String(value);

            switch (operator) {
              case "contains":
                return {
                  [field]: {
                    $regex: new RegExp(escapeRegExp(safeValue), "i"),
                  },
                };

              case "startsWith":
                return {
                  [field]: {
                    $regex: new RegExp(`^${escapeRegExp(safeValue)}`, "i"),
                  },
                };

              case "endsWith":
                return {
                  [field]: {
                    $regex: new RegExp(`${escapeRegExp(safeValue)}$`, "i"),
                  },
                };

              case "equals":
                return {
                  [field]: safeValue,
                };

              default:
                return null;
            }
          })
          .filter(Boolean);

        filter = filterParts.length > 0 ? { $and: filterParts } : {};
      }

      const limitNum = Math.min(Math.max(Number(limit) || 20, 1), 100);
      const skipNum = Math.max(Number(skip) || 0, 0);

      const allowedSortKeys: ContactUsSortKey[] = [
        "fullName",
        "company",
        "email",
        "industry",
        "countryOfInterest",
        "meaObjective",
        "referredBy",
        "createdAt",
        "updatedAt",
      ];

      const sortKey: ContactUsSortKey = allowedSortKeys.includes(sortBy)
        ? sortBy
        : "createdAt";

      const sort = {
        [sortKey]: sortOrder === "asc" ? 1 : -1,
      } as Record<string, 1 | -1>;

      const [submissions, total] = await Promise.all([
        ContactUsModel.find(filter).sort(sort).limit(limitNum).skip(skipNum).lean(),
        ContactUsModel.countDocuments(filter),
      ]);

      this.setStatus(200);
      return createSuccessResponse(
        {
          submissions: submissions.map(mapContactUsSubmission),
          total,
          page: Math.floor(skipNum / limitNum) + 1,
          pages: Math.ceil(total / limitNum),
        },
        "Contact us submissions fetched successfully"
      );
    } catch (error) {
      console.error("Error fetching contact us submissions:", error);
      this.setStatus(500);
      return createErrorResponse("Failed to fetch contact us submissions", error);
    }
  }
}
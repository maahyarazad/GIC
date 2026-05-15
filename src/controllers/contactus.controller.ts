import {
  Controller,
  Get,
  Middlewares,
  Query,
  Route,
  Tags,
  Body,
  Post,
} from "tsoa";
import {
  ContactUsModel,
  mapContactUsSubmission,
} from "../models/contactus.model";
import { adminAuthMiddleware } from "../middleware/adminauth.middleware";
import { mapCreateUserRequestToDb } from "../mappers/user.mapper";
import bcrypt from "bcryptjs";
import { createSuccessResponse, createErrorResponse } from "../utils/helpers";
import {
  User,
  UserSortKey,
  CreateUserRequest,
  UpdateUserRequest,
} from "../types/user.types";
import { UserModel } from "../models/user.model";
import dotenv from "dotenv";
import { sendDynamicEmailToUser } from "../services/emailService";
import crypto from "crypto";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;
type FilterOperator = "contains" | "startsWith" | "endsWith" | "equals";

interface FilterModel<T> {
  field: keyof T | string;
  operator: FilterOperator;
  value: unknown;
}

interface EmailParam {
  template_name: string;
  data: Record<string, any>;
  email: string;
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

const generatePassword = (length = 20) => {
  return crypto
    .randomBytes(length)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, length);
};

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
        ContactUsModel.aggregate([
          { $match: filter },
          { $sort: sort },
          { $skip: skipNum },
          { $limit: limitNum },
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "user",
              pipeline: [
                {
                  $project: {
                    _id: 1,
                  },
                },
              ],
            },
          },
          // left join = preserve docs with no match
          { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        ]),
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
      return createErrorResponse(
        "Failed to fetch contact us submissions",
        error
      );
    }
  }

  @Post("/authorize-user")
  @Middlewares(adminAuthMiddleware)
  public async createUser(@Body() userData: CreateUserRequest): Promise<any> {
    try {
      const email = userData.email.trim().toLowerCase();
      //@ts-ignore
      const existing = await UserModel.findOne({ email }).lean();

      if (existing) {
        this.setStatus(400);
        return createErrorResponse(
          "The email you entered is already registered. Please use a different email to register.",
          "EMAIL_EXISTS"
        );
      }

      const password = generatePassword();
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await UserModel.create(
        mapCreateUserRequestToDb({ ...userData, email }, hashedPassword)
      );

      await ContactUsModel.updateOne({ email }, { $set: { userId: user._id } });

      const params: EmailParam = {
        template_name: "access_granted",
        data: {
          NAME: userData.name,
          PASSWORD: password,
          EMAIL: email,
        },
        email: email,
      };

      await sendDynamicEmailToUser(params);

      this.setStatus(201);
      return createSuccessResponse(
        {
          email: email,
          // optionally return password once (or send via email instead)
          password: password,
        },
        "User created successfully and authorized"
      );
    } catch (error: any) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse(
        error.message || "Failed to create user",
        "INTERNAL_ERROR"
      );
    }
  }
}

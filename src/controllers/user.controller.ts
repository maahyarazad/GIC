import { Types } from "mongoose";
import jwt from "jsonwebtoken";
import { tokenExpiry } from "../config/tokenConfig";
import bcrypt from "bcryptjs";
import {
  User,
  UserSortKey,
  CreateUserRequest,
  UpdateUserRequest,
} from "../types/user.types";
import {
  createSuccessResponse,
  createErrorResponse,
  escapeRegExp,
  FilterModel,
} from "../utils/helpers";
import { adminAuthMiddleware } from "../middleware/adminauth.middleware";
import {
  Controller,
  Get,
  Route,
  Post,
  Put,
  Path,
  Query,
  Body,
  SuccessResponse,
  Tags,
  Middlewares, Request
} from "tsoa";
import dotenv from "dotenv";
import { mapCreateUserRequestToDb, mapUser, mapUsers, mapUpdateUserRequestToDb } from "../mappers/user.mapper";
import { UserModel } from "../models/user.model";
import { LogChangeModel } from "../models/logChange.model";
import { Request as ExpressRequest } from "express";

export interface AuthRequest extends ExpressRequest {
  user?: User;
}
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;

@Route("api/v1/users")
@Tags("Users")
export class UserController extends Controller {
  @Get("/")
  @Middlewares(adminAuthMiddleware)
  public async getAllUsers(
    @Query("filters") filtersJson?: string,
    @Query() limit: number = 20,
    @Query() skip: number = 0,
    @Query() sortBy: UserSortKey = "name",
    @Query() sortOrder: "asc" | "desc" = "asc"
  ): Promise<any> {
    try {
      let filter: any = {};

      if (filtersJson) {
        let filters: FilterModel<User>[] = [];
        try {
          filters = JSON.parse(filtersJson);
        } catch {
          return createErrorResponse("Invalid filters JSON");
        }

        const filterParts = filters.map(({ field, operator, value }) => {
          switch (operator) {
            case "contains":
              return { [field]: { $regex: new RegExp(`${escapeRegExp(String(value))}`, "i") } };
            case "startsWith":
              return { [field]: { $regex: new RegExp(`^${escapeRegExp(String(value))}`, "i") } };
            case "endsWith":
              return { [field]: { $regex: new RegExp(`${escapeRegExp(String(value))}$`, "i") } };
            case "equals":
              return { [field]: value };
            default:
              return {};
          }
        });

        filter = filterParts.length > 0 ? { $and: filterParts } : {};
      }

      const limitNum = Math.min(Math.max(limit, 1), 100);
      const skipNum = Math.max(skip, 0);

      const allowedSortKeys: UserSortKey[] = ["name", "email", "createdAt", "role"];
      const sortKey: UserSortKey = allowedSortKeys.includes(sortBy) ? sortBy : "name";
      const sort = { [sortKey]: sortOrder === "asc" ? 1 : -1 } as Record<string, 1 | -1>;

      const [users, total] = await Promise.all([
        UserModel.find(filter).select("-password").sort(sort).limit(limitNum).skip(skipNum).lean(),
        UserModel.countDocuments(filter),
      ]);

      return createSuccessResponse(
        {
          users: mapUsers(users),
          total,
          page: Math.floor(skipNum / limitNum) + 1,
          pages: Math.ceil(total / limitNum),
        },
        "Users fetched successfully"
      );
    } catch (error) {
      console.error("Error fetching users:", error);
      return createErrorResponse("Failed to fetch users", error);
    }
  }

  @SuccessResponse("201", "Created")
  @Post("/")
  public async createUser(
    @Body() userData: CreateUserRequest
  ): Promise<{ user?: Omit<User, "password">; token?: string; error?: any }> {
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

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const newUser = await UserModel.create(
        mapCreateUserRequestToDb({ ...userData, email }, hashedPassword)
      );

      const token = jwt.sign(
        { userId: newUser._id.toString(), email: newUser.email },
        JWT_SECRET,
        { expiresIn: tokenExpiry.access.value }
      );

      this.setStatus(201);
      const safeUser = newUser.toObject();
      delete (safeUser as any).password;
      return { user: mapUser(safeUser) as Omit<User, "password">, token };
    } catch (error: any) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse(error.message || "Failed to create user", "INTERNAL_ERROR");
    }
  }

  @Get("{id}")
  @Middlewares(adminAuthMiddleware)
  public async getUserById(@Path() id: string): Promise<any> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        this.setStatus(400);
        return createErrorResponse("Invalid user ID");
      }
//@ts-ignore
      const user = await UserModel.findById(id).select("-password").lean();

      if (!user) {
        this.setStatus(404);
        return createErrorResponse("User not found");
      }

      return createSuccessResponse(mapUser(user), "User fetched successfully");
    } catch (error: any) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse(error.message || "Failed to fetch user");
    }
  }

  @Put("{id}")
  @Middlewares(adminAuthMiddleware)
  public async updateUser(
    @Path() id: string,
     @Body() body: UpdateUserRequest,
     @Request() request: AuthRequest
    ): Promise<any> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        this.setStatus(400);
        return createErrorResponse("Invalid user ID");
      }

      const updateData = mapUpdateUserRequestToDb(body);

      if (body.password) {
        updateData.password = await bcrypt.hash(body.password, 10);
      }
//@ts-ignore
      const current = await UserModel.findById(id).lean();
      if (!current) {
        this.setStatus(404);
        return createErrorResponse("User not found");
      }

      const user = await UserModel.findByIdAndUpdate(
        //@ts-ignore
        id,
        { $set: updateData },
        { new: true, lean: true, projection: { password: 0 } as any }
      );


      const token = request.cookies?.token;
      
      
          
          const decoded_token = jwt.verify(token, JWT_SECRET) as { userId: string, role: string};


      await LogChangeModel.create({
        targetId: new Types.ObjectId(id),
        lastModifiedBy: new Types.ObjectId(decoded_token.userId),
        collection: "users",
        message: body.authorize
  ? "User has been authorized"
  : "User access has been revoked",
      });

      return createSuccessResponse(mapUser(user), "User updated successfully");
    } catch (error: any) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse(error.message || "Failed to update user");
    }
  }

  @Put("{id}/authorize")
  @Middlewares(adminAuthMiddleware)
  public async authorizeUser(@Path() id: string): Promise<any> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        this.setStatus(400);
        return createErrorResponse("Invalid user ID");
      }

      const user = await UserModel.findByIdAndUpdate(
        //@ts-ignore
        id,
        { $set: { authorize: true, updatedAt: new Date() } },
        { new: true, lean: true, projection: { password: 0 } as any }
      );

      if (!user) {
        this.setStatus(404);
        return createErrorResponse("User not found");
      }

      return createSuccessResponse(mapUser(user), "User authorized successfully");
    } catch (error: any) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse(error.message || "Failed to authorize user");
    }
  }
}

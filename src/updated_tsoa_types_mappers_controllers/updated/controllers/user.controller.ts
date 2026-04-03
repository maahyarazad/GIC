import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
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
import { getCollection } from "../db";
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
  Middlewares,
  UploadedFile,
} from "tsoa";
import { sendDynamicEmailDoc } from "../services/emailService";
import { authMiddleware } from "../middleware/auth.middleware";
import path from "path";
import fs from "fs/promises";
import dotenv from "dotenv";
import { Request } from "tsoa";
import { LogChangeDbModel } from "../types/db.types";
import {
  mapCreateUserRequestToDb,
  mapUpdateUserRequestToDb,
  mapUser,
  mapUsers,
  UserDb,
} from "../mappers/user.mapper";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET!;

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
      const usersCollection = getCollection<UserDb>("users");
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
      const sort = { [sortKey]: sortOrder === "asc" ? 1 : -1 };

      const total = await usersCollection.countDocuments(filter);
      const users = await usersCollection.find(filter).sort(sort as any).limit(limitNum).skip(skipNum).project<UserDb>({ password: 0 } as any).toArray();

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
  public async createUser(@Body() userData: CreateUserRequest): Promise<any> {
    try {
      const usersCollection = getCollection<UserDb>("users");
      const email = userData.email.trim().toLowerCase();
      const existing = await usersCollection.findOne({ email });
      if (existing) {
        this.setStatus(400);
        return createErrorResponse(
          "The email you entered is already registered. Please use a different email to register.",
          "EMAIL_EXISTS"
        );
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const newUser = mapCreateUserRequestToDb({ ...userData, email }, hashedPassword);
      const result = await usersCollection.insertOne(newUser);
      const createdUser = await usersCollection.findOne({ _id: result.insertedId }, { projection: { password: 0 } });

      if (!createdUser) {
        this.setStatus(500);
        return createErrorResponse("Failed to fetch created user", "FETCH_FAILED");
      }

      const token = jwt.sign({ userId: result.insertedId.toHexString(), email: newUser.email }, JWT_SECRET, {
        expiresIn: "7d",
      });

      this.setStatus(201);
      return { user: mapUser(createdUser), token };
    } catch (error: any) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse(error.message || "Failed to create user", "INTERNAL_ERROR");
    }
  }

  @Put("/{id}")
  @Middlewares(adminAuthMiddleware)
  public async updateUser(
    @Request() req: Express.Request,
    @Path() id: string,
    @Body() updateData: UpdateUserRequest
  ): Promise<any> {
    try {
      if (!ObjectId.isValid(id)) {
        this.setStatus(400);
        return createErrorResponse("Invalid user ID");
      }

      const usersCollection = getCollection<UserDb>("users");
      const dbUpdateData = mapUpdateUserRequestToDb(updateData);
      if (dbUpdateData.password) dbUpdateData.password = await bcrypt.hash(dbUpdateData.password, 10);

      const result = await usersCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: dbUpdateData },
        { returnDocument: "after", projection: { password: 0 } }
      );

      if (!result) {
        this.setStatus(404);
        return createErrorResponse("User not found");
      }

      const token = (req as any).cookies?.token;
      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
        const logCollection = getCollection<LogChangeDbModel>("log_change");
        await logCollection.insertOne({
          targetId: new ObjectId(id),
          lastModifiedBy: new ObjectId(decoded.userId),
          collection: "users",
          message: `User Activation Updated => ${updateData.authorize ? "Authorized" : "Unauthorized"}`,
          createdAt: new Date(),
        });
      }

      if (updateData.authorize && result.email) {
        const loginLink = process.env.NODE_ENV === "PRODUCTION"
          ? `${process.env.CLIENT_ORIGIN_PROD}/login`
          : `${process.env.CLIENT_ORIGIN_DEV}/login`;

        await sendDynamicEmailDoc("account_activated", {
          USER_NAME: result.email,
          LOGIN_LINK: loginLink,
          email: result.email,
        });
      }

      this.setStatus(200);
      return createSuccessResponse({ user: mapUser(result) }, "User updated successfully");
    } catch (error) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse("Failed to update user", undefined, error);
    }
  }

  @Put("user-profile/{id}")
  @Middlewares(authMiddleware)
  public async updateUserProfile(@Path() id: string, @Body() updateData: UpdateUserRequest): Promise<any> {
    try {
      if (!ObjectId.isValid(id)) {
        this.setStatus(400);
        return createErrorResponse("Invalid user ID");
      }

      const usersCollection = getCollection<UserDb>("users");
      const dbUpdateData = mapUpdateUserRequestToDb(updateData);
      if (dbUpdateData.password) dbUpdateData.password = await bcrypt.hash(dbUpdateData.password, 10);

      const result = await usersCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: dbUpdateData },
        { returnDocument: "after", projection: { password: 0 } }
      );

      if (!result) {
        this.setStatus(404);
        return createErrorResponse("User not found");
      }

      this.setStatus(200);
      return createSuccessResponse({ user: mapUser(result) }, "User Profile updated successfully");
    } catch (error) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse("Failed to update user", undefined, error);
    }
  }

  @Get("user-profile/{id}")
  @Middlewares(authMiddleware)
  public async getUserProfile(@Path() id: string): Promise<any> {
    try {
      if (!ObjectId.isValid(id)) {
        this.setStatus(400);
        return createErrorResponse("Invalid user ID");
      }

      const usersCollection = getCollection<UserDb>("users");
      const user = await usersCollection.findOne({ _id: new ObjectId(id) }, { projection: { password: 0 } });
      if (!user) {
        this.setStatus(404);
        return createErrorResponse("User not found");
      }

      this.setStatus(200);
      return createSuccessResponse({ user: mapUser(user) });
    } catch (error) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse("Failed to fetch user", undefined, error);
    }
  }

  @Post("/{id}/upload-photo")
  public async uploadPhoto(@Path() id: string, @UploadedFile("file") file: Express.Multer.File) {
    try {
      if (!ObjectId.isValid(id)) {
        this.setStatus(400);
        return createErrorResponse("Invalid user ID");
      }
      if (!file) {
        this.setStatus(400);
        return createErrorResponse("No file uploaded");
      }

      const uploadDir = path.resolve(process.cwd(), "./uploads/photos");
      await fs.mkdir(uploadDir, { recursive: true });
      const filename = `${id}-${Date.now()}-${file.originalname}`;
      const filepath = path.join(uploadDir, filename);
      await fs.writeFile(filepath, file.buffer);

      const usersCollection = getCollection<UserDb>("users");
      const photoUrl = `/uploads/photos/${filename}`;
      const updateResult = await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { "profile.photo": photoUrl, updatedAt: new Date() } }
      );

      if (updateResult.modifiedCount === 0) {
        this.setStatus(404);
        return createErrorResponse("User not found or photo not updated");
      }

      this.setStatus(200);
      return createSuccessResponse({ photoUrl }, "Photo uploaded successfully");
    } catch (error) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse("Failed to upload photo", undefined, error);
    }
  }
}

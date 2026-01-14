import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {
  User,
  UserSortKey,
  UserFilter,
  RawUserSearchQuery,
  CreateUserRequest,
  UpdateUserRequest,
} from "../types/user.types";
import {
  Sort,
  createSuccessResponse,
  createErrorResponse,
  escapeRegExp,
  FilterModel,
} from "../utils/helpers";
import { getCollection } from "../db";
import { strictLimiter } from "../middleware/ratelimiter.middleware";
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
  FormField,
} from "tsoa";
import { sendDynamicEmailDoc } from "../services/emailService";
import { authMiddleware } from "../middleware/auth.middleware";
import path from "path";
import fs from "fs/promises";
import { cwd } from "process";
import dotenv from "dotenv";
import { Request } from "tsoa";
import {LogChangeModel} from '../types/base.types';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

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
      const usersCollection = getCollection("users");

      let filter: any = {};

      if (filtersJson) {
        let filters: FilterModel<User>[] = [];
        try {
          filters = JSON.parse(filtersJson);
        } catch {
          return createErrorResponse("Invalid filters JSON");
        }

        // Build filter object dynamically
        const filterParts = filters.map(({ field, operator, value }) => {
          switch (operator) {
            case "contains":
              // Case-insensitive regex match
              return {
                [field]: {
                  $regex: new RegExp(`${escapeRegExp(String(value))}`, "i"),
                },
              };

            case "startsWith":
              return {
                [field]: {
                  $regex: new RegExp(`^${escapeRegExp(String(value))}`, "i"),
                },
              };

            case "endsWith":
              return {
                [field]: {
                  $regex: new RegExp(`${escapeRegExp(String(value))}$`, "i"),
                },
              };

            case "equals":
              return { [field]: value };

            default:
              return {};
          }
        });

        // Combine all filters with $and (all must match)
        filter = filterParts.length > 0 ? { $and: filterParts } : {};
      }

      // Clamp limit and skip
      const limitNum = Math.min(Math.max(limit, 1), 100);
      const skipNum = Math.max(skip, 0);

      const allowedSortKeys: UserSortKey[] = [
        "name",
        "email",
        "createdAt",
        "role",
      ];
      const sortKey: UserSortKey = allowedSortKeys.includes(sortBy)
        ? sortBy
        : "name";

      const sort = { [sortKey]: sortOrder === "asc" ? 1 : -1 };

      const total = await usersCollection.countDocuments(filter);

      const users = await usersCollection
        .find(filter)
        .sort(sort as any)
        .limit(limitNum)
        .skip(skipNum)
        .project<Omit<User, "password">>({ password: 0 })
        .toArray();

      return createSuccessResponse(
        {
          users,
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

  //   @Get("/{id}")
  //   public async getUserById(
  //     @Path() id: string
  //   ): Promise<Omit<User, "password">> {
  //     try {
  //       // Validate ObjectId
  //       if (!ObjectId.isValid(id)) {
  //         this.setStatus(400);
  //         throw new Error("Invalid user ID");
  //       }

  //       const usersCollection = getCollection<User>("users");

  //       // Find user without password
  //       const user = await usersCollection.findOne(
  //         { _id: new ObjectId(id) },
  //         { projection: { password: 0 } }
  //       );

  //       if (!user) {
  //         this.setStatus(404);
  //         throw new Error("User not found");
  //       }

  //       this.setStatus(200);
  //       return user as Omit<User, "password">;
  //     } catch (error: any) {
  //       console.error(error);
  //       this.setStatus(this.getStatus() ?? 500); // keep previous or set 500
  //       throw new Error(error.message || "Failed to fetch user");
  //     }
  //   }

  @SuccessResponse("201", "Created")
  @Post("/")
  public async createUser(
    @Body() userData: CreateUserRequest
  ): Promise<{ user?: Omit<User, "password">; token?: string; error?: any }> {
    try {
      const usersCollection = getCollection<User>("users");

      // Check existing user
      const existing = await usersCollection.findOne({ email: userData.email });
      if (existing) {
        this.setStatus(400);
        return createErrorResponse(
          "The email you entered is already registered. Please use a different email to register.",
          "EMAIL_EXISTS"
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const newUser: User = {
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        password: hashedPassword,
        role: userData.role || "user",
        createdAt: new Date(),
        authorize: false,
      };

      // Insert user
      const result = await usersCollection.insertOne(newUser);

      // Fetch created user without password
      const createdUser = await usersCollection.findOne(
        { _id: result.insertedId },
        { projection: { password: 0 } }
      );

      if (!createdUser) {
        this.setStatus(500);
        return createErrorResponse(
          "Failed to fetch created user",
          "FETCH_FAILED"
        );
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: result.insertedId, email: newUser.email },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      this.setStatus(201);
      return { user: createdUser as Omit<User, "password">, token };
    } catch (error: any) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse(
        error.message || "Failed to create user",
        "INTERNAL_ERROR"
      );
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

      const usersCollection = getCollection<User>("users");

      // Hash new password if provided
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }

      updateData.updatedAt = new Date();




      const result = await usersCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        {
          $set: {...updateData},
        },
        {
          returnDocument: "after",
          projection: { password: 0 },
        }
      );

      if (!result) {
        this.setStatus(404);
        return createErrorResponse("User not found");
      }

      // Log Collection
      const token = req.cookies?.token;
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        role: string;
      };
      
      const logCollection = getCollection<LogChangeModel>("log_changes");

        await logCollection.insertOne({
            targetId: new ObjectId(id),
            lastModifiedBy: new ObjectId(decoded.userId),
            collection: "users",
            message: "User Activation Updated",
            createdAt: new Date(),
        });

      if (updateData.authorize) {
        let login_link: string;
        if (process.env.NODE_MODE === "PRODUCTION") {
          login_link = `${process.env.CLIENT_ORIGIN_PROD}/login`;
        } else {
          login_link = `${process.env.CLIENT_ORIGIN_DEV}/login`;
        }

        const params: Record<string, any> = {
          USER_NAME: updateData.email,
          LOGIN_LINK: login_link,
          email: updateData.email,
        };

        await sendDynamicEmailDoc("account_activated", params);
      }

      this.setStatus(200);
      return createSuccessResponse<{ user: Omit<User, "password"> }>(
        { user: result as Omit<User, "password"> },
        "User updated successfully"
      );
    } catch (error) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse("Failed to update user", undefined, error);
    }
  }

  @Put("user-profile/{id}")
  @Middlewares(authMiddleware)
  public async updateUserProfile(
    @Path() id: string,
    @Body() updateData: UpdateUserRequest
  ): Promise<any> {
    try {
      if (!ObjectId.isValid(id)) {
        this.setStatus(400);
        return createErrorResponse("Invalid user ID");
      }

      const usersCollection = getCollection<User>("users");

      // Hash new password if provided
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }

      updateData.updatedAt = new Date();

      const result = await usersCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        {
          returnDocument: "after",
          projection: { password: 0 },
        }
      );

      if (!result) {
        this.setStatus(404);
        return createErrorResponse("User not found");
      }

      this.setStatus(200);
      return createSuccessResponse<{ user: Omit<User, "password"> }>(
        { user: result as Omit<User, "password"> },
        "User Profile updated successfully"
      );
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

      const usersCollection = getCollection<User>("users");

      const user = await usersCollection.findOne({ _id: new ObjectId(id) });

      if (!user) {
        this.setStatus(404);
        return createErrorResponse("User not found");
      }

      this.setStatus(200);
      return createSuccessResponse<{ user: Omit<User, "password"> }>({
        user: user as Omit<User, "password">,
      });
    } catch (error) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse("Failed to update user", undefined, error);
    }
  }


  @Post("/{id}/upload-photo")
  public async uploadPhoto(
    @Path() id: string,
    @UploadedFile("file") file: Express.Multer.File
  ) {
    try {
      if (!ObjectId.isValid(id)) {
        this.setStatus(400);
        return createErrorResponse("Invalid user ID");
      }

      if (!file) {
        this.setStatus(400);
        return createErrorResponse("No file uploaded");
      }

      // Define where to save the file
      const uploadDir = path.resolve(process.cwd(), "./uploads/photos");
      await fs.mkdir(uploadDir, { recursive: true });

      // Generate unique file name or use original file name
      const filename = `${id}-${Date.now()}-${file.originalname}`;
      const filepath = path.join(uploadDir, filename);

      // Save the file from buffer (assuming multer stores it in memory)
      await fs.writeFile(filepath, file.buffer);

      // Update user's photo URL in DB (adjust URL based on your server config)
      const usersCollection = getCollection<User>("users");
      const photoUrl = `/uploads/photos/${filename}`; // Adjust base URL as needed

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

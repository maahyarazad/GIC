import {
  Controller,
  Route,
  Get,
  Tags,
  Body,
  Query,
  Post,
  SuccessResponse,
  Request,
} from "tsoa";
import jwt from "jsonwebtoken";
import { getCollection } from "../db";
import { LoginModel, User, LoginLogModel, RefreshTokenModel } from "../types/user.types";
import { Collection, ObjectId } from "mongodb";
import { createSuccessResponse, createErrorResponse, ApiResponse } from "../utils/helpers";
import * as cookie from "cookie";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { mapLoginLog, mapRefreshToken, mapUser, UserDb } from "../mappers/user.mapper";

dotenv.config();

const JWT_SECRET: string = process.env.JWT_SECRET!;
const REFRESH_SECRET: string = process.env.REFRESH_SECRET!;
const REFRESH_EXPIRE: string = process.env.REFRESH_EXPIRE!;
const ACCESS_EXPIRE: string = process.env.ACCESS_EXPIRE!;

@Route("api/v1/auth")
@Tags("Auth")
export class AuthController extends Controller {
  private static userCollection(): Collection<UserDb> {
    return getCollection<UserDb>("users");
  }

  @Get("profile")
  @SuccessResponse("200", "OK")
  public async getProfile(@Request() req: any): Promise<any> {
    try {
      const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
      const token = cookies.token;
      if (!token) return createErrorResponse("Missing token cookie");

      const payload = jwt.verify(token, JWT_SECRET) as any;
      const users = AuthController.userCollection();
      const user = await users.findOne({ _id: new ObjectId(payload.userId) }, { projection: { password: 0 } });
      if (!user) return createErrorResponse("User not found");
      return createSuccessResponse(mapUser(user), "Profile fetched successfully");
    } catch (err) {
      console.error("Profile error:", err);
      return createErrorResponse("Invalid token", "INVALID_TOKEN", err);
    }
  }

  @Get("verify-token")
  @SuccessResponse("200", "Token is valid")
  public async verifyToken(@Request() req: any): Promise<any> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return { success: false, message: "Missing Authorization header" };
      const token = authHeader.split(" ")[1];
      const payload = jwt.verify(token, JWT_SECRET);
      return { success: true, message: "Token is valid", payload };
    } catch (err) {
      console.error("Token verification error:", err);
      return { success: false, message: "Invalid token", error: err };
    }
  }

  @Post("refresh-token")
  public async refreshToken(@Request() req: any): Promise<ApiResponse<{ token: string }>> {
    try {
      const refreshCollection = getCollection<any>("refresh_tokens");
      const cookies = req.headers.cookie?.split("; ").reduce((acc: any, c: string) => {
        const [key, value] = c.split("=");
        acc[key] = value;
        return acc;
      }, {});

      const refreshToken = cookies?.refreshToken;
      if (!refreshToken) return createErrorResponse("No refresh token", "NO_TOKEN");

      const tokenDoc = await refreshCollection.findOne({ token: refreshToken });
      if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
        return createErrorResponse("Refresh token expired", "TOKEN_EXPIRED");
      }

      const payload: any = jwt.verify(refreshToken, REFRESH_SECRET);
      const usersCollection = AuthController.userCollection();
      const user = await usersCollection.findOne({ _id: new ObjectId(payload.userId) });
      if (!user) return createErrorResponse("User not found", "USER_NOT_FOUND");

      const newToken = jwt.sign({ userId: user._id!.toHexString(), role: user.role }, JWT_SECRET, {
        expiresIn: ACCESS_EXPIRE,
      });

      const isProd = process.env.NODE_ENV === "production";
      const cookieValue = [
        `token=${newToken}`,
        "HttpOnly",
        "Path=/",
        `Max-Age=${24 * 3600}`,
        `SameSite=${isProd ? "None" : "Lax"}`,
        isProd ? "Secure" : "",
      ]
        .filter(Boolean)
        .join("; ");

      this.setHeader("Set-Cookie", cookieValue);
      this.setStatus(200);
      return createSuccessResponse({ token: newToken }, "Access token refreshed");
    } catch (err: any) {
      console.error(err);
      this.setStatus(401);
      return createErrorResponse(err.message || "Invalid refresh token", "INVALID_TOKEN");
    }
  }

  @Post("login")
  public async loginUser(@Body() userData: LoginModel, @Request() req: any): Promise<ApiResponse<Omit<User, "password">>> {
    try {
      const usersCollection = AuthController.userCollection();
      const normalizedEmail = userData.userEmail?.trim().toLowerCase();

      const user = await usersCollection.findOne({
        $or: [{ name: userData.userName ?? "" }, { email: normalizedEmail ?? "" }],
      });

      if (!user) {
        this.setStatus(404);
        return createErrorResponse("User not found", "USER_NOT_FOUND");
      }

      const isPasswordCorrect = await bcrypt.compare(userData.password, user.password ?? "");
      if (!isPasswordCorrect) {
        this.setStatus(401);
        return createErrorResponse("Invalid password", "INVALID_PASSWORD");
      }

      if (!user.authorize) {
        this.setStatus(401);
        return createErrorResponse(
          "User has not been authorized by the administration. Please wait for the activation email.",
          "USER_NOT_AUTHORIZED"
        );
      }

      const loginCollection = getCollection<any>("login_log");
      await loginCollection.insertOne({
        userId: user._id,
        type: "login",
        createdAt: new Date(),
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      const token = jwt.sign({ userId: user._id!.toHexString(), role: user.role }, JWT_SECRET, {
        expiresIn: ACCESS_EXPIRE,
      });

      const refreshCollection = getCollection<any>("refresh_tokens");
      const refreshExpiryMs = req.body.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      const refreshExpirySec = Math.floor(refreshExpiryMs / 1000);

      const existingRefreshToken = await refreshCollection.findOne({
        userId: user._id,
        expiresAt: { $gte: new Date() },
      });

      let refreshToken: string;
      if (existingRefreshToken) {
        refreshToken = existingRefreshToken.token;
      } else {
        refreshToken = jwt.sign({ userId: user._id!.toHexString() }, REFRESH_SECRET, {
          expiresIn: REFRESH_EXPIRE,
        });
        await refreshCollection.insertOne({
          userId: user._id,
          token: refreshToken,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + refreshExpiryMs),
        });
      }

      const isProd = process.env.NODE_ENV === "production";
      const cookies = [
        [
          `token=${token}`,
          "HttpOnly",
          "Path=/",
          `Max-Age=${24 * 3600}`,
          `SameSite=${isProd ? "None" : "Lax"}`,
          isProd ? "Secure" : "",
        ]
          .filter(Boolean)
          .join("; "),
        [
          `refreshToken=${refreshToken}`,
          "HttpOnly",
          "Path=/",
          `Max-Age=${refreshExpirySec}`,
          `SameSite=${isProd ? "None" : "Lax"}`,
          isProd ? "Secure" : "",
        ]
          .filter(Boolean)
          .join("; "),
      ];

      this.setHeader("Set-Cookie", cookies);
      this.setStatus(200);
      const { password, ...safeUser } = user;
      return createSuccessResponse(mapUser(safeUser), "Login successful");
    } catch (error: any) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse(error.message || "Login failed", "INTERNAL_ERROR");
    }
  }
}

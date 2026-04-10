import {
  Controller,
  Route,
  Get,
  Tags,
  Body,
  Post,
  SuccessResponse,
  Request,
} from "tsoa";
import jwt from "jsonwebtoken";
import { LoginModel, User } from "../types/user.types";
import { createSuccessResponse, createErrorResponse, ApiResponse } from "../utils/helpers";
import * as cookie from "cookie";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { mapUser } from "../mappers/user.mapper";
import { LoginLogModel, RefreshTokenModel, UserModel } from "../models/user.model";

dotenv.config();

const JWT_SECRET: string = process.env.JWT_SECRET!;
const REFRESH_SECRET: string = process.env.REFRESH_SECRET!;
const REFRESH_EXPIRE: string = process.env.REFRESH_EXPIRE!;
const ACCESS_EXPIRE: string = process.env.ACCESS_EXPIRE!;

@Route("api/v1/auth")
@Tags("Auth")
export class AuthController extends Controller {
  @Get("profile")
  @SuccessResponse("200", "OK")
  public async getProfile(@Request() req: any): Promise<any> {
    try {
      const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
      const token = cookies.token;
      if (!token) return createErrorResponse("Missing token cookie");

      const payload = jwt.verify(token, JWT_SECRET) as any;
      //@ts-ignore
      const user = await UserModel.findById(payload.userId).select("-password").lean();

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
      const cookies = req.headers.cookie?.split("; ").reduce((acc: any, c: string) => {
        const [key, value] = c.split("=");
        acc[key] = value;
        return acc;
      }, {});

      const refreshToken = cookies?.refreshToken;
      if (!refreshToken) return createErrorResponse("No refresh token", "NO_TOKEN");
//@ts-ignore
      const tokenDoc = await RefreshTokenModel.findOne({ token: refreshToken }).lean();
      if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
        return createErrorResponse("Refresh token expired", "TOKEN_EXPIRED");
      }

      const payload: any = jwt.verify(refreshToken, REFRESH_SECRET);
      //@ts-ignore
      const user = await UserModel.findById(payload.userId).lean();
      if (!user) return createErrorResponse("User not found", "USER_NOT_FOUND");
//@ts-ignore
      const newToken = jwt.sign({ userId: String(user._id), role: user.role }, JWT_SECRET, {
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
      ].filter(Boolean).join("; ");

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
      const normalizedEmail = userData.userEmail?.trim().toLowerCase();

      const user = await UserModel.findOne({
        //@ts-ignore
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

      await LoginLogModel.create({
        userId: user._id,
        type: "login",
        createdAt: new Date(),
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });
//@ts-ignore
      const token = jwt.sign({ userId: String(user._id), role: user.role }, JWT_SECRET, {
        expiresIn: ACCESS_EXPIRE,
      });

      const refreshExpiryMs = req.body.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      const refreshExpirySec = Math.floor(refreshExpiryMs / 1000);

      let refreshTokenDoc = await RefreshTokenModel.findOne({
        //@ts-ignore
        userId: user._id,
        expiresAt: { $gte: new Date() },
      });

      let refreshToken: string;
      if (refreshTokenDoc) {
        refreshToken = refreshTokenDoc.token;
      } else {
        //@ts-ignore
        refreshToken = jwt.sign({ userId: String(user._id) }, REFRESH_SECRET, {
          expiresIn: REFRESH_EXPIRE,
        });

        refreshTokenDoc = await RefreshTokenModel.create({
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
        ].filter(Boolean).join("; "),
        [
          `refreshToken=${refreshToken}`,
          "HttpOnly",
          "Path=/",
          `Max-Age=${refreshExpirySec}`,
          `SameSite=${isProd ? "None" : "Lax"}`,
          isProd ? "Secure" : "",
        ].filter(Boolean).join("; "),
      ];

      this.setHeader("Set-Cookie", cookies);
      this.setStatus(200);

      const safeUser = user.toObject();
      delete (safeUser as any).password;
      return createSuccessResponse(mapUser(safeUser), "Login successful");
    } catch (error: any) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse(error.message || "Login failed", "INTERNAL_ERROR");
    }
  }
}

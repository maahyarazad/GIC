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
  Response,
  Res,
} from "tsoa";

import jwt from "jsonwebtoken";
import { getCollection } from "../db";
import { LoginModel, User } from "../types/user.types";
import { ObjectId } from "mongodb";
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
import { createSuccessResponse, createErrorResponse } from "../utils/helpers";
import { response } from "express";
const FRONTEND_URL = process.env.FRONTEND_URL!;
const FB_APP_ID = process.env.FACEBOOK_APP_ID!;
const FB_APP_SECRET = process.env.FACEBOOK_APP_SECRET!;
const FB_CALLBACK = process.env.FACEBOOK_CALLBACK_URL!;
import * as cookie from "cookie"; // npm install cookie

@Route("auth")
@Tags("Auth")
export class AuthController extends Controller {

  @Get("google/url")
  public async getGoogleAuthUrl(): Promise<{ url: string }> {
    const redirectUri = process.env.GOOGLE_CALLBACK_URL!;
    const clientId = process.env.GOOGLE_CLIENT_ID;

    const url =
      `https://accounts.google.com/o/oauth2/v2/auth` +
      `?client_id=${clientId}` +
      `&redirect_uri=${redirectUri}` +
      `&response_type=code` +
      `&scope=profile email`;

    return { url };
  }


  @Get("google/callback")
  @SuccessResponse("302", "Redirecting")
  public async googleCallback(@Query() code: string): Promise<void> {
    const users = getCollection<User>("users");

    // 1. Exchange code for access_token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();

    // 2. Get user profile
    const profileRes = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenData.access_token}`
    );

    const profile = await profileRes.json();

    // 3. Find or create user
    let user = await users.findOne({ googleId: profile.id });

    if (!user) {
      const newUser: User = {
        _id: undefined as any,
        googleId: profile.id,
        name: profile.name,
        email: profile.email,
        avatar: profile.picture,
        createdAt: new Date(),
        role: "user",
        authorize: false
      };

      const insert = await users.insertOne(newUser);
      user = { ...newUser, _id: insert.insertedId };
    }

    // 4. Sign JWT
    const token = jwt.sign({ userId: user._id, role: "user"}, JWT_SECRET, {
      expiresIn: "30d",
    });

    // 5. Set token cookie
    const isProd = process.env.NODE_ENV === "production";
    const cookie = [
      `token=${token}`,
      "HttpOnly",
      "Path=/",
      `Max-Age=${30 * 24 * 3600}`, // 30 days
      `SameSite=${isProd ? "None" : "Lax"}`,
      isProd ? "Secure" : "",
    ]
      .filter(Boolean)
      .join("; ");

    this.setHeader("Set-Cookie", cookie);

    // 6. Redirect to frontend (without token in URL)
    this.setStatus(302);
    this.setHeader("Location", `${process.env.FRONTEND_URL}/auth/success`);
  }


      @Get("facebook/url")
      public async getFacebookAuthUrl(): Promise<{ url: string }> {
      const redirectUri = process.env.FACEBOOK_CALLBACK_URL!;
      const clientId = process.env.FACEBOOK_APP_ID!;

  const scope =
    process.env.NODE_ENV !== "development"
      ? encodeURIComponent("email public_profile")
      : encodeURIComponent("public_profile");

      const url =
      `https://www.facebook.com/v19.0/dialog/oauth` +
      `?client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${scope}`;

      return { url };
      }



  @Get("facebook/callback")
  @SuccessResponse("302", "Redirecting")
  public async facebookCallback(@Query() code: string): Promise<void> {
    const users = getCollection<User>("users");

    // 1. Exchange code for token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token` +
        `?client_id=${process.env.FACEBOOK_APP_ID}` +
        `&redirect_uri=${process.env.FACEBOOK_CALLBACK_URL}` +
        `&client_secret=${process.env.FACEBOOK_APP_SECRET}` +
        `&code=${code}`
    );

    const tokenData = await tokenRes.json();

    // 2. Fetch user profile
    const profileRes = await fetch(
      `https://graph.facebook.com/me` +
        `?fields=id,name,email,picture.type(large)` +
        `&access_token=${tokenData.access_token}`
    );

    const profile = await profileRes.json();

    // 3. Find or create user
    let user = await users.findOne({ facebookId: profile.id });

    if (!user) {
      const newUser: User = {
        _id: undefined as any,
        facebookId: profile.id,
        name: profile.name,
        email: profile.email ?? null,
        avatar: profile.picture?.data?.url,
        createdAt: new Date(),
        role: "user",
        authorize: false
      };

      const insert = await users.insertOne(newUser);
      user = { ...newUser, _id: insert.insertedId };
    }

    // 4. Sign token
    const token = jwt.sign({ userId: user._id , role: "user"}, JWT_SECRET, {
      expiresIn: "30d",
    });

    const isProd = process.env.NODE_ENV === "production";
    const cookie = [
      `token=${token}`,
      "HttpOnly",
      "Path=/",
      `Max-Age=${30 * 24 * 3600}`, // 30 days
      `SameSite=${isProd ? "None" : "Lax"}`,
      isProd ? "Secure" : "",
    ]
      .filter(Boolean)
      .join("; ");

    this.setHeader("Set-Cookie", cookie);

    // 6. Redirect to frontend (without token in URL)
    this.setStatus(302);
    this.setHeader("Location", `${process.env.FRONTEND_URL}/auth/success`);
  }

  @Get("profile")
  @SuccessResponse("200", "OK")
  public async getProfile(@Request() req: any): Promise<any> {
    try {
      // Parse cookies from the cookie header
      const cookies = req.headers.cookie
        ? cookie.parse(req.headers.cookie)
        : {};

      const token = cookies.token; // name of your cookie

      if (!token) {
        return createErrorResponse("Missing token cookie");
      }

      const payload = jwt.verify(token, JWT_SECRET) as any;

      const users = getCollection<User>("users");
      const user = await users.findOne({ _id: new ObjectId(payload.userId) });

      if (!user) {
        return createErrorResponse("User not found");
      }

      return createSuccessResponse(user, "Profile fetched successfully");
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

      if (!authHeader) {
        return {
          success: false,
          message: "Missing Authorization header",
        };
      }

      const token = authHeader.split(" ")[1];
      const payload = jwt.verify(token, JWT_SECRET);

      return {
        success: true,
        message: "Token is valid",
        payload,
      };
    } catch (err) {
      console.error("Token verification error:", err);
      return {
        success: false,
        message: "Invalid token",
        error: err,
      };
    }
  }

  @Post("login")
  public async loginUser(
    @Body() userData: LoginModel
  ): Promise<{ success: boolean; user: Omit<User, "password"> }> {
    try {
      const usersCollection = getCollection<User>("users");

      // Check by username or email
      const user = await usersCollection.findOne({
        $or: [
          { name: userData.userName ?? "" },
          { email: userData.userEmail ?? "" },
        ],
      });

      if (!user) {
        this.setStatus(404);
        throw new Error("User not found");
      }

      // Sign token
      const token = jwt.sign(
        { userId: user._id.toString(),  role: user.role },
        JWT_SECRET,
        { expiresIn: "1d" }
      );

      const isProd = process.env.NODE_ENV === "production";

      // EXACT SAME AS EXPRESS — BUT AS A STRING
      const cookie = [
        `token=${token}`,
        "HttpOnly",
        "Path=/",
        `Max-Age=${24 * 3600}`,
        `SameSite=${isProd ? "None" : "Lax"}`,
        isProd ? "Secure" : "",
      ]
        .filter(Boolean)
        .join("; ");

      // TSOA-safe cookie header
      this.setHeader("Set-Cookie", cookie);

      this.setStatus(200);

      const { password, ...safeUser } = user;

      return {
        success: true,
        user: safeUser,
      };
    } catch (error: any) {
      console.error(error);
      this.setStatus(this.getStatus() ?? 500);
      throw new Error(error.message);
    }
  }

  @Post("logout")
  public async logoutUser(): Promise<{ success: boolean }> {
    try {
      const isProd = process.env.NODE_ENV === "production";

      // Clear cookie by setting an expired one
      const cookie = [
        `token=`,
        "HttpOnly",
        "Path=/",
        "Max-Age=0",
        `SameSite=${isProd ? "None" : "Lax"}`,
        isProd ? "Secure" : "",
      ]
        .filter(Boolean)
        .join("; ");

      this.setHeader("Set-Cookie", cookie);
      this.setStatus(200);

      return { success: true };
    } catch (error: any) {
      console.error(error);
      this.setStatus(this.getStatus() ?? 500);
      throw new Error(error.message);
    }
  }
}

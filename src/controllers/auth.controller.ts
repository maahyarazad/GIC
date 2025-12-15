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
import { Collection, ObjectId } from "mongodb";
import {
  createSuccessResponse,
  createErrorResponse,
  ApiResponse,
} from "../utils/helpers";
import { sendDynamicEmail } from "../services/emailService";
import * as cookie from "cookie";
import bcrypt from "bcryptjs";
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

const FRONTEND_URL = process.env.FRONTEND_URL!;
const FB_APP_ID = process.env.FACEBOOK_APP_ID!;
const FB_APP_SECRET = process.env.FACEBOOK_APP_SECRET!;
const FB_CALLBACK = process.env.FACEBOOK_CALLBACK_URL!;
@Route("auth")
@Tags("Auth")
export class AuthController extends Controller {


  private static userCollection(): Collection<User>{
    return getCollection<User>("users");
  }


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
    const users = AuthController.userCollection();

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
        authorize: false,
      };

      const insert = await users.insertOne(newUser);
      user = { ...newUser, _id: insert.insertedId };
    }

    // 4. Sign JWT
    const token = jwt.sign({ userId: user._id, role: "user" }, JWT_SECRET, {
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
    const users = AuthController.userCollection();

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
        authorize: false,
      };

      const insert = await users.insertOne(newUser);
      user = { ...newUser, _id: insert.insertedId };
    }

    // 4. Sign token
    const token = jwt.sign({ userId: user._id, role: "user" }, JWT_SECRET, {
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

      const users = AuthController.userCollection();
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
  ): Promise<ApiResponse<Omit<User, "password">>> {
    try {
      const usersCollection = AuthController.userCollection();

      // Check by username or email
      const user = await usersCollection.findOne({
        $or: [
          { name: userData.userName ?? "" },
          { email: userData.userEmail ?? "" },
        ],
      });

      if (!user) {
        this.setStatus(404);
        return createErrorResponse("User not found", "USER_NOT_FOUND");
      }

      const isPasswordCorrect = await bcrypt.compare(
        userData.password,
        user.password
      );

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


      // 🔑 Sign JWT
      const token = jwt.sign(
        { userId: user._id.toString(), role: user.role },
        JWT_SECRET,
        { expiresIn: "1d" }
      );

      const isProd = process.env.NODE_ENV === "production";

      // 🍪 Secure cookie
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

      this.setHeader("Set-Cookie", cookie);
      this.setStatus(200);

      const { password, ...safeUser } = user;

      return createSuccessResponse(safeUser, "Login successful");
    } catch (error: any) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse(
        error.message || "Login failed",
        "INTERNAL_ERROR"
      );
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

  @SuccessResponse("200", "Reset Link Sent")
  @Post("/forgot-password")
  public async resetPassword(
    @Body() body: { email: string }
  ): Promise<{ error?: any }> {
    try {
      const usersCollection = AuthController.userCollection();
      const sessionCollection = getCollection("passwordResetSessions");

      // 1. Check if user exists
      const existing = await usersCollection.findOne({ email: body.email });

      if (!existing) {
        this.setStatus(400);
        return createErrorResponse(
          "The user does not exist. Please check the email and try again.",
          "USER_NOT_FOUND"
        );
      }

      // 2. Generate secure random token
      const token = crypto.randomUUID().toString();

      // 3. Save reset session (valid for 1 hour)
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await sessionCollection.insertOne({
        userId: existing._id,
        email: existing.email,
        token: token,
        expiresAt: expiresAt,
        used: false,
      });

      let resetLink: string;
      if (process.env.NODE_MODE === "PRODUCTION") {
        resetLink = `${process.env.CLIENT_ORIGIN_PROD}/reset-password?token=${token}`;
      } else {
        resetLink = `${process.env.CLIENT_ORIGIN_DEV}/reset-password?token=${token}`;
      }

      const params: Record<string, any> = {
        email: existing.email,
        RESET_LINK: resetLink,
        USER_NAME: existing.email,
      };

      await sendDynamicEmail("reset_password", params);

      this.setStatus(200);
    } catch (error: any) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse(
        error.message || "Failed to initiate password reset",
        "INTERNAL_ERROR"
      );
    }
  }

  @Get("/verify-reset-token")
  @SuccessResponse("200", "Token Valid")
  public async verifyResetToken(@Query() token: string): Promise<any> {
    try {
      if (!token) {
        this.setStatus(400);
        return createErrorResponse("Token is required", "MISSING_TOKEN");
      }

      const sessionCollection = getCollection("passwordResetSessions");

      // Find the session by token
      const session = await sessionCollection.findOne({ token });

      if (!session) {
        this.setStatus(400);
        return createErrorResponse("Invalid reset token", "INVALID_TOKEN");
      }

      // Check expiration
      if (new Date(session.expiresAt).getTime() < Date.now()) {
        this.setStatus(400);
        return createErrorResponse("Token has expired", "TOKEN_EXPIRED");
      }

      // Check if already used
      if (session.used) {
        this.setStatus(400);
        return createErrorResponse("Token already used", "TOKEN_ALREADY_USED");
      }

      // Token valid → return user ID so the frontend can proceed
      this.setStatus(200);
      return createSuccessResponse(
        {
          valid: true,
          userId: session.userId,
          email: session.email,
        },
        "Token is valid"
      );
    } catch (error: any) {
      console.error("Token verification failed:", error);
      this.setStatus(500);
      return createErrorResponse(
        error.message || "Failed to verify token",
        "INTERNAL_ERROR"
      );
    }
  }

  @SuccessResponse("200", "Password Reset Successfully")
  @Post("/reset-password")
  public async setNewPassword(
    @Body() body: { token: string; newPassword: string }
  ): Promise<any> {
    try {
      const { token, newPassword } = body;
      if (!token || !newPassword) {
        this.setStatus(400);
        return createErrorResponse(
          "Token and new password are required",
          "VALIDATION_ERROR"
        );
      }

      const usersCollection = AuthController.userCollection();
      const sessionCollection = getCollection("passwordResetSessions");

      // 1. Find reset session
      const resetSession = await sessionCollection.findOne({ token: token });
      if (!resetSession || resetSession.used) {
        this.setStatus(400);
        return createErrorResponse(
          "Invalid or already used token",
          "INVALID_TOKEN"
        );
      }

      // 2. Check expiration
      if (resetSession.expiresAt < new Date()) {
        this.setStatus(400);
        return createErrorResponse("Token has expired", "TOKEN_EXPIRED");
      }

      // 3. Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // 4. Update user password
      await usersCollection.updateOne(
        { _id: resetSession.userId },
        { $set: { password: hashedPassword } }
      );

      // 5. Mark token as used
      await sessionCollection.updateOne(
        { token: token },
        { $set: { used: true } }
      );

      this.setStatus(200);
      return createSuccessResponse(
        undefined,
        "Password has been reset successfully"
      );
    } catch (error: any) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse(
        error.message || "Failed to reset password",
        "INTERNAL_ERROR"
      );
    }
  }
}

import { Controller, Get, Route, Tags, Request, SuccessResponse, Middlewares } from "tsoa";
import { Request as ExpressRequest } from "express";
import jwt from "jsonwebtoken";
import { createSuccessResponse, createErrorResponse } from "../utils/helpers";
import { authMiddleware } from "../middleware/auth.middleware";
import { tokenExpiry } from "../config/tokenConfig";
@Route("api/v1")
@Tags("auth")
export class SSOController extends Controller {
  @Get("sso")
  @Middlewares(authMiddleware)
  @SuccessResponse("200", "SSO token generated")
  public async getSSOToken(@Request() req: ExpressRequest): Promise<any> {
    try {
      const sessionToken = req.cookies?.token;
      if (!sessionToken) {
        this.setStatus(401);
        return createErrorResponse("Not authenticated");
      }

      let payload = null;
      try {
        payload = jwt.verify(sessionToken, process.env.JWT_SECRET!);
      } catch (err) {
        this.setStatus(401);
        return createErrorResponse("Invalid or expired session token");
      }

      const ssoToken = jwt.sign(
        {
          userId: (payload as any).userId,
          role: (payload as any).role,
          user_profile: (payload as any).user_profile,
        },
        process.env.SSO_SECRET!,
        { expiresIn: tokenExpiry.sso.value }
      );

      this.setStatus(200);
      return createSuccessResponse({ ssoToken }, "SSO token generated");
    } catch (error) {
      console.error("SSO endpoint error:", error);
      this.setStatus(500);
      return createErrorResponse(
        "Failed to generate SSO token",
        undefined,
        error
      );
    }
  }
}

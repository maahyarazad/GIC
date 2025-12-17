import { Controller, Post, Route, Body, SuccessResponse, Request, Tags } from "tsoa";
import { sendDynamicEmail, EmailOtpRequest, emailOtp } from "../services/emailService";
import smsglobal from "smsglobal";
import dotenv from "dotenv";
import { createSuccessResponse, createErrorResponse } from "../utils/helpers";
import { Session, SessionData } from "express-session";
import { getCollection } from "../db";
import { User } from "../types/user.types";


dotenv.config();
const smsglobal = require("smsglobal")(
          process.env.SMSGLOBAL_KEY,
          process.env.SMSGLOBAL_SECRET
        );

interface SendOtpBody {
  email?: string;
  mobile_number?: string;
  origin?: string;
}

interface OtpCheckBody {
  otp: string;
  registration_code?: string;
}

interface OtpCheckMobileBody {
  otp: string;
  requestId?: any;
}

const otpRequestMap = new Map<string, number>();
const otpMobileRequestMap = new Map<string, number>();

@Route("api/v1/otp")
@Tags("otp")
export class OtpController extends Controller {
  private checkLimiter(body: SendOtpBody) {
    const now = Date.now();
    const isMobile = !!body.mobile_number;
    const key = isMobile ? body.mobile_number! : body.email!;
    const map = isMobile ? otpMobileRequestMap : otpRequestMap;

    const lastTime = map.get(key);

    // limiter: allow only 1 OTP per 60 seconds
    if (lastTime && now - lastTime < 60 * 1000) {
      const remaining = Math.ceil((60 * 1000 - (now - lastTime)) / 1000);
      return { allowed: false, remaining };
    }

    return { allowed: true };
  }

  constructor() {
    super();

    setInterval(() => {
      const now = Date.now();
      [otpRequestMap, otpMobileRequestMap].forEach((map) => {
        for (const [key, lastTime] of map.entries()) {
          if (now - lastTime > 4 * 60 * 1000) map.delete(key);
        }
      });
    }, 4 * 60 * 1000);
  }

  private generateOTP(length = 5) {
    let otp = "";
    for (let i = 0; i < length; i++) otp += Math.floor(Math.random() * 10);
    return otp;
  }

  private setLimiterMap(body: SendOtpBody) {
    const now = Date.now();
    const isMobile = !!body.mobile_number;
    const key = isMobile ? body.mobile_number! : body.email || "unknown";
    const map = isMobile ? otpMobileRequestMap : otpRequestMap;
    map.set(key, now);
  }

  // -----------------------------------------
  // SEND EMAIL OTP
  // -----------------------------------------
  @Post("send-email")
  @SuccessResponse("200", "OTP sent successfully")
  public async sendOtpEmail(
    @Body() body: SendOtpBody,
    @Request() req: Express.Request
  ) {
    if (!body.email) return createErrorResponse("Email is required");

    // ---- RATE LIMIT CHECK ----
    const limit = this.checkLimiter(body);
    if (!limit.allowed) {
      this.setStatus(429);
      return createErrorResponse(
        `Please wait ${limit.remaining}s before requesting another OTP`
      );
    }

    this.setLimiterMap(body);

    const usersCollection = getCollection<User>("users");

    // Check existing user
    const existing = await usersCollection.findOne({ email: body.email });
    if (existing) {
      this.setStatus(400);
      return createErrorResponse(
        "The email you entered is already registered. Please use a different email to register.",
        "EMAIL_EXISTS"
      );
    }

    const session = req.session as SessionData & {
      otp?: string;
      otpExpires?: number;
    };
    if (session?.otp) {
      delete session?.otp;
      delete session?.otpExpires;
    }

    const otp = this.generateOTP();
    session.otp = otp;
    session.otpExpires = Date.now() + 5 * 60 * 1000;

    try {
      if (process.env.NODE_ENV === "PRODUCTION") {
        const params: Record<string, any> = {
          email: body.email,
          OTP: otp,
          event: body.origin || "Registration",
          message: `To complete your registration for`,
        };

        await sendDynamicEmail("otp_verification", params);
      }

      return createSuccessResponse(
        { otpSent: true },
        `OTP successfully sent to ${body.email}`
      );
    } catch (error: any) {
      console.error("Failed to send OTP:", error);
      return createErrorResponse(
        "Failed to send OTP",
        undefined,
        error.message
      );
    }
  }

  // -----------------------------------------
  // SEND MOBILE OTP
  // -----------------------------------------
  @Post("send-mobile")
  @SuccessResponse("200", "OTP sent successfully")
  public async sendOtpMobile(@Body() body: SendOtpBody) {
    if (!body.mobile_number)
      return createErrorResponse("Mobile number is required");
    if (!body.origin) return createErrorResponse("Origin is required");

    const limit = this.checkLimiter(body);
    if (!limit.allowed) {
      this.setStatus(429);
      return createErrorResponse(
        `Please wait ${limit.remaining}s before requesting another OTP`
      );
    }

    this.setLimiterMap(body);

    const destination = body.mobile_number.replace(/\D/g, "");
    const payload = {
        origin: 'B P',
      message: `{*code*} is your ${body.origin} verification code.`,
      destination: `+${destination}`,
      length: 5,
      codeExpiry: 300,
    };

    try {
      if (process.env.NODE_ENV === "PRODUCTION") {
        
        const response = await smsglobal.otp.send(payload);
        return createSuccessResponse(
          response.data,
          `OTP sent successfully to +${destination}`
        );
      }
      return createSuccessResponse(
        {},
        `OTP sent successfully to +${destination}`
      );
    } catch (err: any) {
      console.error("Failed to send OTP:", err);
      return createErrorResponse("Failed to send OTP", undefined, err.message);
    }
  }

  // -----------------------------------------
  // CHECK EMAIL OTP
  // -----------------------------------------
  @Post("check-email")
  public async checkOtpEmail(
    @Body() body: OtpCheckBody,
    @Request() req: Express.Request
  ) {
    const session = req.session as SessionData & {
      otp?: string;
      otpExpires?: number;
    };
    const otp = session.otp;

    if (!otp || Date.now() > session.otpExpires!) {
      return createErrorResponse("OTP has expired, please try again");
    }

    if (body.otp !== otp) {
      return createErrorResponse("Invalid OTP code");
    }

    delete session.otp;
    delete session.otpExpires;

    return createSuccessResponse({}, "Verification successful");
  }

  // -----------------------------------------
  // CHECK MOBILE OTP
  // -----------------------------------------
  @Post("check-mobile")
  public async checkOtpMobile(@Body() body: OtpCheckMobileBody) {
    try {
      if (process.env.NODE_ENV === "PRODUCTION") {
        const verifyOtp = () =>
          new Promise((resolve, reject) => {
            smsglobal.otp.verifyByRequestId(
              body.requestId,
              body.otp,
              (error: any, response: any) => {
                if (response && response.statusCode === 200)
                  return resolve(response);
                if (error) return reject(error);
                return reject(new Error(response?.status || "Unknown error"));
              }
            );
          });

        const result = await verifyOtp();
        return createSuccessResponse(result, "Verification successful");
      } else {
        return createSuccessResponse({}, "Verification successful");
      }
    } catch (err: any) {
      console.error("OTP verification failed:", err);
      return createErrorResponse(
        "OTP verification failed",
        undefined,
        err.message
      );
    }
  }
}

import { Controller, Post, Route, Body, SuccessResponse, Request } from "tsoa";
import { SendEmailParams, EmailOtpRequest, emailOtp } from "../services/emailService";
import smsglobal from "smsglobal";
import dotenv from "dotenv";
import { createSuccessResponse, createErrorResponse } from "../utils/helpers";
import { Session, SessionData } from "express-session";


// no need to import anything else for types

dotenv.config();

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
    otp_data: any;
}



@Route("otp")
export class OtpController extends Controller {
    private otpRequestMap: Map<string, number> = new Map();
    private otpMobileRequestMap: Map<string, number> = new Map();

    constructor() {
        super();

        setInterval(() => {
            const now = Date.now();
            [this.otpRequestMap, this.otpMobileRequestMap].forEach((map) => {
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
        const map = isMobile ? this.otpMobileRequestMap : this.otpRequestMap;
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

        this.setLimiterMap(body);

        const session = req.session as SessionData & { otp?: string; otpExpires?: number };
        if (session?.otp) {
            delete session?.otp;
            delete session?.otpExpires;
        }

        const otp = this.generateOTP();
        session.otp = otp;
        session.otpExpires = Date.now() + 5 * 60 * 1000;

        try {
            if (process.env.ENVIRONMENT === "PRODUCTION") {
                const params: EmailOtpRequest = {
                    email: body.email,
                    otp,
                    event: body.origin || "Registration",
                    message: `To complete your registration for`,
                };

                await emailOtp(params);
            }

            return createSuccessResponse({ otpSent: true }, `OTP successfully sent to ${body.email}`);
        } catch (error: any) {
            console.error("Failed to send OTP:", error);
            return createErrorResponse("Failed to send OTP", undefined, error.message);
        }
    }

    // -----------------------------------------
    // SEND MOBILE OTP
    // -----------------------------------------
    @Post("send-mobile")
    @SuccessResponse("200", "OTP sent successfully")
    public async sendOtpMobile(
        @Body() body: SendOtpBody
    ) {
        if (!body.mobile_number) return createErrorResponse("Mobile number is required");
        if (!body.origin) return createErrorResponse("Origin is required");

        this.setLimiterMap(body);

        const payload = {
            origin: body.origin,
            message: `{*code*} is your ${body.origin} verification code.`,
            destination: `+${body.mobile_number.replace(/\D/g, "")}`,
            length: 5,
            codeExpiry: 300,
        };

        try {
            if (process.env.ENVIRONMENT === "PRODUCTION") {
                const response = await smsglobal.otp.send(payload);
                return createSuccessResponse(response, "OTP sent successfully");
            }
            return createSuccessResponse({}, "OTP sent successfully");
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
        const session = req.session as SessionData & { otp?: string; otpExpires?: number };
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
    public async checkOtpMobile(
        @Body() body: OtpCheckMobileBody
    ) {
        try {
            const verifyOtp = () =>
                new Promise((resolve, reject) => {
                    smsglobal.otp.verifyByRequestId(
                        body.otp_data.data.requestId,
                        body.otp,
                        (error: any, response: any) => {
                            if (response && response.statusCode === 200) return resolve(response);
                            if (error) return reject(error);
                            return reject(new Error(response?.status || "Unknown error"));
                        }
                    );
                });

            const result = await verifyOtp();
            return createSuccessResponse(result, "Verification successful");
        } catch (err: any) {
            console.error("OTP verification failed:", err);
            return createErrorResponse("OTP verification failed", undefined, err.message);
        }
    }
}

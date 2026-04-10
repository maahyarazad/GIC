import { Controller, Get, Route, Tags, SuccessResponse, Request } from "tsoa";
import { Request as ExpressRequest } from "express";
import { createSuccessResponse, createErrorResponse } from "../utils/helpers";
import * as jwt from "jsonwebtoken";

@Route("api/v1")
@Tags("events")
export class EventController extends Controller {
  @Get("/events")
  @SuccessResponse("200", "Events fetched")
  public async getEvents(@Request() req: ExpressRequest): Promise<any> {
    try {
      const external_access_token = jwt.sign(
        {},
        process.env.EXTERNAL_ACCESS_SECRET,
        { expiresIn: "10s" }
      );

      const isProd = process.env.NODE_ENV === "PRODUCTION";

      const SERVICES_SERVER_ORIGIN =
        process.env.NODE_ENV === "PRODUCTION"
          ? process.env.SERVICES_SERVER_ORIGIN_PROD
          : process.env.SERVICES_SERVER_ORIGIN_DEV;

      const url = `${SERVICES_SERVER_ORIGIN}/api/registration-config?externalSource=gic`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(external_access_token
            ? { "x-access-token": external_access_token }
            : {}),
        },
      });

      if (!response.ok) {
        this.setStatus(response.status);
        return createErrorResponse("Failed to fetch events from service");
      }

      const data = await response.json();
      this.setStatus(200);
      return createSuccessResponse(data.rows, "Events fetched");
    } catch (error) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse("Failed to fetch events", undefined, error);
    }
  }

  @Get("/my-events")
  @SuccessResponse("200", "Events fetched")
  public async getMyEvents(@Request() req: ExpressRequest): Promise<any> {
    try {
      const {
        page = "1",
        pageSize = "25",
        sortField = "id",
        sortOrder = "desc",
        filter_event,
        external_source = "gms",
      } = req.query as Record<string, string>;

      const external_access_token = jwt.sign(
        {},
        process.env.EXTERNAL_ACCESS_SECRET,
        { expiresIn: "10s" }
      );

      const SERVICES_SERVER_ORIGIN =
        process.env.NODE_ENV === "PRODUCTION"
          ? process.env.SERVICES_SERVER_ORIGIN_PROD
          : process.env.SERVICES_SERVER_ORIGIN_DEV;

      const token = req.cookies?.token;

      const user = jwt.verify(token, process.env.JWT_SECRET) as {
        userId: string;
        role: string;
      };
      if (!user) {
        this.setStatus(403);
        return createErrorResponse("Unauthorized: Invalid or expired token");
      }

      const query = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sortField,
        sortOrder,
        external_source,
        //@ts-ignore
        email: user.user_profile.email,
        ...(filter_event ? { filter_event } : {}),
      }).toString();

      const url = `${SERVICES_SERVER_ORIGIN}/api/registration?${query}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(external_access_token
            ? { "x-access-token": external_access_token }
            : {}),
        },
      });

      if (!response.ok) {
        this.setStatus(response.status);
        return createErrorResponse("Failed to fetch events from service");
      }

      const data = await response.json();
      this.setStatus(200);
      return createSuccessResponse(data, "Events fetched");
    } catch (error) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse("Failed to fetch events", undefined, error);
    }
  }

  @Get("/my-events/qr")
  @SuccessResponse("200", "QR fetched")
  public async getMyEventQR(@Request() req: ExpressRequest): Promise<any> {
    try {
      const { event, event_id } = req.query as {
        event: string;
        event_id: string;
      };

      if (!event || !event_id) {
        this.setStatus(400);
        return createErrorResponse(
          "Missing query parameters: event or event_id"
        );
      }
      const external_access_token = jwt.sign(
        {},
        process.env.EXTERNAL_ACCESS_SECRET,
        { expiresIn: "10s" }
      );

      const SERVICES_SERVER_ORIGIN =
        process.env.NODE_ENV === "PRODUCTION"
          ? process.env.SERVICES_SERVER_ORIGIN_PROD
          : process.env.SERVICES_SERVER_ORIGIN_DEV;

      const url = `${SERVICES_SERVER_ORIGIN}/api/qr?event=${event}&event_id=${event_id}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(external_access_token
            ? { "x-access-token": external_access_token }
            : {}),
        },
      });

      if (!response.ok) {
        this.setStatus(response.status);
        return createErrorResponse("QR not found");
      }

      const buffer = await response.arrayBuffer();

      this.setHeader("Content-Type", "image/png");
      this.setStatus(200);

      return Buffer.from(buffer);
    } catch (error) {
      console.error(error);
      this.setStatus(401);
      return createErrorResponse("Unauthorized or invalid token");
    }
  }
}

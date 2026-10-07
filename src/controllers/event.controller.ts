import {
  Controller,
  Get,
  Middlewares,
  Path,
  Route,
  Tags,
  SuccessResponse,
  Request,
} from "tsoa";
import { Request as ExpressRequest } from "express";
import { Readable } from "stream";
import { Model } from "mongoose";
import { createSuccessResponse, createErrorResponse } from "../utils/helpers";
import { authMiddleware } from "../middleware/auth.middleware";
import { UserDocument, UserModel } from "../models/user.model";
import { toObjectId } from "../mappers/objectId.mapper";
import {
  servicesFetch,
  ServicesUnavailableError,
} from "../services/servicesServer";
import {
  Event,
  MyEventRegistration,
  ServicesRegistrationRow,
} from "../types/event.types";

const GIC_SOURCE = "gic";
const REFERENCE_PATTERN = /^[a-z0-9-]{1,64}$/;
const SERVICES_UNAVAILABLE = "Events service unavailable";

const normalizeEmail = (value: unknown): string =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const emailMatches = (rowEmail: unknown, userEmail: string): boolean =>
  !!userEmail && normalizeEmail(rowEmail) === userEmail;

// Identity comes from the user record; older access tokens carry no user_profile.
const resolveUserEmail = async (req: ExpressRequest): Promise<string> => {
  const tokenUser = (req as any).user;
  const userId = toObjectId(tokenUser?.userId);
  const user = userId
    ? await (UserModel as Model<UserDocument>).findById(userId).lean()
    : null;
  return normalizeEmail((user as any)?.email ?? tokenUser?.user_profile?.email);
};

// Services stores "YYYY-MM-DD HH:mm:ss" in UTC.
const toIsoUtc = (value: string | null): string | null => {
  if (!value) return null;
  const date = new Date(`${value.replace(" ", "T")}Z`);
  return isNaN(date.getTime()) ? null : date.toISOString();
};

const toTime = (value?: string | null): number | null => {
  if (!value) return null;
  const time = new Date(value).getTime();
  return isNaN(time) ? null : time;
};

// Event date descending (undated last), then registration date descending.
const compareRegistrations = (
  a: MyEventRegistration,
  b: MyEventRegistration
): number => {
  const aDay = toTime(a.event.event_date);
  const bDay = toTime(b.event.event_date);
  if (aDay !== bDay) {
    if (aDay === null) return 1;
    if (bDay === null) return -1;
    return bDay - aDay;
  }
  return (toTime(b.registeredAt) ?? 0) - (toTime(a.registeredAt) ?? 0);
};

const toMyEventRegistration = (
  row: ServicesRegistrationRow,
  event: Event
): MyEventRegistration => ({
  reference: row.event_id,
  registeredAt: toIsoUtc(row.metadata_createdAt),
  attendeeName: [row.firstName, row.lastName]
    .filter(Boolean)
    .join(" ")
    .trim(),
  paymentStatus: row.status ?? null,
  event: {
    page: event.page,
    title: event.title,
    event_date: event.event_date,
    event_time: event.event_time,
    event_location_name: event.event_location_name,
    Image: event.Image,
  },
});

@Route("api/v1")
@Tags("events")
export class EventController extends Controller {
  @Get("/events")
  @SuccessResponse("200", "Events fetched")
  public async getEvents(): Promise<any> {
    try {
      const response = await servicesFetch("/api/registration-config", {
        externalSource: GIC_SOURCE,
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
      if (error instanceof ServicesUnavailableError) {
        this.setStatus(502);
        return createErrorResponse(SERVICES_UNAVAILABLE);
      }
      this.setStatus(500);
      return createErrorResponse("Failed to fetch events", undefined, error);
    }
  }

  @Get("/my-events")
  @Middlewares(authMiddleware)
  @SuccessResponse("200", "My events fetched")
  public async getMyEvents(@Request() req: ExpressRequest): Promise<any> {
    try {
      const email = await resolveUserEmail(req);
      if (!email) {
        this.setStatus(401);
        return createErrorResponse("Unauthorized");
      }

      // Upstream parameters are constants: services interpolates sortField into SQL.
      const [configResponse, registrationResponse] = await Promise.all([
        servicesFetch("/api/registration-config", {
          externalSource: GIC_SOURCE,
        }),
        servicesFetch("/api/registration", {
          filterField: "email",
          filterOperator: "contains",
          filterValue: email,
          page: "1",
          pageSize: "100",
          sortField: "id",
          sortOrder: "desc",
        }),
      ]);

      if (!configResponse.ok || !registrationResponse.ok) {
        this.setStatus(502);
        return createErrorResponse(SERVICES_UNAVAILABLE);
      }

      const { rows = [] } = (await configResponse.json()) as { rows?: Event[] };
      const { data = [] } = (await registrationResponse.json()) as {
        data?: ServicesRegistrationRow[];
      };

      const gicEvents = new Map(rows.map((event) => [event.page, event]));

      // "contains" is a case-insensitive LIKE; keep exact (case-insensitive) matches only.
      const items = data
        .filter((row) => emailMatches(row.email, email) && gicEvents.has(row.event))
        .map((row) => toMyEventRegistration(row, gicEvents.get(row.event)!))
        .sort(compareRegistrations);

      this.setStatus(200);
      return createSuccessResponse(
        { items, total: items.length },
        "My events fetched"
      );
    } catch (error) {
      console.error(error);
      if (error instanceof ServicesUnavailableError) {
        this.setStatus(502);
        return createErrorResponse(SERVICES_UNAVAILABLE);
      }
      this.setStatus(500);
      return createErrorResponse("Failed to fetch my events", undefined, error);
    }
  }

  @Get("/my-events/{reference}/qr")
  @Middlewares(authMiddleware)
  @SuccessResponse("200", "QR fetched")
  public async getMyEventQr(
    @Path() reference: string,
    @Request() req: ExpressRequest
  ): Promise<any> {
    try {
      if (!REFERENCE_PATTERN.test(reference)) {
        this.setStatus(400);
        return createErrorResponse("Invalid reference");
      }

      const email = await resolveUserEmail(req);
      if (!email) {
        this.setStatus(401);
        return createErrorResponse("Unauthorized");
      }

      const registrationResponse = await servicesFetch("/api/registration", {
        event_id: reference,
        page: "1",
        pageSize: "5",
      });
      if (!registrationResponse.ok) {
        this.setStatus(502);
        return createErrorResponse(SERVICES_UNAVAILABLE);
      }

      const { data = [] } = (await registrationResponse.json()) as {
        data?: ServicesRegistrationRow[];
      };
      // The event page comes from the stored registration, never from the client.
      const registration = data.find(
        (row) => row.event_id === reference && emailMatches(row.email, email)
      );
      if (!registration) {
        this.setStatus(404);
        return createErrorResponse("Registration not found");
      }

      const qrResponse = await servicesFetch("/api/qr", {
        event: registration.event,
        event_id: reference,
      });
      if (qrResponse.status === 404) {
        this.setStatus(404);
        return createErrorResponse("QR code not available");
      }
      if (!qrResponse.ok) {
        this.setStatus(502);
        return createErrorResponse(SERVICES_UNAVAILABLE);
      }

      const buffer = Buffer.from(await qrResponse.arrayBuffer());
      this.setHeader("Content-Type", "image/png");
      this.setHeader(
        "Content-Disposition",
        `inline; filename="${reference}.png"`
      );
      this.setHeader("Cache-Control", "private, no-store");
      this.setStatus(200);
      return Readable.from(buffer);
    } catch (error) {
      console.error(error);
      if (error instanceof ServicesUnavailableError) {
        this.setStatus(502);
        return createErrorResponse(SERVICES_UNAVAILABLE);
      }
      this.setStatus(500);
      return createErrorResponse("Failed to fetch QR code", undefined, error);
    }
  }
}

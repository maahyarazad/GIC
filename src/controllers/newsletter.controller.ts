import { Controller, Route, Tags, Post, Get, Put, Delete, Body, Query, Path, Middlewares } from "tsoa";
import { Model } from "mongoose";
import {
  ApiResponse,
  createErrorResponse,
  createSuccessResponse,
  FilterModel,
} from "../utils/helpers";
import {
  NewsletterSubscriber,
  CreateNewsletterSubscriberRequest,
  BulkAddSubscribersRequest,
  BulkAddSubscribersResult,
} from "../types/newsletterSubscriber.types";
import { adminAuthMiddleware } from "../middleware/adminauth.middleware";
import { subscribeLimiter } from "../middleware/ratelimiter.middleware";
import { UserDocument, UserModel } from "../models/user.model";
import { NewsletterSubscriberModel } from "../models/newsletterSubscriber.model";
import { mapNewsletterSubscriber, mapNewsletterSubscribers } from "../mappers/newsletter.mapper";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_BULK_EMAILS = 200;

@Route("api/v1/newsletter")
@Tags("newsletter")
export class NewsletterController extends Controller {
  @Post("/")
  @Middlewares(subscribeLimiter)
  public async createSubscriber(
    @Body() body: CreateNewsletterSubscriberRequest
  ): Promise<ApiResponse<NewsletterSubscriber>> {
    try {
      const email = body.email.trim().toLowerCase();
      //@ts-ignore
      const existing = await NewsletterSubscriberModel.findOne({ email });

      if (existing?.active) {
        this.setStatus(400);
        return createErrorResponse("The email you entered is already subscribed!", "EMAIL_EXISTS");
      }

      if (existing && !existing.active) {
        existing.active = true;
        existing.updatedAt = new Date();
        await existing.save();

        this.setStatus(201);
        return createSuccessResponse(
          mapNewsletterSubscriber(existing.toObject()),
          "Subscriber re-subscribed successfully"
        );
      }

      const subscriber = await NewsletterSubscriberModel.create({
        email,
        active: body.active ?? true,
      });

      this.setStatus(201);
      return createSuccessResponse(
        mapNewsletterSubscriber(subscriber.toObject()),
        "You're now subscribed to our newsletter! You can unsubscribe anytime."
      );
    } catch (err: any) {
      this.setStatus(500);
      return createErrorResponse("Failed to create subscriber", "CREATE_ERROR", err);
    }
  }

  /** Admin: add several emails at once. New ones become active, inactive ones are re-activated. */
  @Post("admin/bulk")
  @Middlewares(adminAuthMiddleware)
  public async bulkAddSubscribers(
    @Body() body: BulkAddSubscribersRequest
  ): Promise<ApiResponse<BulkAddSubscribersResult>> {
    try {
      const raw = Array.isArray(body?.emails) ? body.emails : [];
      if (raw.length === 0) {
        this.setStatus(400);
        return createErrorResponse("Provide at least one email", "NO_EMAILS");
      }
      if (raw.length > MAX_BULK_EMAILS) {
        this.setStatus(400);
        return createErrorResponse(`Add up to ${MAX_BULK_EMAILS} emails at a time`, "TOO_MANY_EMAILS");
      }

      const valid: string[] = [];
      const invalid: string[] = [];
      const seen = new Set<string>();
      for (const item of raw) {
        const email = String(item ?? "").trim().toLowerCase();
        if (!email || seen.has(email)) continue;
        seen.add(email);
        (email.length <= 254 && EMAIL_RE.test(email) ? valid : invalid).push(email);
      }

      const existing: any[] = valid.length
        ? //@ts-ignore
          await NewsletterSubscriberModel.find({ email: { $in: valid } }).lean()
        : [];
      const existingByEmail = new Map(existing.map((d) => [d.email, d]));

      const toInsert = valid.filter((e) => !existingByEmail.has(e));
      const toReactivate = existing.filter((d) => !d.active).map((d) => d._id);

      if (toInsert.length) {
        await NewsletterSubscriberModel.insertMany(
          toInsert.map((email) => ({ email, active: true })),
          { ordered: false }
        );
      }
      if (toReactivate.length) {
        await NewsletterSubscriberModel.updateMany(
          { _id: { $in: toReactivate } },
          { $set: { active: true, updatedAt: new Date() } }
        );
      }

      return createSuccessResponse<BulkAddSubscribersResult>(
        {
          added: toInsert.length,
          reactivated: toReactivate.length,
          duplicates: existing.length - toReactivate.length,
          invalid,
        },
        "Subscribers processed"
      );
    } catch (err: any) {
      this.setStatus(500);
      return createErrorResponse("Failed to add subscribers", "BULK_ADD_ERROR", err);
    }
  }

  @Get("/")
  @Middlewares(adminAuthMiddleware)
  public async getSubscribers(
    @Query() limit: number = 10,
    @Query() skip: number = 0,
    @Query() sortBy?: keyof NewsletterSubscriber,
    @Query() sortOrder?: "asc" | "desc",
    @Query() filters?: string
  ): Promise<ApiResponse<any>> {
    try {
      const query: any = {};

      if (filters) {
        try {
          const parsed: FilterModel<NewsletterSubscriber>[] = JSON.parse(filters);

          parsed.forEach((f) => {
            switch (f.operator) {
              case "contains":
                query[f.field] = { $regex: f.value, $options: "i" };
                break;
              case "equals":
                query[f.field] = f.value;
                break;
              case "startsWith":
                query[f.field] = { $regex: `^${f.value}`, $options: "i" };
                break;
              case "endsWith":
                query[f.field] = { $regex: `${f.value}$`, $options: "i" };
                break;
            }
          });
        } catch (err) {
          console.warn("Invalid filters JSON:", err);
        }
      }

      const sort: any = {};
      if (sortBy) sort[sortBy] = sortOrder === "desc" ? -1 : 1;

      const [docs, total] = await Promise.all([
        NewsletterSubscriberModel.find(query).sort(sort).skip(skip).limit(limit).lean(),
        NewsletterSubscriberModel.countDocuments(query),
      ]);

      // Internal = the subscriber's email belongs to a registered user (derived, not stored).
      const userEmails = new Set<string>();
      if (docs.length > 0) {
        const users = await (UserModel as Model<UserDocument>)
          .find({ email: { $in: docs.map((d: any) => d.email) } })
          .select("email")
          .lean();
        users.forEach((u: any) => userEmails.add(String(u.email).toLowerCase()));
      }
      const subscribers = docs.map((d: any) =>
        mapNewsletterSubscriber(d, userEmails.has(String(d.email).toLowerCase()) ? "internal" : "external")
      );

      return createSuccessResponse(
        { subscribers, total },
        "Subscribers fetched successfully",
        {
          page: Math.floor(skip / limit) + 1,
          limit,
          total,
          pages: Math.ceil(total / limit),
        }
      );
    } catch (err: any) {
      return createErrorResponse("Failed to fetch subscribers", "FETCH_ERROR", err);
    }
  }

  @Get("email/{email}")
  public async getSubscriberByEmail(@Path() email: string): Promise<ApiResponse<any>> {
    try {
      const normalized = email.trim().toLowerCase();
      //@ts-ignore
      const subscriber = await NewsletterSubscriberModel.findOne({ email: normalized }).lean();
      // Never-subscribed is not an error: return null so the UI can render an "off" toggle.
      return createSuccessResponse(
        subscriber ? mapNewsletterSubscriber(subscriber) : null,
        "Subscriber fetched"
      );
    } catch (err: any) {
      this.setStatus(500);
      return createErrorResponse("Failed to fetch subscriber", "FETCH_ERROR", err);
    }
  }

  @Put("email/{email}")
  public async upsertSubscriberByEmail(
    @Path() email: string,
    @Body() body: { active?: boolean }
  ): Promise<ApiResponse<any>> {
    try {
      const normalized = email.trim().toLowerCase();
      const subscriber = await NewsletterSubscriberModel.findOneAndUpdate(
        //@ts-ignore
        { email: normalized },
        {
          $set: { ...(body.active !== undefined ? { active: body.active } : {}), updatedAt: new Date() },
          $setOnInsert: { email: normalized },
        },
        { new: true, upsert: true, lean: true, setDefaultsOnInsert: true }
      );

      return createSuccessResponse(
        mapNewsletterSubscriber(subscriber),
        "Subscription updated successfully"
      );
    } catch (err: any) {
      this.setStatus(500);
      return createErrorResponse("Failed to update subscription", "UPDATE_ERROR", err);
    }
  }

  @Put("{id}")
  @Middlewares(adminAuthMiddleware)
  public async updateSubscriber(@Path() id: string, @Body() body: { active?: boolean }): Promise<ApiResponse<any>> {
    try {
      const subscriber = await NewsletterSubscriberModel.findByIdAndUpdate(
        //@ts-ignore
        id,
        { $set: { ...(body.active !== undefined ? { active: body.active } : {}), updatedAt: new Date() } },
        { new: true, lean: true }
      );

      if (!subscriber) {
        this.setStatus(404);
        return createErrorResponse("Subscriber not found", "NOT_FOUND");
      }

      return createSuccessResponse(
        mapNewsletterSubscriber(subscriber),
        "Subscriber updated successfully"
      );
    } catch (err: any) {
      this.setStatus(500);
      return createErrorResponse("Failed to update subscriber", "UPDATE_ERROR", err);
    }
  }

  @Delete("{id}")
  @Middlewares(adminAuthMiddleware)
  public async deleteSubscriber(@Path() id: string): Promise<ApiResponse<null>> {
    try {
        //@ts-ignore
      const subscriber = await NewsletterSubscriberModel.findByIdAndDelete(id).lean();
      if (!subscriber) {
        this.setStatus(404);
        return createErrorResponse("Subscriber not found", "NOT_FOUND");
      }

      return createSuccessResponse(null, "Subscriber deleted successfully");
    } catch (err: any) {
      this.setStatus(500);
      return createErrorResponse("Failed to delete subscriber", "DELETE_ERROR", err);
    }
  }
}

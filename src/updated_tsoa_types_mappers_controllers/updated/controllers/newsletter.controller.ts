import {
  Controller,
  Route,
  Tags,
  Post,
  Get,
  Put,
  Body,
  Query,
  Path,
} from "tsoa";

import { getCollection } from "../db";
import { ObjectId } from "mongodb";
import {
  ApiResponse,
  createErrorResponse,
  createSuccessResponse,
  FilterModel,
} from "../utils/helpers";

import {
  NewsletterSubscriber,
  CreateNewsletterSubscriberRequest,
  UpdateNewsletterSubscriberRequest,
} from "../types/newsletterSubscriber.types";
import { mapNewsletterSubscriber, mapNewsletterSubscribers } from "../mappers/newsletter.mapper";

interface NewsletterSubscriberDb {
  _id?: ObjectId;
  email: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

@Route("api/v1/newsletter")
@Tags("newsletter")
export class NewsletterController extends Controller {
  @Post("/")
  public async createSubscriber(
    @Body() body: CreateNewsletterSubscriberRequest
  ): Promise<ApiResponse<NewsletterSubscriber>> {
    try {
      const collection = getCollection<NewsletterSubscriberDb>("newsletter_subscribers");
      const normalizedEmail = body.email.trim().toLowerCase();

      const subscriber: NewsletterSubscriberDb = {
        email: normalizedEmail,
        active: body.active ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const existing = await collection.findOne({ email: normalizedEmail });

      switch (true) {
        case Boolean(existing && existing.active):
          this.setStatus(400);
          return createErrorResponse("The email you entered is already subscribed!", "EMAIL_EXISTS");

        case Boolean(existing && !existing.active): {
          const result = await collection.findOneAndUpdate(
            { _id: existing!._id },
            { $set: { active: true, updatedAt: new Date() } },
            { returnDocument: "after" }
          );

          this.setStatus(201);
          return createSuccessResponse(mapNewsletterSubscriber(result), "Subscriber re-subscribed successfully");
        }

        default: {
          const result = await collection.insertOne(subscriber);
          this.setStatus(201);
          return createSuccessResponse(
            mapNewsletterSubscriber({ ...subscriber, _id: result.insertedId }),
            "You're now subscribed to our newsletter! You can unsubscribe anytime."
          );
        }
      }
    } catch (err: any) {
      this.setStatus(500);
      return createErrorResponse("Failed to create subscriber", "CREATE_ERROR", err);
    }
  }

  @Get("/")
  public async getSubscribers(
    @Query() limit: number = 10,
    @Query() skip: number = 0,
    @Query() sortBy?: keyof NewsletterSubscriber,
    @Query() sortOrder?: "asc" | "desc",
    @Query() filters?: string
  ): Promise<ApiResponse<any>> {
    try {
      const collection = getCollection<NewsletterSubscriberDb>("newsletter_subscribers");
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

      const total = await collection.countDocuments(query);
      const sortQuery: any = {};
      if (sortBy) sortQuery[sortBy] = sortOrder === "desc" ? -1 : 1;

      const docs = await collection.find(query).sort(sortQuery).skip(skip).limit(limit).toArray();
      const subscribers = mapNewsletterSubscribers(docs);

      return createSuccessResponse({ subscribers, total }, "Subscribers fetched successfully");
    } catch (err: any) {
      return createErrorResponse("Failed to fetch subscribers", "FETCH_ERROR", err);
    }
  }

  @Get("/{id}")
  public async getSubscriber(@Path() id: string): Promise<ApiResponse<NewsletterSubscriber>> {
    try {
      if (!ObjectId.isValid(id)) return createErrorResponse("Invalid subscriber ID", "INVALID_ID");
      const collection = getCollection<NewsletterSubscriberDb>("newsletter_subscribers");
      const subscriber = await collection.findOne({ _id: new ObjectId(id) });
      if (!subscriber) return createErrorResponse("Subscriber not found", "NOT_FOUND");
      return createSuccessResponse(mapNewsletterSubscriber(subscriber), "Subscriber fetched successfully");
    } catch (err: any) {
      return createErrorResponse("Failed to fetch subscriber", "FETCH_ERROR", err);
    }
  }

  @Get("email/{email}")
  public async getSubscriberByEmail(@Path() email: string): Promise<ApiResponse<NewsletterSubscriber>> {
    try {
      const collection = getCollection<NewsletterSubscriberDb>("newsletter_subscribers");
      const subscriber = await collection.findOne({ email: email.trim().toLowerCase() });
      if (!subscriber) return createErrorResponse("Subscriber not found", "NOT_FOUND");
      return createSuccessResponse(mapNewsletterSubscriber(subscriber), "Subscriber fetched successfully");
    } catch (err: any) {
      return createErrorResponse("Failed to fetch subscriber", "FETCH_ERROR", err);
    }
  }

  @Put("/{email}")
  public async upsertSubscriber(
    @Path() email: string,
    @Body() body: UpdateNewsletterSubscriberRequest
  ): Promise<ApiResponse<NewsletterSubscriber>> {
    try {
      const collection = getCollection<NewsletterSubscriberDb>("newsletter_subscribers");
      const now = new Date();
      const normalizedEmail = email.trim().toLowerCase();

      const result = await collection.findOneAndUpdate(
        { email: normalizedEmail },
        { $set: { ...body, updatedAt: now }, $setOnInsert: { createdAt: now, email: normalizedEmail } },
        { returnDocument: "after", upsert: true }
      );

      return createSuccessResponse(mapNewsletterSubscriber(result), "Subscriber status updated successfully");
    } catch (err: any) {
      return createErrorResponse("Failed to upsert subscriber", "UPSERT_ERROR", err);
    }
  }

  @Get("unsubscribe/{id}")
  public async unSubscribe(@Path() id: string): Promise<ApiResponse<NewsletterSubscriber>> {
    try {
      if (!ObjectId.isValid(id)) return createErrorResponse("Invalid subscriber ID", "INVALID_ID");
      const collection = getCollection<NewsletterSubscriberDb>("newsletter_subscribers");
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { active: false, updatedAt: new Date() } },
        { returnDocument: "after" }
      );

      if (!result) return createErrorResponse("Subscriber not found", "SUBSCRIBER_NOT_FOUND");
      return createSuccessResponse(mapNewsletterSubscriber(result), "Subscriber unsubscribed successfully");
    } catch (err: any) {
      return createErrorResponse("Failed to unsubscribe subscriber", "UNSUBSCRIBE_ERROR", err);
    }
  }
}

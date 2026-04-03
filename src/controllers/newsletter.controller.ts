import { Controller, Route, Tags, Post, Get, Put, Delete, Body, Query, Path } from "tsoa";
import {
  ApiResponse,
  createErrorResponse,
  createSuccessResponse,
  FilterModel,
} from "../utils/helpers";
import { NewsletterSubscriber, CreateNewsletterSubscriberRequest } from "../types/newsletterSubscriber.types";
import { NewsletterSubscriberModel } from "../models/newsletterSubscriber.model";
import { mapNewsletterSubscriber, mapNewsletterSubscribers } from "../mappers/newsletter.mapper";

@Route("api/v1/newsletter")
@Tags("newsletter")
export class NewsletterController extends Controller {
  @Post("/")
  public async createSubscriber(
    @Body() body: CreateNewsletterSubscriberRequest
  ): Promise<ApiResponse<NewsletterSubscriber>> {
    try {
      const email = body.email.trim().toLowerCase();
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

  @Get("/")
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

      return createSuccessResponse(
        { subscribers: mapNewsletterSubscribers(docs), total },
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

  @Put("{id}")
  public async updateSubscriber(@Path() id: string, @Body() body: { active?: boolean }): Promise<ApiResponse<any>> {
    try {
      const subscriber = await NewsletterSubscriberModel.findByIdAndUpdate(
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
  public async deleteSubscriber(@Path() id: string): Promise<ApiResponse<null>> {
    try {
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

import {
  Controller,
  Route,
  Tags,
  Post,
  Get,
  Put,
  Delete,
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

import { NewsletterSubscriber } from "../types/newsletterSubscriber.types";

@Route("newsletter")
@Tags("newsletter")
export class NewsletterController extends Controller {
  // Create subscriber
  @Post("/")
  public async createSubscriber(
    @Body() body: Pick<NewsletterSubscriber, "email" | "active">
  ): Promise<ApiResponse<NewsletterSubscriber>> {
    try {
      const collection = getCollection("newsletter_subscribers");

      const subscriber: NewsletterSubscriber = {
        email: body.email,
        active: body.active ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const existing = await collection.findOne({ email: body.email });

      switch (true) {
        case existing && existing.active:
          this.setStatus(400);
          return createErrorResponse(
            "The email you entered is already subscribed!",
            "EMAIL_EXISTS"
          );

        case existing && !existing.active:
             const _result = await collection.findOneAndUpdate(
                { _id: new ObjectId(existing._id) },
                { $set: {active: true, updatedAt: new Date} },
                { returnDocument: "after" }
            );

            if (!_result) {
            return createErrorResponse(
              "Failed to create subscriber",
              "CREATE_ERROR"
            );
          }

          this.setStatus(201);
          return createSuccessResponse(
            subscriber,
            "Subscriber re-subscribed successfully"
          );

        case !existing:
          const result = await collection.insertOne(subscriber);

          if (!result.acknowledged) {
            return createErrorResponse(
              "Failed to create subscriber",
              "CREATE_ERROR"
            );
          }

          this.setStatus(201);
          return createSuccessResponse(
            subscriber,
            "You're now subscribed to our newsletter! You can unsubscribe anytime."
          );
      }
    } catch (err: any) {
      this.setStatus(500);
      return createErrorResponse(
        "Failed to create subscriber",
        "CREATE_ERROR",
        err
      );
    }
  }

  // Fetch all with filtering/pagination/sorting (same as files)
  @Get("/")
  public async getSubscribers(
    @Query() limit: number = 10,
    @Query() skip: number = 0,
    @Query() sortBy?: keyof NewsletterSubscriber,
    @Query() sortOrder?: "asc" | "desc",
    @Query() filters?: string
  ): Promise<ApiResponse<any>> {
    try {
      const collection = getCollection("newsletter_subscribers");

      const query: any = {};

      // Parse filters
      if (filters) {
        try {
          const parsed: FilterModel<NewsletterSubscriber>[] =
            JSON.parse(filters);

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
      if (sortBy) {
        sortQuery[sortBy] = sortOrder === "desc" ? -1 : 1;
      }

      const docs = await collection
        .find(query)
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .toArray();

      const subscribers = docs.map((d) => ({
        _id: d._id.toHexString(),
        email: d.email,
        active: d.active,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      }));

      return createSuccessResponse(
        { subscribers, total },
        "Subscribers fetched successfully"
      );
    } catch (err: any) {
      return createErrorResponse(
        "Failed to fetch subscribers",
        "FETCH_ERROR",
        err
      );
    }
  }

  // Get one subscriber
  @Get("/{id}")
  public async getSubscriber(
    @Path() id: string
  ): Promise<ApiResponse<NewsletterSubscriber>> {
    try {
      const collection = getCollection<NewsletterSubscriber>(
        "newsletter_subscribers"
      );

      const subscriber = await collection.findOne({ _id: new ObjectId(id) });

      if (!subscriber)
        return createErrorResponse("Subscriber not found", "NOT_FOUND");

      return createSuccessResponse(
        subscriber,
        "Subscriber fetched successfully"
      );
    } catch (err: any) {
      return createErrorResponse(
        "Failed to fetch subscriber",
        "FETCH_ERROR",
        err
      );
    }
  }


    // Get one subscriber
  @Get("email/{email}")
  public async getSubscriberByEmail(
    @Path() email: string
  ): Promise<ApiResponse<NewsletterSubscriber>> {
    try {
      const collection = getCollection<NewsletterSubscriber>(
        "newsletter_subscribers"
      );

      const subscriber = await collection.findOne({ email: email });

      if (!subscriber)
        return createErrorResponse("Subscriber not found", "NOT_FOUND");

      return createSuccessResponse(
        subscriber,
        "Subscriber fetched successfully"
      );
    } catch (err: any) {
      return createErrorResponse(
        "Failed to fetch subscriber",
        "FETCH_ERROR",
        err
      );
    }
  }


  // Update subscriber
  @Put("/{id}")
  public async updateSubscriber(
    @Path() id: string,
    @Body() body: Partial<NewsletterSubscriber>
  ): Promise<ApiResponse<NewsletterSubscriber>> {
    try {
      const collection = getCollection("newsletter_subscribers");

      const updateData = {
        ...body,
        updatedAt: new Date(),
      };

      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: "after" }
      );

      if (!result)
        return createErrorResponse("Subscriber not found", "NOT_FOUND");

      return createSuccessResponse(
        undefined,
        "Subscriber updated successfully"
      );
    } catch (err: any) {
      return createErrorResponse(
        "Failed to update subscriber",
        "UPDATE_ERROR",
        err
      );
    }
  }

  // Delete subscriber
  @Delete("/{id}")
  public async deleteSubscriber(
    @Path() id: string
  ): Promise<ApiResponse<null>> {
    try {
      const collection = getCollection("newsletter_subscribers");

      const found = await collection.findOne({ _id: new ObjectId(id) });
      if (!found) {
        return createErrorResponse("Subscriber not found", "NOT_FOUND");
      }

      await collection.deleteOne({ _id: new ObjectId(id) });

      return createSuccessResponse(null, "Subscriber deleted successfully");
    } catch (err: any) {
      return createErrorResponse(
        "Failed to delete subscriber",
        "DELETE_ERROR",
        err
      );
    }
  }
}

import {
  Controller,
  Route,
  Tags,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Path,
  Middlewares,
} from "tsoa";
import {
  ApiResponse,
  createSuccessResponse,
  createErrorResponse,
} from "../utils/helpers";
import { adminAuthMiddleware } from "../middleware/adminauth.middleware";
import {
  CreateNewsletterArticleRequest,
  NewsletterArticle,
  SendTestNewsletterRequest,
  UpdateNewsletterArticleRequest,
} from "../types/newsletterArticle.types";
import { NewsletterArticleModel } from "../models/newsletterArticle.model";
import {
  mapNewsletterArticle,
  mapNewsletterArticles,
} from "../mappers/newsletterArticle.mapper";
import { sendMassDynamicEmailDoc, sendMassEmail } from "../services/emailService";

@Route("api/v1/newsletter-articles")
@Tags("newsletter-articles")
export class NewsletterArticleController extends Controller {
  @Post("/")
  @Middlewares(adminAuthMiddleware)
  public async createArticle(
    @Body() body: CreateNewsletterArticleRequest
  ): Promise<ApiResponse<NewsletterArticle>> {
    try {
      const doc = await NewsletterArticleModel.create(body);
      this.setStatus(201);
      return createSuccessResponse(
        mapNewsletterArticle(doc.toObject()),
        "Newsletter article created successfully"
      );
    } catch (err: any) {
      this.setStatus(500);
      return createErrorResponse(
        "Failed to create newsletter article",
        "CREATE_ERROR",
        err
      );
    }
  }

  @Get("/")
  @Middlewares(adminAuthMiddleware)
  public async getArticles(): Promise<ApiResponse<NewsletterArticle[]>> {
    try {
      const articles = await NewsletterArticleModel.find()
        .sort({ createdAt: -1 })
        .lean();
      return createSuccessResponse(
        mapNewsletterArticles(articles),
        "Newsletter articles fetched successfully"
      );
    } catch (err: any) {
      return createErrorResponse(
        "Failed to fetch newsletter articles",
        "FETCH_ERROR",
        err
      );
    }
  }

  @Get("{id}")
  @Middlewares(adminAuthMiddleware)
  public async getArticle(
    @Path() id: string
  ): Promise<ApiResponse<NewsletterArticle>> {
    try {
      //@ts-ignore
      const article = await NewsletterArticleModel.findById(id).lean();
      if (!article) {
        this.setStatus(404);
        return createErrorResponse("Newsletter article not found", "NOT_FOUND");
      }
      return createSuccessResponse(
        mapNewsletterArticle(article),
        "Newsletter article fetched successfully"
      );
    } catch (err: any) {
      return createErrorResponse(
        "Failed to fetch newsletter article",
        "FETCH_ERROR",
        err
      );
    }
  }

  @Put("{id}")
  @Middlewares(adminAuthMiddleware)
  public async updateArticle(
    @Path() id: string,
    @Body() body: UpdateNewsletterArticleRequest
  ): Promise<ApiResponse<NewsletterArticle>> {
    try {
      const article = await NewsletterArticleModel.findByIdAndUpdate(
        //@ts-ignore
        id,
        { $set: { ...body, updatedAt: new Date() } },
        { new: true, lean: true }
      );

      if (!article) {
        this.setStatus(404);
        return createErrorResponse("Newsletter article not found", "NOT_FOUND");
      }

      return createSuccessResponse(
        mapNewsletterArticle(article),
        "Newsletter article updated successfully"
      );
    } catch (err: any) {
      return createErrorResponse(
        "Failed to update newsletter article",
        "UPDATE_ERROR",
        err
      );
    }
  }

  @Delete("{id}")
  @Middlewares(adminAuthMiddleware)
  public async deleteArticle(
    @Path() id: string
  ): Promise<ApiResponse<null>> {
    try {
      //@ts-ignore
      const article = await NewsletterArticleModel.findByIdAndDelete(id).lean();
      if (!article) {
        this.setStatus(404);
        return createErrorResponse("Newsletter article not found", "NOT_FOUND");
      }
      return createSuccessResponse(
        null,
        "Newsletter article deleted successfully"
      );
    } catch (err: any) {
      return createErrorResponse(
        "Failed to delete newsletter article",
        "DELETE_ERROR",
        err
      );
    }
  }

  /** Send the article to a single address as a test, without touching sentAt. */
  @Post("{id}/send-test")
  @Middlewares(adminAuthMiddleware)
  public async sendTest(
    @Path() id: string,
    @Body() body: SendTestNewsletterRequest
  ): Promise<ApiResponse<null>> {
    try {
      const email = body.email?.trim();
      if (!email) {
        this.setStatus(400);
        return createErrorResponse("A test email address is required", "BAD_REQUEST");
      }

      //@ts-ignore
      const article = await NewsletterArticleModel.findById(id).lean();
      if (!article) {
        this.setStatus(404);
        return createErrorResponse("Newsletter article not found", "NOT_FOUND");
      }

      await sendMassEmail({
        recipients: [
          {
            email,
            subject: article.subject,
            htmlBody: article.html,
            textBody: article.text || "",
          },
        ],
      });

      return createSuccessResponse(null, "Test email sent successfully");
    } catch (err: any) {
      this.setStatus(500);
      return createErrorResponse("Failed to send test email", "SEND_ERROR", err);
    }
  }

  /** Send the article to all active subscribers and record the sent time. */
  @Post("{id}/send")
  @Middlewares(adminAuthMiddleware)
  public async sendToSubscribers(
    @Path() id: string
  ): Promise<ApiResponse<NewsletterArticle>> {
    try {
      //@ts-ignore
      const article = await NewsletterArticleModel.findById(id).lean();
      if (!article) {
        this.setStatus(404);
        return createErrorResponse("Newsletter article not found", "NOT_FOUND");
      }

      // sendMassDynamicEmailDoc reads subject/html/text and adds per-subscriber
      // unsubscribe tokens; the article is structurally compatible.
      await sendMassDynamicEmailDoc(article as any, {});

      const sentAt = new Date();
      await NewsletterArticleModel.findByIdAndUpdate(
        //@ts-ignore
        id,
        { $set: { sentAt, updatedAt: sentAt } },
        { new: true, lean: true }
      );

      return createSuccessResponse(
        mapNewsletterArticle({ ...article, sentAt }),
        "Newsletter sent to subscribers successfully"
      );
    } catch (err: any) {
      this.setStatus(500);
      return createErrorResponse(
        "Failed to send newsletter to subscribers",
        "SEND_ERROR",
        err
      );
    }
  }
}

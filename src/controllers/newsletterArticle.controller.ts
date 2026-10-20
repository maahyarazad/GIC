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
  Query,
  Request,
} from "tsoa";
import { Request as ExpressRequest } from "express";
import {
  ApiResponse,
  createSuccessResponse,
  createErrorResponse,
} from "../utils/helpers";
import { adminAuthMiddleware } from "../middleware/adminauth.middleware";
import { authMiddleware } from "../middleware/auth.middleware";
import { optionalAuth } from "../middleware/optionalAuth";
import {
  CreateNewsletterArticleRequest,
  NewsletterArticle,
  NewsletterPublicDetail,
  NewsletterTeaser,
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

  @Get("/studio-license-key")
  @Middlewares(adminAuthMiddleware)
  public async getStudioLicenseKey(): Promise<ApiResponse<{ licenseKey: string }>> {
    const licenseKey = process.env.GRAPESJS_LICENSE_KEY?.trim() || "DEMO_LOCALHOST_KEY";
    return createSuccessResponse({ licenseKey }, "Studio license key retrieved");
  }

  /** Published articles for the landing page: titles for everyone, previews only for signed-in users, never the HTML. */
  @Get("public")
  @Middlewares(optionalAuth)
  public async getPublicArticles(
    @Request() req: ExpressRequest,
    @Query() limit: number = 6
  ): Promise<ApiResponse<{ items: NewsletterTeaser[]; authorized: boolean }>> {
    try {
      const authorized = !!(req as any).user;
      const max = Math.min(Math.max(Math.floor(Number(limit)) || 6, 1), 24);
      //@ts-ignore
      const docs = await NewsletterArticleModel.find({ published: true })
        .sort({ sentAt: -1, createdAt: -1 })
        .limit(max)
        .select(authorized ? "title sentAt createdAt html" : "title sentAt createdAt")
        .lean();
      const items: NewsletterTeaser[] = docs.map((d: any) => ({
        id: String(d._id),
        title: d.title,
        sentAt: new Date(d.sentAt ?? d.createdAt).toISOString(),
        ...(authorized
          ? {
              preview: String(d.html ?? "")
                .replace(/<(style|script)[\s\S]*?<\/\1>/gi, " ")
                .replace(/<[^>]+>/g, " ")
                .replace(/&nbsp;/g, " ")
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 160),
            }
          : {}),
      }));
      return createSuccessResponse({ items, authorized }, "Newsletters fetched successfully");
    } catch (err: any) {
      this.setStatus(500);
      return createErrorResponse("Failed to fetch newsletters", "FETCH_ERROR", err);
    }
  }

  /** Full sent article for signed-in users. */
  @Get("public/{id}")
  @Middlewares(authMiddleware)
  public async getPublicArticle(
    @Path() id: string
  ): Promise<ApiResponse<NewsletterPublicDetail>> {
    try {
      //@ts-ignore
      const d: any = await NewsletterArticleModel.findOne({ _id: id, published: true }).lean();
      if (!d) {
        this.setStatus(404);
        return createErrorResponse("Newsletter not found", "NOT_FOUND");
      }
      return createSuccessResponse(
        {
          id: String(d._id),
          title: d.title,
          subject: d.subject,
          sentAt: new Date(d.sentAt ?? d.createdAt).toISOString(),
          html: d.html,
        },
        "Newsletter fetched successfully"
      );
    } catch (err: any) {
      this.setStatus(404);
      return createErrorResponse("Newsletter not found", "NOT_FOUND", err);
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
        sender: "info",
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
      await sendMassDynamicEmailDoc(article as any, {}, { sender: "info" });

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

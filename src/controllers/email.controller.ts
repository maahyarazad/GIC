import { Controller, Route, Tags, Post, Get, Put, Delete, Body, Path, Middlewares } from "tsoa";
import {
  ApiResponse,
  createSuccessResponse,
  createErrorResponse,
} from "../utils/helpers";
import { adminAuthMiddleware } from "../middleware/adminauth.middleware";
import { sendMassDynamicEmailDoc } from "../services/emailService";
import {
  CreateEmailTemplateRequest,
  EmailTemplate,
  UpdateEmailTemplateRequest,
} from "../types/email.types";
import { EmailTemplateModel } from "../models/emailTemplate.model";
import { mapEmailTemplate, mapEmailTemplates } from "../mappers/email.mapper";

@Route("api/v1/email-templates")
@Tags("email-templates")
export class EmailTemplateController extends Controller {
  @Post("/")
  @Middlewares(adminAuthMiddleware)
  public async createTemplate(
    @Body() body: CreateEmailTemplateRequest
  ): Promise<ApiResponse<EmailTemplate>> {
    try {
      const existing = await EmailTemplateModel.findOne({ name: body.name }).lean();
      if (existing) {
        this.setStatus(409);
        return createErrorResponse("Template name already exists", "DUPLICATE_TEMPLATE");
      }

      const doc = await EmailTemplateModel.create(body);

      return createSuccessResponse(
        mapEmailTemplate(doc.toObject()),
        "Template created successfully"
      );
    } catch (err: any) {
      return createErrorResponse("Failed to create template", "CREATE_ERROR", err);
    }
  }

  @Get("/")
  @Middlewares(adminAuthMiddleware)
  public async getTemplates(): Promise<ApiResponse<EmailTemplate[]>> {
    try {
      const templates = await EmailTemplateModel.find().sort({ createdAt: -1 }).lean();
      return createSuccessResponse(mapEmailTemplates(templates), "Templates fetched successfully");
    } catch (err: any) {
      return createErrorResponse("Failed to fetch templates", "FETCH_ERROR", err);
    }
  }

  @Get("{id}")
  @Middlewares(adminAuthMiddleware)
  public async getTemplate(@Path() id: string): Promise<ApiResponse<EmailTemplate>> {
    try {
      const template = await EmailTemplateModel.findById(id).lean();
      if (!template) {
        this.setStatus(404);
        return createErrorResponse("Template not found", "NOT_FOUND");
      }

      return createSuccessResponse(mapEmailTemplate(template), "Template fetched successfully");
    } catch (err: any) {
      return createErrorResponse("Failed to fetch template", "FETCH_ERROR", err);
    }
  }

  @Put("{id}")
  @Middlewares(adminAuthMiddleware)
  public async updateTemplate(
    @Path() id: string,
    @Body() body: UpdateEmailTemplateRequest
  ): Promise<ApiResponse<EmailTemplate>> {
    try {
      const template = await EmailTemplateModel.findByIdAndUpdate(
        id,
        { $set: { ...body, updatedAt: new Date() } },
        { new: true, lean: true }
      );

      if (!template) {
        this.setStatus(404);
        return createErrorResponse("Template not found", "NOT_FOUND");
      }

      return createSuccessResponse(mapEmailTemplate(template), "Template updated successfully");
    } catch (err: any) {
      return createErrorResponse("Failed to update template", "UPDATE_ERROR", err);
    }
  }

  @Delete("{id}")
  @Middlewares(adminAuthMiddleware)
  public async deleteTemplate(@Path() id: string): Promise<ApiResponse<null>> {
    try {
      const template = await EmailTemplateModel.findByIdAndDelete(id).lean();
      if (!template) {
        this.setStatus(404);
        return createErrorResponse("Template not found", "NOT_FOUND");
      }

      return createSuccessResponse(null, "Template deleted successfully");
    } catch (err: any) {
      return createErrorResponse("Failed to delete template", "DELETE_ERROR", err);
    }
  }

  @Post("send-email-template/{id}")
  @Middlewares(adminAuthMiddleware)
  public async sendEmail(
    @Path() id: string,
    @Body() params: Record<string, unknown>
  ): Promise<ApiResponse<null>> {
    try {
      const email = await EmailTemplateModel.findById(id).lean();
      if (!email) {
        this.setStatus(404);
        return createErrorResponse("Template not found", "NOT_FOUND");
      }

      const result = await sendMassDynamicEmailDoc(email, params);

      return createSuccessResponse(
        null,
        `All batches processed. Total successful emails: ${result}`
      );
    } catch (err: any) {
      return createErrorResponse("Failed to send email template", "SEND_ERROR", err);
    }
  }
}

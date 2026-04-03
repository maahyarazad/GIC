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
import { getCollection } from "../db";
import { ObjectId, Collection } from "mongodb";
import {
  ApiResponse,
  createSuccessResponse,
  createErrorResponse,
} from "../utils/helpers";
import { adminAuthMiddleware } from "../middleware/adminauth.middleware";
import { sendMassDynamicEmailDoc } from "../services/emailService";
import {
  EmailTemplate,
  CreateEmailTemplateRequest,
  UpdateEmailTemplateRequest,
} from "../types/email.types";
import { mapEmailTemplate, mapEmailTemplates } from "../mappers/email.mapper";

interface EmailTemplateDb {
  _id?: ObjectId;
  name: string;
  subject: string;
  html: string;
  text?: string;
  variables?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

@Route("api/v1/email-templates")
@Tags("email-templates")
export class EmailTemplateController extends Controller {
  private static collection(): Collection<EmailTemplateDb> {
    return getCollection<EmailTemplateDb>("email_templates");
  }

  @Post("/")
  @Middlewares(adminAuthMiddleware)
  public async createTemplate(
    @Body() body: CreateEmailTemplateRequest
  ): Promise<ApiResponse<EmailTemplate>> {
    try {
      const collection = EmailTemplateController.collection();
      const now = new Date();
      const doc: EmailTemplateDb = { ...body, createdAt: now, updatedAt: now };
      const result = await collection.insertOne(doc);
      return createSuccessResponse(mapEmailTemplate({ ...doc, _id: result.insertedId }), "Template created successfully");
    } catch (err: any) {
      return createErrorResponse("Failed to create template", "CREATE_ERROR", err);
    }
  }

  @Get("/")
  @Middlewares(adminAuthMiddleware)
  public async getTemplates(): Promise<ApiResponse<EmailTemplate[]>> {
    try {
      const collection = EmailTemplateController.collection();
      const templates = await collection.find().toArray();
      return createSuccessResponse(mapEmailTemplates(templates), "Templates fetched successfully");
    } catch (err: any) {
      return createErrorResponse("Failed to fetch templates", "FETCH_ERROR", err);
    }
  }

  @Post("send-email-template/{id}")
  @Middlewares(adminAuthMiddleware)
  public async sendEmail(@Path() id: string, @Body() params: Partial<EmailTemplate>): Promise<ApiResponse<null>> {
    try {
      if (!ObjectId.isValid(id)) return createErrorResponse("Invalid template ID", "INVALID_ID");
      const collection = EmailTemplateController.collection();
      const email = await collection.findOne({ _id: new ObjectId(id) });
      if (!email) return createErrorResponse("Template not found", "NOT_FOUND");
      const result = await sendMassDynamicEmailDoc(email, params);
      return createSuccessResponse(null, `All batches processed. Total successful emails: ${result}`);
    } catch (err: any) {
      return createErrorResponse("Failed to send template email", "SEND_ERROR", err);
    }
  }

  @Put("/{id}")
  @Middlewares(adminAuthMiddleware)
  public async updateTemplate(
    @Path() id: string,
    @Body() body: UpdateEmailTemplateRequest
  ): Promise<ApiResponse<EmailTemplate>> {
    try {
      if (!ObjectId.isValid(id)) return createErrorResponse("Invalid template ID", "INVALID_ID");
      const collection = EmailTemplateController.collection();
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...body, updatedAt: new Date() } },
        { returnDocument: "after" }
      );
      if (!result) return createErrorResponse("Template not found", "NOT_FOUND");
      return createSuccessResponse(mapEmailTemplate(result), "Template updated successfully");
    } catch (err: any) {
      return createErrorResponse("Failed to update template", "UPDATE_ERROR", err);
    }
  }

  @Delete("/{id}")
  public async deleteTemplate(@Path() id: string): Promise<ApiResponse<null>> {
    try {
      if (!ObjectId.isValid(id)) return createErrorResponse("Invalid template ID", "INVALID_ID");
      const collection = EmailTemplateController.collection();
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      if (result.deletedCount === 0) return createErrorResponse("Template not found", "NOT_FOUND");
      return createSuccessResponse(null, "Template deleted successfully");
    } catch (err: any) {
      return createErrorResponse("Failed to delete template", "DELETE_ERROR", err);
    }
  }
}

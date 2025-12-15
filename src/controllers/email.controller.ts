import { Controller, Route, Tags, Post, Get, Put, Delete, Body, Path, Middlewares } from "tsoa";
import { getCollection } from "../db";
import { ObjectId, Collection } from "mongodb";
import {
  ApiResponse,
  createSuccessResponse,
  createErrorResponse,
} from "../utils/helpers";
import {adminAuthMiddleware} from '../middleware/adminauth.middleware';
import {sendDynamicEmailDoc, sendMassDynamicEmailDoc} from '../services/emailService'


// Interface for Email Template
export interface EmailTemplateDoc {
  
  name: string;          // Unique identifier
  subject: string;       // Subject with placeholders
  html: string;          // HTML content
  text?: string;         // Optional text version
  variables?: string[];  // Expected placeholders
  createdAt?: Date;
  updatedAt?: Date;
}

@Route("email-templates")
@Tags("email-templates")
export class EmailTemplateController extends Controller {

private static collection(): Collection<EmailTemplateDoc> {
    return getCollection<EmailTemplateDoc>("email_templates");
  }

  /** Create a new template */
  @Post("/")
  @Middlewares(adminAuthMiddleware)
  public async createTemplate(@Body() body: EmailTemplateDoc): Promise<ApiResponse<EmailTemplateDoc>> {
    try {
      

      const collection = EmailTemplateController.collection();

      const now = new Date();
      const doc: EmailTemplateDoc = {
        ...body,
        createdAt: now,
        updatedAt: now,
      };

      const result = await collection.insertOne(doc);

      return createSuccessResponse({ ...doc, _id: result.insertedId.toHexString() }, "Template created successfully");
    } catch (err: any) {
      return createErrorResponse("Failed to create template", "CREATE_ERROR", err);
    }
  }

  /** Get all templates */
  @Get("/")
  @Middlewares(adminAuthMiddleware)
  public async getTemplates(): Promise<ApiResponse<EmailTemplateDoc[]>> {
    try {
        const collection = EmailTemplateController.collection();

      const templates = await collection.find().toArray();
      const sanitized = templates.map(t => ({
        _id: t._id.toHexString(),
        name: t.name,
        subject: t.subject,
        html: t.html,
        text: t.text,
        variables: t.variables,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }));

      return createSuccessResponse(sanitized, "Templates fetched successfully");
    } catch (err: any) {
      return createErrorResponse("Failed to fetch templates", "FETCH_ERROR", err);
    }
  }


  
  @Post("/{id}")
  @Middlewares(adminAuthMiddleware)
  public async sendEmail(@Path() id: string, @Body() params: Partial<EmailTemplateDoc>): Promise<ApiResponse<null>> {
    try {
      
      const collection = EmailTemplateController.collection();
      const email = await collection.findOne({_id: new ObjectId(id)});

      const result = await sendMassDynamicEmailDoc(email, params );

      return createSuccessResponse(null, `All batches processed. Total successful emails: ${result}`);
    } catch (err: any) {
      return createErrorResponse("Failed to fetch templates", "FETCH_ERROR", err);
    }
  }

  /** Update a template by ID */
  @Put("/{id}")
  @Middlewares(adminAuthMiddleware)
  public async updateTemplate(
    @Path() id: string,
    @Body() body: Partial<EmailTemplateDoc>
  ): Promise<ApiResponse<EmailTemplateDoc>> {
    try {
            const collection = EmailTemplateController.collection();
      const updateDoc = { ...body, updatedAt: new Date() };

      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateDoc },
        { returnDocument: "after" }
      );

      if (!result) {
        return createErrorResponse("Template not found", "NOT_FOUND");
      }

      return createSuccessResponse(undefined,  "Template updated successfully");
    } catch (err: any) {
      return createErrorResponse("Failed to update template", "UPDATE_ERROR", err);
    }
  }

  /** Delete a template by ID */
  @Delete("/{id}")
  public async deleteTemplate(@Path() id: string): Promise<ApiResponse<null>> {
    try {
            const collection = EmailTemplateController.collection();
      const result = await collection.deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0) {
        return createErrorResponse("Template not found", "NOT_FOUND");
      }

      return createSuccessResponse(null, "Template deleted successfully");
    } catch (err: any) {
      return createErrorResponse("Failed to delete template", "DELETE_ERROR", err);
    }
  }
}

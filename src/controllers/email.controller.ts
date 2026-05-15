import { Controller, Route, Tags, Post, Get, Put, Delete, Body, Path, Middlewares } from "tsoa";
import {
  ApiResponse,
  createSuccessResponse,
  createErrorResponse,
} from "../utils/helpers";
import { adminAuthMiddleware } from "../middleware/adminauth.middleware";
// import { sendMassDynamicEmailDoc } from "../services/emailService";
import {
  CreateEmailTemplateRequest,
  EmailTemplate,
  UpdateEmailTemplateRequest,EmailTemplatePayload
} from "../types/email.types";
import { EmailTemplateModel } from "../models/emailTemplate.model";
import { mapEmailTemplate, mapEmailTemplates } from "../mappers/email.mapper";
import { sendDynamicEmailDoc } from "../services/emailService";
import {extractTemplateVariables} from '../utils/helpers';


@Route("api/v1/email-templates")
@Tags("email-templates")
export class EmailTemplateController extends Controller {
  @Post("/")
  @Middlewares(adminAuthMiddleware)
  public async createTemplate(
    @Body() body: CreateEmailTemplateRequest
  ): Promise<ApiResponse<EmailTemplate>> {
    try {
                    
        //@ts-ignore
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
                    //@ts-ignore
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
                    //@ts-ignore
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
                    //@ts-ignore
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

@Post("/send-email-template/:id")
@Middlewares(adminAuthMiddleware)
public async sendEmail(
  @Path() id: string,
  @Body() body: { variables: Record<string, string>; email: string }
): Promise<ApiResponse<null>> {
  try {
    //@ts-ignore
    const template = await EmailTemplateModel.findById(id).lean();

    if (!template) {
      this.setStatus(404);
      return createErrorResponse("Template not found", "NOT_FOUND");
    }

    template.variables = extractTemplateVariables(template.html);

    const { variables = {}, email } = body;

    // Build final params (merge system + user input)
    const params: Record<string, any> = {
      email,
      ...variables,
    };

    // Inject GLOBAL variables automatically
    for (const v of template.variables || []) {
      if (v.type === "G") {
        if (v.name === "CURRENT_YEAR") {
          params[v.name] = new Date().getFullYear().toString();
        }

        if (v.name === "EVENT_NAME") {
          params[v.name] = "German Industry Club";
        }

        // fallback support
        if (!params[v.name] && v.defaultValue) {
          params[v.name] = v.defaultValue;
        }
      }
    }

    // Ensure required base fields
    params.USER_NAME = params.USER_NAME || email;

    // Send email using template engine
    await sendDynamicEmailDoc(template.name, params);

    return createSuccessResponse(
      null,
      "Email sent successfully"
    );

  } catch (err: any) {
    return createErrorResponse(
      "Failed to send email template",
      "SEND_ERROR",
      err
    );
  }
}
}

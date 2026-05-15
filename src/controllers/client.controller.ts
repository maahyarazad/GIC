import {
  Controller,
  Get,
  Route,
  Tags,
  Put,
  Body,
  Path,
  Middlewares,
} from "tsoa";
import fs from "fs/promises";
import path from "path";
import { createErrorResponse, createSuccessResponse } from "../utils/helpers";
import { adminAuthMiddleware } from "../middleware/adminauth.middleware";

@Route("api/v1/client")
@Tags("client")
export class ClientController extends Controller {
  private get blueprintFilePath(): string {
    return path.join(process.cwd(), "file_storage", "client_blueprint.json");
  }

  private async ensureBlueprintFile(): Promise<void> {
    const filePath = this.blueprintFilePath;
    const dir = path.dirname(filePath);

    await fs.mkdir(dir, { recursive: true });

    try {
      await fs.access(filePath);
    } catch {
      await fs.writeFile(filePath, JSON.stringify({}, null, 2), "utf-8");
    }
  }

  @Get("/")
  public async getLargeJson(): Promise<any> {
    try {
      await this.ensureBlueprintFile();

      const filePath = this.blueprintFilePath;
      const raw = await fs.readFile(filePath, "utf-8");
      const json = raw.trim() ? JSON.parse(raw) : {};

      this.setStatus(200);
      return createSuccessResponse(json, "JSON fetched successfully");
    } catch (err: any) {
      console.error(err);
      this.setStatus(500);
      return createErrorResponse("Failed to fetch JSON file", undefined, err);
    }
  }

  @Put("/{id}")
  @Middlewares(adminAuthMiddleware)
  public async updateJson(@Body() updatedJson: any): Promise<any> {
    try {
      await this.ensureBlueprintFile();

      const { _id, ...json } = updatedJson ?? {};

      await fs.writeFile(
        this.blueprintFilePath,
        JSON.stringify(json, null, 2),
        "utf-8"
      );

      this.setStatus(200);
      return createSuccessResponse(json, "JSON updated successfully");
    } catch (err: any) {
      console.error(err);
      this.setStatus(500);
      return createErrorResponse("Failed to update JSON file", undefined, err);
    }
  }
}
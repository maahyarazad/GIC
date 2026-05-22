import { Controller, Route, Tags, Post, Get, Delete, UploadedFile, Query, Request } from "tsoa";
import { getCollection } from "../db";
import fs from "fs";
import path from "path";
import { ObjectId } from "mongodb";
import { ApiResponse, createSuccessResponse, createErrorResponse , FilterModel, escapeRegExp} from "../utils/helpers";
import mime from "mime-types";

export interface UploadedFileDoc {
  filename: string;
  mimetype: string;
  extension: string;
  path: string;
  size: number;
  createdAt: Date;
}


@Route("api/v1/files")
@Tags("files")
export class FileController extends Controller {
  @Post("/")
  public async uploadFile(
    @UploadedFile("file") file: Express.Multer.File
  ): Promise<ApiResponse<any>> {
    try {
      const collection = getCollection("uploaded_files");

      const extension = mime.extension(file.mimetype);
      if (!extension) {
        return createErrorResponse("Unsupported file type", "UPLOAD_ERROR");
      }

      const doc: UploadedFileDoc = {
        filename: file.originalname,
        mimetype: file.mimetype,
        extension: extension,
        path: file.path,
        size: file.size,
        createdAt: new Date(),
      };

      const result = await collection.insertOne(doc);

      if (result.acknowledged) {
        const targetPath = path.join(
          "file_storage",
          `${result.insertedId.toString()}.${extension}`
        );
        fs.writeFileSync(targetPath, file.buffer);

        this.setStatus(201);
        return createSuccessResponse(
          { fileId: result.insertedId.toString(), extension },
          "File created successfully"
        );
       

      }
    } catch (err: any) {
      this.setStatus(500);
      return createErrorResponse("Failed to upload file", "UPLOAD_ERROR", err);
    }
  }

  @Get("/")
  public async getFiles(
    @Query() limit: number = 10,
    @Query() skip: number = 0,
    @Query() sortBy?: keyof UploadedFileDoc,
    @Query() sortOrder?: "asc" | "desc",
    @Query() filters?: string // JSON string of FilterModel[]
  ): Promise<ApiResponse<{ files: UploadedFileDoc[]; total: number }>> {
    try {
      const collection = getCollection("uploaded_files");

      const pipeline: any[] = [];
      const matchFilters: any[] = [];

      // Apply filters
      if (filters) {
        try {
          const parsedFilters: FilterModel<UploadedFileDoc>[] =
            JSON.parse(filters);

          parsedFilters.forEach((f) => {
            const field: any = f.field;
            const value = String(f.value).trim(); // ensure string for regex

            if (field === "_id") {
              // If value is full ObjectId length (24 hex chars), treat as equals
              const isFullObjectId = /^[a-fA-F0-9]{24}$/.test(value);

              if (f.operator === "contains" && isFullObjectId) {
                try {
                  matchFilters.push({ _id: new ObjectId(value) });
                } catch {
                  console.warn("Invalid ObjectId in equals filter:", value);
                }
              } else {
                // Convert _id to string for regex operations
                switch (f.operator) {
                  case "contains":
                    pipeline.push({
                      $addFields: { _id_str: { $toString: "$_id" } },
                    });
                    matchFilters.push({
                      _id_str: { $regex: escapeRegExp(value), $options: "i" },
                    });
                    break;
                  case "startsWith":
                    pipeline.push({
                      $addFields: { _id_str: { $toString: "$_id" } },
                    });
                    matchFilters.push({
                      _id_str: {
                        $regex: `^${escapeRegExp(value)}`,
                        $options: "i",
                      },
                    });
                    break;
                  case "endsWith":
                    pipeline.push({
                      $addFields: { _id_str: { $toString: "$_id" } },
                    });
                    matchFilters.push({
                      _id_str: {
                        $regex: `${escapeRegExp(value)}$`,
                        $options: "i",
                      },
                    });
                    break;
                  case "equals":
                    try {
                      matchFilters.push({ _id: new ObjectId(value) });
                    } catch {
                      console.warn("Invalid ObjectId in equals filter:", value);
                    }
                    break;
                }
              }
            } else {
              // Regular fields
              switch (f.operator) {
                case "contains":
                  matchFilters.push({
                    [field]: { $regex: escapeRegExp(value), $options: "i" },
                  });
                  break;
                case "startsWith":
                  matchFilters.push({
                    [field]: {
                      $regex: `^${escapeRegExp(value)}`,
                      $options: "i",
                    },
                  });
                  break;
                case "endsWith":
                  matchFilters.push({
                    [field]: {
                      $regex: `${escapeRegExp(value)}$`,
                      $options: "i",
                    },
                  });
                  break;
                case "equals":
                  matchFilters.push({ [field]: f.value });
                  break;
              }
            }
          });

          if (matchFilters.length > 0) {
            pipeline.push({ $match: { $and: matchFilters } });
          }
        } catch (err) {
          console.warn("Invalid filters JSON:", err);
        }
      }

      // Apply sort
      if (sortBy) {
        pipeline.push({ $sort: { [sortBy]: sortOrder === "desc" ? -1 : 1 } });
      }

      // Pagination
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: limit });

      // Execute aggregation
      const files = await collection.aggregate(pipeline).toArray();

      // Count total (without skip/limit)
      const countPipeline = pipeline.filter(
        (stage) => !("$skip" in stage || "$limit" in stage)
      );
      countPipeline.push({ $count: "total" });
      const countResult = await collection.aggregate(countPipeline).toArray();
      const total = countResult[0]?.total || 0;

      // Sanitize files
      const sanitizedFiles: UploadedFileDoc[] = files.map((f) => ({
        _id: f._id.toHexString(),
        filename: f.filename,
        mimetype: f.mimetype,
        extension: f.extension,
        path: f.path,
        size: f.size,
        createdAt: f.createdAt,
      }));

      return createSuccessResponse(
        { files: sanitizedFiles, total },
        "Files fetched successfully",
        {
          page: Math.floor(skip / limit) + 1,
          limit,
          total,
          pages: Math.ceil(total / limit),
        }
      );
    } catch (err: any) {
      return createErrorResponse("Failed to fetch files", "FETCH_ERROR", err);
    }
  }


  @Delete("/{id}")
  public async deleteFile(id: string): Promise<ApiResponse<null>> {
    try {
      const collection = getCollection("uploaded_files");
      const file = await collection.findOne({ _id: new ObjectId(id) });

      if (!file) {
        return createErrorResponse("File not found", "NOT_FOUND");
      }

      // fs.unlinkSync(path.resolve(file.path));
      await collection.deleteOne({ _id: new ObjectId(id) });

      return createSuccessResponse(null, "File deleted successfully");
    } catch (err: any) {
      return createErrorResponse("Failed to delete file", "DELETE_ERROR", err);
    }
  }
}

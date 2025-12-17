import { Controller, Route, Tags, Post, Get, Delete, UploadedFile, Query, Request } from "tsoa";
import { getCollection } from "../db";
import fs from "fs";
import path from "path";
import { ObjectId } from "mongodb";
import { ApiResponse, createSuccessResponse, createErrorResponse , FilterModel} from "../utils/helpers";
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
        return createSuccessResponse(undefined,"File created successfully");
       

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

    const query: any = {};

    // Apply filters
    if (filters) {
      try {
        const parsedFilters: FilterModel<UploadedFileDoc>[] = JSON.parse(filters);
        parsedFilters.forEach((f) => {
          const field = f.field;
          const value = f.value;
          switch (f.operator) {
            case "contains":
              query[field] = { $regex: value, $options: "i" };
              break;
            case "equals":
              query[field] = value;
              break;
            case "startsWith":
              query[field] = { $regex: `^${value}`, $options: "i" };
              break;
            case "endsWith":
              query[field] = { $regex: `${value}$`, $options: "i" };
              break;
          }
        });
      } catch (err) {
        console.warn("Invalid filters JSON:", err);
      }
    }

    // Count total matching documents
    const total = await collection.countDocuments(query);

    // Apply sort
    let sortQuery: any = {};
    if (sortBy) {
      sortQuery[sortBy] = sortOrder === "desc" ? -1 : 1;
    }

    const files = await collection
      .find(query)
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .toArray();

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
      "Files fetched successfully"
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

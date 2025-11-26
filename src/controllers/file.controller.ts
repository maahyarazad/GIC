





import { Controller, Route, Tags, Post, Get, Delete, UploadedFile ,SuccessResponse, Request} from "tsoa";
import { getCollection } from "../db";
import fs from "fs";
import path from "path";
import { ObjectId } from "mongodb";
import {
  
  ApiResponse,
  createSuccessResponse,
  createErrorResponse,
} from "../utils/helpers";


export interface UploadedFileDoc {

  filename: string;
  mimetype: string;
  path: string;
  size: number;
  createdAt: Date;
}


@Route("files")
@Tags("files")
export class FileController extends Controller {

  @Post("/")
  public async uploadFile(
    @UploadedFile("file") file: Express.Multer.File
  ): Promise<{ doc?: UploadedFileDoc; error?: any }> {
    try {
      const collection = getCollection("uploaded_files");

      const doc: UploadedFileDoc = {
        filename: file.originalname,
        mimetype: file.mimetype,
        path: file.path,
        size: file.size,
        createdAt: new Date(),
      };

      const result = await collection.insertOne(doc);

          this.setStatus(201);
          return { doc };
      
      
    } catch (err: any) {
        this.setStatus(500);
      return createErrorResponse("Failed to upload file", "UPLOAD_ERROR", err);
    }
  }

@Get("/")
public async getFiles(): Promise<ApiResponse<UploadedFileDoc[]>> {
  try {

        const collection = getCollection("uploaded_files");

    const files = await collection.find().toArray();

    const sanitizedFiles: UploadedFileDoc[] = files.map(f => ({
      _id: f._id.toHexString(),
      filename: f.filename,
      mimetype: f.mimetype,
      path: f.path,
      size: f.size,
      createdAt: f.createdAt,
    }));

    return createSuccessResponse(sanitizedFiles, "Files fetched successfully");
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

      fs.unlinkSync(path.resolve(file.path));
      await collection.deleteOne({ _id: new ObjectId(id) });

      return createSuccessResponse(null, "File deleted successfully");
    } catch (err: any) {
      return createErrorResponse("Failed to delete file", "DELETE_ERROR", err);
    }
  }
}

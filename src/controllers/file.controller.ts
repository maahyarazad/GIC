// import { Controller, Route, Tags, Post, Get, Delete, UploadedFile } from "tsoa";
// import { getCollection } from "../db";
// import fs from "fs";
// import path from "path";

// @Route("files")
// @Tags("files")
// export class FileController extends Controller {
//   @Post("/")
//   public async uploadFile(
//     @UploadedFile("file") file: Express.Multer.File
//   ): Promise<any> {
//     const collection = getCollection("uploaded_files");

//     const doc = {
//       filename: file.originalname,
//       mimetype: file.mimetype,
//       path: file.path,
//       size: file.size,
//       createdAt: new Date()
//     };

//     await collection.insertOne(doc);
//     return { success: true, data: doc };
//   }

//   @Get("/")
//   public async getFiles() {
//     const collection = getCollection("uploaded_files");
//     const files = await collection.find().toArray();
//     return { success: true, data: files };
//   }

//   @Delete("/{id}")
//   public async deleteFile(id: string) {
//     const collection = getCollection("uploaded_files");
//     const file = await collection.findOne({ _id: new ObjectId(id) });

//     if (!file) return { success: false, message: "Not found" };

//     fs.unlinkSync(path.resolve(file.path));
//     await collection.deleteOne({ _id: new ObjectId(id) });

//     return { success: true };
//   }
// }

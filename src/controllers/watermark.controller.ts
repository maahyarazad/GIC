import { getCollection } from "../db.js";
import { User } from "../types/user.types.js";
import { ObjectId } from "mongodb";
import { addWatermark } from "../services/watermarkService.js";
import path from "path";
import fs from "fs";
import { Application } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import dotenv from "dotenv";
import { Product } from "../types/product.types";
dotenv.config();
import jwt from "jsonwebtoken";
import {LogChangeModel} from '../types/base.types';

const JWT_SECRET = process.env.JWT_SECRET;

export function RegisterFileDownloadRoutes(app: Application) {
  app.get("/api/v1/watermark/:fileId", authMiddleware, async (req, res) => {
    try {
      const productCollection = getCollection<Product>("products");
      const fileId = req.params.fileId;

      const __dirname = path.resolve();
      const token = req.cookies?.token;

      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }

      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        role: string;
      };

      const usersCollection = getCollection<User>("users");
      const user = await usersCollection.findOne({
                    //@ts-ignore
        _id: new ObjectId(decoded.userId),
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const version = process.env.PDF_WATERMARK_VERSION;

      const inputPath = path.resolve(
        __dirname,
        "file_storage",
        `${fileId}.pdf`
      );

      const outputPath = path.resolve(
        __dirname,
        `uploads/${decoded.userId}.pdf`
      );

      const fullname =
        user.name === "" ? user.email.split("@") : user.name.split("@");
      const uniqueIndex = `Confidential Black File [informal, not Official]  ${fullname[0]}`;

      await addWatermark(inputPath, outputPath, uniqueIndex);

      const product = await productCollection.findOne({ fileId: fileId });

      const updateData: Partial<Product> = {
        ...product,
        updatedAt: new Date(),
        downloadCount: product.downloadCount + 1,
      };

      const result = await productCollection.updateOne(
                    //@ts-ignore
        { _id: new ObjectId(product._id) },
        { $set: updateData }
      );

      const logCollection = getCollection<LogChangeModel>("log_change");
      
        await logCollection.insertOne({
            //@ts-ignore
            targetId: new ObjectId(product._id),
            //@ts-ignore
            lastModifiedBy: new ObjectId(decoded.userId),
            collection: "products",
            message: `${JSON.stringify(product)}`,
            createdAt: new Date(),
        });


      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${decoded.userId}.pdf"`
      );

      const stream = fs.createReadStream(outputPath);
      //CLEANUP handlers — AFTER stream exists
      req.on("aborted", () => stream.destroy());
      res.on("close", () => stream.destroy());

      stream.pipe(res);

      stream.on("error", (err) => {
        console.error(err);
        res.sendStatus(500);
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error processing PDF" });
    }
  });
}

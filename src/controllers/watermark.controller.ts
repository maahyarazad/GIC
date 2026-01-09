import { getCollection } from "../db";
import { User } from "../types/user.types";
import { ObjectId } from "mongodb";
import { addWatermark } from "../services/watermarkService";
import path from "path";
import fs from "fs";
import { Application } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import dotenv from "dotenv";
dotenv.config();

export function RegisterFileDownloadRoutes(app: Application) {
  app.get("/api/v1/watermark/:id", authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;

      const usersCollection = getCollection<User>("users");
      const user = await usersCollection.findOne({ _id: new ObjectId(id) });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const version = process.env.PDF_WATERMARK_VERSION;

      const inputPath = path.resolve(
        process.cwd(),
        "file_storage/agnes-j-metro-models-gmbh.pdf"
      );

      const outputPath = path.resolve(
        process.cwd(),
        `uploads/watermarked-${id}.pdf`
      );

      const uniqueIndex = `${user.email}__${id}__${user.role}__${version}`;

      await addWatermark(inputPath, outputPath, uniqueIndex);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="watermarked-${id}.pdf"`
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

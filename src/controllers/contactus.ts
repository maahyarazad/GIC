import {
  createSuccessResponse,
  createErrorResponse,
} from "../utils/helpers";

import express, { Request, Response } from "express";
import multer from "multer";
import {ContactUsModel, mapContactUsSubmission
} from '../models/contactus.model'
const router = express.Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, "file_storage/"),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

router.post(
  "/api/v1/contact-us",
  upload.single("attachment"),
  async (req: Request, res: Response) => {
    try {
      const {
        fullName,
        email,
        industry,
        meaObjective,
        company,
        phone,
        countryOfInterest,
        referredBy,
      } = req.body;

      const normalizedFullName = fullName?.trim();
      const normalizedEmail = email?.trim().toLowerCase();
      const normalizedIndustry = industry?.trim();
      const normalizedMeaObjective = meaObjective?.trim();
      const normalizedCompany = company?.trim() || "";
      const normalizedPhone = phone?.trim() || "";
      const normalizedCountryOfInterest = countryOfInterest?.trim() || "";
      const normalizedReferredBy = referredBy?.trim() || "";

      if (!normalizedFullName) {
        return res.status(400).json(createErrorResponse("Full Name is required", "FULL_NAME_REQUIRED"));
      }

      if (!normalizedEmail) {
        return res.status(400).json(createErrorResponse("Email is required", "EMAIL_REQUIRED"));
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        return res.status(400).json(createErrorResponse("Invalid email address", "INVALID_EMAIL"));
      }

      if (!normalizedIndustry) {
        return res.status(400).json(createErrorResponse("Industry / Sector is required", "INDUSTRY_REQUIRED"));
      }

      if (!normalizedMeaObjective) {
        return res.status(400).json(createErrorResponse("Your MEA Objective is required", "MEA_OBJECTIVE_REQUIRED"));
      }

      let attachmentMeta: any = null;

      if (req.file) {
        attachmentMeta = {
          fieldname: req.file.fieldname,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          filename: req.file.filename || null,
          path: req.file.path || null,
        };
      }

      const submission = await ContactUsModel.create({
        fullName: normalizedFullName,
        email: normalizedEmail,
        industry: normalizedIndustry,
        meaObjective: normalizedMeaObjective,
        company: normalizedCompany,
        phone: normalizedPhone,
        countryOfInterest: normalizedCountryOfInterest,
        referredBy: normalizedReferredBy,
        attachment: attachmentMeta,
      });

      return res.status(201).json(
        createSuccessResponse(
          mapContactUsSubmission(submission.toObject()),
          "Application submitted successfully"
        )
      );
    } catch (err: any) {
      return res.status(500).json(
        createErrorResponse("Failed to submit application", "CREATE_ERROR", err)
      );
    }
  }
);

export function RegisterContactUsRoutes(app: express.Application) {
  app.use(router);
}
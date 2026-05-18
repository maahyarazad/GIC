import express, { Request, Response } from "express";
import { createSuccessResponse, createErrorResponse } from "../utils/helpers";

import { BlogModel } from "../models/blog.model";
import {
  mapBlog,
  mapBlogs,
  mapComment,
  mapCreateBlogRequestToDb,
  mapUpdateBlogRequestToDb,
} from "../mappers/blog.mapper";
import { Application } from "express";

export function RegisterBlogRoutes(app: Application) {
  app.post("/api/v1/blogs/published", async (req, res) => {
    try {
      const limit = Number(req.query.limit ?? 12);
      const skip = Number(req.query.skip ?? 0);

      const [docs, total] = await Promise.all([
        //@ts-ignore
        BlogModel.find({ published: true }, { comments: 0 })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        BlogModel.countDocuments({ published: true }),
      ]);

      res
        .status(200)
        .json(
          createSuccessResponse(
            { blogs: mapBlogs(docs), total, limit, skip },
            "Published blogs fetched successfully"
          )
        );
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json(
          createErrorResponse(
            "Failed to fetch published blogs",
            undefined,
            error
          )
        );
    }
  });
}

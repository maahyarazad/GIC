import { Types } from "mongoose";
import {
  Controller,
  Get,
  Route,
  Post,
  Put,
  Delete,
  Path,
  Query,
  Body,
  SuccessResponse,
  Tags,
  Middlewares,
} from "tsoa";
import {
  Blog,
  CreateBlogRequest,
  UpdateBlogRequest,
  CreateCommentRequest,
  ApproveCommentRequest,
} from "../types/blog.types";
import {
  createErrorResponse,
  createSuccessResponse,
  validateRequiredFields,
} from "../utils/helpers";
import { adminAuthMiddleware } from "../middleware/adminauth.middleware";
import {
  mapBlog,
  mapBlogs,
  mapComment,
  mapCreateBlogRequestToDb,
  mapUpdateBlogRequestToDb,
} from "../mappers/blog.mapper";
import { BlogModel } from "../models/blog.model";


@Route("api/v1/blogs")
@Tags("Blogs")
export class BlogController extends Controller {
  @Post("/")
  @Middlewares(adminAuthMiddleware)
  @SuccessResponse("201", "Blog created successfully")
  public async createBlog(@Body() body: CreateBlogRequest): Promise<any> {
    try {
      const missing = validateRequiredFields(body, ["title", "content", "authorName"]);
      if (missing.length > 0) {
        this.setStatus(400);
        return createErrorResponse(`Missing required fields: ${missing.join(", ")}`);
      }

      const blog = await BlogModel.create(mapCreateBlogRequestToDb(body));

      this.setStatus(201);
      return createSuccessResponse(
        { blog: mapBlog(blog.toObject()) },
        "Blog created successfully"
      );
    } catch (error: any) {
      if (error?.code === 11000) {
        this.setStatus(409);
        return createErrorResponse("A blog with this title already exists.");
      }
      console.error(error);
      this.setStatus(500);
      return createErrorResponse("Failed to create blog", undefined, error);
    }
  }

  @Get("/")
  @Middlewares(adminAuthMiddleware)
  @SuccessResponse("200", "Blogs fetched successfully")
  public async getAllBlogs(
    @Query() limit: number = 20,
    @Query() skip: number = 0,
    @Query() published?: boolean
  ): Promise<{ blogs: Blog[]; total: number; limit: number; skip: number }> {
    const filter: any = {};
    if (published !== undefined) filter.published = published;

    const [docs, total] = await Promise.all([
      BlogModel.find(filter, { comments: 0 })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BlogModel.countDocuments(filter),
    ]);

    return { blogs: mapBlogs(docs), total, limit, skip };
  }

  @Get("{id}")
  @Middlewares(adminAuthMiddleware)
  @SuccessResponse("200", "Blog fetched successfully")
  public async getBlogById(@Path() id: string): Promise<any> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        this.setStatus(400);
        return createErrorResponse("Invalid blog ID");
      }
//@ts-ignore
      const blog = await BlogModel.findById(id).lean();
      if (!blog) {
        this.setStatus(404);
        return createErrorResponse("Blog not found");
      }

      return createSuccessResponse({ blog: mapBlog(blog) }, "Blog fetched successfully");
    } catch (error) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse("Failed to fetch blog", undefined, error);
    }
  }

  @Put("{id}")
  @Middlewares(adminAuthMiddleware)
  @SuccessResponse("200", "Blog updated successfully")
  public async updateBlog(
    @Path() id: string,
    @Body() body: UpdateBlogRequest
  ): Promise<any> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        this.setStatus(400);
        return createErrorResponse("Invalid blog ID");
      }

      const blog = await BlogModel.findByIdAndUpdate(
        //@ts-ignore
        id,
        { $set: mapUpdateBlogRequestToDb(body) },
        { new: true, lean: true }
      );

      if (!blog) {
        this.setStatus(404);
        return createErrorResponse("Blog not found");
      }

      return createSuccessResponse({ blog: mapBlog(blog) }, "Blog updated successfully");
    } catch (error) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse("Failed to update blog", undefined, error);
    }
  }

  @Delete("{id}")
  @Middlewares(adminAuthMiddleware)
  @SuccessResponse("200", "Blog deleted successfully")
  public async deleteBlog(@Path() id: string): Promise<any> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        this.setStatus(400);
        return createErrorResponse("Invalid blog ID");
      }
      //@ts-ignore
      const result = await BlogModel.findByIdAndDelete(id).lean();
      if (!result) {
        this.setStatus(404);
        return createErrorResponse("Blog not found");
      }

      return createSuccessResponse({ success: true }, "Blog deleted successfully");
    } catch (error) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse("Failed to delete blog", undefined, error);
    }
  }



  @Get("by-slug/{slug}")
  @SuccessResponse("200", "Blog fetched successfully")
  public async getBlogBySlug(@Path() slug: string): Promise<any> {
    try {
      //@ts-ignore
      const blog = await BlogModel.findOne({ slug, published: true }).lean();
      if (!blog) {
        this.setStatus(404);
        return createErrorResponse("Blog not found");
      }
      //@ts-ignore
      const approvedComments = (blog.comments ?? []).filter((c: any) => c.approved).map(mapComment);
      return createSuccessResponse(
        { blog: { ...mapBlog(blog), comments: approvedComments } },
        "Blog fetched successfully"
      );
    } catch (error) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse("Failed to fetch blog", undefined, error);
    }
  }

  @Post("{blogId}/comments")
  @SuccessResponse("201", "Comment added successfully")
  public async addComment(
    @Path() blogId: string,
    @Body() body: CreateCommentRequest
  ): Promise<any> {
    try {
      if (!Types.ObjectId.isValid(blogId)) {
        this.setStatus(400);
        return createErrorResponse("Invalid blog ID");
      }

      const missing = validateRequiredFields(body, ["body", "authorName", "authorEmail"]);
      if (missing.length > 0) {
        this.setStatus(400);
        return createErrorResponse(`Missing required fields: ${missing.join(", ")}`);
      }

      const blog = await BlogModel.findByIdAndUpdate(
        //@ts-ignore
        blogId,
        {
          $push: {
            comments: {
              body: body.body,
              authorName: body.authorName,
              authorEmail: body.authorEmail,
              approved: false,
              createdAt: new Date(),
            },
          },
        },
        { new: true, lean: true }
      );

      if (!blog) {
        this.setStatus(404);
        return createErrorResponse("Blog not found");
      }
//@ts-ignore
      const newComment = blog.comments[blog.comments.length - 1];
      this.setStatus(201);
      return createSuccessResponse(
        { comment: mapComment(newComment) },
        "Comment added and pending approval"
      );
    } catch (error) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse("Failed to add comment", undefined, error);
    }
  }

  @Get("{blogId}/comments")
  @SuccessResponse("200", "Comments fetched successfully")
  public async getComments(@Path() blogId: string): Promise<any> {
    try {
      if (!Types.ObjectId.isValid(blogId)) {
        this.setStatus(400);
        return createErrorResponse("Invalid blog ID");
      }
//@ts-ignore
      const blog = await BlogModel.findById(blogId).select("title comments").lean();
      if (!blog) {
        this.setStatus(404);
        return createErrorResponse("Blog not found");
      }

      return createSuccessResponse(
        { comments: blog.comments.map(mapComment) },
        "Comments fetched successfully"
      );
    } catch (error) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse("Failed to fetch comments", undefined, error);
    }
  }

  @Put("{blogId}/comments/{commentId}/approve")
  @Middlewares(adminAuthMiddleware)
  @SuccessResponse("200", "Comment updated successfully")
  public async approveComment(
    @Path() blogId: string,
    @Path() commentId: string,
    @Body() body: ApproveCommentRequest
  ): Promise<any> {
    try {
      if (!Types.ObjectId.isValid(blogId) || !Types.ObjectId.isValid(commentId)) {
        this.setStatus(400);
        return createErrorResponse("Invalid ID");
      }

      const blog = await BlogModel.findOneAndUpdate(
        //@ts-ignore
        { _id: blogId, "comments._id": new Types.ObjectId(commentId) },
        { $set: { "comments.$.approved": body.approved } },
        { new: true, lean: true }
      );

      if (!blog) {
        this.setStatus(404);
        return createErrorResponse("Blog or comment not found");
      }
//@ts-ignore
      const updated = blog.comments.find(
        (c: any) => c._id.toString() === commentId
      );

      return createSuccessResponse(
        { comment: updated ? mapComment(updated) : null },
        "Comment updated successfully"
      );
    } catch (error) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse("Failed to update comment", undefined, error);
    }
  }
}



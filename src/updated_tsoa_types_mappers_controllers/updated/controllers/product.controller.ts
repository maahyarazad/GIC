import { ObjectId } from "mongodb";
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
import { getCollection } from "../db";
import {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ProductSortKey,
  SortOrder,
} from "../types/product.types";
import {
  createErrorResponse,
  createSuccessResponse,
  validateRequiredFields,
  Sort,
} from "../utils/helpers";
import { adminAuthMiddleware } from "../middleware/adminauth.middleware";
import {
  ProductDb,
  mapCreateProductRequestToDb,
  mapProduct,
  mapProducts,
  mapUpdateProductRequestToDb,
} from "../mappers/product.mapper";

@Route("api/v1/products")
@Tags("Products")
export class ProductController extends Controller {
  @Post("/")
  @Middlewares(adminAuthMiddleware)
  @SuccessResponse("201", "Product created successfully")
  public async createProduct(@Body() body: CreateProductRequest): Promise<any> {
    try {
      const required = ["fileId", "name", "code", "importance"];
      const missing = validateRequiredFields(body, required);

      if (missing.length > 0) {
        this.setStatus(400);
        return createErrorResponse(`Missing required fields: ${missing.join(", ")}`);
      }

      const productCollection = getCollection<ProductDb>("products");
      const existing = await productCollection.findOne({ fileId: body.fileId });
      if (existing) {
        this.setStatus(409);
        return createErrorResponse(`Product with fileId '${body.fileId}' already exists.`);
      }

      const product = mapCreateProductRequestToDb(body);
      const insertResult = await productCollection.insertOne(product);

      this.setStatus(201);
      return createSuccessResponse(
        { product: mapProduct({ ...product, _id: insertResult.insertedId }) },
        "Product created successfully"
      );
    } catch (error) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse("Failed to create product", undefined, error);
    }
  }

  @Get("/")
  @SuccessResponse("200", "Products fetched successfully")
  public async getAllProducts(
    @Query() limit: number = 20,
    @Query() skip: number = 0,
    @Query() sortBy: ProductSortKey = "createdAt",
    @Query() sortOrder: SortOrder = "desc",
    @Query() name?: string,
    @Query() importance?: "A" | "B" | "C" | "D",
    @Query() tags?: string
  ): Promise<{ products: Product[]; total: number; limit: number; skip: number }> {
    const productCollection = getCollection<ProductDb>("products");
    const sort: Sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const filter: any = {};
    if (name) filter.name = { $regex: new RegExp(name, "i") };
    if (importance) filter.importance = importance;
    if (tags) filter.tags = { $all: tags.split(",").map((t) => t.trim()) };

    const docs = await productCollection.find(filter).skip(skip).limit(limit).sort(sort).toArray();
    const total = await productCollection.countDocuments(filter);

    return { products: mapProducts(docs), total, limit, skip };
  }

  @Get("{id}")
  @SuccessResponse("200", "Product fetched successfully")
  public async getProductById(@Path() id: string): Promise<any> {
    try {
      if (!ObjectId.isValid(id)) {
        this.setStatus(400);
        return createErrorResponse("Invalid product ID");
      }

      const productCollection = getCollection<ProductDb>("products");
      const product = await productCollection.findOne({ _id: new ObjectId(id) });

      if (!product) {
        this.setStatus(404);
        return createErrorResponse("Product not found");
      }

      return createSuccessResponse({ product: mapProduct(product) }, "Product fetched successfully");
    } catch (error) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse("Failed to fetch product", undefined, error);
    }
  }

  @Get("/by-parent/{parentId}")
  @SuccessResponse("200", "Products fetched by parent ID successfully")
  public async getProductsByParent(@Path() parentId: string): Promise<{ products: Product[] }> {
    try {
      if (!ObjectId.isValid(parentId)) {
        this.setStatus(400);
        return { products: [] };
      }

      const productCollection = getCollection<ProductDb>("products");
      const products = await productCollection.find({ parent: new ObjectId(parentId) }).toArray();
      return { products: mapProducts(products) };
    } catch (error) {
      console.error(error);
      this.setStatus(500);
      return { products: [] };
    }
  }

  @Put("{id}")
  @Middlewares(adminAuthMiddleware)
  @SuccessResponse("200", "Product updated successfully")
  public async updateProduct(@Path() id: string, @Body() body: UpdateProductRequest): Promise<any> {
    try {
      if (!ObjectId.isValid(id)) {
        this.setStatus(400);
        return createErrorResponse("Invalid product ID");
      }

      const productCollection = getCollection<ProductDb>("products");
      const updateData = mapUpdateProductRequestToDb(body);

      const result = await productCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: "after" }
      );

      if (!result) {
        this.setStatus(404);
        return createErrorResponse("Product not found");
      }

      return createSuccessResponse({ product: mapProduct(result) }, "Product updated successfully");
    } catch (error) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse("Failed to update product", undefined, error);
    }
  }

  @Delete("{id}")
  @Middlewares(adminAuthMiddleware)
  @SuccessResponse("200", "Product deleted successfully")
  public async deleteProduct(@Path() id: string): Promise<any> {
    try {
      if (!ObjectId.isValid(id)) {
        this.setStatus(400);
        return createErrorResponse("Invalid product ID");
      }

      const productCollection = getCollection<ProductDb>("products");
      const result = await productCollection.deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0) {
        this.setStatus(404);
        return createErrorResponse("Product not found");
      }

      return createSuccessResponse({ success: true }, "Product deleted successfully");
    } catch (error) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse("Failed to delete product", undefined, error);
    }
  }
}

import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { Sort, createSuccessResponse, createErrorResponse, validateRequiredFields } from "../utils/helpers";
import { Controller, Get, Route, Post, Put, Path, Query, Body, SuccessResponse, Tags, Delete } from "tsoa";
import { getCollection } from "../db";
import { Product, ProductSortKey, SortOrder, UpdateProductRequest, CreateProductRequest } from "../types/product.types";


@Route("api/v1/products")
@Tags("Products")
export class ProductConroller extends Controller {
  @Post("/")
  public async createProduct(@Body() body: CreateProductRequest): Promise<any> {
    try {

      // Validate required fields
      const required = ["sku", "name", "price", "product_type"];
      const missing = validateRequiredFields(body, required);

      if (missing.length > 0) {
        this.setStatus(400);

        return createErrorResponse(
          `Missing required fields: ${missing.join(", ")}`
        );
      }

      const productCollection = getCollection("products");
      const existing = await productCollection.findOne({ sku: body.sku });

      if (existing) {
        this.setStatus(409); // Conflict
        return createErrorResponse(`Product with SKU '${body.sku}' already exists.`);
      }


      // Normalize sale_price
      const sale_price =
        body.sale_price === undefined
          ? null
          : typeof body.sale_price === "string" ||
            typeof body.sale_price === "number"
          ? body.sale_price
          : null;

      const product: Product = {
        ...body,
        sale_price,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

    
      await productCollection.insertOne(product);

      return createSuccessResponse<{ product: Product }>(
        { product },
        "Product created successfully"
      );
    } catch (error) {
      console.error(error);
      return createErrorResponse(`${error}`);
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
  @Query() minPrice?: number,
  @Query() maxPrice?: number,
  @Query() product_type?: string,
  @Query() tags?: string, // comma-separated string of tags, e.g. "summer,sale"
): Promise<{
  products: Product[];
  total: number;
  limit: number;
  skip: number;
}> {
  const productCollection = getCollection<Product>("products");

  // Allowed sort keys (TS safe)
  const validSortKeys: ProductSortKey[] = [
    "sku",
    "name",
    "price",
    "product_type",
    "partner",
    "set",
    "sale_price",
    "sale_period",
    "createdAt",
    "updatedAt",
  ];

  const sortKey = validSortKeys.includes(sortBy) ? sortBy : "createdAt";

  // Convert sort order
  const sortOrderValue = sortOrder === "asc" ? 1 : -1;

  const sort: Sort = {
    [sortKey]: sortOrderValue,
  };

  // Build filter object
  const filter: any = {};

  if (name) {
    // Case-insensitive regex match for name
    filter.name = { $regex: new RegExp(name, "i") };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }

  if (product_type) {
    filter.product_type = product_type;
  }

  if (tags) {
    // Assuming tags are passed as comma-separated string, e.g. "summer,sale"
    const tagsArray = tags.split(",").map((tag) => tag.trim());
    filter.tags = { $all: tagsArray };
  }

  // Query database with filter
  const products = await productCollection
    .find(filter)
    .skip(skip)
    .limit(limit)
    .sort(sort)
    .toArray();

  const total = await productCollection.countDocuments(filter);

  return {
    products,
    total,
    limit,
    skip,
  };
}


  @Get("{id}")
  @SuccessResponse("200", "Product fetched")
  public async getProductById(@Path() id: string): Promise<any> {
    try {
      const productCollection = getCollection<Product>("products");

      const product = await productCollection.findOne({
        _id: new ObjectId(id),
      });

      if (!product) {
        this.setStatus(404);
        return createErrorResponse("Product not found");
      }

      this.setStatus(200);
      return createSuccessResponse({ product }, "Product fetched");
    } catch (error) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse("Failed to fetch product", undefined, error);
    }
  }

  @Put("{id}")
  @SuccessResponse("200", "Product updated successfully")
  public async updateProduct(
    @Path() id: string,
    @Body() body: UpdateProductRequest
  ): Promise<any> {
    try {
      const productCollection = getCollection<Product>("products");

      const updateData = {
        ...body,
        updatedAt: new Date(),
      };

      const result = await productCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        this.setStatus(404);
        return createErrorResponse("Product not found");
      }

      this.setStatus(200);
      return createSuccessResponse(
        { success: true },
        "Product updated successfully"
      );
    } catch (error) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse("Failed to update product", undefined, error);
    }
  }

  @Delete("{id}")
  @SuccessResponse("200", "Product deleted successfully")
  public async deleteProduct(@Path() id: string): Promise<any> {
    try {
      const productCollection = getCollection<Product>("products");

      const result = await productCollection.deleteOne({
        _id: new ObjectId(id),
      });

      if (result.deletedCount === 0) {
        this.setStatus(404);
        return createErrorResponse("Product not found");
      }

      this.setStatus(200);
      return createSuccessResponse(
        { success: true },
        "Product deleted successfully"
      );
    } catch (error) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse("Failed to delete product", undefined, error);
    }
  }
}

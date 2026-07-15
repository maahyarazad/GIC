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
} from "../utils/helpers";
import { adminAuthMiddleware } from "../middleware/adminauth.middleware";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  mapCreateProductRequestToDb,
  mapProduct,
  mapProducts,
  mapUpdateProductRequestToDb,
} from "../mappers/product.mapper";
import { ProductModel } from "../models/product.model";
import swaggerDocument from "../swagger/swagger.json";

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
        return createErrorResponse(
          `Missing required fields: ${missing.join(", ")}`
        );
      }

      const existing = await ProductModel.findOne({
        //@ts-ignore
        $or: [{ fileId: body.fileId }, { code: body.code }],
      }).lean();

      if (existing) {
        this.setStatus(409);
        return createErrorResponse(
          "A product with the same fileId or code already exists."
        );
      }

      const product = await ProductModel.create(
        mapCreateProductRequestToDb(body)
      );

      this.setStatus(201);
      return createSuccessResponse(
        { product: mapProduct(product.toObject()) },
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
  ): Promise<{
    products: Product[];
    total: number;
    limit: number;
    skip: number;
  }> {
    const filter: any = {};
    if (name) filter.name = { $regex: new RegExp(name, "i") };
    if (importance) filter.importance = importance;
    if (tags) filter.tags = { $all: tags.split(",").map((t) => t.trim()) };

    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 } as Record<
      string,
      1 | -1
    >;

    const [docs, total] = await Promise.all([
      ProductModel.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      ProductModel.countDocuments(filter),
    ]);

    return { products: mapProducts(docs), total, limit, skip };
  }

  /**
   * The ProductMetadata schema (category -> field tree) taken from the generated
   * OpenAPI spec. Drives the Compare Countries UI dynamically so it adapts when
   * new categories/fields are added to the metadata type. Declared before the
   * `{id}` route so the literal path isn't captured as a product id.
   */
  @Get("/metadata-schema")
  @Middlewares(authMiddleware)
  @SuccessResponse("200", "Product metadata schema fetched successfully")
  public async getMetadataSchema(): Promise<any> {
    try {
      const properties = (swaggerDocument as any)?.components?.schemas
        ?.ProductMetadata?.properties;

      if (!properties) {
        this.setStatus(404);
        return createErrorResponse("ProductMetadata schema not found");
      }

      return createSuccessResponse(
        { properties },
        "Product metadata schema fetched successfully"
      );
    } catch (error) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse(
        "Failed to fetch metadata schema",
        undefined,
        error
      );
    }
  }

  /**
   * Returns just a country's full metadata tree — used by the Compare Countries
   * view, which loads each country's metadata on demand as it is selected.
   */
  @Get("{id}/metadata")
  @Middlewares(authMiddleware)
  @SuccessResponse("200", "Product metadata fetched successfully")
  public async getProductMetadata(@Path() id: string): Promise<any> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        this.setStatus(400);
        return createErrorResponse("Invalid product ID");
      }

      const product = await (ProductModel as any)
        .findById(id)
        .select("name code metadata")
        .lean();

      if (!product) {
        this.setStatus(404);
        return createErrorResponse("Product not found");
      }

      return createSuccessResponse(
        {
          _id: String((product as any)._id),
          name: (product as any).name,
          code: (product as any).code,
          metadata: (product as any).metadata ?? {},
        },
        "Product metadata fetched successfully"
      );
    } catch (error) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse(
        "Failed to fetch product metadata",
        undefined,
        error
      );
    }
  }

  @Get("{id}")
  @SuccessResponse("200", "Product fetched successfully")
  @Middlewares(authMiddleware)
  public async getProductById(@Path() id: string): Promise<any> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        this.setStatus(400);
        return createErrorResponse("Invalid product ID");
      }
      //@ts-ignore
      const product = await ProductModel.findById(id).lean();

      if (!product) {
        this.setStatus(404);
        return createErrorResponse("Product not found");
      }

      return createSuccessResponse(
        { product: mapProduct(product) },
        "Product fetched successfully"
      );
    } catch (error) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse("Failed to fetch product", undefined, error);
    }
  }

  @Get("/by-parent/{parentId}")
  @Middlewares(authMiddleware)
  @SuccessResponse("200", "Products fetched by parent ID successfully")
  public async getProductsByParent(
    @Path() parentId: string
  ): Promise<{ products: Product[] }> {
    try {
      if (!Types.ObjectId.isValid(parentId)) {
        this.setStatus(400);
        return { products: [] };
      }
      //@ts-ignore
      const products = await ProductModel.find({
        //@ts-ignore
        parent: new Types.ObjectId(parentId),
      })
        .select(
          "fileId name slug code subRegion content variant media tags downloadCount importance parent children recommended metadata sourceFiles sourceSheets isActive order createdAt updatedAt"
        )
        .lean();

      return { products: products };
    } catch (error) {
      console.error(error);
      this.setStatus(500);
      return { products: [] };
    }
  }

  @Put("{id}")
  @Middlewares(adminAuthMiddleware)
  @SuccessResponse("200", "Product updated successfully")
  public async updateProduct(
    @Path() id: string,
    @Body() body: UpdateProductRequest
  ): Promise<any> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        this.setStatus(400);
        return createErrorResponse("Invalid product ID");
      }

      const updateData = mapUpdateProductRequestToDb(body);

      const product = await ProductModel.findByIdAndUpdate(
        //@ts-ignore
        id,
        { $set: updateData },
        { new: true, lean: true }
      );

      if (!product) {
        this.setStatus(404);
        return createErrorResponse("Product not found");
      }

      return createSuccessResponse(
        { product: mapProduct(product) },
        "Product updated successfully"
      );
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
      if (!Types.ObjectId.isValid(id)) {
        this.setStatus(400);
        return createErrorResponse("Invalid product ID");
      }
      //@ts-ignore
      const result = await ProductModel.findByIdAndDelete(id).lean();
      if (!result) {
        this.setStatus(404);
        return createErrorResponse("Product not found");
      }

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

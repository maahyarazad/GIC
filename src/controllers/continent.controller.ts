import { Types } from "mongoose";
import {
  Controller,
  Route,
  Post,
  Body,
  SuccessResponse,
  Tags,
  Middlewares,
  Query,
  Get,
  Delete,
  Put,
  Path,
} from "tsoa";
import {
  Continent,
  CreateContinentRequest,
  UpdateContinentRequest,
  ContinentViewModel,
} from "../types/continent.types";
import { Product } from "../types/product.types";
import {
  createSuccessResponse,
  createErrorResponse,
  validateRequiredFields,
  escapeRegExp,
  FilterModel,
} from "../utils/helpers";
import { adminAuthMiddleware } from "../middleware/adminauth.middleware";
import { authMiddleware } from "../middleware/auth.middleware";
import { ContinentModel } from "../models/continent.model";
import { ProductModel } from "../models/product.model";
import {
  mapContinent,
  mapContinentViewModel,
  mapCreateContinentRequestToDb,
} from "../mappers/continent.mapper";
import { mapCreateProductRequestToDb } from "../mappers/product.mapper";
import { toObjectIdArray } from "../mappers/objectId.mapper";
import {
  initializeDatabase,
  hydrateProductMetadataFromXlsx,
} from "../initialize_db";

export type ContinentSortKey =
  | "name"
  | "slug"
  | "createdAt"
  | "order"
  | "isActive";

@Route("api/v1/continents")
@Tags("Continents")
export class ContinentController extends Controller {
  @Get("/initialize_db")
  public async initializeDB(): Promise<any> {
    try {
      await initializeDatabase();
      await hydrateProductMetadataFromXlsx();
      return createSuccessResponse(null, "Request Completed");
    } catch (error: any) {
      this.setStatus(500);
      return createErrorResponse(error.message || "Failed to process request");
    }
  }

  @Post("/")
  @Middlewares(adminAuthMiddleware)
  @SuccessResponse("201", "Created")
  public async createContinent(
    @Body() body: CreateContinentRequest
  ): Promise<any> {
    try {
      const missing = validateRequiredFields(body, ["name", "slug"]);
      if (missing.length > 0) {
        this.setStatus(400);
        return createErrorResponse(
          `Missing required fields: ${missing.join(", ")}`
        );
      }
      //@ts-ignore
      const duplicate = await ContinentModel.findOne({
        //@ts-ignore
        slug: body.slug,
      }).lean();
      if (duplicate) {
        this.setStatus(400);
        return createErrorResponse(
          `Continent with slug "${body.slug}" already exists`
        );
      }

      const continent = await ContinentModel.create(
        mapCreateContinentRequestToDb(body)
      );

      if (body.productObjects?.length) {
        const productIds = await this.upsertProductsForContinent(
          continent._id,
          body.productObjects
        );
        continent.products = productIds;
        await continent.save();
      }

      this.setStatus(201);
      return createSuccessResponse(
        mapContinent(continent.toObject()),
        "Continent created successfully"
      );
    } catch (error: any) {
      this.setStatus(500);
      return createErrorResponse(error.message || "Failed to create continent");
    }
  }

  @Put("{id}")
  @Middlewares(adminAuthMiddleware)
  public async updateContinent(
    @Path() id: string,
    @Body() body: UpdateContinentRequest
  ): Promise<any> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        this.setStatus(400);
        return createErrorResponse("Invalid continent ID");
      }

      if (body.slug) {
        const duplicate = await ContinentModel.findOne({
          //@ts-ignore
          slug: body.slug,
          _id: { $ne: new Types.ObjectId(id) },
        }).lean();

        if (duplicate) {
          this.setStatus(400);
          return createErrorResponse(
            `Continent with slug "${body.slug}" already exists`
          );
        }
      }

      const updateData: any = {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.slug !== undefined ? { slug: body.slug } : {}),
        ...(body.description !== undefined
          ? { description: body.description ?? null }
          : {}),
        ...(body.products !== undefined
          ? { products: toObjectIdArray(body.products) }
          : {}),
        ...(body.parent !== undefined
          ? {
              parent:
                body.parent && Types.ObjectId.isValid(body.parent)
                  ? new Types.ObjectId(body.parent)
                  : null,
            }
          : {}),
        ...(body.children !== undefined
          ? { children: toObjectIdArray(body.children) }
          : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
        ...(body.order !== undefined ? { order: body.order } : {}),
        ...(body.image !== undefined ? { image: body.image ?? null } : {}),
        ...(body.imageAlt !== undefined
          ? { imageAlt: body.imageAlt ?? null }
          : {}),
        ...(body.seoTitle !== undefined
          ? { seoTitle: body.seoTitle ?? null }
          : {}),
        ...(body.seoDescription !== undefined
          ? { seoDescription: body.seoDescription ?? null }
          : {}),
        ...(body.seoKeywords !== undefined
          ? { seoKeywords: body.seoKeywords ?? null }
          : {}),
        updatedAt: new Date(),
      };

      if (body.productObjects?.length) {
        updateData.products = await this.upsertProductsForContinent(
          new Types.ObjectId(id),
          body.productObjects
        );
      }

      const continent = await ContinentModel.findByIdAndUpdate(
        //@ts-ignore
        id,
        { $set: updateData },
        { new: true, lean: true }
      );

      if (!continent) {
        this.setStatus(404);
        return createErrorResponse("Continent not found");
      }

      return createSuccessResponse(
        mapContinent(continent),
        "Continent updated successfully"
      );
    } catch (error: any) {
      console.error("Update continent error:", error);
      this.setStatus(500);
      return createErrorResponse(error.message || "Failed to update continent");
    }
  }

  @Get("/")
  
  public async getAllContinents(
    @Query("filters") filtersJson?: string,
    @Query() limit: number = 20,
    @Query() skip: number = 0,
    @Query() sortBy: ContinentSortKey = "name",
    @Query() sortOrder: "asc" | "desc" = "asc"
  ): Promise<any> {
    try {
      let filter: any = {};

      if (filtersJson) {
        let filters: FilterModel<Continent>[] = [];
        try {
          filters = JSON.parse(filtersJson);
        } catch {
          return createErrorResponse("Invalid filters JSON");
        }

        const filterParts = filters.map(({ field, operator, value }) => {
          switch (operator) {
            case "contains":
              return {
                [field]: {
                  $regex: new RegExp(`${escapeRegExp(String(value))}`, "i"),
                },
              };
            case "startsWith":
              return {
                [field]: {
                  $regex: new RegExp(`^${escapeRegExp(String(value))}`, "i"),
                },
              };
            case "endsWith":
              return {
                [field]: {
                  $regex: new RegExp(`${escapeRegExp(String(value))}$`, "i"),
                },
              };
            case "equals":
              //@ts-ignore
              if (field === "isActive")
                //@ts-ignore
                return { isActive: value === true || value === "true" };
              return { [field]: value };
            default:
              return {};
          }
        });

        filter = filterParts.length > 0 ? { $and: filterParts } : {};
      }

      const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 } as Record<
        string,
        1 | -1
      >;
      const [docs, total] = await Promise.all([
        ContinentModel.find(filter).sort(sort).skip(skip).limit(limit).lean(),
        ContinentModel.countDocuments(filter),
      ]);

      return createSuccessResponse(
        {
          continents: docs.map(mapContinent),
          total,
          page: Math.floor(skip / limit) + 1,
          pages: Math.ceil(total / limit),
        },
        "Continents fetched successfully"
      );
    } catch (error: any) {
      console.error(error);
      this.setStatus(500);
      return createErrorResponse(error.message || "Failed to fetch continents");
    }
  }

  @Get("{id}")
  @Middlewares(adminAuthMiddleware)
  public async getContinentById(@Path() id: string): Promise<any> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        this.setStatus(400);
        return createErrorResponse("Invalid continent ID");
      }

      //@ts-ignore
      const continent = await ContinentModel.findById(id).lean();
      if (!continent) {
        this.setStatus(404);
        return createErrorResponse("Continent not found");
      }

      let productDocs: any[] = [];
      if (continent.products?.length) {
        //@ts-ignore
        productDocs = await ProductModel.find({
            //@ts-ignore
          _id: { $in: continent.products },
        })
          .select("metadata.conclusion")
          .lean();
      }

      return createSuccessResponse(
        mapContinentViewModel(continent, productDocs as any),
        "Continent fetched successfully"
      );
    } catch (error: any) {
      this.setStatus(500);
      return createErrorResponse(error.message || "Failed to fetch continent");
    }
  }

  @Delete("{id}")
  @Middlewares(adminAuthMiddleware)
  public async deleteContinent(@Path() id: string): Promise<any> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        this.setStatus(400);
        return createErrorResponse("Invalid continent ID");
      }
      //@ts-ignore
      const continent = await ContinentModel.findByIdAndDelete(id).lean();
      if (!continent) {
        this.setStatus(404);
        return createErrorResponse("Continent not found");
      }

      return createSuccessResponse(
        { success: true },
        "Continent deleted successfully"
      );
    } catch (error: any) {
      this.setStatus(500);
      return createErrorResponse(error.message || "Failed to delete continent");
    }
  }

  private async upsertProductsForContinent(
    continentId: Types.ObjectId,
    products: Product[]
  ): Promise<Types.ObjectId[]> {
    const ids: Types.ObjectId[] = [];

    for (const product of products) {
      const query =
        product._id && Types.ObjectId.isValid(product._id)
          ? { _id: new Types.ObjectId(product._id) }
          : product.code
          ? { code: product.code }
          : { fileId: product.fileId };

      const update = {
        $set: {
            //@ts-ignore
          ...mapCreateProductRequestToDb({
            fileId: product.fileId,
            name: product.name,
            code: product.code,
            content: product.content,
            variant: product.variant,
            media: product.media,
            tags: product.tags,
            downloadCount: product.downloadCount,
            importance: product.importance,
            parent: continentId.toHexString(),
            children: product.children ?? [],
            recommended: product.recommended ?? [],
          }),
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      };
      //@ts-ignore
      const saved = await ProductModel.findOneAndUpdate(query, update, {
        upsert: true,
        new: true,
      });
      //@ts-ignore
      ids.push(saved._id);
    }

    return ids;
  }
}

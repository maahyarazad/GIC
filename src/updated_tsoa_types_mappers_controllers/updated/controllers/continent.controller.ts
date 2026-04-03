import { ObjectId } from "mongodb";
import {
  Controller,
  Route,
  Post,
  Path,
  Body,
  SuccessResponse,
  Tags,
  Middlewares,
  Query,
  Get,
  Delete,
} from "tsoa";
import { getCollection } from "../db";
import {
  Continent,
  CreateContinentRequest,
  UpdateContinentRequest,
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
import {
  ContinentDb,
  mapContinent,
  mapCreateContinentRequestToDb,
} from "../mappers/continent.mapper";
import {
  ProductDb,
  mapCreateProductRequestToDb,
  mapProduct,
  mapUpdateProductRequestToDb,
} from "../mappers/product.mapper";

export type ContinentSortKey =
  | "name"
  | "slug"
  | "createdAt"
  | "order"
  | "isActive";

@Route("api/v1/continents")
@Tags("Continents")
export class ContinentController extends Controller {
  @Post("/")
  @Middlewares(adminAuthMiddleware)
  @SuccessResponse("201", "Created")
  public async createContinent(@Body() body: CreateContinentRequest): Promise<any> {
    try {
      const missing = validateRequiredFields(body, ["name", "slug"]);
      if (missing.length) {
        this.setStatus(400);
        return createErrorResponse(`Missing required fields: ${missing.join(", ")}`);
      }

      const productObjects = body.productObjects ?? [];
      const collection = getCollection<ContinentDb>("continents");
      const duplicate = await collection.findOne({ slug: body.slug });
      if (duplicate) {
        this.setStatus(400);
        return createErrorResponse(`Continent with slug "${body.slug}" already exists`);
      }

      const continent = mapCreateContinentRequestToDb(body);
      const result = await collection.insertOne(continent);
      let responseContinent = mapContinent({ ...continent, _id: result.insertedId });

      if (productObjects.length > 0) {
        const productIds = await this.createProductsForContinent(result.insertedId, productObjects);
        await collection.updateOne({ _id: result.insertedId }, { $set: { products: productIds, updatedAt: new Date() } });
        responseContinent.products = productIds.map((x) => x.toHexString());
      }

      this.setStatus(201);
      return createSuccessResponse({ continent: responseContinent });
    } catch (error: any) {
      this.setStatus(500);
      return createErrorResponse(error.message || "Failed to create continent");
    }
  }

  @Post("/update")
  @Middlewares(adminAuthMiddleware)
  public async updateContinent(@Body() body: UpdateContinentRequest): Promise<any> {
    try {
      if (!body._id || !ObjectId.isValid(body._id)) {
        this.setStatus(400);
        return createErrorResponse("Invalid continent ID");
      }

      const collection = getCollection<ContinentDb>("continents");
      const _id = new ObjectId(body._id);

      if (body.slug) {
        const duplicate = await collection.findOne({ slug: body.slug, _id: { $ne: _id } });
        if (duplicate) {
          this.setStatus(400);
          return createErrorResponse(`Continent with slug "${body.slug}" already exists`);
        }
      }

      let continentProductIds: ObjectId[] | undefined;
      const productObjects = body.productObjects ?? [];
      if (productObjects.length > 0) {
        continentProductIds = await this.upsertProductsForContinent(_id, productObjects);
      }

      const { _id: _, productObjects: __, products: ___, ...rest } = body;
      const current = await collection.findOne({ _id });
      if (!current) {
        this.setStatus(404);
        return createErrorResponse("Continent not found");
      }

      const updateData: Partial<ContinentDb> = {
        ...(rest.name !== undefined ? { name: rest.name } : {}),
        ...(rest.slug !== undefined ? { slug: rest.slug } : {}),
        ...(rest.description !== undefined ? { description: rest.description ?? null } : {}),
        ...(rest.parent !== undefined ? { parent: rest.parent ? new ObjectId(rest.parent) : null } : {}),
        ...(rest.children !== undefined ? { children: (rest.children ?? []).filter((x): x is string => !!x && ObjectId.isValid(x)).map((x) => new ObjectId(x)) } : {}),
        ...(rest.isActive !== undefined ? { isActive: rest.isActive } : {}),
        ...(rest.order !== undefined ? { order: rest.order } : {}),
        ...(rest.image !== undefined ? { image: rest.image ?? null } : {}),
        ...(rest.imageAlt !== undefined ? { imageAlt: rest.imageAlt ?? null } : {}),
        ...(rest.seoTitle !== undefined ? { seoTitle: rest.seoTitle ?? null } : {}),
        ...(rest.seoDescription !== undefined ? { seoDescription: rest.seoDescription ?? null } : {}),
        ...(rest.seoKeywords !== undefined ? { seoKeywords: rest.seoKeywords ?? null } : {}),
        updatedAt: new Date(),
      };

      if (continentProductIds !== undefined) {
        updateData.products = continentProductIds;
      }

      await collection.updateOne({ _id }, { $set: updateData });
      const updated = await collection.findOne({ _id });
      return createSuccessResponse({ continent: mapContinent(updated) }, "Continent updated successfully");
    } catch (error: any) {
      console.error("Update continent error:", error);
      this.setStatus(500);
      return createErrorResponse(error.message || "Failed to update continent");
    }
  }

  @Get("/")
  public async getAllCategories(
    @Query("filters") filtersJson?: string,
    @Query() limit: number = 20,
    @Query() skip: number = 0,
    @Query() sortBy: ContinentSortKey = "name",
    @Query() sortOrder: "asc" | "desc" = "asc"
  ): Promise<any> {
    try {
      const categoriesCollection = getCollection<ContinentDb>("continents");
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
              return { [field]: { $regex: new RegExp(`${escapeRegExp(String(value))}`, "i") } };
            case "startsWith":
              return { [field]: { $regex: new RegExp(`^${escapeRegExp(String(value))}`, "i") } };
            case "endsWith":
              return { [field]: { $regex: new RegExp(`${escapeRegExp(String(value))}$`, "i") } };
            case "equals":
              if (field === "isActive") return { isActive: value === "true" || value === true || value === 1 };
              return { [field]: value };
            default:
              return {};
          }
        });

        filter = filterParts.length > 0 ? { $and: filterParts } : {};
      }

      const limitNum = Math.min(Math.max(limit, 1), 100);
      const skipNum = Math.max(skip, 0);
      const allowedSortKeys: ContinentSortKey[] = ["name", "slug", "createdAt", "order", "isActive"];
      const sortKey: ContinentSortKey = allowedSortKeys.includes(sortBy) ? sortBy : "name";
      const sort = { [sortKey]: sortOrder === "asc" ? 1 : -1 };

      const total = await categoriesCollection.countDocuments(filter);
      const categories = await categoriesCollection.find(filter).sort(sort as any).limit(limitNum).skip(skipNum).toArray();

      return createSuccessResponse(
        {
          categories: categories.map(mapContinent),
          total,
          page: Math.floor(skipNum / limitNum) + 1,
          pages: Math.ceil(total / limitNum),
        },
        "Categories fetched successfully"
      );
    } catch (error) {
      console.error("Error fetching categories:", error);
      return createErrorResponse("Failed to fetch categories", error);
    }
  }

  @Delete("/{id}")
  @Middlewares(adminAuthMiddleware)
  @SuccessResponse("200", "Deleted")
  public async deleteContinent(@Path() id: string): Promise<any> {
    try {
      if (!ObjectId.isValid(id)) {
        this.setStatus(400);
        return createErrorResponse("Invalid continent ID");
      }

      const collection = getCollection<ContinentDb>("continents");
      const _id = new ObjectId(id);
      const result = await collection.deleteOne({ _id });

      if (result.deletedCount === 0) {
        this.setStatus(404);
        return createErrorResponse("Continent not found");
      }

      return createSuccessResponse({ message: "Continent deleted successfully" });
    } catch (error: any) {
      this.setStatus(500);
      return createErrorResponse(error.message || "Failed to delete continent");
    }
  }

  private async createProductsForContinent(continentId: ObjectId, products: Product[]): Promise<ObjectId[]> {
    const productsCollection = getCollection<ProductDb>("products");
    const continentProductIds: ObjectId[] = [];

    for (const p of products) {
      const newProduct = mapCreateProductRequestToDb({
        fileId: p.fileId,
        name: p.name,
        code: p.code,
        content: p.content,
        variant: p.variant,
        media: p.media,
        tags: p.tags,
        downloadCount: p.downloadCount,
        importance: p.importance,
        parent: continentId.toHexString(),
        children: p.children,
        recommended: p.recommended,
      });

      const result = await productsCollection.insertOne(newProduct);
      continentProductIds.push(result.insertedId);
    }

    return continentProductIds;
  }

  private async upsertProductsForContinent(continentId: ObjectId, products: Product[]): Promise<ObjectId[]> {
    const productsCollection = getCollection<ProductDb>("products");
    const resultIds: ObjectId[] = [];

    for (const p of products) {
      if (p._id && ObjectId.isValid(p._id)) {
        const updateData = mapUpdateProductRequestToDb({
          name: p.name,
          code: p.code,
          fileId: p.fileId,
          importance: p.importance,
          recommended: p.recommended,
          children: p.children,
          downloadCount: p.downloadCount,
          parent: continentId.toHexString(),
          content: p.content,
          variant: p.variant,
          media: p.media,
          tags: p.tags,
        });

        await productsCollection.updateOne({ _id: new ObjectId(p._id) }, { $set: updateData });
        resultIds.push(new ObjectId(p._id));
      } else {
        const newProduct = mapCreateProductRequestToDb({
          fileId: p.fileId,
          name: p.name,
          code: p.code,
          content: p.content,
          variant: p.variant,
          media: p.media,
          tags: p.tags,
          downloadCount: p.downloadCount,
          importance: p.importance,
          parent: continentId.toHexString(),
          children: p.children,
          recommended: p.recommended,
        });

        const insertResult = await productsCollection.insertOne(newProduct);
        resultIds.push(insertResult.insertedId);
      }
    }

    return resultIds;
  }
}

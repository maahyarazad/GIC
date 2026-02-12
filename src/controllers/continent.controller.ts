import { ObjectId } from "mongodb";
import {
  Controller,
  Route,
  Post,
  Put,
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
  public async createContinent(
    @Body() body: CreateContinentRequest
  ): Promise<any> {
    try {
      validateRequiredFields(body, ["name", "slug"]);

    const productObjects = body.productObject ?? [];


      const collection = getCollection<Continent>("continents");
      const duplicate = await collection.findOne({ slug: body.slug });
      if (duplicate) {
        this.setStatus(400);
        return createErrorResponse(
          `Continent with slug "${body.slug}" already exists`
        );
      }

      const now = new Date();

      const Continent: Continent = {
        _id: new ObjectId(),
        name: body.name,
        slug: body.slug,
        description: body.description ?? null,
        products: [],
        parent: body.parent ?? null,
        children: body.children ?? null,
        isActive: body.isActive ?? true,
        order: body.order,
        createdAt: now,
        updatedAt: now,
      };

      const result = await collection.insertOne(Continent);

      if (productObjects && productObjects.length > 0) {
        // Upsert or link products
        const productIds = await this.createProductsForContinent(
          result.insertedId,
          productObjects
        );

        // Update the continent with product IDs
        await collection.updateOne(
          { _id: result.insertedId },
          { $set: { products: productIds } }
        );

        // Update local object to return
        Continent.products = productIds;
      }

      this.setStatus(201);
      return createSuccessResponse(Continent);
    } catch (error: any) {
      return createErrorResponse(error.message || "Failed to create Continent");
    }
  }

@Post("/update")
@Middlewares(adminAuthMiddleware)
public async updateContinent(
  
  @Body() body: CreateContinentRequest
): Promise<any> {
  try {
    const collection = getCollection<Continent>("continents");
    const _id = new ObjectId(body._id);

    // Check duplicate slug
    if (body.slug) {
      const duplicate = await collection.findOne({
        slug: body.slug,
        _id: { $ne: _id },
      });

      if (duplicate) {
        this.setStatus(400);
        return createErrorResponse(
          `Continent with slug "${body.slug}" already exists`
        );
      }
    }

    let continentProductIds: ObjectId[] = [];


    const productObjects = body.productObject ?? [];

    // Upsert products
    if (productObjects && productObjects.length > 0) {
      continentProductIds = await this.upsertProductsForContinent(
        _id,
       productObjects
      );
    }

    delete body.productObject;
    delete body._id;
    // Update continent data (add products)
    const updateData: Partial<Continent> = {
      ...body,
      products: continentProductIds,
      updatedAt: new Date(),
    };

    await collection.updateOne(
      { _id }, // correct filter
      { $set: updateData }
    );

    return createSuccessResponse("Continent updated successfully");
  } catch (error: any) {
    console.error("Update continent error:", error);
    this.setStatus(500);
    return createErrorResponse(error.message || "Failed to update Continent");
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
      const categoriesCollection = getCollection("continents");

      let filter: any = {};

      // 🔹 Handle Filters
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
              // Special handling for boolean fields
              if (field === "isActive") {
                return { isActive: value === "true" || value === 1 || Boolean(value) };
              }

              return { [field]: value };

            default:
              return {};
          }
        });

        filter = filterParts.length > 0 ? { $and: filterParts } : {};
      }

      // 🔹 Clamp pagination
      const limitNum = Math.min(Math.max(limit, 1), 100);
      const skipNum = Math.max(skip, 0);

      // 🔹 Safe sorting
      const allowedSortKeys: ContinentSortKey[] = [
        "name",
        "slug",
        "createdAt",
        "order",
        "isActive",
      ];

      const sortKey: ContinentSortKey = allowedSortKeys.includes(sortBy)
        ? sortBy
        : "name";

      const sort = { [sortKey]: sortOrder === "asc" ? 1 : -1 };

      // 🔹 Total count
      const total = await categoriesCollection.countDocuments(filter);

      // 🔹 Query data
      const categories = await categoriesCollection
        .find(filter)
        .sort(sort as any)
        .limit(limitNum)
        .skip(skipNum)
        .toArray();

      return createSuccessResponse(
        {
          categories,
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
      const collection = getCollection<Continent>("continents");

      const _id = new ObjectId(id);

      const result = await collection.deleteOne({ _id });

      if (result.deletedCount === 0) {
        this.setStatus(404);
        return createErrorResponse("Continent not found");
      }

      return createSuccessResponse({
        message: "Continent deleted successfully",
      });
    } catch (error: any) {
      this.setStatus(500);
      return createErrorResponse(error.message || "Failed to delete Continent");
    }
  }

  private async createProductsForContinent(
    continentId: ObjectId,
    products: Product[]
  ): Promise<ObjectId[]> {
    const productsCollection = getCollection<Product>("products");
    const continentProductIds: ObjectId[] = [];

    for (const p of products) {
      const newProduct: Product = {
        ...p,
        parent: continentId,
        children: p.children ?? [],
        recommended: p.recommended ?? [],
        downloadCount: p.downloadCount ?? 0,
        importance: p.importance ?? "A",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await productsCollection.insertOne(newProduct);

      continentProductIds.push(result.insertedId);
    }

    return continentProductIds;
  }

  private async upsertProductsForContinent(
    continentId: ObjectId,
    products: Product[]
  ): Promise<ObjectId[]> {
    const productsCollection = getCollection<Product>("products");
    const resultIds: ObjectId[] = [];

    for (const p of products) {
      if (p._id) {
        // Existing product → update
        const updateResult = await productsCollection.updateOne(
          { _id: new ObjectId(p._id) },
          {
            $set: {
              name: p.name,
              code: p.code,
              fileId: p.fileId,
              importance: p.importance ?? "A",
              recommended: p.recommended ?? [],
              children: p.children ?? [],
              downloadCount: p.downloadCount ?? 0,
              updatedAt: new Date(),
            },
          }
        );

        if (updateResult.modifiedCount > 0) {
          resultIds.push(p._id);
        } else {
          // If nothing was modified, still include the _id
          resultIds.push(p._id);
        }
      } else {
        // New product → create
        const newProduct: Product = {
          ...p,
          parent: continentId,
          children: p.children ?? [],
          recommended: p.recommended ?? [],
          downloadCount: p.downloadCount ?? 0,
          importance: p.importance ?? "A",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const insertResult = await productsCollection.insertOne(newProduct);
        resultIds.push(insertResult.insertedId);
      }
    }

    return resultIds;
  }
}

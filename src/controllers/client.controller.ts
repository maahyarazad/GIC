import { Controller, Get, Route, Tags, Put, Body, Path } from "tsoa";
import { ObjectId } from "mongodb";
import { getCollection } from "../db";
import { createErrorResponse, createSuccessResponse } from "../utils/helpers";

@Route("client")
@Tags("client")
export class ClientController extends Controller {
  @Get("/")
  public async getLargeJson(): Promise<any> {
    try {
      const collection = getCollection("client_blueprint");
      const doc = await collection.findOne({});

      if (!doc) {
        this.setStatus(404);
        return createErrorResponse("JSON file not found");
      }

      this.setStatus(200);
      return createSuccessResponse(doc, "JSON fetched successfully");
    } catch (err: any) {
      console.error(err);
      this.setStatus(500);
      return createErrorResponse("Failed to fetch JSON file", undefined, err);
    }
  }

  @Put("/{id}")
  public async updateJsonById(@Path() id: string, @Body() updatedJson: any): Promise<any> {
    try {
      if (!ObjectId.isValid(id)) {
        this.setStatus(400);
        return createErrorResponse("Invalid ID");
      }

      const collection = getCollection("client_blueprint");
      const json = updatedJson;
      delete json._id;

      
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: json },
        { returnDocument: "after" }
      );

      if (!result) {
        this.setStatus(404);
        return createErrorResponse("Document not found");
      }

      this.setStatus(200);
      return createSuccessResponse(result, "JSON updated successfully");
    } catch (err: any) {
      console.error(err);
      this.setStatus(500);
      return createErrorResponse("Failed to update JSON file", undefined, err);
    }
  }
}

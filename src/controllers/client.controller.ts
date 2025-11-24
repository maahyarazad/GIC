import { Controller, Get, Route, Tags } from "tsoa";

import { getCollection } from "../db";

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
        throw new Error("JSON file not found");
      }

      this.setStatus(200);
      return doc;
    } catch (err: any) {
      console.error(err);
      this.setStatus(500);
      throw new Error("Failed to fetch JSON file");
    }
  }
}

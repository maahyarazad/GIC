import {   Controller,
  Get,
  Route,
  Tags,
  Res,
  TsoaResponse, } from "tsoa";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { SitemapStream, streamToPromise } from "sitemap";
import { Readable } from "stream";

dotenv.config();
interface XmlResponse {
  content: string;
}

function scanPages(): string[] {
  // TODO: Implement your real page scanning logic
  return ["/", "/about", "/contact"];
}

@Route("sitemap.xml")
@Tags("sitemap")
export class SitemapController extends Controller {
  @Get("/")
  public async getSitemap(
    @Res() res: TsoaResponse<200, string>,
    @Res() resError: TsoaResponse<500, { message: string }>
  ): Promise<string | void> {
    try {
      const pages = scanPages();

      const baseUrl =
        process.env.NODE_ENV === "production"
          ? process.env.CLIENT_ORIGIN_PROD
          : process.env.CLIENT_ORIGIN_DEV;

      // Map pages to sitemap links format
      const links = pages.map((page) => ({
        url: page,
        changefreq: "daily",
        priority: 0.7,
      }));

      // Create a sitemap stream with hostname
      const stream = new SitemapStream({ hostname: baseUrl });

      // Create a readable stream from the links array
      const xmlData = await streamToPromise(
        Readable.from(links).pipe(stream)
      ).then((data) => data.toString());

      // Send XML response with content-type header
      res(200, xmlData);
      this.setHeader("Content-Type", "application/xml");
      return;
    } catch (error) {
      console.error("Error generating sitemap:", error);
      resError(500, { message: "Internal Server Error" });
    }
  }
}
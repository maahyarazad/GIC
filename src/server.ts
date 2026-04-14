import "dotenv/config";

import compression from "compression";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import cookieParser from "cookie-parser";
import session from "express-session";
import swaggerUi from "swagger-ui-express";

import { pathToFileURL } from "url";
import { createServer as createViteServer } from "vite";

/* ---- LOCAL IMPORTS (ESM-safe) ---- */
import { RegisterRoutes } from "./routes/routes";
import { RegisterFileDownloadRoutes } from "./controllers/watermark.controller";
import { verifyRequirements } from "./db";

/* ---- JSON IMPORT (REQUIRED ASSERTION) ---- */
import swaggerDocument from "./swagger/swagger.json";
import {RegisterContactUsRoutes} from './controllers/contactus';
const isProduction = process.env.NODE_ENV === "PRODUCTION";

const app = express();
const PORT = process.env.PORT ?? 5173;

/* ---------------------- Middleware ---------------------- */
const allowedOrigins = [
  process.env.CLIENT_ORIGIN_DEV,
  process.env.CLIENT_ORIGIN_PROD,
];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow requests like curl or same-origin
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 15 * 60 * 1000,
    },
  })
);

app.use(express.json());

/* ---------------------- Routes (TSOA) ---------------------- */
RegisterRoutes(app);
RegisterFileDownloadRoutes(app);
//

/* ---------------------- Swagger Docs ---------------------- */
if (!isProduction) {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, { explorer: true })
  );
}

app.get("/robots.txt", (req, res) => {
  res.type("text/plain");
  res.send(`User-agent: *
Allow: /`);
});

/* ---------------------- Static uploads ---------------------- */

/* ---------------------- Startup Checks ---------------------- */
async function startServer() {
  try {
    await verifyRequirements();
  } catch (err) {
    console.error("Startup failed:", err);
    process.exit(1);
  }
}
startServer();

/* ---------------------- SSR + Static Handling ---------------------- */




const envVars = {
  VITE_SERVER_API_URL: isProduction
    ? process.env.CLIENT_ORIGIN_PROD
    : process.env.CLIENT_ORIGIN_DEV,
  SERVICES_SERVER_ORIGIN: isProduction
    ? process.env.SERVICES_SERVER_ORIGIN_PROD
    : process.env.SERVICES_SERVER_ORIGIN_DEV,

  VITE_SERVER_ACCOUNT_REGISTER_SUCCESS:
    process.env.VITE_SERVER_ACCOUNT_REGISTER_SUCCESS,

};


async function startSSR() {
  if (!isProduction) {
    const __dirname = path.resolve();
    app.use(
      "/uploads",
      express.static(path.resolve(__dirname, "file_storage"))
    );

    app.use(
      "/uploads/photos",
      express.static(path.resolve(__dirname, "uploads/photos"))
    );

    const vite = await createViteServer({
      // root: process.cwd(),
      root: path.resolve(__dirname, "ui"),
      server: {
        middlewareMode: true,
      },
      appType: "custom",
      base: process.env.CLIENT_ORIGIN_DEV,
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "ui/src"),
        },
      },
      optimizeDeps: {
        include: [
          "@animated-burgers/burger-rotate",
          "react-icons/fa",
          "@reduxjs/toolkit",
          "react-slick",
          "formik",
          "yup",
          "lucide-react",
          "react-icons/io",
          "json-edit-react",
        ],
      },
      ssr: {
        noExternal: ["react-router-dom"], // Add this line to fix SSR import issues
      },
    });

    // Serve Vite's HMR, transforms, etc.
    app.use(vite.middlewares);

    // SSR handler
    app.use("*", async (req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith("/uploads")) {
        return next(); // Let express.static handle this
      }

      try {
        const url = req.originalUrl;

        // Build absolute file URL for ssrLoadModule (required for files outside root)
        const ssrEntryPath = path.resolve(__dirname, "ui/src/entry-server.jsx");

        const ssrEntryFileUrl = pathToFileURL(ssrEntryPath).href;

        let template = fs.readFileSync(
          path.resolve(__dirname, "ui/index.html"),
          "utf-8"
        );

        // Replace a placeholder (e.g. <!--env-->) in your HTML with a global JS variable
        template = template.replace(
          "<!--env-->",
          `<script>window.__ENV__ = ${JSON.stringify(envVars).replace(
            /</g,
            "\\u003c"
          )};</script>`
        );

        template = await vite.transformIndexHtml(url, template);
        // Load the SSR renderer
        const { render } = await vite.ssrLoadModule(ssrEntryFileUrl);

        const { appHtml, preloadedState } = await render(url, envVars);

        const stateScript = `
            <script>
            window.__PRELOADED_STATE__ = ${JSON.stringify(
              preloadedState
            ).replace(/</g, "\\u003c")}
            </script>
            `;

        const html = template
          .replace(`<!--app-head-->`, appHtml.head ?? "")
          .replace(`<!--app-html-->`, appHtml.html ?? "")
          .replace("</body>", `${stateScript}</body>`);

        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        console.error(e);
        res.status(500).end(e.message);
      }
    });
  } else {
    /*  PRODUCTION — serve built client and SSR entry */
    app.use(
      "/uploads",
      express.static(path.resolve(__dirname, "../file_storage"))
    );
    app.use(
      "/uploads/photos",
      express.static(path.resolve(__dirname, "uploads/photos"))
    );
    const serverPath = path.resolve(
      __dirname,
      "../ui/dist/server/entry-server.js"
    );

    const compression = (await import("compression")).default;
    app.use(compression());
    // Serve static assets
    app.use(express.static(path.resolve(__dirname, "../ui/dist/client")));

    const { render } = await import(serverPath);

    app.use("*", async (req: Request, res: Response) => {
      try {
        const url = req.originalUrl;

        let template = fs.readFileSync(
          path.resolve(__dirname, "../ui/dist/client/index.html"),
          "utf-8"
        );

        // Replace a placeholder (e.g. <!--env-->) in your HTML with a global JS variable
        template = template.replace(
          "<!--env-->",
          `<script>window.__ENV__ = ${JSON.stringify(envVars).replace(
            /</g,
            "\\u003c"
          )};</script>`
        );

        const { appHtml, preloadedState } = await render(url, envVars);
        const stateScript = `
            <script>
            window.__PRELOADED_STATE__ = ${JSON.stringify(
              preloadedState
            ).replace(/</g, "\\u003c")}
            </script>
            `;

        const html = template
          .replace(`<!--app-head-->`, appHtml.head ?? "")
          .replace(`<!--app-html-->`, appHtml.html ?? "")
          .replace("</body>", `${stateScript}</body>`);

        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e) {
        console.error(e);
        res.status(500).end(e.message);
      }
    });
  }
}


RegisterContactUsRoutes(app);

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);

startSSR();

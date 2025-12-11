import "dotenv/config";

import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import cookieParser from "cookie-parser";
import session from "express-session";
import { RegisterRoutes } from "./routes/routes";
import swaggerUi from "swagger-ui-express";
import * as swaggerDocument from "./swagger/swagger.json";
import { pathToFileURL } from "url";
import { createServer as createViteServer } from "vite";

import { verifyRequirements } from "./db";

const isProduction = process.env.NODE_ENV === "PRODUCTION";
const __dirname = path.resolve();

const app = express();
const PORT = process.env.PORT ?? 5173;

/* ---------------------- Middleware ---------------------- */
const allowedOrigins = [process.env.CLIENT_ORIGIN_DEV, process.env.CLIENT_ORIGIN_PROD];
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

app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60 * 1000,
    },
  })
);

app.use(express.json());

/* ---------------------- Routes (TSOA) ---------------------- */
RegisterRoutes(app);

/* ---------------------- Swagger Docs ---------------------- */
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, { explorer: true })
);

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

app.use("/uploads", express.static(path.resolve(__dirname, "file_storage")));

async function startSSR() {
    
  if (!isProduction) {
    const vite = await createViteServer({
      // root: process.cwd(),
      root: path.resolve(__dirname, "public"),
      server: {
        middlewareMode: true,
      },
      appType: "custom",
      base: process.env.CLIENT_ORIGIN_DEV,
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "public/src"),
        },
      },
      optimizeDeps: {
        include: [
          "@animated-burgers/burger-rotate",
          "react-icons/fa",
          "@reduxjs/toolkit",
          "react-lazy-load-image-component",
          "react-slick",
          "formik",
          "yup",
          "lucide-react",
          "react-icons/io",
          "json-edit-react",
        ],
      },
      ssr: {
    noExternal: ['react-router-dom'],  // Add this line to fix SSR import issues
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
        const ssrEntryPath = path.resolve(
          __dirname,
          "public",
          "src",
          "entry-server.jsx"
        );
        const ssrEntryFileUrl = pathToFileURL(ssrEntryPath).href;

        let template = fs.readFileSync(
          path.resolve(__dirname, "public", "index.html"),
          "utf-8"
        );
        
        // Define your env vars for injection
        const envVars = {
        VITE_SERVER_API_URL: process.env.CLIENT_ORIGIN_DEV || "http://localhost:5173",
        // add more if needed
        };

        // Replace a placeholder (e.g. <!--env-->) in your HTML with a global JS variable
        template = template.replace(
        "<!--env-->",
        `<script>window.__ENV__ = ${JSON.stringify(envVars).replace(/</g, '\\u003c')};</script>`
        );

        template = await vite.transformIndexHtml(url, template);
        // Load the SSR renderer
        const { render } = await vite.ssrLoadModule(ssrEntryFileUrl);

        const appHtml = await render(url, envVars);

        const html = template
          .replace(`<!--app-head-->`, appHtml.head ?? "")
          .replace(`<!--app-html-->`, appHtml.html ?? "");

        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        console.error(e);
        res.status(500).end(e.message);
      }
    });
  } else {
    /* 🏭 PRODUCTION — serve built client and SSR entry */
    const distPath = path.resolve(__dirname, "./public/dist/client");
    const serverPath = path.resolve(
      __dirname,
      "./public/dist/server/entry-server.js"
    );

    const compression = (await import("compression")).default;
    app.use(compression());
    // Serve static assets
    app.use(express.static(path.resolve(__dirname, "./public/dist/client")));

    const { render } = await import(serverPath);

    app.use("*", async (req: Request, res: Response) => {
      try {
        const url = req.originalUrl;

        const template = fs.readFileSync(
          path.resolve(__dirname, "./public/dist/client/index.html"),
          "utf-8"
        );

        const appHtml = await render(url);

        const html = template.replace(`<!--app-html-->`, appHtml);

        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e) {
        console.error(e);
        res.status(500).end(e.message);
      }
    });
  }
  
}






app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    next();
});

app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);

startSSR();

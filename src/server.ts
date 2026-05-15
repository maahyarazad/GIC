import "dotenv/config";

import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import cookieParser from "cookie-parser";
import session from "express-session";
import swaggerUi from "swagger-ui-express";

import { pathToFileURL } from "url";
import { createServer as createViteServer } from "vite";

import { RegisterRoutes } from "./routes/routes";
import { RegisterFileDownloadRoutes } from "./controllers/watermark.controller";
import { verifyRequirements } from "./db";

import swaggerDocument from "./swagger/swagger.json";
import { RegisterContactUsRoutes } from "./controllers/contactus";

// ✅ Fix 1: case-insensitive comparison
const isProduction = process.env.NODE_ENV?.toLowerCase() === "production";

const app = express();
const PORT = process.env.PORT ?? 5173;

// ✅ Fix 2: envVars uses correct isProduction flag now
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

console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("isProduction:", isProduction);
console.log("envVars:", envVars);

/* ---------------------- Middleware ---------------------- */
const allowedOrigins = [
  process.env.CLIENT_ORIGIN_DEV,
  process.env.CLIENT_ORIGIN_PROD,
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
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

/* ---------------------- Routes ---------------------- */
RegisterRoutes(app);
RegisterFileDownloadRoutes(app);
RegisterContactUsRoutes(app);

/* ---------------------- Swagger ---------------------- */
if (!isProduction) {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, { explorer: true })
  );
}

app.get("/robots.txt", (req, res) => {
  res.type("text/plain");
  res.send(`User-agent: *\nAllow: /`);
});

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

/* ---------------------- SSR ---------------------- */
async function startSSR() {
  if (!isProduction) {
    /* ---- DEV ---- */
    const __dirname = path.resolve();

    app.use("/uploads", express.static(path.resolve(__dirname, "file_storage")));
    app.use("/uploads/photos", express.static(path.resolve(__dirname, "uploads/photos")));

    const vite = await createViteServer({
      root: path.resolve(__dirname, "ui"),
      server: { middlewareMode: true },
      appType: "custom",
      base: process.env.CLIENT_ORIGIN_DEV,
      resolve: {
        alias: { "@": path.resolve(__dirname, "ui/src") },
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
      ssr: { noExternal: ["react-router-dom"] },
    });

    app.use(vite.middlewares);

    app.get("*", async (req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith("/uploads")) return next();

      try {
        const url = req.originalUrl;
        const ssrEntryPath = path.resolve(__dirname, "ui/src/entry-server.jsx");
        const ssrEntryFileUrl = pathToFileURL(ssrEntryPath).href;

        let template = fs.readFileSync(path.resolve(__dirname, "ui/index.html"), "utf-8");

        template = template.replace(
          "<!--env-->",
          `<script>window.__ENV__ = ${JSON.stringify(envVars).replace(/</g, "\\u003c")};</script>`
        );

        template = await vite.transformIndexHtml(url, template);

        const { render } = await vite.ssrLoadModule(ssrEntryFileUrl);

        // ✅ Fix 3: load clientData in dev too
        const clientDataPath = path.resolve(__dirname, "file_storage/client_blueprint.json");
        const rawDev = fs.existsSync(clientDataPath)
          ? fs.readFileSync(clientDataPath, "utf-8")
          : "{}";
        const clientData = rawDev.trim() ? JSON.parse(rawDev) : {};

        const { appHtml, preloadedState } = await render(url, envVars, clientData);

        const stateScript = `<script>window.__PRELOADED_STATE__ = ${JSON.stringify(preloadedState).replace(/</g, "\\u003c")}</script>`;

        const html = template
          .replace(`<!--app-head-->`, appHtml.head ?? "")
          .replace(`<!--app-html-->`, appHtml.html ?? "")
          .replace(`<!--preloaded-state-->`, stateScript);

        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        console.error(e);
        res.status(500).end(e.message);
      }
    });
  } else {
    /* ---- PRODUCTION ---- */
    app.use("/uploads", express.static(path.resolve(__dirname, "../file_storage")));
    app.use("/uploads/photos", express.static(path.resolve(__dirname, "uploads/photos")));

    const compression = (await import("compression")).default;
    app.use(compression());

    // ✅ Fix 4: static BEFORE the SSR catch-all, but after /uploads
    app.use(express.static(path.resolve(__dirname, "../ui/dist/client"), {
        index: false  // ✅ don't serve index.html automatically
    }));

    const serverPath = path.resolve(__dirname, "../ui/dist/server/entry-server.js");
    const { render } = await import(serverPath);

    app.get("*", async (req: Request, res: Response) => {
      try {
        const url = req.originalUrl;

        let template = fs.readFileSync(
          path.resolve(__dirname, "../ui/dist/client/index.html"),
          "utf-8"
        );

        template = template.replace(
          "<!--env-->",
          `<script>window.__ENV__ = ${JSON.stringify(envVars).replace(/</g, "\\u003c")};</script>`
        );

        // ✅ Fix 5: readFileSync (not readFile) — this was the main production bug
        const blueprintPath = path.join(process.cwd(), "file_storage", "client_blueprint.json");
        const raw = fs.existsSync(blueprintPath)
          ? fs.readFileSync(blueprintPath, "utf-8")
          : "{}";
        const clientData = raw.trim() ? JSON.parse(raw) : {};

        console.log("clientData keys:", Object.keys(clientData));
        console.log("envVars:", envVars);

        const { appHtml, preloadedState } = await render(url, envVars, clientData);

        const stateScript = `<script>window.__PRELOADED_STATE__ = ${JSON.stringify(preloadedState).replace(/</g, "\\u003c")}</script>`;

        const html = template
          .replace(`<!--app-head-->`, appHtml.head ?? "")
          .replace(`<!--app-html-->`, appHtml.html ?? "")
          .replace(`<!--preloaded-state-->`, stateScript);

        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e: any) {
        console.error(e);
        res.status(500).end(e?.message || "SSR Error");
      }
    });
  }
}

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

startSSR();
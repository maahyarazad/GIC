import "dotenv/config";

import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import session from "express-session";
import { RegisterRoutes } from "./routes/routes";
import swaggerUi from "swagger-ui-express";
import * as swaggerDocument from "./swagger/swagger.json";
const app = express();
const PORT = process.env.PORT;

import { verifyRequirements } from "./db";
const allowedOrigins = [
  process.env.CLIENT_ORIGIN_DEV ,
  process.env.CLIENT_ORIGIN_PROD
];


app.use(
  cors({

    origin: true, // allow all origins dynamically
    credentials: true, // allow cookies
  })
);


app.use(cookieParser());
app.use(
  session({
    name: "sid", // session cookie name
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // only save sessions when initialized
    cookie: {
      httpOnly: true, // client-side JS cannot access the cookie
      secure: process.env.NODE_ENV === "production", // only over HTTPS in production
      maxAge: 15 * 60 * 1000, // session expires after 5 minutes
    //   sameSite: "lax",
    },
  })
);
app.use(express.json());



RegisterRoutes(app);


async function startServer() {
  try {
    await verifyRequirements();
    // Start your Express app or other server here
  } catch (err) {
    console.error("Startup failed:", err);
    process.exit(1);
  }
}

startServer();



app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, { explorer: true }));


app.use("/uploads", express.static(path.resolve(__dirname, "../file_storage")));

// Serve React build
const reactBuildPath = path.resolve(__dirname, "../public/dist");
app.use(express.static(reactBuildPath));

// SPA fallback (React)
app.get("*", (req: Request, res: Response) => {
  res.sendFile(path.join(reactBuildPath, "index.html"));
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

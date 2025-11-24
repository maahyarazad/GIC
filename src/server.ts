import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import fsReg from "fs";
import nodemailer from "nodemailer";
import { authMiddleware } from "./middleware/auth.middleware";
import cookieParser from "cookie-parser";



import { RegisterRoutes } from "./routes/routes";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import * as swaggerDocument from "../dist/openapi.json";
const app = express();
const PORT = process.env.PORT || 5500;
import { verifyRequirements } from "./db";
app.use(
  cors({
    origin: "http://localhost:5174",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

// User routes
// app.use("/api/users", userRoutes);

RegisterRoutes(app);

// const swaggerSpec = swaggerJsdoc({
//     definition: {
//         openapi: "3.0.0",
//         info: {
//             title: "API Documentation",
//             version: "1.0.0",
//         },
//     },
//     apis: [
//         "./src/routes/*.ts",   // for development
//         "./dist/routes/*.js"   // for production build
//     ]
// });


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

app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, { explorer: true })
);

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("*", (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Generate user ID tail using time in seconds
const createID = (): string => {
    const id = Math.floor(new Date().getTime() / 1000);
    return id.toString().slice(-8);
};

// Define paths
const leadsListPath = "./data/leads_list.json";

// MAIN RUNNER
const runner = async (xPath: string) => {
    const read = await fs.readFile(xPath, "utf-8");
    return JSON.parse(read);
};

// MAIN AUTHOR
const author = async (xPath: string, data: any) => {
    try {
        await fs.writeFile(xPath, JSON.stringify(data, null, 2));
        return { success: true, message: "File written successfully." };
    } catch (error: any) {
        console.error("Error writing file:", error);
        if (error.code === "ENOENT") throw new Error("Path does not exist");
        else if (error.code === "EACCES") throw new Error("Permission denied");
        else throw new Error("Unexpected error writing file");
    }
};

// MULTER STORAGE
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, "public/"),
    filename: async (req, file, cb) => {
        const originalName = path.parse(file.originalname).name;
        const extension = path.extname(file.originalname);
        let newFileName = originalName;
        let counter = 1;

        let filePath = path.join("public", file.originalname);

        try {
            while (true) {
                try {
                    await fs.access(filePath);
                    newFileName = `${originalName} (${counter})`;
                    filePath = path.join("public", `${newFileName}${extension}`);
                    counter++;
                } catch {
                    break;
                }
            }

            // ✅ Must pass two arguments to callback: error and filename
            cb(null, `${newFileName}${extension}`);
        } catch (error) {
            cb(error as Error, ""); // second argument required even if error
        }
    },

});

const upload = multer({ storage });

// DELAY HOOK
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// NODEMAILER TRANSPORTER
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const baseMailOptions = {
    from: `"CRM" <${process.env.SMTP_SENDER}>`,
    to: "",
    bcc: "",
};

// Email route
app.post("/email", async (req: Request, res: Response) => {
    const { pdfFileName, pdfFilePath, message } = req.body;

    if (!pdfFilePath || !pdfFileName) {
        return res.status(400).send("Missing file info");
    }

    const mailOptions = {
        ...baseMailOptions,
        subject: "Request for Procurement Agreement",
        text: `Please find the attached PDF document.\n\nMessage: ${message}`,
        attachments: [{ filename: pdfFileName, path: pdfFilePath }],
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).send("Email sent successfully.");
    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).send("Error sending email.");
    }
});

// Fetch route
app.post("/fetch", async (req: Request, res: Response) => {
    try {
        const { data, key, target, path: filePath, command } = req.body;
        if (!filePath || !command) return res.status(400).send("Missing path or command");

        const datapath = `./data/${filePath}.json`;
        const cData = await runner(datapath);
        if (!cData) return res.status(404).json({ message: "Error retrieving data", success: false });

        if (command.includes("get")) {
            if (!key) return res.send(cData);
            const match = cData.find((item: any) => item.id === key);
            return match ? res.send(match) : res.status(404).json({ status: false, message: "Item not found" });
        }

        if (command.includes("create")) {
            data.id = "yUs" + createID();
            cData.push(data);
            await author(datapath, cData);
            return res.status(200).json({ status: true, message: "Success! Page refreshed.", data });
        }

        if (command.includes("update")) {
            const matchIndex = cData.findIndex((item: any) => item.id === key);
            if (matchIndex === -1) return res.status(404).json({ status: false, message: "Item not found" });

            const merged = { ...cData[matchIndex], ...data };
            cData[matchIndex] = merged;
            await author(datapath, cData);
            return res.status(200).json({ status: true, message: "Success! Page refreshed.", data: merged });
        }

    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});



// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

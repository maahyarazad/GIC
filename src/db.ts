import mongoose from "mongoose";
import type { Db, Collection, Document } from "mongodb";
import dotenv from "dotenv";

import { UserModel, RefreshTokenModel, LoginLogModel } from "./models/user.model";
import { OrderModel } from "./models/order.model";

dotenv.config();

let database: Db | null = null;
let connect$: Promise<Db> | null = null;



async function _connectToDatabase(): Promise<Db> {
  if (database && mongoose.connection.readyState === 1) {
    return database;
  }

  const dbName = process.env.DB_NAME;
  if (!dbName) {
    throw new Error("DB_NAME environment variable is not defined.");
  }

  // In development talk to the Docker mongo (db_container, published on 127.0.0.1:27017),
  // so local work never writes to the shared cluster. MONGO_URI_LOCAL overrides the default.
  const isDevelopment = process.env.NODE_ENV === "DEVELOPMENT";
  const uri = isDevelopment
    ? process.env.MONGO_URI_LOCAL || "mongodb://localhost:27017"
    : process.env.MONGO_URI;

  if (!uri) {
    throw new Error(
      "No MongoDB URI available. Set MONGO_URI (or MONGO_URI_LOCAL in development)."
    );
  }

  await mongoose.connect(uri, {
    dbName,
    autoIndex: true,
  });

  if (!mongoose.connection.db) {
    throw new Error("Mongoose connected but database reference is unavailable.");
  }

  database = mongoose.connection.db;
  console.log(
    `Connected to database: ${database.databaseName} (${isDevelopment ? "local" : "remote"})`
  );
  return database;
}

export async function connectToDatabase(): Promise<Db> {
  connect$ ??= _connectToDatabase();
  return await connect$;
}

/**
 * Temporary compatibility helper for non-migrated files.
 * Prefer using Mongoose models directly in new code.
 */
export function getCollection<T extends Document>(collectionName: string): Collection<T> {
  if (!mongoose.connection.db) {
    throw new Error("Database not connected.");
  }

  return mongoose.connection.db.collection<T>(collectionName);
}

export async function closeDatabaseConnection(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    database = null;
    connect$ = null;
    console.log("Database connection closed");
  }
}

export async function verifyRequirements(): Promise<void> {
  await connectToDatabase();

  await verifyUsersCollection();
  await verifyOrdersCollection();

  console.log("All database requirements verified successfully");
}

async function verifyUsersCollection(): Promise<void> {
  const count = await UserModel.estimatedDocumentCount();
  if (count === 0) {
    console.warn("Users collection is empty. Please ensure sample data is loaded.");
  }

  await UserModel.syncIndexes();
  await RefreshTokenModel.syncIndexes();
  await LoginLogModel.syncIndexes();

  console.log("User-related indexes verified successfully");
}

async function verifyOrdersCollection(): Promise<void> {
  const count = await OrderModel.estimatedDocumentCount();
  if (count === 0) {
    console.warn("Orders collection is empty. Please ensure sample data is loaded.");
  }

  await OrderModel.syncIndexes();
  console.log("Order indexes verified successfully");
}

export { mongoose };

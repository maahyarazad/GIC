import mongoose from "mongoose";
import type { Db, Collection, Document } from "mongodb";
import dotenv from "dotenv";

import { UserModel, RefreshTokenModel, LoginLogModel } from "./models/user.model";
import { OrderModel } from "./models/order.model";

dotenv.config();

let database: Db | null = null;
let connect$: Promise<Db> | null = null;

function buildMongoUri(): string {
  const user = process.env.MONGO_USER;
  const password = process.env.MONGO_PASSWORD;

  if (!user || !password) {
    throw new Error("MONGO_USER or MONGO_PASSWORD is not defined.");
  }

  return `mongodb+srv://${user}:${password}@cluster0.ooeuiqe.mongodb.net/?appName=Cluster0`;
}

async function _connectToDatabase(): Promise<Db> {
  if (database && mongoose.connection.readyState === 1) {
    return database;
  }

  const dbName = process.env.DB_NAME;
  if (!dbName) {
    throw new Error("DB_NAME environment variable is not defined.");
  }

  await mongoose.connect(buildMongoUri(), {
    dbName,
    autoIndex: true,
  });

  if (!mongoose.connection.db) {
    throw new Error("Mongoose connected but database reference is unavailable.");
  }

  database = mongoose.connection.db;
  console.log(`Connected to database: ${database.databaseName}`);
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

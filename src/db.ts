import { MongoClient, Db, Collection, Document } from "mongodb";
import dotenv from "dotenv";
dotenv.config();



let client: MongoClient;
let database: Db;

async function _connectToDatabase(): Promise<Db> {
  // Return existing connection if already established
  // This prevents creating multiple connections unnecessarily
  if (database) {
    return database;
  }

  // Retrieve MongoDB connection string from environment variables
  const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.ooeuiqe.mongodb.net/?appName=Cluster0`;

  if (!uri) {
    throw new Error(
      "MONGODB_URI environment variable is not defined. Please check your .env file and ensure it contains a valid MongoDB connection string."
    );
  }

  try {
    // Create new MongoDB client instance
    client = new MongoClient(uri);

    // Connect to MongoDB
    await client.connect();

    // Get reference to the sample_mflix database
    database = client.db(`${process.env.DB_NAME}`);

    console.log(`Connected to database: ${database.databaseName}`);

    return database;
  } catch (error) {
    throw error;
  }
}

let connect$: Promise<Db>;


/**
 * Establishes connection to MongoDB by using the connection string from environment variables
 *
 * @returns Promise<Db> - The connected database instance
 * @throws Error if connection fails or if MONGODB_URI is not provided
 */
export async function connectToDatabase(): Promise<Db> {
  // connect$ only gets assigned exactly once on the first request, ensuring all subsequent requests use the same connect$ promise.
  connect$ ??= _connectToDatabase();
  return await connect$;
}

/**
 * Gets a reference to a specific collection in the database
 *
 * @param collectionName - Name of the collection to access
 * @returns Collection instance
 * @throws Error if database is not connected
 */
export function getCollection<T extends Document>(
  collectionName: string
): Collection<T> {
  if (!database) {
    throw new Error("Database not connected.");
  }

  return database.collection(collectionName);
}

/**
 * Closes the database connection
 * This should be called when the application is shutting down
 */
export async function closeDatabaseConnection(): Promise<void> {
  if (client) {
    await client.close();
    console.log("Database connection closed");
  }
}



export async function verifyRequirements(): Promise<void> {
  try {
    const db = await connectToDatabase();

    await verifyUsersCollection(db);
    await verifyOrdersCollection(db);
    // Add more verification calls here for other collections as needed

    console.log("All database requirements verified successfully");
  } catch (error) {
    console.error("Requirements verification failed:", error);
    throw error;
  }
}



async function verifyUsersCollection(db: Db): Promise<void> {
  const usersCollection = db.collection("users");

  // Check if collection has documents
  const userCount = await usersCollection.estimatedDocumentCount();

  if (userCount === 0) {
    console.warn("Users collection is empty. Please ensure sample data is loaded.");
  }

  // Create indexes as needed, e.g., unique index on email
  try {
    await usersCollection.createIndex(
      { email: 1 },
      {
        unique: true,
        name: "unique_email_index",
        background: true,
      }
    );
    console.log("Unique index created on email for users collection");
  } catch (error) {
    console.error("Could not create unique index on email:", error);
  }
}


async function verifyOrdersCollection(db: Db): Promise<void> {
  const ordersCollection = db.collection("orders");

  const orderCount = await ordersCollection.estimatedDocumentCount();

  if (orderCount === 0) {
    console.warn("Orders collection is empty. Please ensure sample data is loaded.");
  }

  // Create indexes if required
  try {
    await ordersCollection.createIndex(
      { userId: 1 },
      {
        name: "userId_index",
        background: true,
      }
    );
    console.log("Index on userId created for orders collection");
  } catch (error) {
    console.error("Could not create index on userId:", error);
  }
}

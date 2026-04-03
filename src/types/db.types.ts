// models/db.types.ts (internal only - NEVER used in controllers)
import { ObjectId } from "mongodb";

export interface BaseModel {
  _id?: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LogChangeModel {
  _id?: ObjectId;
  targetId: ObjectId;
  lastModifiedBy: ObjectId;
  collection: string;
  message: string;
  createdAt?: Date;
}
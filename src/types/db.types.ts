import { ObjectId } from "mongodb";

export interface BaseDbModel {
  _id?: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LogChangeDbModel extends BaseDbModel {
  targetId: ObjectId;
  lastModifiedBy: ObjectId;
  collection: string;
  message: string;
}

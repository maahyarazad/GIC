import { LogChangeModel } from "../types/base.types";
import { mapId } from "./objectId.mapper";

export interface LogWithUser extends LogChangeModel {
  userDetails?: {
    name?: string;
    email?: string;
    role?: string;
  };
}

export const mapLogChange = (doc: any): LogWithUser => ({
  _id: mapId(doc?._id),
  targetId: mapId(doc.targetId)!,
  lastModifiedBy: mapId(doc.lastModifiedBy)!,
  collection: doc.collection,
  message: doc.message,
  createdAt: doc.createdAt,
  userDetails: doc.userDetails
    ? {
        name: doc.userDetails.name,
        email: doc.userDetails.email,
        role: doc.userDetails.role,
      }
    : undefined,
});

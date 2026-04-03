import { Schema, model, models, Types } from "mongoose";

export interface LogChangeDocument {
  targetId: Types.ObjectId;
  lastModifiedBy: Types.ObjectId;
  collection: string;
  message: string;
  createdAt?: Date;
}

const LogChangeSchema = new Schema<LogChangeDocument>(
  {
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    lastModifiedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    collection: { type: String, required: true, trim: true, index: true },
    message: { type: String, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

export const LogChangeModel = models.LogChange || model<LogChangeDocument>("LogChange", LogChangeSchema, "log_change");

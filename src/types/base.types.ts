import { ObjectId } from "mongodb";

/* ============================================================
   BASE MODEL WITH TIMESTAMPS
   ============================================================ */
export interface BaseModel {
  _id?: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

/* ============================================================
   SORT MODEL (Global)
   ============================================================ */
export type SortOrder = "asc" | "desc";

export type Sort<T = any> = {
  [K in keyof T]?: 1 | -1;
};


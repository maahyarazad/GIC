export interface BaseModel {
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LogChangeModel extends BaseModel {
  targetId: string;
  lastModifiedBy: string;
  collection: string;
  message: string;
}

export type SortOrder = "asc" | "desc";

export type Sort<T = any> = {
  [K in keyof T]?: 1 | -1;
};

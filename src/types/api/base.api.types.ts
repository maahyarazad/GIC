/**
 * Mongo ObjectId represented as a string in API contracts.
 * Example: 507f1f77bcf86cd799439011
 */
export type ApiObjectId = string;

/**
 * @tsoaModel
 */
export interface BaseApiModel {
  _id?: ApiObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
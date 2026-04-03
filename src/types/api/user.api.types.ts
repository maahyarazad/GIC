import { BaseApiModel, ApiObjectId } from "./base.api.types";
import { SortOrder } from "../base.types";

export interface SocialLinkDto {
  platform: string;
  url: string;
}

export type UserSortKey = "name" | "email" | "createdAt" | "role";

/**
 * @tsoaModel
 */
export interface UserResponse extends BaseApiModel {
  name: string;
  email: string;
  phone?: string;
  role?: "user" | "admin" | "superadmin";
  orders?: ApiObjectId[];
  addresses?: ApiObjectId[];
  authorize: boolean;
  googleId?: string;
  facebookId?: string;
  avatar?: string;
  profile?: {
    photo?: string;
    title?: string;
    description?: string;
    socialLinks?: SocialLinkDto[];
  };
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  role?: "user" | "admin";
  authorize: boolean;
}

export interface UpdateUserRequest {
  _id?: ApiObjectId;
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  role?: "user" | "admin" | "superadmin";
  authorize?: boolean;
  profile?: {
    photo?: string;
    title?: string;
    description?: string;
    socialLinks?: SocialLinkDto[];
  };
}

export interface AuthUserResponse {
  _id: string;
  name: string;
  email: string;
  role: string;
  token: string;
}

export type RawUserSearchQuery = {
  q?: string;
  role?: string;
  email?: string;
  limit?: string;
  skip?: string;
  sortBy?: UserSortKey | string;
  sortOrder?: SortOrder;
};
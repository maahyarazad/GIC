import { BaseModel, Sort, SortOrder } from "./base.types";

export interface SocialLink {
  platform: string;
  url: string;
}

export interface UserProfile {
  photo?: string;
  title?: string;
  description?: string;
  socialLinks?: SocialLink[];
}

export type UserRole = "user" | "admin" | "superadmin";
export type UserSortKey = "name" | "email" | "createdAt" | "role";

export interface User extends BaseModel {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role?: UserRole;
  orders?: string[];
  addresses?: string[];
  authorize: boolean;
  googleId?: string;
  facebookId?: string;
  avatar?: string;
  profile?: UserProfile;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  role?: "user" | "admin";
  authorize?: boolean;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  role?: UserRole;
  authorize?: boolean;
  profile?: UserProfile;
}

export interface AuthUser {
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

export type UserFilter = {
  $text?: { $search: string };
  role?: string;
  email?: { $regex: RegExp };
  name?: { $regex: RegExp };
};

export interface Comment extends BaseModel {
  userId: string;
  text: string;
  date: Date;
}

export interface CommentInfo {
  _id?: string;
  userName: string;
  userEmail: string;
  text: string;
  date: Date;
}

export interface LoginModel {
  userName: string;
  userEmail: string;
  password: string;
  rememberMe: boolean;
}

export type CommentSortKey = "date" | "userId";
export type CommentSort = Sort<{ date: Date; userId: string }>;

export interface Address extends BaseModel {
  userId: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  isDefault?: boolean;
}

export interface LoginLogModel {
  userId: string;
  type: "login";
  createdAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  macAddress?: string;
}

export interface RefreshTokenModel {
  userId: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
}

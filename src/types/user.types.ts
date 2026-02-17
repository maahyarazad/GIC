import { ObjectId } from "mongodb";
import { BaseModel, SortOrder, Sort } from "./base.types";

export interface SocialLink {
  platform: string; // e.g., "facebook", "linkedin", "twitter"
  url: string;
}

export type UserSortKey = "name" | "email" | "createdAt" | "role";
/* ============================================================
   USER DOCUMENT
   ============================================================ */
export interface User extends BaseModel {
  name: string;
  email: string;
  password?: string; 
  phone?: string;
  role?: "user" | "admin" | "superadmin";
  orders?: ObjectId[];    
  addresses?: ObjectId[]; 
  authorize: boolean;
  // Social login fields
  googleId?: string;
  facebookId?: string;

  // Optional avatar
  avatar?: string;
  profile?: {
    photo?: string;           // profile picture URL
    title?: string;           // professional / personal title
    description?: string;     // bio or description
    socialLinks?: SocialLink[]; // array of social links
  };

}

/* API REQUEST TYPES (USER) */
export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  role?: "user" | "admin";
    authorize: boolean;
}

export interface UpdateUserRequest extends BaseModel{
  name?: string;
  email?: string;
  password?: string;
    phone?: string;
    role?: "user" | "admin" | "superadmin";
    authorize?: boolean;
     profile?: {
    photo?: string;           // profile picture URL
    title?: string;           // professional / personal title
    description?: string;     // bio or description
    socialLinks?: SocialLink[]; // array of social links
  };
}

/* Auth Returned User */
export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  token: string;
}

/* User search query */
export type RawUserSearchQuery = {
  q?: string;
  role?: string;
  email?: string;
  limit?: string;
  skip?: string;
  sortBy?: UserSortKey | string;
  sortOrder?: SortOrder;
};

/* MongoDB filter for users */
export type UserFilter = {
  $text?: { $search: string };
  role?: string;
  email?: { $regex: RegExp };
  name?: { $regex: RegExp };  // Add this line for name filtering
};

/* ============================================================
   COMMENT DOCUMENT
   ============================================================ */
export interface Comment extends BaseModel {
  userId: ObjectId;
  text: string;
  date: Date;
}

/* Aggregation response with user info */
export interface CommentInfo {
  _id?: string;
  userName: string;
  userEmail: string;
  text: string;
  date: Date;
}


export interface LoginModel{
  userName: string;
  userEmail: string;
  password: string;
  rememberMe: boolean;
}

/* Sorting fields for comments */
export type CommentSortKey = "date" | "userId";

export type CommentSort = Sort<{
  date: Date;
  userId: ObjectId;
}>;


export interface Address extends BaseModel {
  userId: ObjectId;
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
  userId: ObjectId;    
  type: "login" ;
  createdAt?: Date;    
  ipAddress?: string; 
  userAgent?: string;  
  macAddress?: string;  
}


export interface RefreshTokenModel {
  userId: ObjectId;
  token: string;
  createdAt: Date;
  expiresAt: Date;
}


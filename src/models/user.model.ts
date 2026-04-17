import { Schema, model, models, Types } from "mongoose";
import { SocialLink, UserProfile } from "../types/user.types";

export interface UserDocument {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role?: "user" | "admin" | "superadmin";
  orders?: Types.ObjectId[];
  addresses?: Types.ObjectId[];
  authorize: boolean;
  requirePasswordChange:boolean;
  googleId?: string;
  facebookId?: string;
  avatar?: string;
  profile?: UserProfile;
  createdAt?: Date;
  updatedAt?: Date;
    remarks?: string | null;
}

export interface CommentDocument {
  userId: Types.ObjectId;
  text: string;
  date: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AddressDocument {
  userId: Types.ObjectId;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  isDefault?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LoginLogDocument {
  userId: Types.ObjectId;
  type: "login";
  createdAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  macAddress?: string;
}

export interface RefreshTokenDocument {
  userId: Types.ObjectId;
  token: string;
  createdAt: Date;
  expiresAt: Date;
}

const SocialLinkSchema = new Schema<SocialLink>(
  {
    platform: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const UserProfileSchema = new Schema<UserProfile>(
  {
    photo: { type: String, default: undefined },
    title: { type: String, default: undefined },
    description: { type: String, default: undefined },
    socialLinks: { type: [SocialLinkSchema], default: undefined },
  },
  { _id: false }
);

const UserSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    password: { type: String, default: undefined },
    phone: { type: String, default: undefined },
    role: { type: String, enum: ["user", "admin", "superadmin"], default: "user", index: true },
    orders: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    addresses: [{ type: Schema.Types.ObjectId, ref: "Address" }],
    authorize: { type: Boolean, required: true, default: false },
    requirePasswordChange: { type: Boolean, required: true, default: true },
    googleId: { type: String, default: undefined, index: true },
    facebookId: { type: String, default: undefined, index: true },
    avatar: { type: String, default: undefined },
    profile: { type: UserProfileSchema, default: undefined },
    remarks: { type: String, required: false, default: "" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const CommentSchema = new Schema<CommentDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    text: { type: String, required: true, trim: true },
    date: { type: Date, required: true, default: Date.now },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const AddressSchema = new Schema<AddressDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, default: undefined, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, default: undefined, trim: true },
    postalCode: { type: String, default: undefined, trim: true },
    country: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const LoginLogSchema = new Schema<LoginLogDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["login"], required: true, default: "login" },
    ipAddress: { type: String, default: undefined },
    userAgent: { type: String, default: undefined },
    macAddress: { type: String, default: undefined },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

const RefreshTokenSchema = new Schema<RefreshTokenDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    token: { type: String, required: true, unique: true, index: true },
    createdAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true, index: true },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

export const UserModel = models.User || model<UserDocument>("User", UserSchema);
export const CommentModel = models.Comment || model<CommentDocument>("Comment", CommentSchema);
export const AddressModel = models.Address || model<AddressDocument>("Address", AddressSchema);
export const LoginLogModel = models.LoginLog || model<LoginLogDocument>("LoginLog", LoginLogSchema, "login_log");
export const RefreshTokenModel =
  models.RefreshToken || model<RefreshTokenDocument>("RefreshToken", RefreshTokenSchema, "refresh_tokens");

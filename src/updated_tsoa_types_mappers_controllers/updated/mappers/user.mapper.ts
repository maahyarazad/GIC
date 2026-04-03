import { ObjectId } from "mongodb";
import { User, CreateUserRequest, UpdateUserRequest, LoginLogModel, RefreshTokenModel } from "../types/user.types";
import { mapId, toObjectIdArray } from "./objectId.mapper";

export interface UserDb {
  _id?: ObjectId;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role?: User["role"];
  orders?: ObjectId[];
  addresses?: ObjectId[];
  authorize: boolean;
  googleId?: string;
  facebookId?: string;
  avatar?: string;
  profile?: User["profile"];
  createdAt?: Date;
  updatedAt?: Date;
}

export const mapUser = (doc: any): User => ({
  _id: mapId(doc?._id),
  name: doc.name,
  email: doc.email,
  password: doc.password,
  phone: doc.phone,
  role: doc.role,
  orders: (doc.orders ?? []).map((x: any) => mapId(x)!).filter(Boolean),
  addresses: (doc.addresses ?? []).map((x: any) => mapId(x)!).filter(Boolean),
  authorize: Boolean(doc.authorize),
  googleId: doc.googleId,
  facebookId: doc.facebookId,
  avatar: doc.avatar,
  profile: doc.profile,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

export const mapUsers = (docs: any[] = []): User[] => docs.map(mapUser);

export const mapCreateUserRequestToDb = (body: CreateUserRequest, hashedPassword: string): UserDb => ({
  name: body.name,
  email: body.email.trim().toLowerCase(),
  password: hashedPassword,
  phone: body.phone,
  role: body.role ?? "user",
  authorize: body.authorize ?? false,
  createdAt: new Date(),
});

export const mapUpdateUserRequestToDb = (body: UpdateUserRequest): Partial<UserDb> => ({
  ...(body.name !== undefined ? { name: body.name } : {}),
  ...(body.email !== undefined ? { email: body.email.trim().toLowerCase() } : {}),
  ...(body.password !== undefined ? { password: body.password } : {}),
  ...(body.phone !== undefined ? { phone: body.phone } : {}),
  ...(body.role !== undefined ? { role: body.role } : {}),
  ...(body.authorize !== undefined ? { authorize: body.authorize } : {}),
  ...(body.profile !== undefined ? { profile: body.profile } : {}),
  updatedAt: new Date(),
});

export const mapLoginLog = (doc: any): LoginLogModel => ({
  userId: mapId(doc.userId)!,
  type: doc.type,
  createdAt: doc.createdAt,
  ipAddress: doc.ipAddress,
  userAgent: doc.userAgent,
  macAddress: doc.macAddress,
});

export const mapRefreshToken = (doc: any): RefreshTokenModel => ({
  userId: mapId(doc.userId)!,
  token: doc.token,
  createdAt: doc.createdAt,
  expiresAt: doc.expiresAt,
});

import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { getCollection } from "../db";
import { RefreshTokenModel } from "../types/user.types";
import { tokenExpiry } from "../config/tokenConfig";

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

export interface AccessTokenPayload {
  userId: string;
  role: string;
  user_profile?: {
    email?: string;
    phone?: string;
    whatsapp?: string;
    firstName?: string;
  };
}

/**
 * Attempts to reissue a fresh access token using the refreshToken cookie.
 *
 * When the access token has expired, this checks for a valid `refreshToken`
 * cookie (both the stored DB record and the JWT signature), issues a new access
 * token, and sets it on the HttpOnly secure `token` cookie via `res`.
 *
 * @returns the decoded payload of the newly issued token, or `null` when no
 *          valid refresh token is available (caller should respond 401).
 */
export async function reissueAccessTokenFromRefresh(
  req: Request,
  res: Response
): Promise<AccessTokenPayload | null> {
  if (!JWT_SECRET || !REFRESH_SECRET) {
    return null;
  }

  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    return null;
  }

  try {
    const refreshCollection =
      getCollection<RefreshTokenModel>("refresh_tokens");

    const tokenDoc = await refreshCollection.findOne({ token: refreshToken });
    if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
      return null;
    }

    const payload = jwt.verify(refreshToken, REFRESH_SECRET) as {
      userId: string;
    };

    const usersCollection = getCollection("users");
    const user = await usersCollection.findOne({
      _id: new ObjectId(payload.userId),
    } as any);
    if (!user) {
      return null;
    }

    const newPayload: AccessTokenPayload = {
      userId: user._id.toString(),
      role: (user as any).role,
      user_profile: {
        email: (user as any).email,
        phone: (user as any).phone,
        whatsapp: (user as any).phone,
        firstName: (user as any).name,
      },
    };

    const newToken = jwt.sign(newPayload, JWT_SECRET, {
      expiresIn: tokenExpiry.access.value,
    });

    const isProd = process.env.NODE_ENV === "PRODUCTION";
    res.cookie("token", newToken, {
      httpOnly: true,
      path: "/",
      maxAge: tokenExpiry.access.seconds * 1000,
      sameSite: isProd ? "none" : "lax",
      secure: true,
    });

    return newPayload;
  } catch (err) {
    console.error("Refresh token reissue failed:", err);
    return null;
  }
}

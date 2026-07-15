import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../types/user.types";
import { reissueAccessTokenFromRefresh } from "./refreshAccessToken";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

export interface AuthRequest extends Request {
  user?: User;
}

const ADMIN_ROLES = ["admin", "procurement"];

export const adminAuthMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
    };

    if (!ADMIN_ROLES.includes(decoded.role)) {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }

    req.user = decoded as unknown as User;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      // Access token expired — try to reissue using the refresh token cookie.
      const reissued = await reissueAccessTokenFromRefresh(req, res);
      if (reissued) {
        if (!ADMIN_ROLES.includes(reissued.role)) {
          return res.status(403).json({ message: "Forbidden: Admins only" });
        }
        req.user = reissued as unknown as User;
        return next();
      }

      return res
        .status(401)
        .json({ message: "Token expired", code: "TOKEN_EXPIRED" });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      // malformed, bad signature, etc.
      return res.status(401).json({ message: "Invalid token" });
    }

    console.error("Admin auth error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
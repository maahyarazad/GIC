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

export const authMiddleware = async (
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

    // decoded.exp is already validated by jwt.verify — no manual check needed
    req.user = decoded as unknown as User; // see note below

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      // Access token expired — try to reissue using the refresh token cookie.
      const reissued = await reissueAccessTokenFromRefresh(req, res);
      if (reissued) {
        req.user = reissued as unknown as User;
        return next();
      }

      return res
        .status(401)
        .json({ message: "Token expired", code: "TOKEN_EXPIRED" });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Invalid token" });
    }

    console.error("Auth middleware error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
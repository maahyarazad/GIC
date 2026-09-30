## Feature - Use refreshToken to renew the token

## Description

1. Update the **`adminauth.middleware.ts`** and **`adminauth.middleware.ts`** files and enable using the refresh token if that is available to reissue new token
2. Update the logic where the token is expired the UI should navigate to login  

```js
      
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../types/user.types";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

export interface AuthRequest extends Request {
  user?: User;
}

export const adminAuthMiddleware = (
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

    if (!["admin", "procurement"].includes(decoded.role)) {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
        //Check if there is a refresh token then issue another token here and assign it to http secure token
      // token was valid but has expired
      return res.status(401).json({ message: "Token expired", code: "TOKEN_EXPIRED" });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      // malformed, bad signature, etc.
      return res.status(401).json({ message: "Invalid token" });
    }

    console.error("Admin auth error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};



```
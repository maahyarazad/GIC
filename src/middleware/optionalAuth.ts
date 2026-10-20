import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../types/user.types";
import { AuthRequest } from "./auth.middleware";

/** Sets req.user when the token cookie is valid; never rejects the request. */
export const optionalAuth = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const token = req.cookies?.token;
  const secret = process.env.JWT_SECRET;
  if (token && secret) {
    try {
      req.user = jwt.verify(token, secret) as unknown as User;
    } catch {
      // Invalid or expired token: treat as a visitor.
    }
  }
  next();
};

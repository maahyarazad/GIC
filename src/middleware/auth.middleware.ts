import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getCollection } from "../db";
import { User } from "../types/user.types";

const JWT_SECRET = process.env.JWT_SECRET;

export interface AuthRequest extends Request {
  user?: User;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }


    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, role: string };





    
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

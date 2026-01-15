import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getCollection } from "../db";
import { User } from "../types/user.types";
import { ObjectId } from "mongodb";
import dotenv from "dotenv";
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

export interface AuthRequest extends Request {
  user?: User;
}

export const adminAuthMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from cookies
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, role: string};


    // Check if role is admin or procurement
    if (!["admin", "procurement"].includes(decoded.role)) {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }

    

    next();
    
  } catch (error) {
    console.error("Admin auth error:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

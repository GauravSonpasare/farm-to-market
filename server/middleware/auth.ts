import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "farm-to-market-jwt-secret";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  id: number;
  email: string;
  role: "farmer" | "buyer" | "admin";
  status: "pending" | "approved" | "blocked";
}

// Extend Express User to include the authenticated user fields
declare global {
  namespace Express {
    interface User extends JwtPayload {}
  }
}

// ─── JWT Helpers ──────────────────────────────────────────────────────────────

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

// ─── Auth Middleware ──────────────────────────────────────────────────────────

/**
 * Reads the JWT from the httpOnly cookie and attaches the user to req.user.
 * Returns 401 if no valid token is found.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// ─── Role Guards ──────────────────────────────────────────────────────────────

export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export function isFarmer(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  // Allow admins to act as farmers for testing/management
  if (req.user.role === "admin") {
    return next();
  }
  if (req.user.role !== "farmer") {
    return res.status(403).json({ message: "Farmer access required" });
  }
  if (req.user.status !== "approved") {
    return res.status(403).json({ message: "Your account is not yet approved by admin." });
  }
  next();
}

export function isBuyer(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "buyer") {
    return res.status(403).json({ message: "Buyer access required" });
  }
  next();
}

/**
 * Allows any of the specified roles.
 * Usage: requireRole("admin", "farmer")
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: `Access restricted to: ${roles.join(", ")}` });
    }
    next();
  };
}

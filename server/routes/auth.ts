import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import passport from "passport";
import { db } from "../db";
import { users } from "../shim-schema";
import { eq } from "drizzle-orm";
import { signToken, requireAuth, type JwtPayload } from "../middleware/auth";

const router = Router();

// ─── POST /api/auth/register ──────────────────────────────────────────────────

router.post("/register", async (req: Request, res: Response) => {
  try {
    const {
      name, email, password, role, phone, location,
      phone2, address, village, district, state, pincode, city,
      yearsExp, farmingType, primaryCrops, farmSize, govtId,
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res
        .status(400)
        .json({ message: "Name, email, password, and role are required" });
    }

    // Only allow farmer or buyer registration (admin is seeded)
    if (!["farmer", "buyer"].includes(role)) {
      return res
        .status(400)
        .json({ message: "Role must be 'farmer' or 'buyer'" });
    }

    // Check if email already exists
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return res
        .status(409)
        .json({ message: "An account with this email already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Buyers get instant approval, farmers need admin approval
    const status = role === "buyer" ? "approved" : "pending";

    // Insert user with extended profile fields
    await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      role,
      status,
      phone:           phone    || null,
      phone2:          phone2   || null,
      location:        location || address || null,
      address:         address  || null,
      village:         village  || null,
      district:        district || null,
      state:           state    || null,
      pincode:         pincode  || null,
      city:            city     || null,
      yearsExperience: yearsExp      || null,
      farmingType:     farmingType   || null,
      primaryCrops:    primaryCrops  || null,
      farmSize:        farmSize      || null,
      govtId:          govtId        || null,
    } as any);

    // Fetch the newly created user
    const [newUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // If buyer, auto-login by setting JWT cookie
    if (role === "buyer") {
      const payload: JwtPayload = {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role as "farmer" | "buyer" | "admin",
        status: newUser.status as "pending" | "approved" | "blocked",
      };

      const token = signToken(payload);

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.status(201).json({
        message: "Registration successful",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          status: newUser.status,
          phone: newUser.phone,
          location: newUser.location,
        },
      });
    }

    // Farmer registration — no auto-login, pending approval
    return res.status(201).json({
      message:
        "Registration successful! Your farmer account is pending admin approval.",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      },
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

router.post("/login", (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate(
    "local",
    { session: false },
    (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Internal server error" });
      }

      if (!user) {
        return res
          .status(401)
          .json({ message: info?.message || "Invalid credentials" });
      }

      // ── Block pending users BEFORE issuing a JWT ──────────────────────────
      if (user.status === "pending") {
        return res.status(403).json({
          message:
            "Your account is pending admin approval. Please wait for an admin to approve your account.",
        });
      }

      // ── Block explicitly blocked users ────────────────────────────────────
      if (user.status === "blocked") {
        return res.status(403).json({
          message:
            "Your account has been blocked. Please contact support.",
        });
      }

      const payload: JwtPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
      };

      const token = signToken(payload);

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.json({
        message: "Login successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          phone: user.phone,
          location: user.location,
        },
      });
    }
  )(req, res, next);
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

router.get("/me", requireAuth, async (req: Request, res: Response) => {
  try {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        status: users.status,
        phone: users.phone,
        location: users.location,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, req.user!.id))
      .limit(1);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user });
  } catch (error: any) {
    console.error("Get user error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── POST /api/auth/logout ───────────────────────────────────────────────────

router.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  return res.json({ message: "Logged out successfully" });
});

export default router;

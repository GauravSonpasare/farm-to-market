import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { users } from "./shim-schema";
import { eq } from "drizzle-orm";
// Note: auth uses 'any' casts throughout due to drizzle-orm dual-installation
// type conflict between root/node_modules and server/node_modules

// ─── Passport Local Strategy ─────────────────────────────────────────────────
// Used only during the login route to validate credentials.

passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async (email, password, done) => {
      try {
        const result = await (db as any)
          .select()
          .from(users as any)
          .where(eq(users.email as any, email))
          .limit(1);
        
        const user = result[0] as {
          id: number;
          name: string;
          email: string;
          password: string;
          role: string;
          status: string;
          location: string | null;
          phone: string | null;
          fcmToken: string | null;
          createdAt: any;
        } | undefined;

        if (!user) {
          return done(null, false, { message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Invalid email or password" });
        }

        // Check if user is blocked
        if (user.status === "blocked") {
          return done(null, false, {
            message: "Your account has been blocked. Contact support.",
          });
        }

        // Check if farmer is still pending approval
        if (user.role === "farmer" && user.status === "pending") {
          return done(null, false, {
            message:
              "Your farmer account is pending admin approval. Please wait.",
          });
        }

        return done(null, {
          id: user.id,
          email: user.email,
          password: user.password,
          role: user.role as "farmer" | "buyer" | "admin",
          status: user.status as "pending" | "approved" | "blocked",
          location: user.location,
          phone: user.phone,
          fcmToken: user.fcmToken,
          createdAt: user.createdAt,
        } as any);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// No serialize/deserialize needed — we use stateless JWT, not sessions.

export default passport;

import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { users } from "./shim-schema";
import { eq } from "drizzle-orm";

// ─── Passport Local Strategy ─────────────────────────────────────────────────
// Used only during the login route to validate credentials.

passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async (email, password, done) => {
      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

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

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// No serialize/deserialize needed — we use stateless JWT, not sessions.

export default passport;

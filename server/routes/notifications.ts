import { Router } from "express";
import { db } from "../db";
import { users, notifications } from "../shim-schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth, isAdmin } from "../middleware/auth";
import { sendPushNotification } from "../lib/firebase";

const router = Router();
router.use(requireAuth);

// ─── REGISTER FCM TOKEN ────────────────────────────────────────────────────────
router.post("/register-token", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Token required" });

    // @ts-ignore
    const userId = req.session.userId;

    await db.update(users).set({ fcmToken: token }).where(eq(users.id, userId));
    res.json({ message: "Token registered successfully" });
  } catch (err) {
    console.error("Token registration error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── GET USER NOTIFICATIONS ──────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.session.userId;
    const userNotifs = await db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    res.json({ notifications: userNotifs });
  } catch (err) {
    console.error("Fetch notifications error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── MARK NOTIFICATION AS READ ───────────────────────────────────────────────
router.patch("/:id/read", async (req, res) => {
  try {
    const notifId = parseInt(req.params.id);
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notifId));

    res.json({ message: "Marked as read" });
  } catch (err) {
    console.error("Mark read error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── ADMIN: SEND MANUAL NOTIFICATION ─────────────────────────────────────────
router.post("/send", isAdmin, async (req, res) => {
  try {
    const { title, body, type, targetRole } = req.body;
    if (!title || !body) return res.status(400).json({ message: "Title and body required" });

    let targetUsers = await db.select().from(users);
    if (targetRole && targetRole !== 'all') {
      targetUsers = targetUsers.filter(u => u.role === targetRole);
    }

    let dispatchCount = 0;
    for (const user of targetUsers) {
      await db.insert(notifications).values({
        userId: user.id,
        message: `${title}: ${body}`,
        type: type || 'admin',
      });

      if (user.fcmToken) {
        await sendPushNotification(user.fcmToken, title, body);
        dispatchCount++;
      }
    }

    res.json({ message: `Notifications dispatched to ${targetUsers.length} users (${dispatchCount} via Push).` });
  } catch (err) {
    console.error("Manual dispatch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

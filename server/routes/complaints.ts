import { Router, Request, Response } from "express";
import { db } from "../db";
import { complaints, users } from "../shim-schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const userId = (req: Request): number => (req.user as any)?.id;

// ─── GET all complaints (public to all authenticated users) ───────────────────
router.get("/", async (req: Request, res: Response) => {
  try {
    const result = await (db as any)
      .select({
        id: complaints.id,
        message: complaints.message,
        status: complaints.status,
        voiceNote: (complaints as any).voiceNote,
        createdAt: complaints.createdAt,
        userName: users.name,
        userRole: users.role,
        userLocation: users.location,
      })
      .from(complaints as any)
      .innerJoin(users as any, eq(complaints.userId as any, users.id as any))
      .orderBy(desc(complaints.createdAt as any));

    res.json({ complaints: result });
  } catch (err) {
    console.error("Fetch complaints error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── POST a new complaint (any authenticated user) ────────────────────────────
router.post("/", async (req: Request, res: Response) => {
  try {
    const { message, voiceNote } = req.body;
    if (!message) return res.status(400).json({ message: "Message is required" });

    const uid = userId(req);
    
    // Insert using orderId=null workaround — complaints schema requires orderId
    // We'll use a dummy orderId of 0 to allow standalone/global complaints
    await (db as any).insert(complaints as any).values({
      userId: uid,
      orderId: 0,
      message,
      voiceNote: voiceNote || null,
      status: "open",
    });

    res.status(201).json({ message: "Complaint submitted" });
  } catch (err) {
    console.error("Submit complaint error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

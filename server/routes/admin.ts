import { Router, Request, Response } from "express";
import { db } from "../db";
import { users, crops, orders, complaints } from "../shim-schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth, isAdmin } from "../middleware/auth";

const router = Router();

// Apply auth & admin check to all routes
router.use(requireAuth, isAdmin);

// ─── User Management ────────────────────────────────────────────────────────

// Get all users
router.get("/users", async (req, res) => {
  try {
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        status: users.status,
        location: users.location,
        phone: users.phone,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    res.json({ users: allUsers });
  } catch (error) {
    console.error("Fetch users error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update user status
router.patch("/users/:id/status", async (req, res) => {
  try {
    const userId = parseInt(req.params.id as string);
    const { status } = req.body;

    if (!["pending", "approved", "blocked"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // better-sqlite3 doesn't support .returning() — update then select separately
    await db
      .update(users)
      .set({ status })
      .where(eq(users.id, userId));

    const [updated] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!updated) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User status updated", user: updated });
  } catch (error) {
    console.error("Update user status error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ─── Crop Management ────────────────────────────────────────────────────────

// Get all crops
router.get("/crops", async (req, res) => {
  try {
    const allCrops = await db
      .select({
        id: crops.id,
        name: crops.name,
        quantity: crops.quantity,
        price: crops.price,
        status: crops.status,
        createdAt: crops.createdAt,
        image: crops.image,
        farmerName: users.name,
        farmerId: crops.farmerId,
      })
      .from(crops)
      .innerJoin(users, eq(crops.farmerId, users.id))
      .orderBy(desc(crops.createdAt));

    res.json({ crops: allCrops });
  } catch (error) {
    console.error("Fetch crops error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update crop status
router.patch("/crops/:id/status", async (req, res) => {
  try {
    const cropId = parseInt(req.params.id as string);
    const { status } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // better-sqlite3 doesn't support .returning() — update then select separately
    await db
      .update(crops)
      .set({ status })
      .where(eq(crops.id, cropId));

    const [updated] = await db
      .select()
      .from(crops)
      .where(eq(crops.id, cropId))
      .limit(1);

    if (!updated) return res.status(404).json({ message: "Crop not found" });

    res.json({ message: "Crop status updated", crop: updated });
  } catch (error) {
    console.error("Update crop status error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ─── Complaint Management ───────────────────────────────────────────────────

// Get all complaints
router.get("/complaints", async (req, res) => {
  try {
    const allComplaints = await db
      .select({
        id: complaints.id,
        orderId: complaints.orderId,
        message: complaints.message,
        status: complaints.status,
        createdAt: complaints.createdAt,
        userName: users.name,
        userRole: users.role,
      })
      .from(complaints)
      .innerJoin(users, eq(complaints.userId, users.id))
      .orderBy(desc(complaints.createdAt));

    res.json({ complaints: allComplaints });
  } catch (error) {
    console.error("Fetch complaints error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Mark complaint as resolved
router.patch("/complaints/:id/status", async (req, res) => {
  try {
    const complaintId = parseInt(req.params.id as string);
    const { status } = req.body;

    if (!["open", "resolved"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // better-sqlite3 doesn't support .returning() — update then select separately
    await db
      .update(complaints)
      .set({ status })
      .where(eq(complaints.id, complaintId));

    const [updated] = await db
      .select()
      .from(complaints)
      .where(eq(complaints.id, complaintId))
      .limit(1);

    if (!updated) return res.status(404).json({ message: "Complaint not found" });

    res.json({ message: "Complaint marked as resolved", complaint: updated });
  } catch (error) {
    console.error("Update complaint status error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;

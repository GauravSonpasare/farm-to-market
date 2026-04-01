import { Router, Request, Response } from "express";
import { db } from "../db";
import { crops, users } from "../shim-schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth, isFarmer } from "../middleware/auth";
import { cropImageUpload } from "../middleware/upload";

const router = Router();

// ─── POST /api/crops ──────────────────────────────────────────────────────────
// Upload a new crop listing (Farmer only)
// Accepts multipart/form-data with an optional "image" file field.

router.post(
  "/",
  requireAuth,
  isFarmer,
  // Parse multipart form; injects req.file with the saved image info
  (req: Request, res: Response, next: Function) => {
    cropImageUpload(req, res, (err: any) => {
      if (err) {
        console.error("[CROPS] Image upload error:", err.message);
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    try {
      console.log("[CROPS] POST /api/crops — body:", JSON.stringify(req.body));
      console.log("[CROPS] Uploaded file:", req.file?.filename || "none");

      // Parse & validate fields from form body
      const { name, description, location } = req.body;
      const quantity = parseFloat(req.body.quantity);
      const price = parseFloat(req.body.price);

      if (!name || !name.trim()) {
        return res.status(400).json({ message: "Crop name is required" });
      }
      if (isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({ message: "Quantity must be a positive number" });
      }
      if (isNaN(price) || price <= 0) {
        return res.status(400).json({ message: "Price must be a positive number" });
      }
      if (description && description.trim().length < 10) {
        return res.status(400).json({ message: "Description must be at least 10 characters" });
      }

      const farmerId = (req.user as any).id as number;

      // Build the image URL: served as a static file at /uploads/crops/<filename>
      const imageUrl = req.file
        ? `/uploads/crops/${req.file.filename}`
        : null;

      console.log("[CROPS] Inserting crop — farmerId:", farmerId, "imageUrl:", imageUrl);

      // better-sqlite3 doesn't support .returning() — insert then select
      await db.insert(crops).values({
        name: name.trim(),
        description: description?.trim() || null,
        location: location?.trim() || null,
        quantity,
        price,
        image: imageUrl,
        farmerId,
        status: "pending",
      });

      const [newCrop] = await db
        .select()
        .from(crops)
        .where(eq(crops.farmerId, farmerId))
        .orderBy(desc(crops.createdAt))
        .limit(1);

      console.log("[CROPS] Crop inserted, id:", newCrop?.id);

      return res.status(201).json({
        message: "Crop uploaded successfully and is pending approval",
        crop: newCrop,
      });
    } catch (error: any) {
      console.error("[CROPS] Crop upload error:", error);
      return res.status(500).json({ message: "Internal server error: " + error.message });
    }
  }
);

// ─── GET /api/crops/me ────────────────────────────────────────────────────────
// Get crops uploaded by the logged-in farmer

router.get("/me", requireAuth, isFarmer, async (req: Request, res: Response) => {
  try {
    const farmerId = (req.user as any).id as number;
    const myCrops = await db
      .select()
      .from(crops)
      .where(eq(crops.farmerId, farmerId))
      .orderBy(desc(crops.createdAt));
    return res.json({ crops: myCrops });
  } catch (error: any) {
    console.error("[CROPS] Get farmer crops error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── GET /api/crops ─────────────────────────────────────────────────────────
// Get all APPROVED crops for the marketplace (any authenticated user)

router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const approvedCrops = await db
      .select({
        id: crops.id,
        farmerId: crops.farmerId,
        name: crops.name,
        description: crops.description,
        quantity: crops.quantity,
        price: crops.price,
        location: crops.location,
        image: crops.image,
        status: crops.status,
        createdAt: crops.createdAt,
        farmerName: users.name,
        farmerLocation: users.location,
      })
      .from(crops)
      .innerJoin(users, eq(crops.farmerId, users.id))
      .where(eq(crops.status, "approved"))
      .orderBy(desc(crops.createdAt));

    return res.json({ crops: approvedCrops });
  } catch (error: any) {
    console.error("[CROPS] Get approved crops error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── GET /api/crops/:id ───────────────────────────────────────────────────────
// Single crop detail with farmer info

router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const cropId = parseInt(req.params.id as string);
    if (isNaN(cropId)) {
      return res.status(400).json({ message: "Invalid crop ID" });
    }

    const [cropDetail] = await db
      .select({
        id: crops.id,
        farmerId: crops.farmerId,
        name: crops.name,
        description: crops.description,
        quantity: crops.quantity,
        price: crops.price,
        location: crops.location,
        image: crops.image,
        status: crops.status,
        createdAt: crops.createdAt,
        farmerName: users.name,
        farmerLocation: users.location,
        farmerPhone: users.phone,
      })
      .from(crops)
      .innerJoin(users, eq(crops.farmerId, users.id))
      .where(eq(crops.id, cropId))
      .limit(1);

    if (!cropDetail) {
      return res.status(404).json({ message: "Crop not found" });
    }

    return res.json({ crop: cropDetail });
  } catch (error: any) {
    console.error("[CROPS] Get crop detail error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── DELETE /api/crops/:id ────────────────────────────────────────────────────
// Delete a crop listing owned by the farmer

router.delete("/:id", requireAuth, isFarmer, async (req: Request, res: Response) => {
  try {
    const cropId = parseInt(req.params.id as string);
    const farmerId = (req.user as any).id as number;

    if (isNaN(cropId)) {
      return res.status(400).json({ message: "Invalid crop ID" });
    }

    // Verify ownership
    const [existingCrop] = await db
      .select()
      .from(crops)
      .where(eq(crops.id, cropId))
      .limit(1);

    if (!existingCrop) {
      return res.status(404).json({ message: "Crop not found" });
    }

    if (existingCrop.farmerId !== farmerId) {
      return res.status(403).json({ message: "Not authorized to delete this crop" });
    }

    // Hard delete crop to clean up bad DB state and prevent buyers from seeing it.
    await db.delete(crops).where(eq(crops.id, cropId));

    return res.json({ message: "Crop deleted successfully" });
  } catch (error: any) {
    console.error("[CROPS] Delete crop error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;

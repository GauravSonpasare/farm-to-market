import { Router } from "express";
import { db } from "../db";
import { marketPrices } from "../shim-schema";
import { requireAuth, isAdmin } from "../middleware/auth";
import { eq, desc } from "drizzle-orm";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const prices = await db.select().from(marketPrices).orderBy(desc(marketPrices.updatedAt));
    res.json({ marketPrices: prices });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", isAdmin, async (req, res) => {
  try {
    const { cropName, price, unit, location } = req.body;

    // Minimal mock upsert detection
    const existing = await db.select().from(marketPrices)
      .where(eq(marketPrices.cropName, cropName));

    const match = existing.find(e => e.location === location);

    if (match) {
      await db.update(marketPrices)
        .set({ price: parseFloat(price.toString()), unit: unit || "kg", updatedAt: new Date() })
        .where(eq(marketPrices.id, match.id));
    } else {
      await db.insert(marketPrices).values({
        cropName,
        price: parseFloat(price.toString()),
        location,
        unit: unit || "kg",
      });
    }

    res.json({ message: "Market price updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

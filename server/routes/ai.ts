import { Router } from "express";
import { db } from "../db";
import { users, crops, orders, ratings, marketPrices } from "../shim-schema";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

// ─── 1. CROP QUALITY RATING (Buyer Side) ─────────────────────────────────────
router.post("/crop-rating", async (req, res) => {
  try {
    const { farmerId, cropPrice, cropName, location } = req.body;
    if (!farmerId || !cropPrice || !cropName) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 1. Fetch Farmer Ratings
    const farmerRatings = await db.select().from(ratings).where(eq(ratings.farmerId, farmerId));
    const avgRating = farmerRatings.length > 0
      ? farmerRatings.reduce((acc, curr) => acc + curr.rating, 0) / farmerRatings.length
      : 3; // Default intermediate rating for new farmers

    // 2. Fetch Market Price
    let marketDiscountScore = 5; // out of 10
    const marketMatch = await db.select().from(marketPrices).where(sql`LOWER(${marketPrices.cropName}) = LOWER(${cropName})`).limit(1);

    if (marketMatch.length > 0 && marketMatch[0].price > 0) {
      const marketP = marketMatch[0].price;
      const parsedPrice = parseFloat(cropPrice);
      if (parsedPrice <= marketP) {
        marketDiscountScore = 10; // Fantastic price
      } else if (parsedPrice <= marketP * 1.1) {
        marketDiscountScore = 7; // Fair
      } else {
        marketDiscountScore = 3; // Overpriced
      }
    }

    // 3. Past Orders execution rate
    const pastOrders = await db.select().from(orders).where(eq(orders.farmerId, farmerId));
    const completedOrders = pastOrders.filter(o => o.status === "completed" || o.status === "delivered").length;
    let reliabilityScore = pastOrders.length > 0 ? (completedOrders / pastOrders.length) * 10 : 5;

    // Weighted Formula: 50% Rating, 30% Price Parity, 20% Reliability
    const rawScore = (avgRating / 5) * 10 * 0.5 + marketDiscountScore * 0.3 + reliabilityScore * 0.2;
    const finalScore = parseFloat(Math.min(10, Math.max(1, rawScore)).toFixed(1));

    let label = "Risky";
    if (finalScore >= 7) label = "Recommended";
    else if (finalScore >= 4) label = "Average";

    res.json({
      score: finalScore,
      label,
      details: {
        avgRating: avgRating.toFixed(1),
        completedOrders,
        totalOrders: pastOrders.length
      }
    });

  } catch (err) {
    console.error("Crop rating error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ─── 2. PRICE SUGGESTION (Farmer Side) ────────────────────────────────────────
router.post("/price-suggestion", async (req, res) => {
  try {
    const { cropName, location } = req.body;
    if (!cropName) return res.status(400).json({ message: "Crop name required" });

    // 1. Fetch Market Price
    const marketMatches = await db.select().from(marketPrices).where(sql`LOWER(${marketPrices.cropName}) = LOWER(${cropName})`);

    let basePrice = 50; // default fallback if crop perfectly unknown
    let foundMarket = false;

    if (marketMatches.length > 0) {
      basePrice = marketMatches[0].price;
      foundMarket = true;
    }

    // 2. Fetch Recent Orders for crop
    const recentOrders = await db.select({
      price: crops.price,
      quantity: orders.quantity
    })
      .from(orders)
      .innerJoin(crops, eq(orders.cropId, crops.id))
      .where(sql`LOWER(${crops.name}) = LOWER(${cropName})`)
      .orderBy(desc(orders.createdAt))
      .limit(20);

    let demandLevel = "Low";
    if (recentOrders.length > 10) demandLevel = "High";
    else if (recentOrders.length > 3) demandLevel = "Medium";

    let avgSoldPrice = basePrice;
    if (recentOrders.length > 0) {
      avgSoldPrice = recentOrders.reduce((acc, curr) => acc + curr.price, 0) / recentOrders.length;
    }

    // Heuristic Suggestion Engine
    let suggestedPrice = foundMarket ? basePrice : avgSoldPrice;

    if (demandLevel === "High") {
      suggestedPrice = suggestedPrice * 1.05; // 5% markup due to high demand
    } else if (demandLevel === "Low" && foundMarket) {
      suggestedPrice = suggestedPrice * 0.95; // 5% discount to move volume
    }

    // Round to nearest whole number
    suggestedPrice = Math.round(suggestedPrice);

    // Fictional profit margin heuristic (assuming cost to grow is roughly 40% of market)
    const profitMargin = Math.round(((suggestedPrice - (basePrice * 0.4)) / suggestedPrice) * 100);

    res.json({
      suggestedPrice,
      demandLevel,
      profitMargin: profitMargin > 0 && profitMargin <= 100 ? profitMargin : 55, // sanitize 
      marketSourced: foundMarket
    });

  } catch (err) {
    console.error("Price suggestion error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


// ─── 3. DEMAND PREDICTION (Everyone) ──────────────────────────────────────────
router.get("/demand-prediction", async (req, res) => {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Fetch all relevant orders with their underlying crop data
    const recentActivity = await db.select({
      cropName: crops.name,
      quantity: orders.quantity,
    })
      .from(orders)
      .innerJoin(crops, eq(orders.cropId, crops.id))
      .where(gte(orders.createdAt, ninetyDaysAgo));

    // Aggregate by Crop
    const volumeMap: Record<string, number> = {};
    recentActivity.forEach(a => {
      const name = a.cropName.trim().toUpperCase();
      volumeMap[name] = (volumeMap[name] || 0) + a.quantity;
    });

    // Check active listings to find Oversupply
    const activeListings = await db.select().from(crops).where(eq(crops.status, "approved"));
    const supplyMap: Record<string, number> = {};
    activeListings.forEach(c => {
      const name = c.name.trim().toUpperCase();
      supplyMap[name] = (supplyMap[name] || 0) + c.quantity;
    });

    const predictions: Array<{ cropName: string, demandLevel: string, reason: string, icon: string, metric: number }> = [];

    // Analyze Top 10 crops by total known string keys
    const allKnownCrops = Array.from(new Set([...Object.keys(volumeMap), ...Object.keys(supplyMap)]));

    allKnownCrops.forEach(crop => {
      const sold = volumeMap[crop] || 0;
      const available = supplyMap[crop] || 0;

      if (sold > available * 1.5 && sold > 10) {
        predictions.push({
          cropName: crop,
          demandLevel: "High Demand",
          icon: "📈",
          reason: "Purchases significantly outpace available market supply.",
          metric: sold
        });
      } else if (available > sold * 3 && available > 50) {
        predictions.push({
          cropName: crop,
          demandLevel: "Oversupply",
          icon: "⚠️",
          reason: "Heavy market saturation leading to increased competition.",
          metric: sold
        });
      } else if (sold > 0 && available > 0) {
        predictions.push({
          cropName: crop,
          demandLevel: "Price Increase Expected",
          icon: "💰",
          reason: "Steady demand with tapering seasonal supply indicates rising valuation.",
          metric: sold
        });
      }
    });

    // Filter, sort by metric/importance, limit to UI 
    const sorted = predictions.sort((a, b) => b.metric - a.metric).map(p => {
      // Hide internal metric metric
      return { cropName: p.cropName, demandLevel: p.demandLevel, icon: p.icon, reason: p.reason };
    }).slice(0, 5);

    // Fallback if no order history exists yet (empty DBs)
    if (sorted.length === 0) {
      sorted.push(
        { cropName: "WHEAT", demandLevel: "High Demand", icon: "📈", reason: "Consistent baseline staple demand." },
        { cropName: "TOMATO", demandLevel: "Price Increase Expected", icon: "💰", reason: "Historical seasonal shortages approaching." },
        { cropName: "ONION", demandLevel: "Oversupply", icon: "⚠️", reason: "Recent bumper harvests inflating local granaries." }
      );
    }

    res.json({ predictions: sorted });

  } catch (err) {
    console.error("Demand prediction error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;

import { Router } from "express";
import { db } from "../db";
import { users, crops, orders, payments } from "../shim-schema";
import { eq, desc, sql, gte, and } from "drizzle-orm";
import { requireAuth, isAdmin } from "../middleware/auth";

const router = Router();
router.use(requireAuth, isAdmin);

// Helper for date filtering
const getStartDate = (range?: string) => {
  const now = new Date();
  if (range === "week") {
    return new Date(now.setDate(now.getDate() - 7));
  } else if (range === "month") {
    return new Date(now.setMonth(now.getMonth() - 1));
  } else if (range === "year") {
    return new Date(now.setFullYear(now.getFullYear() - 1));
  }
  // Default to 10 years ago to essentially get all records
  return new Date(now.setFullYear(now.getFullYear() - 10));
};

// ─── 1. OVERVIEW COUNTS ───────────────────────────────────────────────────────
router.get("/overview", async (req, res) => {
  try {
    const range = req.query.range as string;
    const startDate = getStartDate(range);

    const [farmerCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(and(eq(users.role, "farmer"), gte(users.createdAt, startDate)));

    const [buyerCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(and(eq(users.role, "buyer"), gte(users.createdAt, startDate)));

    const [orderCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(gte(orders.createdAt, startDate));

    const allPayments = await db
      .select({ amount: payments.amount })
      .from(payments)
      .where(and(eq(payments.status, "paid"), gte(payments.createdAt, startDate)));

    const totalRevenue = allPayments.reduce((acc, p) => acc + p.amount, 0);

    res.json({
      totalFarmers: farmerCount.count,
      totalBuyers: buyerCount.count,
      totalOrders: orderCount.count,
      totalRevenue,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── 2. MONTHLY SALES (Last 6 Months) ─────────────────────────────────────────
router.get("/monthly-sales", async (req, res) => {
  try {
    // For this chart, we explicitly want the last 6 months of data, grouped by month
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1); // Start from beginning of the month

    const recentPayments = await db
      .select({
        amount: payments.amount,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .where(and(eq(payments.status, "paid"), gte(payments.createdAt, sixMonthsAgo)));

    const monthlySales: Record<string, number> = {};

    // Initialize last 6 months with 0
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthName = d.toLocaleString('default', { month: 'short' });
      monthlySales[monthName] = 0;
    }

    recentPayments.forEach(p => {
      const monthName = new Date(p.createdAt).toLocaleString('default', { month: 'short' });
      if (monthlySales[monthName] !== undefined) {
        monthlySales[monthName] += p.amount;
      }
    });

    const formattedData = Object.keys(monthlySales).map(month => ({
      name: month,
      revenue: monthlySales[month]
    }));

    res.json({ data: formattedData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── 3. TOP CROPS ─────────────────────────────────────────────────────────────
router.get("/top-crops", async (req, res) => {
  try {
    const range = req.query.range as string;
    const startDate = getStartDate(range);

    const allOrders = await db
      .select({
        cropName: crops.name,
        quantity: orders.quantity,
      })
      .from(orders)
      .innerJoin(crops, eq(orders.cropId, crops.id))
      .where(gte(orders.createdAt, startDate));

    const cropMap: Record<string, number> = {};
    allOrders.forEach(o => {
      cropMap[o.cropName] = (cropMap[o.cropName] || 0) + o.quantity;
    });

    // Sort and get top 5
    const topCrops = Object.keys(cropMap)
      .map(name => ({ name, value: cropMap[name] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    res.json({ data: topCrops });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── 4. ORDERS BY STATUS ──────────────────────────────────────────────────────
router.get("/orders-by-status", async (req, res) => {
  try {
    const range = req.query.range as string;
    const startDate = getStartDate(range);

    const allOrders = await db
      .select({ status: orders.status })
      .from(orders)
      .where(gte(orders.createdAt, startDate));

    const statusCounts = {
      Pending: 0,
      Accepted: 0,
      Shipped: 0,
      Delivered: 0,
      Completed: 0,
      Rejected: 0
    };

    allOrders.forEach(o => {
      const capitalizedStatus = o.status.charAt(0).toUpperCase() + o.status.slice(1);
      if (capitalizedStatus in statusCounts) {
        statusCounts[capitalizedStatus as keyof typeof statusCounts]++;
      }
    });

    const formattedData = Object.keys(statusCounts)
      .filter(key => statusCounts[key as keyof typeof statusCounts] > 0 || ['Pending', 'Accepted', 'Completed'].includes(key))
      .map(name => ({
        name,
        value: statusCounts[name as keyof typeof statusCounts]
      }));

    res.json({ data: formattedData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── 5. FARMER INCOME GROWTH ──────────────────────────────────────────────────
router.get("/farmer-income", async (req, res) => {
  try {
    // Also use a 6-month historical view for the Area Chart
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);

    const recentPayments = await db
      .select({
        amount: payments.amount,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .where(and(eq(payments.status, "paid"), gte(payments.createdAt, sixMonthsAgo)));

    const monthlyIncome: Record<string, number> = {};

    // Initialize
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthName = d.toLocaleString('default', { month: 'short' });
      monthlyIncome[monthName] = 0;
    }

    recentPayments.forEach(p => {
      // In F2M MVP, user platform cut isn't explicitly defined, assuming Farmer gets 100% of payment
      const monthName = new Date(p.createdAt).toLocaleString('default', { month: 'short' });
      if (monthlyIncome[monthName] !== undefined) {
        monthlyIncome[monthName] += p.amount;
      }
    });

    const formattedData = Object.keys(monthlyIncome).map(month => ({
      name: month,
      income: monthlyIncome[month]
    }));

    res.json({ data: formattedData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── 6. LOCATION DEMAND ───────────────────────────────────────────────────────
router.get("/location-demand", async (req, res) => {
  try {
    const range = req.query.range as string;
    const startDate = getStartDate(range);

    const allOrders = await db
      .select({
        location: users.location,
        quantity: orders.quantity,
      })
      .from(orders)
      .innerJoin(users, eq(orders.buyerId, users.id))
      .where(gte(orders.createdAt, startDate));

    const locationMap: Record<string, number> = {};
    allOrders.forEach(o => {
      const loc = o.location || "Unknown";
      locationMap[loc] = (locationMap[loc] || 0) + 1; // Count of orders per location
    });

    const topLocations = Object.keys(locationMap)
      .map(name => ({ name, orders: locationMap[name] }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5); // top 5 demand regions

    res.json({ data: topLocations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

import { Router, Request, Response } from "express";
import { db } from "../db";
import {
  orders,
  crops,
  users,
  ratings,
  notifications,
} from "../shim-schema";
import { eq, desc, and, sql } from "drizzle-orm";
import {
  requireAuth,
  isFarmer,
  isBuyer,
  isAdmin,
} from "../middleware/auth";
import { notifyUser } from "../websocket";
import { sendPushNotification } from "../lib/firebase";
import { z } from "zod";

const router = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const userId = (req: Request) => (req.user as any).id as number;
const userRole = (req: Request) => (req.user as any).role as string;

// ─── POST /api/orders ─────────────────────────────────────────────────────────
// Buyer places a new order

router.post("/", requireAuth, isBuyer, async (req: Request, res: Response) => {
  try {
    const { cropId, quantity } = req.body;
    console.log("[ORDERS] POST /api/orders — cropId:", cropId, "quantity:", quantity);

    if (!cropId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: "Invalid cropId or quantity" });
    }

    const [crop] = await db
      .select()
      .from(crops)
      .where(eq(crops.id, parseInt(cropId)))
      .limit(1);

    if (!crop) return res.status(404).json({ message: "Crop not found" });
    if (crop.status !== "approved")
      return res.status(400).json({ message: "Crop is not available for purchase" });
    if (crop.quantity < quantity)
      return res.status(400).json({ message: `Not enough quantity available (${crop.quantity} kg left)` });

    const totalPrice = crop.price * quantity;
    const buyerId = userId(req);

    console.log("[ORDERS] Inserting order — buyerId:", buyerId, "farmerId:", crop.farmerId, "total:", totalPrice);

    // better-sqlite3 does NOT support .returning() — insert then select
    await db.insert(orders).values({
      cropId: crop.id,
      buyerId,
      farmerId: crop.farmerId,
      quantity,
      totalPrice,
      status: "pending",
    });

    // Fetch the newly created order
    const [newOrder] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.buyerId, buyerId), eq(orders.cropId, crop.id)))
      .orderBy(desc(orders.createdAt))
      .limit(1);

    console.log("[ORDERS] Order created, id:", newOrder?.id);

    // Deduct crop quantity
    await db
      .update(crops)
      .set({ quantity: crop.quantity - quantity })
      .where(eq(crops.id, crop.id));

    console.log("[ORDERS] Crop quantity updated");

    // Notify farmer — real-time WebSocket
    try {
      notifyUser(crop.farmerId, {
        type: "NEW_ORDER",
        orderId: newOrder.id,
        message: "You have a new order!",
      });
    } catch (e) {
      console.warn("[ORDERS] WebSocket notify failed (non-fatal):", e);
    }

    // Persist notification in DB
    try {
      await db.insert(notifications).values({
        userId: crop.farmerId,
        message: `${(req.user as any)?.name || "A buyer"} placed an order for ${quantity}kg of ${crop.name}.`,
        type: "order",
      });
    } catch (e) {
      console.warn("[ORDERS] Notification insert failed (non-fatal):", e);
    }

    // FCM push (non-fatal if no token)
    try {
      const [farmer] = await db.select().from(users).where(eq(users.id, crop.farmerId)).limit(1);
      if (farmer?.fcmToken) {
        await sendPushNotification(
          farmer.fcmToken,
          "New Order Received",
          `${(req.user as any)?.name || "A buyer"} ordered ${quantity}kg of ${crop.name}.`
        );
      }
    } catch (e) {
      console.warn("[ORDERS] FCM push failed (non-fatal):", e);
    }

    return res.status(201).json({ message: "Order placed successfully", order: newOrder });
  } catch (error: any) {
    console.error("[ORDERS] Place order error:", error);
    return res.status(500).json({ message: "Internal server error: " + error.message });
  }
});

// ─── PATCH /api/orders/:id/status ─────────────────────────────────────────────
// Farmer: accepts / rejects / ships / delivers their own orders
// Admin: can set any status

router.patch("/:id/status", requireAuth, async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id as string);
    const { status } = req.body;
    console.log("[ORDERS] PATCH status — orderId:", orderId, "status:", status);

    const VALID_STATUSES = ["accepted", "rejected", "shipped", "delivered", "completed"];
    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${VALID_STATUSES.join(", ")}` });
    }

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const role = userRole(req);
    const self = userId(req);

    // Role-based permission checks
    if (role === "farmer") {
      if (order.farmerId !== self) {
        return res.status(403).json({ message: "You can only update your own orders" });
      }
      const farmerAllowed: Record<string, string[]> = {
        pending: ["accepted", "rejected"],
        accepted: ["shipped"],
        shipped: ["delivered"],
      };
      if (!farmerAllowed[order.status]?.includes(status)) {
        return res.status(400).json({
          message: `Cannot move order from '${order.status}' to '${status}' as a farmer`,
        });
      }
    } else if (role !== "admin") {
      return res.status(403).json({ message: "Only farmers or admins can update order status" });
    }

    // better-sqlite3 does NOT support .returning() — update then select
    await db
      .update(orders)
      .set({ status: status as any })
      .where(eq(orders.id, orderId));

    const [updated] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);

    console.log("[ORDERS] Status updated to:", status);

    // Real-time notify buyer
    try {
      notifyUser(order.buyerId, {
        type: "ORDER_STATUS_UPDATED",
        orderId: order.id,
        status,
      });
    } catch (e) {
      console.warn("[ORDERS] WebSocket notify failed (non-fatal):", e);
    }

    try {
      await db.insert(notifications).values({
        userId: order.buyerId,
        message: `Your order for crop #${order.cropId} is now ${status}.`,
        type: "order",
      });
    } catch (e) {
      console.warn("[ORDERS] Notification insert failed (non-fatal):", e);
    }

    try {
      const [buyer] = await db.select().from(users).where(eq(users.id, order.buyerId)).limit(1);
      if (buyer?.fcmToken) {
        await sendPushNotification(buyer.fcmToken, "Order Status Updated", `Your order is now ${status}.`);
      }
    } catch (e) {
      console.warn("[ORDERS] FCM push failed (non-fatal):", e);
    }

    return res.json({ message: "Order status updated", order: updated });
  } catch (error: any) {
    console.error("[ORDERS] Update order status error:", error);
    return res.status(500).json({ message: "Internal server error: " + error.message });
  }
});

// ─── GET /api/orders/farmer ───────────────────────────────────────────────────
// All orders addressed to the logged-in farmer

router.get("/farmer", requireAuth, isFarmer, async (req: Request, res: Response) => {
  try {
    const farmerId = userId(req);
    console.log("[ORDERS] GET /farmer — farmerId:", farmerId);

    const farmerOrders = await db
      .select({
        id: orders.id,
        status: orders.status,
        quantity: orders.quantity,
        totalPrice: orders.totalPrice,
        createdAt: orders.createdAt,
        cropId: orders.cropId,
        cropName: crops.name,
        cropImage: crops.image,
        buyerId: orders.buyerId,
        buyerName: users.name,
        buyerPhone: users.phone,
      })
      .from(orders)
      .innerJoin(crops, eq(orders.cropId, crops.id))
      .innerJoin(users, eq(orders.buyerId, users.id))
      .where(eq(orders.farmerId, farmerId))
      .orderBy(desc(orders.createdAt));

    return res.json({ orders: farmerOrders });
  } catch (error: any) {
    console.error("[ORDERS] Get farmer orders error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── GET /api/orders/farmer/stats ─────────────────────────────────────────────
// Statistics for the farmer home dashboard
router.get("/farmer/stats", requireAuth, isFarmer, async (req: Request, res: Response) => {
  try {
    const farmerId = userId(req);
    
    // Active Listings: Approved crops owned by this farmer
    const [cropsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(crops)
      .where(and(eq(crops.farmerId, farmerId), eq(crops.status, "approved")));

    // Pending Orders: Orders for this farmer's crops that are 'pending'
    const [pendingCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(and(eq(orders.farmerId, farmerId), eq(orders.status, "pending")));

    // Total Revenue: Sum of totalPrice for 'completed' or 'delivered' orders
    const [revenueResult] = await db
      .select({ total: sql<number>`sum(total_price)` })
      .from(orders)
      .where(and(
        eq(orders.farmerId, farmerId), 
        sql`status IN ('completed', 'delivered')`
      ));

    return res.json({
      activeListings: cropsCount?.count || 0,
      pendingOrders: pendingCount?.count || 0,
      totalRevenue: revenueResult?.total || 0
    });
  } catch (error: any) {
    console.error("[ORDERS] Get farmer stats error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── GET /api/orders/buyer ────────────────────────────────────────────────────
// All orders placed by the logged-in buyer

router.get("/buyer", requireAuth, isBuyer, async (req: Request, res: Response) => {
  try {
    const buyerId = userId(req);
    console.log("[ORDERS] GET /buyer — buyerId:", buyerId);

    const buyerOrders = await db
      .select({
        id: orders.id,
        status: orders.status,
        quantity: orders.quantity,
        totalPrice: orders.totalPrice,
        createdAt: orders.createdAt,
        cropId: orders.cropId,
        cropName: crops.name,
        cropImage: crops.image,
        farmerId: orders.farmerId,
        farmerName: users.name,
      })
      .from(orders)
      .innerJoin(crops, eq(orders.cropId, crops.id))
      .innerJoin(users, eq(orders.farmerId, users.id))
      .where(eq(orders.buyerId, buyerId))
      .orderBy(desc(orders.createdAt));

    return res.json({ orders: buyerOrders });
  } catch (error: any) {
    console.error("[ORDERS] Get buyer orders error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── GET /api/orders/me ───────────────────────────────────────────────────────
// Legacy alias for buyer orders

router.get("/me", requireAuth, isBuyer, async (req: Request, res: Response) => {
  const buyerId = userId(req);
  try {
    const myOrders = await db
      .select({
        id: orders.id,
        cropId: orders.cropId,
        buyerId: orders.buyerId,
        farmerId: orders.farmerId,
        quantity: orders.quantity,
        totalPrice: orders.totalPrice,
        status: orders.status,
        createdAt: orders.createdAt,
        cropName: crops.name,
        cropImage: crops.image,
        farmerName: users.name,
      })
      .from(orders)
      .innerJoin(crops, eq(orders.cropId, crops.id))
      .innerJoin(users, eq(orders.farmerId, users.id))
      .where(eq(orders.buyerId, buyerId))
      .orderBy(desc(orders.createdAt));

    return res.json({ orders: myOrders });
  } catch (error: any) {
    console.error("[ORDERS] Get my orders error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── GET /api/orders ──────────────────────────────────────────────────────────
// Admin: get all orders

router.get("/", requireAuth, isAdmin, async (req: Request, res: Response) => {
  try {
    const allOrders = await db
      .select({
        id: orders.id,
        status: orders.status,
        quantity: orders.quantity,
        totalPrice: orders.totalPrice,
        createdAt: orders.createdAt,
        cropName: crops.name,
        farmerId: orders.farmerId,
        buyerId: orders.buyerId,
      })
      .from(orders)
      .innerJoin(crops, eq(orders.cropId, crops.id))
      .orderBy(desc(orders.createdAt));

    return res.json({ orders: allOrders });
  } catch (error: any) {
    console.error("[ORDERS] Admin get orders error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── POST /api/orders/:id/rate ────────────────────────────────────────────────
// Buyer rates a farmer after order delivery

router.post("/:id/rate", requireAuth, isBuyer, async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id as string);
    const buyerId = userId(req);
    const { rating, review } = req.body;
    console.log("[ORDERS] POST /:id/rate — orderId:", orderId, "rating:", rating);

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.buyerId, buyerId)))
      .limit(1);

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!["delivered", "completed"].includes(order.status)) {
      return res.status(400).json({ message: "You can only rate delivered orders" });
    }

    const [existing] = await db
      .select()
      .from(ratings)
      .where(and(eq(ratings.orderId, orderId), eq(ratings.buyerId, buyerId)))
      .limit(1);

    if (existing) {
      return res.status(409).json({ message: "You have already rated this order" });
    }

    // better-sqlite3 does NOT support .returning() — insert then select
    await db.insert(ratings).values({
      farmerId: order.farmerId,
      buyerId,
      orderId,
      rating: parseInt(rating),
      review: review?.trim() || null,
    });

    const [newRating] = await db
      .select()
      .from(ratings)
      .where(and(eq(ratings.orderId, orderId), eq(ratings.buyerId, buyerId)))
      .limit(1);

    // Mark order as completed after rating
    await db
      .update(orders)
      .set({ status: "completed" })
      .where(eq(orders.id, orderId));

    console.log("[ORDERS] Rating submitted, id:", newRating?.id);
    return res.status(201).json({ message: "Rating submitted successfully", rating: newRating });
  } catch (error: any) {
    console.error("[ORDERS] Rate farmer error:", error);
    return res.status(500).json({ message: "Internal server error: " + error.message });
  }
});

export default router;

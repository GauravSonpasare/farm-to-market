import { Router, Request, Response } from "express";
import { db } from "../db";
import { messages, orders, users } from "../shim-schema";
import { eq, and, or, asc } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

const router = Router();

// ─── GET /api/chat/:orderId ────────────────────────────────────────────────────
// Load message history for an order.
// Only the farmer or buyer on that order can access it.

router.get("/:orderId", requireAuth, async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.orderId as string);
    const userId = (req.user as any).id as number;

    // Verify the requesting user is a party to this order
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.buyerId !== userId && order.farmerId !== userId) {
      return res.status(403).json({ message: "Access denied: not a party to this order" });
    }

    const history = await db
      .select({
        id: messages.id,
        orderId: messages.orderId,
        senderId: messages.senderId,
        receiverId: messages.receiverId,
        content: messages.content,
        createdAt: messages.createdAt,
        senderName: users.name,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.orderId, orderId))
      .orderBy(asc(messages.createdAt));

    return res.json({ messages: history });
  } catch (error: any) {
    console.error("Get chat history error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;

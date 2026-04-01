import { Router, Request, Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { db } from "../db";
import { payments, orders, crops, users } from "../shim-schema";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth, isBuyer, isFarmer } from "../middleware/auth";

const router = Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

const userId = (req: Request) => (req.user as any).id as number;

// ─── POST /api/payments/create-order ─────────────────────────────────────────
// Buyer initiates payment for an order → creates Razorpay order

router.post("/create-order", requireAuth, isBuyer, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    const buyerId = userId(req);

    if (!orderId) {
      return res.status(400).json({ message: "orderId is required" });
    }

    // Verify the order exists and belongs to this buyer
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, parseInt(orderId)), eq(orders.buyerId, buyerId)))
      .limit(1);

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status !== "pending" && order.status !== "accepted") {
      return res.status(400).json({ message: "Payment is only allowed for pending or accepted orders" });
    }

    // Check if already paid
    const [existingPayment] = await db
      .select()
      .from(payments)
      .where(and(eq(payments.orderId, order.id)))
      .limit(1);

    if (existingPayment && existingPayment.status === "paid") {
      return res.status(409).json({ message: "This order has already been paid for" });
    }

    const amountInPaise = Math.round(order.totalPrice * 100); // Razorpay expects paise

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `order_${order.id}`,
      notes: {
        orderId: String(order.id),
        buyerId: String(buyerId),
      },
    });

    // Upsert a pending payment record
    if (existingPayment) {
      await db
        .update(payments)
        .set({ transactionId: razorpayOrder.id, status: "pending" })
        .where(eq(payments.id, existingPayment.id));
    } else {
      await db.insert(payments).values({
        orderId: order.id,
        amount: order.totalPrice,
        status: "pending",
        transactionId: razorpayOrder.id,
      });
    }

    return res.json({
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
    });
  } catch (error: any) {
    console.error("Create payment order error:", error);
    return res.status(500).json({ message: "Failed to create payment order" });
  }
});

// ─── POST /api/payments/verify ────────────────────────────────────────────────
// Verify Razorpay signature and mark payment as paid

router.post("/verify", requireAuth, isBuyer, async (req: Request, res: Response) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET || "";
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // Mark payment as paid
    await db
      .update(payments)
      .set({ status: "paid", transactionId: razorpay_payment_id })
      .where(eq(payments.transactionId, razorpay_order_id));

    // Update order status to accepted (if it was pending payment)
    // (Order stays "accepted" until farmer ships; payment success doesn't auto-advance)
    // Just record the successful payment

    return res.json({ message: "Payment verified successfully", paymentId: razorpay_payment_id });
  } catch (error: any) {
    console.error("Verify payment error:", error);
    return res.status(500).json({ message: "Payment verification failed" });
  }
});

// ─── GET /api/payments/buyer ──────────────────────────────────────────────────
// All payments made by the buyer

router.get("/buyer", requireAuth, isBuyer, async (req: Request, res: Response) => {
  try {
    const buyerId = userId(req);

    const buyerPayments = await db
      .select({
        id: payments.id,
        amount: payments.amount,
        status: payments.status,
        transactionId: payments.transactionId,
        createdAt: payments.createdAt,
        orderId: orders.id,
        orderStatus: orders.status,
        cropName: crops.name,
        farmerName: users.name,
      })
      .from(payments)
      .innerJoin(orders, eq(payments.orderId, orders.id))
      .innerJoin(crops, eq(orders.cropId, crops.id))
      .innerJoin(users, eq(orders.farmerId, users.id))
      .where(eq(orders.buyerId, buyerId))
      .orderBy(desc(payments.createdAt));

    return res.json({ payments: buyerPayments });
  } catch (error: any) {
    console.error("Get buyer payments error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── GET /api/payments/farmer ─────────────────────────────────────────────────
// All payments received by the farmer

router.get("/farmer", requireAuth, isFarmer, async (req: Request, res: Response) => {
  try {
    const farmerId = userId(req);

    const farmerPayments = await db
      .select({
        id: payments.id,
        amount: payments.amount,
        status: payments.status,
        transactionId: payments.transactionId,
        createdAt: payments.createdAt,
        orderId: orders.id,
        cropName: crops.name,
        buyerName: users.name,
        quantity: orders.quantity,
      })
      .from(payments)
      .innerJoin(orders, eq(payments.orderId, orders.id))
      .innerJoin(crops, eq(orders.cropId, crops.id))
      .innerJoin(users, eq(orders.buyerId, users.id))
      .where(eq(orders.farmerId, farmerId))
      .orderBy(desc(payments.createdAt));

    return res.json({ payments: farmerPayments });
  } catch (error: any) {
    console.error("Get farmer payments error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;

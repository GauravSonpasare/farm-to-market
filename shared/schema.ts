import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  doublePrecision,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "farmer",
  "buyer",
  "admin",
]);

export const userStatusEnum = pgEnum("user_status", [
  "pending",
  "approved",
  "blocked",
]);

export const cropStatusEnum = pgEnum("crop_status", [
  "pending",
  "approved",
  "rejected",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "accepted",
  "rejected",
  "shipped",
  "delivered",
  "completed",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "paid",
  "pending",
  "refunded",
]);

export const complaintStatusEnum = pgEnum("complaint_status", [
  "open",
  "resolved",
]);

// ─── Tables ───────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default("buyer"),
  status: userStatusEnum("status").notNull().default("pending"),
  location: text("location"),
  phone: text("phone"),
  fcmToken: text("fcm_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const crops = pgTable("crops", {
  id: serial("id").primaryKey(),
  farmerId: integer("farmer_id")
    .references(() => users.id)
    .notNull(),
  name: text("name").notNull(),
  description: text("description"),
  quantity: doublePrecision("quantity").notNull(),
  price: doublePrecision("price").notNull(),
  location: text("location"),
  image: text("image"),
  status: cropStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  cropId: integer("crop_id")
    .references(() => crops.id)
    .notNull(),
  buyerId: integer("buyer_id")
    .references(() => users.id)
    .notNull(),
  farmerId: integer("farmer_id")
    .references(() => users.id)
    .notNull(),
  quantity: doublePrecision("quantity").notNull(),
  totalPrice: doublePrecision("total_price").notNull(),
  status: orderStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .references(() => orders.id)
    .notNull(),
  amount: doublePrecision("amount").notNull(),
  status: paymentStatusEnum("status").notNull().default("pending"),
  transactionId: text("transaction_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  farmerId: integer("farmer_id")
    .references(() => users.id)
    .notNull(),
  buyerId: integer("buyer_id")
    .references(() => users.id)
    .notNull(),
  orderId: integer("order_id")
    .references(() => orders.id)
    .notNull(),
  rating: integer("rating").notNull(),
  review: text("review"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const complaints = pgTable("complaints", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  orderId: integer("order_id")
    .references(() => orders.id)
    .notNull(),
  message: text("message").notNull(),
  status: complaintStatusEnum("status").notNull().default("open"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .references(() => orders.id)
    .notNull(),
  senderId: integer("sender_id")
    .references(() => users.id)
    .notNull(),
  receiverId: integer("receiver_id")
    .references(() => users.id)
    .notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const marketPrices = pgTable("market_prices", {
  id: serial("id").primaryKey(),
  cropName: text("crop_name").notNull(),
  price: doublePrecision("price").notNull(),
  unit: text("unit").notNull().default("kg"),
  location: text("location").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

// Users
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  location: z.string().optional(),
});
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof selectUserSchema>;

// Crops
export const insertCropSchema = createInsertSchema(crops, {
  name: z.string().min(1, "Crop name is required"),
  quantity: z.number().positive("Quantity must be positive"),
  price: z.number().positive("Price must be positive"),
  description: z.string().min(10, "Please provide a detailed description").optional(),
});
export const selectCropSchema = createSelectSchema(crops);
export type InsertCrop = z.infer<typeof insertCropSchema>;
export type Crop = z.infer<typeof selectCropSchema>;

// Orders
export const insertOrderSchema = createInsertSchema(orders, {
  quantity: z.number().positive("Quantity must be positive"),
  totalPrice: z.number().positive("Total price must be positive"),
});
export const selectOrderSchema = createSelectSchema(orders);
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = z.infer<typeof selectOrderSchema>;

// Payments
export const insertPaymentSchema = createInsertSchema(payments, {
  amount: z.number().positive("Amount must be positive"),
});
export const selectPaymentSchema = createSelectSchema(payments);
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = z.infer<typeof selectPaymentSchema>;

// Ratings
export const insertRatingSchema = createInsertSchema(ratings, {
  rating: z.number().int().min(1).max(5),
  review: z.string().optional(),
});
export const selectRatingSchema = createSelectSchema(ratings);
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Rating = z.infer<typeof selectRatingSchema>;

// Complaints
export const insertComplaintSchema = createInsertSchema(complaints, {
  message: z.string().min(1, "Message is required"),
});
export const selectComplaintSchema = createSelectSchema(complaints);
export type InsertComplaint = z.infer<typeof insertComplaintSchema>;
export type Complaint = z.infer<typeof selectComplaintSchema>;

// Notifications
export const insertNotificationSchema = createInsertSchema(notifications, {
  message: z.string().min(1, "Message is required"),
  type: z.string().min(1, "Type is required"),
});
export const selectNotificationSchema = createSelectSchema(notifications);
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = z.infer<typeof selectNotificationSchema>;

// Market Prices
export const insertMarketPriceSchema = createInsertSchema(marketPrices, {
  price: z.number().positive("Price must be positive"),
  cropName: z.string().min(1, "Crop name is required"),
  location: z.string().min(1, "Location is required"),
});
export const selectMarketPriceSchema = createSelectSchema(marketPrices);
export type InsertMarketPrice = z.infer<typeof insertMarketPriceSchema>;
export type MarketPrice = z.infer<typeof selectMarketPriceSchema>;

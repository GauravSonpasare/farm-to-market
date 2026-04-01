/**
 * SQLite-compatible schema — mirrors shared/schema.ts but uses
 * drizzle-orm/sqlite-core instead of drizzle-orm/pg-core.
 * Enums are stored as TEXT columns with runtime checks.
 */
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ─── Tables ───────────────────────────────────────────────────────────────────

export const users = sqliteTable("users", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    role: text("role").notNull().default("buyer"),         // farmer | buyer | admin
    status: text("status").notNull().default("pending"),   // pending | approved | blocked
    location: text("location"),
    phone: text("phone"),
    fcmToken: text("fcm_token"),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const crops = sqliteTable("crops", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    farmerId: integer("farmer_id").notNull().references(() => users.id),
    name: text("name").notNull(),
    description: text("description"),
    quantity: real("quantity").notNull(),
    price: real("price").notNull(),
    location: text("location"),
    image: text("image"),
    status: text("status").notNull().default("pending"), // pending | approved | rejected
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const orders = sqliteTable("orders", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    cropId: integer("crop_id").notNull().references(() => crops.id),
    buyerId: integer("buyer_id").notNull().references(() => users.id),
    farmerId: integer("farmer_id").notNull().references(() => users.id),
    quantity: real("quantity").notNull(),
    totalPrice: real("total_price").notNull(),
    status: text("status").notNull().default("pending"), // pending | accepted | rejected | shipped | delivered | completed
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const payments = sqliteTable("payments", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: integer("order_id").notNull().references(() => orders.id),
    amount: real("amount").notNull(),
    status: text("status").notNull().default("pending"), // paid | pending | refunded
    transactionId: text("transaction_id"),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const ratings = sqliteTable("ratings", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    farmerId: integer("farmer_id").notNull().references(() => users.id),
    buyerId: integer("buyer_id").notNull().references(() => users.id),
    orderId: integer("order_id").notNull().references(() => orders.id),
    rating: integer("rating").notNull(),
    review: text("review"),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const complaints = sqliteTable("complaints", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").notNull().references(() => users.id),
    orderId: integer("order_id").notNull().references(() => orders.id),
    message: text("message").notNull(),
    status: text("status").notNull().default("open"), // open | resolved
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const notifications = sqliteTable("notifications", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").notNull().references(() => users.id),
    message: text("message").notNull(),
    type: text("type").notNull(),
    isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const messages = sqliteTable("messages", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: integer("order_id").notNull().references(() => orders.id),
    senderId: integer("sender_id").notNull().references(() => users.id),
    receiverId: integer("receiver_id").notNull().references(() => users.id),
    content: text("content").notNull(),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const marketPrices = sqliteTable("market_prices", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    cropName: text("crop_name").notNull(),
    price: real("price").notNull(),
    unit: text("unit").notNull().default("kg"),
    location: text("location").notNull(),
    updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// ─── Re-export types to match shared/schema.ts interface ─────────────────────
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Crop = typeof crops.$inferSelect;
export type InsertCrop = typeof crops.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;
export type Rating = typeof ratings.$inferSelect;
export type InsertRating = typeof ratings.$inferInsert;
export type Complaint = typeof complaints.$inferSelect;
export type InsertComplaint = typeof complaints.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type MarketPrice = typeof marketPrices.$inferSelect;
export type InsertMarketPrice = typeof marketPrices.$inferInsert;

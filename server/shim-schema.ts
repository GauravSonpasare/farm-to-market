/**
 * Compatibility shim: routes import tables from "../../shared/schema".
 * We override that path using tsconfig path aliases so they land here instead,
 * getting SQLite tables while still getting Zod validators from the original file.
 *
 * Tables → drizzle-orm/sqlite-core (from ./schema-sqlite)
 * Zod schemas / types → re-exported from original shared/schema.ts
 */

// ─── SQLite Tables (actual DB tables used at runtime) ────────────────────────
export {
    users,
    crops,
    orders,
    payments,
    ratings,
    complaints,
    notifications,
    messages,
    marketPrices,
} from "./schema-sqlite";

// ─── Zod Schemas & TypeScript types (from shared) ────────────────────────────
export {
    insertUserSchema,
    selectUserSchema,
    insertCropSchema,
    selectCropSchema,
    insertOrderSchema,
    selectOrderSchema,
    insertPaymentSchema,
    selectPaymentSchema,
    insertRatingSchema,
    selectRatingSchema,
    insertComplaintSchema,
    selectComplaintSchema,
    insertNotificationSchema,
    selectNotificationSchema,
    insertMarketPriceSchema,
    selectMarketPriceSchema,
} from "../shared/schema";

// ─── TypeScript types (from sqlite schema) ───────────────────────────────────
export type {
    User,
    InsertUser,
    Crop,
    InsertCrop,
    Order,
    InsertOrder,
    Payment,
    InsertPayment,
    Rating,
    InsertRating,
    Complaint,
    InsertComplaint,
    Notification,
    InsertNotification,
    MarketPrice,
    InsertMarketPrice,
} from "./schema-sqlite";

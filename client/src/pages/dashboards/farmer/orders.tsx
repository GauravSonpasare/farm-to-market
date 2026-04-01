import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../hooks/use-auth";
import OrderChat from "../buyer/order-chat";
import {
  Loader2,
  PackageOpen,
  AlertCircle,
  CheckCircle2,
  Check,
  X,
  Truck,
  MessageCircle,
  PackageCheck,
} from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { apiRequest } from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type Order = {
  id: number;
  status: string;
  quantity: number;
  totalPrice: number;
  createdAt: string;
  cropId: number;
  cropName: string;
  cropImage?: string;
  buyerId: number;
  buyerName: string;
  buyerPhone?: string;
};

type ActionState = {
  [orderId: number]: "idle" | "loading";
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700 border-amber-200",
  accepted:  "bg-blue-100 text-blue-700 border-blue-200",
  rejected:  "bg-red-100 text-red-700 border-red-200",
  shipped:   "bg-purple-100 text-purple-700 border-purple-200",
  delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
  completed: "bg-slate-100 text-slate-700 border-slate-200",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${STATUS_COLORS[status] || "bg-slate-100 text-slate-600 border-slate-200"}`}
    >
      {status}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FarmerOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionState, setActionState] = useState<ActionState>({});
  const [notification, setNotification] = useState<string | null>(null);
  const [chatOpenId, setChatOpenId] = useState<number | null>(null);

  // ─── Fetch orders ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await apiRequest("GET", "/api/orders/farmer");
        const data = await res.json();
        setOrders(data.orders || []);
      } catch (err: any) {
        setError(err.message || "Failed to load orders.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrders();
  }, []);

  // ─── Status update handler ─────────────────────────────────────────────────
  const updateStatus = useCallback(async (orderId: number, status: string) => {
    setActionState((prev) => ({ ...prev, [orderId]: "loading" }));
    try {
      const res = await apiRequest("PATCH", `/api/orders/${orderId}/status`, { status });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update status");
      }
      const data = await res.json();
      // Optimistically update local state
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: data.order.status } : o))
      );
      setNotification(`Order #${orderId.toString().padStart(6, "0")} → ${status}`);
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      setNotification(`Error: ${err.message}`);
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setActionState((prev) => ({ ...prev, [orderId]: "idle" }));
    }
  }, []);

  // ─── Loading / Error states ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="w-10 h-10 animate-spin text-green-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
        <p className="text-red-500 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Incoming Orders</h1>
        <p className="text-slate-500 mt-1">
          Manage orders from buyers for your crop listings.
        </p>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-6 right-6 z-50 bg-green-800 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium"
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {orders.length === 0 ? (
        <Card className="border-dashed bg-slate-50/50 shadow-none border-slate-200">
          <CardContent className="flex flex-col items-center justify-center py-24 text-center">
            <PackageOpen size={64} className="text-slate-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-700 mb-2">No orders yet</h3>
            <p className="text-slate-500 max-w-sm">
              Once buyers place orders for your crops, they will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => {
            const isActing = actionState[order.id] === "loading";
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <Card className="overflow-hidden border-slate-200 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row">
                    {/* Crop Image */}
                    <div className="w-full sm:w-36 h-36 shrink-0 bg-slate-100">
                      <img
                        src={order.cropImage || "https://images.unsplash.com/photo-1595856407062-817ab0ecdf35"}
                        alt={order.cropName}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Order Details */}
                    <div className="flex-1 p-5 flex flex-col justify-between">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                            Order #{order.id.toString().padStart(6, "0")}
                          </p>
                          <h3 className="text-lg font-bold text-slate-800">{order.cropName}</h3>
                          <p className="text-sm text-slate-500 mt-0.5">
                            Buyer:{" "}
                            <span className="font-semibold text-slate-700">
                              {order.buyerName}
                            </span>
                            {order.buyerPhone && (
                              <span className="ml-2 text-slate-400">
                                · {order.buyerPhone}
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-slate-500 mt-0.5">
                            Qty:{" "}
                            <span className="font-semibold text-slate-700">
                              {order.quantity} kg
                            </span>{" "}
                            · Total:{" "}
                            <span className="font-bold text-green-700 text-base">
                              ₹{order.totalPrice.toFixed(2)}
                            </span>
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(order.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <StatusBadge status={order.status} />
                      </div>

                      {/* Action Buttons & Chat */}
                      <div className="mt-4 border-t border-slate-100 pt-4 flex flex-wrap justify-between items-center gap-4">
                        <div className="flex flex-wrap gap-2">
                          {order.status === "pending" && (
                          <>
                            <Button
                              onClick={() => updateStatus(order.id, "accepted")}
                              disabled={isActing}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                              size="sm"
                            >
                              {isActing ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Check size={14} />
                              )}
                              Accept
                            </Button>
                            <Button
                              onClick={() => updateStatus(order.id, "rejected")}
                              disabled={isActing}
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50 gap-2"
                              size="sm"
                            >
                              <X size={14} />
                              Reject
                            </Button>
                          </>
                        )}

                        {order.status === "accepted" && (
                          <Button
                            onClick={() => updateStatus(order.id, "shipped")}
                            disabled={isActing}
                            className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
                            size="sm"
                          >
                            {isActing ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Truck size={14} />
                            )}
                            Mark as Shipped
                          </Button>
                        )}

                        {order.status === "shipped" && (
                          <Button
                            onClick={() => updateStatus(order.id, "delivered")}
                            disabled={isActing}
                            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                            size="sm"
                          >
                            {isActing ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <PackageCheck size={14} />
                            )}
                            Mark as Delivered
                          </Button>
                        )}

                        {(order.status === "delivered" || order.status === "completed") && (
                          <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-semibold">
                            <CheckCircle2 size={16} />
                            {order.status === "completed" ? "Completed" : "Delivered"}
                          </div>
                        )}
                        </div>

                        <Button
                          variant="outline"
                          onClick={() => setChatOpenId(chatOpenId === order.id ? null : order.id)}
                          className="text-slate-600 hover:text-green-700 hover:bg-green-50"
                          size="sm"
                        >
                          <MessageCircle size={16} className="mr-2" />
                          Chat
                        </Button>
                      </div>

                      <AnimatePresence>
                        {chatOpenId === order.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-4 overflow-hidden w-full"
                          >
                           <OrderChat 
                             orderId={order.id} 
                             currentUserId={user!.id} 
                             otherPartyId={order.buyerId} 
                             otherPartyName={order.buyerName} 
                           />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

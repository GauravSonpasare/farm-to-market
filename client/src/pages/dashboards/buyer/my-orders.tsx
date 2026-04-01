import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { apiRequest } from "../../../lib/api";
import { useOrderWebSocket } from "../../../hooks/use-websocket";
import { useAuth } from "../../../hooks/use-auth";
import OrderChat from "./order-chat";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  PackageOpen,
  CheckCircle2,
  AlertCircle,
  Star,
  MessageCircle,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

type Order = {
  id: number;
  status: string;
  quantity: number;
  totalPrice: number;
  createdAt: string;
  cropName: string;
  cropImage?: string;
  farmerId: number;
  farmerName: string;
  rated?: boolean;
};

// ─── Order Status Stepper ─────────────────────────────────────────────────────

const STEPS = ["pending", "accepted", "shipped", "delivered", "completed"];

function OrderTimeline({ currentStatus }: { currentStatus: string }) {
  const currentStepIndex = STEPS.indexOf(currentStatus);
  const isRejected = currentStatus === "rejected";

  if (isRejected) {
    return (
      <div className="w-full py-3 mt-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 border border-red-200">
          <X size={16} className="text-red-500" />
          <span className="text-red-700 text-sm font-bold uppercase tracking-wider">Order Rejected</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-4 mt-6">
      <div className="relative flex items-center justify-between w-full">
        {/* Background Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 rounded-full z-0" />

        {/* Active Animated Line */}
        <motion.div
          initial={{ width: 0 }}
          animate={{
            width: `${(Math.max(0, currentStepIndex) / (STEPS.length - 1)) * 100}%`,
          }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 rounded-full z-10"
        />

        {/* Step Dots */}
        {STEPS.map((step, index) => {
          const isCompleted = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;
          return (
            <div key={step} className="relative z-20 flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: isCompleted ? 1 : 0.8, opacity: 1 }}
                transition={{ delay: index * 0.15, type: "spring" }}
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                  isCompleted
                    ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                    : "bg-white border-slate-300 text-slate-300"
                } ${isCurrent ? "ring-4 ring-emerald-100" : ""}`}
              >
                {isCompleted ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <span className="text-xs font-bold">{index + 1}</span>
                )}
              </motion.div>
              <div className="absolute top-10 w-20 text-center">
                <span
                  className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${
                    isCompleted ? "text-emerald-700" : "text-slate-400"
                  }`}
                >
                  {step}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Rating Modal ─────────────────────────────────────────────────────────────

function RatingModal({
  orderId,
  farmerName,
  onClose,
  onSuccess,
}: {
  orderId: number;
  farmerName: string;
  onClose: () => void;
  onSuccess: (orderId: number) => void;
}) {
  const [stars, setStars] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [review, setReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [err, setErr] = useState("");

  async function handleSubmit() {
    if (stars === 0) {
      setErr("Please select a star rating.");
      return;
    }
    setIsSubmitting(true);
    setErr("");
    try {
      const res = await apiRequest("POST", `/api/orders/${orderId}/rate`, {
        rating: stars,
        review: review.trim() || undefined,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to submit rating");
      }
      onSuccess(orderId);
    } catch (e: any) {
      setErr(e.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star size={28} className="text-amber-500 fill-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Rate Your Farmer</h2>
          <p className="text-slate-500 text-sm mt-1">
            How was your experience with <strong>{farmerName}</strong>?
          </p>
        </div>

        {/* Star Input */}
        <div className="flex justify-center gap-3 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.button
              key={star}
              whileHover={{ scale: 1.25 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setStars(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="focus:outline-none"
            >
              <Star
                size={36}
                className={`transition-colors duration-150 ${
                  star <= (hovered || stars)
                    ? "text-amber-400 fill-amber-400"
                    : "text-slate-300"
                }`}
              />
            </motion.button>
          ))}
        </div>

        {/* Review Text */}
        <textarea
          placeholder="Share your experience (optional)…"
          value={review}
          onChange={(e) => setReview(e.target.value)}
          rows={3}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none placeholder-slate-400"
        />

        {/* Error */}
        {err && (
          <p className="text-red-500 text-xs font-medium mt-2">{err}</p>
        )}

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl h-11 gap-2"
        >
          {isSubmitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Star size={16} className="fill-white" />
          )}
          Submit Rating
        </Button>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [chatOpenId, setChatOpenId] = useState<number | null>(null);
  const [ratingModal, setRatingModal] = useState<{
    orderId: number;
    farmerName: string;
  } | null>(null);

  // ─── Fetch buyer orders ──────────────────────────────────────────────────
  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await apiRequest("GET", "/api/orders/buyer");
        const data = await res.json();
        setOrders(data.orders || []);
      } catch (err: any) {
        setError(err.message || "Failed to load your orders.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrders();
  }, []);

  // ─── WebSocket – live order status updates ───────────────────────────────
  useOrderWebSocket(
    useCallback((msg) => {
      if (msg.type === "ORDER_STATUS_UPDATED") {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === msg.orderId ? { ...o, status: msg.status } : o
          )
        );
      }
    }, [])
  );

  // ─── Rating submitted callback ───────────────────────────────────────────
  function handleRatingSuccess(orderId: number) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: "completed", rated: true } : o
      )
    );
    setRatingModal(null);
  }

  // ─── Loading / Error ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
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
        <h1 className="text-3xl font-bold text-slate-800">My Orders</h1>
        <p className="text-slate-500 mt-1">
          Live tracking of your purchases — updates in real time without refreshing.
        </p>
      </div>

      {/* Empty state */}
      {orders.length === 0 ? (
        <Card className="border-dashed bg-slate-50/50 shadow-none border-slate-200">
          <CardContent className="flex flex-col items-center justify-center py-24 text-center">
            <PackageOpen size={64} className="text-slate-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-700 mb-2">No active orders found</h3>
            <p className="text-slate-500 max-w-sm mb-6">
              You haven't purchased anything yet. Head over to the marketplace to get started.
            </p>
            <Link href="/buyer/browse">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Start Shopping
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 180, damping: 18 }}
            >
              <Card className="overflow-hidden border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row border-b border-slate-100">
                  {/* Crop Image */}
                  <div className="w-full md:w-48 h-40 bg-slate-100 shrink-0">
                    <img
                      src={
                        order.cropImage ||
                        "https://images.unsplash.com/photo-1595856407062-817ab0ecdf35"
                      }
                      alt={order.cropName}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Order Info */}
                  <CardHeader className="flex-1 p-6">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                          Order #{order.id.toString().padStart(6, "0")}
                        </p>
                        <CardTitle className="text-xl text-slate-800">
                          {order.cropName || "Unknown Crop"}
                        </CardTitle>
                        <p className="text-sm text-slate-500 mt-1">
                          Farmer:{" "}
                          <span className="font-semibold text-slate-700">
                            {order.farmerName}
                          </span>
                        </p>
                        <p className="text-sm text-slate-500 font-medium mt-0.5">
                          {order.quantity} kg · Total:{" "}
                          <strong className="text-emerald-700 font-bold text-base">
                            ₹{order.totalPrice.toFixed(2)}
                          </strong>
                        </p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-slate-400">Placed On</p>
                        <p className="text-sm text-slate-700 font-medium">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                </div>

                {/* Timeline + Rate Button */}
                <CardContent className="p-6 pt-10 pb-14">
                  <OrderTimeline currentStatus={order.status} />

                  {/* Rate Farmer button (shows after delivered & not yet rated) */}
                  {order.status === "delivered" && !order.rated && (
                    <div className="mt-10 flex justify-end">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <Button
                          onClick={() =>
                            setRatingModal({
                              orderId: order.id,
                              farmerName: order.farmerName,
                            })
                          }
                          className="bg-amber-500 hover:bg-amber-600 text-white gap-2 font-semibold shadow-md shadow-amber-200"
                        >
                          <Star size={16} className="fill-white" />
                          Rate Farmer
                        </Button>
                      </motion.div>
                    </div>
                  )}

                  {/* Already rated */}
                  {(order.status === "completed" || order.rated) && (
                    <div className="mt-10 flex justify-end">
                      <div className="inline-flex items-center gap-2 text-emerald-600 text-sm font-semibold">
                        <CheckCircle2 size={16} />
                        Rated ✓
                      </div>
                    </div>
                  )}

                  {/* Chat Toggle & Chat Box */}
                  <div className="mt-6 border-t border-slate-100 pt-4 flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setChatOpenId(chatOpenId === order.id ? null : order.id)}
                      className="text-slate-600 hover:text-emerald-700 hover:bg-emerald-50"
                    >
                      <MessageCircle size={16} className="mr-2" />
                      Chat with Farmer
                    </Button>
                  </div>
                  <AnimatePresence>
                    {chatOpenId === order.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 overflow-hidden"
                      >
                       <OrderChat 
                         orderId={order.id} 
                         currentUserId={user!.id} 
                         otherPartyId={order.farmerId} 
                         otherPartyName={order.farmerName} 
                       />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Rating Modal */}
      <AnimatePresence>
        {ratingModal && (
          <RatingModal
            orderId={ratingModal.orderId}
            farmerName={ratingModal.farmerName}
            onClose={() => setRatingModal(null)}
            onSuccess={handleRatingSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../../../hooks/use-auth";
import { apiRequest } from "../../../lib/api";
import {
  Loader2,
  ArrowLeft,
  Star,
  MapPin,
  Sparkles,
  CheckCircle,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";

export default function CropDetail({ params }: { params?: { id: string } }) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const [crop, setCrop] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  const [quantityToOrder, setQuantityToOrder] = useState<number>(1);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState("");

  useEffect(() => {
    async function fetchCrop() {
      if (!params?.id) return;
      try {
        console.log("[CROP-DETAIL] Fetching crop id:", params.id);
        const res = await apiRequest("GET", `/api/crops/${params.id}`);
        const data = await res.json();
        setCrop(data.crop);
        console.log("[CROP-DETAIL] Crop loaded:", data.crop?.name);

        // AI rating (non-fatal)
        try {
          const aiRes = await apiRequest("POST", "/api/ai/crop-rating", {
            farmerId: data.crop.farmerId,
            cropPrice: data.crop.price,
            cropName: data.crop.name,
            location: data.crop.location || data.crop.farmerLocation || "Unknown",
          });
          const aiData = await aiRes.json();
          setAiAnalysis(aiData);
        } catch (e) {
          console.warn("[CROP-DETAIL] AI Rating unavailable (non-fatal)");
        }
      } catch (err: any) {
        console.error("[CROP-DETAIL] Failed to load crop:", err);
        setError(err.message || "Failed to load crop details.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchCrop();
  }, [params?.id]);

  const handleOrder = async () => {
    if (!crop || quantityToOrder <= 0 || quantityToOrder > crop.quantity) return;

    setIsOrdering(true);
    setOrderError("");

    try {
      console.log("[CROP-DETAIL] Placing order — cropId:", crop.id, "qty:", quantityToOrder);

      const res = await apiRequest("POST", "/api/orders", {
        cropId: crop.id,
        quantity: quantityToOrder,
      });
      const data = await res.json();
      console.log("[CROP-DETAIL] Order placed successfully, id:", data.order?.id);

      setOrderSuccess(true);
      // Redirect to My Orders after 2.5s
      setTimeout(() => setLocation("/buyer/orders"), 2500);
    } catch (err: any) {
      console.error("[CROP-DETAIL] Order failed:", err);
      setOrderError(err.message || "Failed to place order. Please try again.");
    } finally {
      setIsOrdering(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────────
  if (error || !crop) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 text-lg">{error || "Crop not found"}</p>
        <Button
          variant="outline"
          onClick={() => setLocation("/buyer/browse")}
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────────
  if (orderSuccess) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-full max-w-lg mx-auto bg-white rounded-2xl border border-slate-100 mt-10 shadow-sm">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4"
        >
          <CheckCircle size={32} />
        </motion.div>
        <h2 className="text-2xl font-bold text-slate-800">Order Placed Successfully!</h2>
        <p className="text-slate-500 mt-2">
          Your order has been sent to <strong>{crop.farmerName}</strong>.
        </p>
        <p className="text-sm text-slate-400 mt-4">Redirecting to My Orders...</p>
      </div>
    );
  }

  const isRecommended = aiAnalysis && aiAnalysis.score >= 7.0;

  // ── Main Detail View ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <button
        onClick={() => setLocation("/buyer/browse")}
        className="flex items-center text-slate-500 mb-6 hover:text-emerald-600 transition-colors font-medium text-sm"
      >
        <ArrowLeft size={16} className="mr-1" /> Back to Marketplace
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Left Column: Image & Description ─────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-100 bg-slate-100 h-96 relative">
            <img
              src={crop.image || "https://images.unsplash.com/photo-1595856407062-817ab0ecdf35"}
              alt={crop.name}
              className="w-full h-full object-cover"
            />
            {isRecommended && (
              <div className="absolute top-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2">
                <ShieldCheck size={18} /> Farm-to-Market Certified
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">{crop.name}</h1>
            <div className="flex items-center gap-4 text-slate-500 text-sm mb-6 border-b border-slate-100 pb-6">
              <span className="flex items-center">
                <MapPin size={16} className="mr-1 text-emerald-500" />
                {crop.location || crop.farmerLocation || "Location N/A"}
              </span>
              <span className="text-slate-300">•</span>
              <span>
                Available Stock: <strong className="text-slate-700">{crop.quantity} kg</strong>
              </span>
            </div>

            <h3 className="font-semibold text-lg text-slate-800 mb-3">Description</h3>
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
              {crop.description ||
                "No specific description was provided by the farmer. This crop is verified as listed directly from the farm."}
            </p>
          </div>
        </div>

        {/* ── Right Column: Order Box, AI Widget, Farmer Profile ───────────── */}
        <div className="space-y-6">

          {/* Order box */}
          <div className="bg-white p-6 rounded-2xl border-2 border-emerald-100 shadow-sm">
            <div className="mb-4">
              <span className="text-3xl font-bold text-emerald-700">₹{crop.price}</span>
              <span className="text-slate-500"> / kg</span>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="quantity" className="text-slate-600">
                  Quantity Required (kg)
                </Label>
                <Input
                  id="order-quantity"
                  type="number"
                  min="1"
                  max={crop.quantity}
                  value={quantityToOrder}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setQuantityToOrder(parseFloat(e.target.value) || 0)
                  }
                  className="mt-1 border-slate-200"
                />
                {quantityToOrder > crop.quantity && (
                  <p className="text-red-500 text-xs mt-1">
                    Cannot exceed available stock ({crop.quantity} kg)
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center py-3 border-t border-b border-slate-100">
                <span className="text-slate-500 font-medium">Total Price:</span>
                <span className="text-xl font-bold text-slate-800">
                  ₹{((quantityToOrder || 0) * crop.price).toFixed(2)}
                </span>
              </div>

              {/* Order error */}
              {orderError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  {orderError}
                </div>
              )}

              <Button
                onClick={handleOrder}
                disabled={
                  isOrdering ||
                  quantityToOrder <= 0 ||
                  quantityToOrder > crop.quantity
                }
                className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-sm text-lg py-6"
              >
                {isOrdering ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : null}
                {isOrdering ? "Placing Order..." : "Place Order →"}
              </Button>

              <p className="text-xs text-slate-400 text-center">
                Your order will be confirmed by the farmer.
              </p>
            </div>
          </div>

          {/* AI Rating Widget */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-lg border border-slate-700 text-slate-50 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles size={80} />
            </div>
            <h3 className="font-semibold text-emerald-400 mb-1 flex items-center gap-2">
              <Sparkles size={16} /> AI Quality Analysis
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Auto-calculated based on historic yield data, region climate, and farmer trust score.
            </p>

            {aiAnalysis ? (
              <>
                <div className="flex items-end gap-2 mb-2">
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-4xl font-black"
                  >
                    {aiAnalysis.score}
                  </motion.span>
                  <span className="text-lg text-slate-400 mb-1">/ 10</span>
                </div>
                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden mb-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(aiAnalysis.score / 10) * 100}%` }}
                    transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
                    className={`h-full ${isRecommended
                        ? "bg-emerald-500"
                        : aiAnalysis.score > 4
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                  />
                </div>
                <p className="text-sm">
                  Verdict:{" "}
                  <strong
                    className={
                      isRecommended
                        ? "text-emerald-400"
                        : aiAnalysis.score > 4
                          ? "text-yellow-400"
                          : "text-red-400"
                    }
                  >
                    {aiAnalysis.label}
                  </strong>
                </p>
              </>
            ) : (
              <div className="py-4 text-center text-slate-400 text-sm animate-pulse">
                Analyzing seller reputation...
              </div>
            )}
          </motion.div>

          {/* Farmer Profile Preview */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-4">
              Supplied By
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-xl uppercase">
                {crop.farmerName?.charAt(0) || "F"}
              </div>
              <div>
                <p className="font-bold text-slate-800">{crop.farmerName}</p>
                <div className="flex items-center text-yellow-500 text-sm mt-0.5">
                  <Star size={14} className="fill-current" />
                  <Star size={14} className="fill-current" />
                  <Star size={14} className="fill-current" />
                  <Star size={14} className="fill-current" />
                  <Star size={14} className="text-slate-200" />
                  <span className="text-slate-400 ml-2 text-xs">(4.0)</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-600">
              <p className="flex justify-between">
                <span>Location:</span>
                <strong className="text-slate-800">{crop.farmerLocation || "Unspecified"}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

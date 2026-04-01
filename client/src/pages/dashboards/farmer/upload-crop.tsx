import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import {
  Loader2,
  UploadCloud,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";

type FormValues = {
  name: string;
  description: string;
  location: string;
  quantity: string;
  price: string;
};

export default function FarmerUpload() {
  const [, setLocation] = useLocation();
  const [isUploading, setIsUploading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);

  // Image state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // AI suggestion state
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { name: "", description: "", location: "", quantity: "", price: "" },
  });

  const watchName = watch("name");
  const watchLocation = watch("location");

  // ── AI price suggestion (debounced) ─────────────────────────────────────────
  useEffect(() => {
    const fetchSuggestion = async () => {
      if (watchName?.length > 2 && watchLocation?.length > 2) {
        setIsAiLoading(true);
        try {
          const res = await fetch("/api/ai/price-suggestion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ cropName: watchName, location: watchLocation }),
          });
          if (res.ok) setAiSuggestion(await res.json());
        } catch (e) {
          console.warn("[UPLOAD] AI suggestion unavailable");
        } finally {
          setIsAiLoading(false);
        }
      } else {
        setAiSuggestion(null);
      }
    };
    const t = setTimeout(fetchSuggestion, 800);
    return () => clearTimeout(t);
  }, [watchName, watchLocation]);

  // ── Image picker ─────────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  };

  const clearImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
  };

  // ── Form submit — send as FormData (supports file upload) ───────────────────
  const onSubmit = async (data: FormValues) => {
    setIsUploading(true);
    setServerError("");

    try {
      const formData = new FormData();
      formData.append("name", data.name.trim());
      formData.append("description", data.description.trim());
      formData.append("location", data.location.trim());
      formData.append("quantity", data.quantity);
      formData.append("price", data.price);
      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      console.log("[UPLOAD] Submitting crop via FormData...");

      const res = await fetch("/api/crops", {
        method: "POST",
        credentials: "include",
        body: formData,
        // Do NOT set Content-Type — browser sets it automatically with boundary
      });

      const resData = await res.json();
      console.log("[UPLOAD] Server response:", resData);

      if (!res.ok) {
        throw new Error(resData.message || "Failed to submit crop listing");
      }

      reset();
      clearImage();
      setSuccess(true);
      setTimeout(() => setLocation("/farmer/listings"), 2500);
    } catch (err: any) {
      console.error("[UPLOAD] Submission error:", err);
      setServerError(err.message || "An error occurred while submitting your listing.");
    } finally {
      setIsUploading(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-full">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6"
        >
          <CheckCircle2 size={40} />
        </motion.div>
        <h2 className="text-2xl font-bold text-slate-800">
          Crop Submitted for Approval!
        </h2>
        <p className="text-slate-500 mt-2">
          Your listing is pending admin review. It'll appear on the marketplace once approved.
        </p>
        <p className="text-sm text-slate-400 mt-4">Redirecting to your listings...</p>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────────
  return (
    <Card className="max-w-2xl mx-auto shadow-sm border-slate-200">
      <CardHeader>
        <CardTitle>List a New Crop</CardTitle>
        <CardDescription>
          Fill in the details below. All listings are reviewed by admin before
          appearing on the marketplace.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* Crop Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Crop Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g. Organic Basmati Rice"
              {...register("name", { required: "Crop name is required" })}
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="description"
              rows={4}
              className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
              placeholder="Describe your crop's quality, harvest date, and farming methods used."
              {...register("description", {
                required: "Description is required",
                minLength: { value: 10, message: "Description must be at least 10 characters" },
              })}
            />
            {errors.description && (
              <p className="text-red-500 text-sm">{errors.description.message}</p>
            )}
          </div>

          {/* Quantity + Price */}
          <div className="grid grid-cols-2 gap-4">
            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantity (kg) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="100"
                {...register("quantity", {
                  required: "Quantity is required",
                  min: { value: 0.01, message: "Must be greater than 0" },
                })}
              />
              {errors.quantity && (
                <p className="text-red-500 text-sm">{errors.quantity.message}</p>
              )}
            </div>

            {/* Price + AI widget */}
            <div className="space-y-2 relative">
              <Label htmlFor="price">
                Price per kg (₹) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="50"
                {...register("price", {
                  required: "Price is required",
                  min: { value: 0.01, message: "Must be greater than 0" },
                })}
              />
              {errors.price && (
                <p className="text-red-500 text-sm">{errors.price.message}</p>
              )}

              <AnimatePresence>
                {aiSuggestion && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 overflow-hidden"
                  >
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center gap-2 text-emerald-700 font-bold mb-3">
                        <Sparkles size={16} className="animate-pulse" />
                        AI Market Insights
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div className="bg-white p-2 rounded-lg border border-emerald-100 flex flex-col justify-center shadow-xs">
                          <p className="text-[10px] uppercase font-bold text-slate-400">Suggested</p>
                          <p className="font-bold text-emerald-700 text-lg">₹{aiSuggestion.suggestedPrice}</p>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-emerald-100 flex flex-col justify-center items-center shadow-xs">
                          <p className="text-[10px] uppercase font-bold text-slate-400">Demand</p>
                          <p className="font-bold text-slate-700 flex items-center gap-1 mt-0.5">
                            {aiSuggestion.demandLevel === "High" && <TrendingUp size={14} className="text-emerald-500" />}
                            {aiSuggestion.demandLevel === "Medium" && <Minus size={14} className="text-amber-500" />}
                            {aiSuggestion.demandLevel === "Low" && <TrendingDown size={14} className="text-red-500" />}
                            {aiSuggestion.demandLevel}
                          </p>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-emerald-100 flex flex-col justify-center shadow-xs">
                          <p className="text-[10px] uppercase font-bold text-slate-400">Est. Profit</p>
                          <p className="font-bold text-slate-700 mt-0.5">~{aiSuggestion.profitMargin}%</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                {isAiLoading && !aiSuggestion && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-slate-400 mt-2 flex items-center gap-2"
                  >
                    <Loader2 size={12} className="animate-spin" /> Analyzing market forces...
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Farm Location / Region</Label>
            <Input
              id="location"
              placeholder="e.g. Nashik, Maharashtra"
              {...register("location")}
            />
          </div>

          {/* Image Upload — always enabled, image is optional */}
          <div className="space-y-2">
            <Label htmlFor="image">
              Crop Image <span className="text-slate-400 text-xs font-normal">(optional)</span>
            </Label>

            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors relative">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="mx-auto h-44 rounded-lg object-cover shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute top-2 right-2 bg-white rounded-full shadow p-1 text-slate-400 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                  <p className="text-sm text-emerald-600 font-medium mt-2">{selectedFile?.name}</p>
                </div>
              ) : (
                <>
                  <UploadCloud className="mx-auto h-10 w-10 text-slate-400 mb-3" />
                  <p className="text-sm text-slate-500">Click to upload or drag & drop a crop photo</p>
                </>
              )}

              <input
                id="image"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                className="mt-3 w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
              />
              <p className="text-xs text-slate-400 mt-2">JPG, PNG, WebP up to 5 MB</p>
            </div>
          </div>

          {/* Server error */}
          {serverError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              {serverError}
            </div>
          )}

          <Button
            type="submit"
            disabled={isUploading}
            className="w-full bg-green-600 hover:bg-green-700 py-5 text-base"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {selectedFile ? "Uploading image & submitting..." : "Submitting..."}
              </>
            ) : (
              "Submit Crop Listing"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/api";
import { Loader2, Sprout, Trash2, Edit, Plus } from "lucide-react";

interface Crop {
  id: number;
  name: string;
  price: number;
  quantity: number;
  status: string;
  image?: string;
  description?: string;
  location?: string;
}

const STATUS_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  approved: { label: "✓ Active",   bg: "rgba(16,185,129,0.2)", color: "#10b981" },
  pending:  { label: "⏳ Pending", bg: "rgba(245,158,11,0.2)", color: "#f59e0b" },
  rejected: { label: "✕ Rejected", bg: "rgba(239,68,68,0.2)",  color: "#ef4444" },
};

export default function FarmerListings() {
  const [crops, setCrops]         = useState<Crop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [error, setError]         = useState("");

  useEffect(() => {
    apiRequest("GET", "/api/crops/me")
      .then(r => r.json())
      .then(d => { setCrops(d.crops || []); setIsLoading(false); })
      .catch((e: any) => { setError(e.message || "Failed to load"); setIsLoading(false); });
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this crop listing?")) return;
    setIsDeleting(id);
    try {
      const res = await apiRequest("DELETE", `/api/crops/${id}`);
      if (!res.ok) throw new Error((await res.json()).message);
      setCrops(prev => prev.filter(c => c.id !== id));
    } catch (e: any) {
      alert(e.message || "Failed to delete");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black" style={{ color: "#f0fdf4" }}>My Listings</h1>
          <p style={{ color: "#a7c5a9" }}>Manage your crop inventory and status.</p>
        </div>
        <Link href="/farmer/upload">
          <button className="f2m-btn flex items-center gap-2">
            <Plus size={16} /> New Listing
          </button>
        </Link>
      </motion.div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map(i => <div key={i} className="f2m-skeleton h-72 rounded-2xl" />)}
        </div>
      )}

      {error && (
        <div className="f2m-card p-6 text-center" style={{ borderColor: "rgba(239,68,68,0.3)" }}>
          <p style={{ color: "#ef4444" }}>{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && crops.length === 0 && !error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="f2m-card p-16 text-center">
          <Sprout size={52} className="mx-auto mb-4" style={{ color: "#4b5563" }} />
          <h3 className="text-xl font-bold mb-2" style={{ color: "#f0fdf4" }}>No crops listed yet</h3>
          <p className="mb-5" style={{ color: "#a7c5a9" }}>Upload your first crop to start selling on the marketplace.</p>
          <Link href="/farmer/upload">
            <button className="f2m-btn">Upload First Crop</button>
          </Link>
        </motion.div>
      )}

      {/* Grid */}
      {!isLoading && crops.length > 0 && (
        <motion.div
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
          initial="hidden" animate="show"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <AnimatePresence>
            {crops.map(crop => {
              const st = STATUS_STYLES[crop.status] || STATUS_STYLES.pending;
              return (
                <motion.div key={crop.id}
                  variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 280, damping: 22 } } }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -4 }}
                  className="f2m-crop-card">

                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={crop.image || "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600"}
                      alt={crop.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(6,13,20,0.85) 0%, transparent 50%)" }} />
                    {/* Status badge */}
                    <span className="absolute top-3 right-3 text-xs font-bold px-3 py-1.5 rounded-full"
                      style={{ background: st.bg, color: st.color, backdropFilter: "blur(8px)" }}>
                      {st.label}
                    </span>
                    {/* Crop name overlay */}
                    <p className="absolute bottom-3 left-4 font-black text-white text-lg drop-shadow">{crop.name}</p>
                  </div>

                  {/* Details */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-black" style={{ color: "#10b981" }}>
                        ₹{crop.price}<span className="text-sm font-normal" style={{ color: "#6b7280" }}>/kg</span>
                      </span>
                      <span className="text-xs font-semibold px-2 py-1 rounded-full"
                        style={{ background: "rgba(16,185,129,0.1)", color: "#a7c5a9" }}>
                        {crop.quantity} tons
                      </span>
                    </div>
                    {crop.description && (
                      <p className="text-sm line-clamp-2" style={{ color: "#a7c5a9" }}>{crop.description}</p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: "1px solid rgba(16,185,129,0.1)" }}>
                      <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-colors"
                        style={{ background: "rgba(96,165,250,0.1)", color: "#60a5fa" }}>
                        <Edit size={14} /> Edit
                      </button>
                      <button onClick={() => handleDelete(crop.id)} disabled={isDeleting === crop.id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                        style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                        {isDeleting === crop.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

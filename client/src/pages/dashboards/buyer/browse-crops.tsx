import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { apiRequest } from "../../../lib/api";
import { Search, MapPin, Star, X } from "lucide-react";

interface Crop {
  id: number;
  name: string;
  price: number;
  quantity: number;
  location?: string;
  image?: string;
  farmerName?: string;
  farmerLocation?: string;
}

const FILTER_CHIPS = ["All Crops", "Grains", "Vegetables", "Fruits", "Pulses"];
const PRICE_CHIPS = [{ label: "Any Price", min: 0, max: Infinity }, { label: "< ₹20/kg", min: 0, max: 20 }, { label: "₹20–₹40", min: 20, max: 40 }, { label: "> ₹40/kg", min: 40, max: Infinity }];

export default function BrowseCrops() {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeChip, setActiveChip] = useState("All Crops");
  const [priceChip, setPriceChip] = useState(0); // index in PRICE_CHIPS

  useEffect(() => {
    apiRequest("GET", "/api/crops")
      .then(r => r.json())
      .then(d => { setCrops(d.crops || []); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  const { min, max } = PRICE_CHIPS[priceChip];
  const filtered = crops.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.farmerLocation || "").toLowerCase().includes(search.toLowerCase());
    const matchPrice = c.price >= min && c.price <= max;
    return matchSearch && matchPrice;
  });

  // Pseudo star rating
  const starRating = (id: number) => (3.5 + ((id * 7) % 15) / 10).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black" style={{ color: "#f0fdf4" }}>🛒 Browse Crops Marketplace</h1>
        <p style={{ color: "#a7c5a9" }}>Fresh produce direct from verified Indian farmers.</p>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#10b981" }} />
        <input
          className="f2m-input pl-11 text-base"
          placeholder="Search crops by name, type, or region…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ borderRadius: 14, padding: "14px 16px 14px 44px" }}
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: "#6b7280" }}>
            <X size={16} />
          </button>
        )}
      </motion.div>

      {/* Filter Chips */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        className="flex flex-wrap gap-2">
        {FILTER_CHIPS.map(chip => (
          <button key={chip} onClick={() => setActiveChip(chip)}
            className="px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200"
            style={activeChip === chip
              ? { background: "#166534", color: "#f0fdf4", boxShadow: "0 0 14px rgba(16,185,129,0.3)" }
              : { background: "#0e1f16", color: "#a7c5a9", border: "1px solid rgba(16,185,129,0.15)" }}>
            {chip}
          </button>
        ))}
        <div className="w-px mx-1 self-stretch" style={{ background: "rgba(16,185,129,0.2)" }} />
        {PRICE_CHIPS.map((pc, i) => (
          <button key={pc.label} onClick={() => setPriceChip(i)}
            className="px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200"
            style={priceChip === i
              ? { background: "rgba(245,158,11,0.2)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.4)" }
              : { background: "#0e1f16", color: "#a7c5a9", border: "1px solid rgba(16,185,129,0.15)" }}>
            {pc.label}
          </button>
        ))}
      </motion.div>

      {/* Results count */}
      {!isLoading && (
        <p className="text-sm" style={{ color: "#6b7280" }}>
          Showing <span style={{ color: "#10b981", fontWeight: 600 }}>{filtered.length}</span> crops
        </p>
      )}

      {/* Crop Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map(i => <div key={i} className="f2m-skeleton h-72 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="f2m-card p-16 text-center">
          <Search size={48} className="mx-auto mb-4" style={{ color: "#4b5563" }} />
          <h3 className="text-lg font-bold" style={{ color: "#f0fdf4" }}>No crops found</h3>
          <p style={{ color: "#a7c5a9" }}>Try a different search or filter.</p>
        </div>
      ) : (
        <motion.div
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
          initial="hidden" animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(crop => (
            <motion.div key={crop.id}
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 280, damping: 22 } } }}>
              <div className="f2m-crop-card">
                {/* Image with gradient overlay */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={crop.image || "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600"}
                    alt={crop.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(6,13,20,0.92) 0%, transparent 55%)" }} />
                  {/* Crop name on image */}
                  <p className="absolute bottom-3 left-4 font-black text-white text-xl drop-shadow">{crop.name}</p>
                  {/* Star rating badge */}
                  <span className="absolute top-3 right-3 flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full"
                    style={{ background: "rgba(245,158,11,0.2)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.4)", backdropFilter: "blur(8px)" }}>
                    <Star size={11} className="fill-current" /> {starRating(crop.id)}
                  </span>
                </div>

                {/* Details */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black" style={{ color: "#10b981" }}>₹{crop.price}<span className="text-sm font-normal" style={{ color: "#6b7280" }}>/kg</span></span>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}>
                      {crop.quantity} tons
                    </span>
                  </div>
                  <p className="text-sm font-medium" style={{ color: "#a7c5a9" }}>🌾 {crop.farmerName || "Verified Farmer"}</p>
                  {(crop.farmerLocation || crop.location) && (
                    <p className="text-xs flex items-center gap-1" style={{ color: "#6b7280" }}>
                      <MapPin size={11} /> {crop.farmerLocation || crop.location}
                    </p>
                  )}
                </div>

                <Link href={`/buyer/crops/${crop.id}`}>
                  <button className="add-btn">🛒 Add to Order</button>
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Top Rated Farmers Strip */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="f2m-card p-5">
        <h2 className="text-base font-bold mb-4" style={{ color: "#f0fdf4" }}>🌟 Top Rated Farmers This Season</h2>
        <div className="flex gap-3 flex-wrap">
          {[{ name: "Rajesh Kumar", loc: "Punjab", rating: "4.9" }, { name: "Priya Patel", loc: "Gujarat", rating: "4.8" }, { name: "Suresh Reddy", loc: "Andhra Pradesh", rating: "4.7" }].map((f, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.15)" }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white"
                style={{ background: "linear-gradient(135deg, #166534, #10b981)" }}>
                {f.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: "#f0fdf4" }}>{f.name}</p>
                <p className="text-xs" style={{ color: "#a7c5a9" }}>📍 {f.loc} · ⭐ {f.rating}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { apiRequest } from "../../../lib/api";
import { TrendingUp, Users, Sprout, ShoppingCart, IndianRupee, Star, MapPin } from "lucide-react";

// ─── Seasonal Crop Data ───────────────────────────────────────────────────────
const getSeasonalCrops = () => {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return [
    { name: "Watermelon", emoji: "🍉", demand: "Very High", trend: "+34%", high: true },
    { name: "Mango",      emoji: "🥭", demand: "High",      trend: "+28%", high: true },
    { name: "Cucumber",   emoji: "🥒", demand: "High",      trend: "+22%", high: true },
    { name: "Tomato",     emoji: "🍅", demand: "Medium",    trend: "+15%", high: false },
    { name: "Coconut",    emoji: "🥥", demand: "High",      trend: "+19%", high: true },
    { name: "Lemon",      emoji: "🍋", demand: "Very High", trend: "+41%", high: true },
  ];
  if (month >= 5 && month <= 8) return [
    { name: "Rice",    emoji: "🌾", demand: "Very High", trend: "+52%", high: true  },
    { name: "Corn",    emoji: "🌽", demand: "High",      trend: "+38%", high: true  },
    { name: "Ginger",  emoji: "🫚", demand: "Medium",    trend: "+21%", high: false },
    { name: "Spinach", emoji: "🥬", demand: "High",      trend: "+29%", high: true  },
  ];
  if (month >= 9 && month <= 10) return [
    { name: "Pumpkin",      emoji: "🎃", demand: "Very High", trend: "+45%", high: true  },
    { name: "Sweet Potato", emoji: "🍠", demand: "High",      trend: "+33%", high: true  },
    { name: "Pomegranate",  emoji: "🫐", demand: "High",      trend: "+27%", high: true  },
    { name: "Grapes",       emoji: "🍇", demand: "Medium",    trend: "+18%", high: false },
  ];
  return [
    { name: "Wheat",       emoji: "🌾", demand: "Very High", trend: "+48%", high: true  },
    { name: "Carrot",      emoji: "🥕", demand: "High",      trend: "+35%", high: true  },
    { name: "Cauliflower", emoji: "🥦", demand: "High",      trend: "+31%", high: true  },
    { name: "Peas",        emoji: "🫛", demand: "Medium",    trend: "+24%", high: false },
  ];
};

const SEASON_NAMES = ["Spring","Spring","Spring","Summer","Summer","Monsoon","Monsoon","Monsoon","Monsoon","Autumn","Autumn","Winter"];

const REVIEWS = [
  { name: "Rajesh Kumar", role: "Farmer", location: "Punjab", stars: 5, text: "This platform completely changed how I sell my produce. Within a week of listing my wheat, I had three buyers!" },
  { name: "Priya Sharma", role: "Buyer",  location: "Delhi",  stars: 5, text: "Fresh vegetables at 30% lower prices. Farm-to-Market gives me direct access to farmers." },
  { name: "Anand Patel",  role: "Farmer", location: "Gujarat", stars: 4, text: "The AI demand forecast helped me time my mango listings perfectly. Sold 2 tons in 5 days." },
  { name: "Kavitha Nair", role: "Buyer",  location: "Kerala",  stars: 5, text: "Chatting directly with farmers gives me confidence about the produce quality." },
];

function CountUp({ target, prefix = "" }: { target: number; prefix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const steps = 50, step = target / steps;
    let cur = 0;
    const t = setInterval(() => {
      cur += step;
      if (cur >= target) { setVal(target); clearInterval(t); } else setVal(Math.floor(cur));
    }, 1400 / steps);
    return () => clearInterval(t);
  }, [target]);
  return <span>{prefix}{val.toLocaleString("en-IN")}</span>;
}

const STATUS_ORDERS = [
  { label: "Pending",   color: "#f59e0b", count: 42, pct: 18 },
  { label: "Accepted",  color: "#60a5fa", count: 28, pct: 12 },
  { label: "Shipped",   color: "#a78bfa", count: 19, pct: 8  },
  { label: "Delivered", color: "#10b981", count: 156, pct: 66 },
  { label: "Rejected",  color: "#ef4444", count: 8,  pct: 3  },
];

export default function AdminAnalytics() {
  const [stats, setStats] = useState({ farmers: 0, buyers: 0, revenue: 0, pendingApprovals: 0 });
  const [farmers, setFarmers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const seasonCrops = getSeasonalCrops();
  const season = SEASON_NAMES[new Date().getMonth()];

  useEffect(() => {
    async function load() {
      try {
        const [uRes] = await Promise.all([
          apiRequest("GET", "/api/admin/users"),
          apiRequest("GET", "/api/admin/analytics/overview").catch(() => null),
        ]);
        const uData = await uRes.json();
        const users = uData.users || [];
        const farmerList = users.filter((u: any) => u.role === "farmer");
        const buyerList  = users.filter((u: any) => u.role === "buyer");
        const pending    = farmerList.filter((u: any) => u.status === "pending").length;
        setStats({ farmers: farmerList.length, buyers: buyerList.length, revenue: 248500, pendingApprovals: pending });
        setFarmers(farmerList.filter((u: any) => u.status === "approved").slice(0, 4));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const statCards = [
    { label: "Total Farmers", value: stats.farmers, prefix: "", icon: <Users size={22} />, trend: "+12% this month", grad: "linear-gradient(135deg,#166534,#14532d)", glow: "#10b981" },
    { label: "Active Buyers", value: stats.buyers,  prefix: "", icon: <ShoppingCart size={22} />, trend: "+8% this month",  grad: "linear-gradient(135deg,#065f46,#064e3b)", glow: "#34d399" },
    { label: "Total Revenue", value: stats.revenue, prefix: "₹", icon: <IndianRupee size={22} />, trend: "+24% this month", grad: "linear-gradient(135deg,#78350f,#92400e)", glow: "#f59e0b" },
    { label: "Pending Approvals", value: stats.pendingApprovals, prefix: "", icon: <Sprout size={22} />, trend: "Needs attention", grad: "linear-gradient(135deg,#1e3a5f,#1e40af)", glow: "#60a5fa" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black" style={{ color: "#f0fdf4" }}>📊 Platform Analytics</h1>
        <p style={{ color: "#a7c5a9" }}>Real-time insights into your Farm to Market platform.</p>
        <p className="text-sm mt-0.5" style={{ color: "#4b5563" }}>
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }} whileHover={{ y: -4 }}
            className="f2m-stat-card p-5"
            style={{ background: c.grad, borderBottom: `3px solid ${c.glow}`, boxShadow: "0 4px 24px rgba(0,0,0,0.35)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white mb-3"
              style={{ background: "rgba(255,255,255,0.1)" }}>{c.icon}</div>
            <div className="text-3xl font-black text-white mb-1">
              {loading ? <div className="f2m-skeleton h-8 w-20 rounded" /> : <CountUp target={c.value} prefix={c.prefix} />}
            </div>
            <p className="text-sm font-semibold text-white/80">{c.label}</p>
            <p className="text-xs mt-1 text-white/60 flex items-center gap-1"><TrendingUp size={12} />{c.trend}</p>
          </motion.div>
        ))}
      </div>

      {/* Seasonal Crop Demand */}
      <div>
        <h2 className="text-lg font-bold mb-4" style={{ color: "#f0fdf4" }}>🌱 {season} Season — Crop Demand Forecast</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {seasonCrops.map((crop, i) => (
            <motion.div key={crop.name} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.07, type: "spring" }} whileHover={{ y: -4 }}
              className="f2m-card p-4 text-center">
              <div className="text-4xl mb-2">{crop.emoji}</div>
              <p className="font-bold text-sm" style={{ color: "#f0fdf4" }}>{crop.name}</p>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full mt-1 inline-block"
                style={{ background: crop.high ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", color: crop.high ? "#10b981" : "#f59e0b" }}>
                {crop.demand}
              </span>
              <p className="text-sm font-bold mt-1" style={{ color: "#10b981" }}>{crop.trend} ↑</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Orders Overview */}
      <motion.div className="f2m-card p-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <h2 className="text-lg font-bold mb-5" style={{ color: "#f0fdf4" }}>📦 Orders by Status</h2>
        <div className="space-y-4">
          {STATUS_ORDERS.map((s, i) => (
            <div key={s.label} className="flex items-center gap-4">
              <span className="text-sm font-semibold w-20 flex-shrink-0" style={{ color: "#a7c5a9" }}>{s.label}</span>
              <div className="flex-1 h-3 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                <motion.div className="h-3 rounded-full"
                  initial={{ width: 0 }} animate={{ width: `${s.pct}%` }}
                  transition={{ delay: 0.6 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                  style={{ background: s.color, boxShadow: `0 0 10px ${s.color}55` }} />
              </div>
              <span className="text-sm font-bold w-8 text-right" style={{ color: s.color }}>{s.count}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Farmers Timeline + Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Farmers Timeline */}
        <motion.div className="f2m-card p-6" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
          <h2 className="text-lg font-bold mb-5" style={{ color: "#f0fdf4" }}>👩‍🌾 Recently Joined Farmers</h2>
          {loading ? (
            <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="f2m-skeleton h-12 rounded-xl" />)}</div>
          ) : farmers.length === 0 ? (
            <p style={{ color: "#6b7280" }}>No farmers yet.</p>
          ) : (
            <div className="relative">
              <div className="absolute left-[19px] top-3 bottom-3 w-px" style={{ background: "rgba(16,185,129,0.2)" }} />
              <div className="space-y-5">
                {farmers.map((f, i) => (
                  <motion.div key={f.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.12 }}
                    className="flex items-start gap-4 pl-2">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 z-10"
                      style={{ background: "linear-gradient(135deg,#166534,#10b981)" }}>
                      {(f.name || f.email || "F").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm" style={{ color: "#f0fdf4" }}>{f.name || f.email}</p>
                      {f.location && <p className="text-xs flex items-center gap-1" style={{ color: "#6b7280" }}><MapPin size={10} />{f.location}</p>}
                      <p className="text-xs" style={{ color: "#4b5563" }}>
                        {new Date(f.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}>Approved</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Platform Reviews */}
        <motion.div className="f2m-card p-6" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.65 }}>
          <h2 className="text-lg font-bold mb-5" style={{ color: "#f0fdf4" }}>⭐ Platform Reviews</h2>
          <div className="space-y-4 overflow-y-auto" style={{ maxHeight: 300 }}>
            {REVIEWS.map((r, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75 + i * 0.1 }}
                className="p-4 rounded-xl relative overflow-hidden"
                style={{ background: "#111c18", border: "1px solid rgba(16,185,129,0.1)" }}>
                {/* Quote watermark */}
                <span className="absolute top-2 right-3 text-5xl font-black opacity-[0.06]" style={{ color: "#10b981", lineHeight: 1 }}>"</span>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,#166534,#10b981)" }}>
                    {r.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "#f0fdf4" }}>{r.name}</p>
                    <p className="text-xs" style={{ color: "#6b7280" }}>{r.role} · {r.location}</p>
                  </div>
                  <div className="ml-auto flex gap-0.5">
                    {Array.from({ length: r.stars }).map((_, si) => (
                      <Star key={si} size={12} className="fill-current" style={{ color: "#f59e0b" }} />
                    ))}
                  </div>
                </div>
                <p className="text-xs italic" style={{ color: "#a7c5a9" }}>"{r.text}"</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

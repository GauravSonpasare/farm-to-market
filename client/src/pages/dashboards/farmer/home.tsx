import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { apiRequest } from "../../../lib/api";
import { useAuth } from "../../../hooks/use-auth";
import { TrendingUp, TrendingDown, Sprout, ShoppingCart, IndianRupee, CheckCircle, Lightbulb } from "lucide-react";
import { Link } from "wouter";

function CountUp({ target, prefix = "", suffix = "" }: { target: number; prefix?: string; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const dur = 1200, steps = 40, step = target / steps;
    let cur = 0;
    const t = setInterval(() => {
      cur += step;
      if (cur >= target) { setVal(target); clearInterval(t); }
      else setVal(Math.floor(cur));
    }, dur / steps);
    return () => clearInterval(t);
  }, [target]);
  return <span>{prefix}{val.toLocaleString("en-IN")}{suffix}</span>;
}

const SEASONAL_CROPS = [
  { emoji: "🌾", name: "Rice", demand: "Very High", trend: "+18%", color: "#10b981" },
  { emoji: "🌽", name: "Maize", demand: "High", trend: "+12%", color: "#10b981" },
  { emoji: "🥜", name: "Groundnut", demand: "Medium", trend: "+7%", color: "#f59e0b" },
  { emoji: "🍅", name: "Tomato", demand: "High", trend: "+15%", color: "#10b981" },
  { emoji: "🫘", name: "Soybean", demand: "Medium", trend: "+5%", color: "#f59e0b" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function FarmerHome() {
  const { user } = useAuth();
  const name = (user as any)?.email?.split("@")[0] || "Farmer";
  const [stats, setStats] = useState({ listings: 0, orders: 0, revenue: 0, approved: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [cropsRes, ordersRes] = await Promise.all([
          apiRequest("GET", "/api/crops/my"),
          apiRequest("GET", "/api/orders/farmer"),
        ]);
        const cropsData = await cropsRes.json();
        const ordersData = await ordersRes.json();
        const crops = cropsData.crops || [];
        const orders = ordersData.orders || [];
        const approved = crops.filter((c: any) => c.status === "approved").length;
        const revenue = orders.filter((o: any) => o.status === "delivered" || o.status === "completed")
          .reduce((s: number, o: any) => s + (o.totalPrice || 0), 0);
        setStats({ listings: crops.length, orders: orders.filter((o: any) => o.status === "pending").length, revenue, approved });
        setRecentOrders(orders.slice(0, 3));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const statCards = [
    { label: "My Listings", value: stats.listings, prefix: "", suffix: "", icon: <Sprout size={22} />, trend: "+2 this week", trendUp: true, grad: "linear-gradient(135deg, #166534, #14532d)", glow: "#10b981" },
    { label: "Pending Orders", value: stats.orders, prefix: "", suffix: "", icon: <ShoppingCart size={22} />, trend: "Awaiting response", trendUp: null, grad: "linear-gradient(135deg, #78350f, #92400e)", glow: "#f59e0b" },
    { label: "Total Earnings", value: stats.revenue, prefix: "₹", suffix: "", icon: <IndianRupee size={22} />, trend: "+₹8,200 this month", trendUp: true, grad: "linear-gradient(135deg, #065f46, #064e3b)", glow: "#34d399" },
    { label: "Approved Crops", value: stats.approved, prefix: "", suffix: "", icon: <CheckCircle size={22} />, trend: `${stats.listings > 0 ? Math.round(stats.approved / stats.listings * 100) : 0}% approval rate`, trendUp: true, grad: "linear-gradient(135deg, #1e3a5f, #1e40af)", glow: "#60a5fa" },
  ];

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-black" style={{ color: "#f0fdf4" }}>
          {getGreeting()}, {name.charAt(0).toUpperCase() + name.slice(1)} 🌾
        </h1>
        <p className="mt-1" style={{ color: "#a7c5a9" }}>Here's your farm activity today — Kharif season is in full swing.</p>
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
            style={{ background: c.grad, borderBottom: `3px solid ${c.glow}`, boxShadow: `0 4px 24px rgba(0,0,0,0.3)` }}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                style={{ background: "rgba(255,255,255,0.1)" }}>
                {c.icon}
              </div>
            </div>
            <div className="text-3xl font-black text-white mb-1">
              {loading ? <div className="f2m-skeleton h-8 w-20 rounded" /> : <CountUp target={c.value} prefix={c.prefix} suffix={c.suffix} />}
            </div>
            <p className="text-sm font-semibold text-white/80">{c.label}</p>
            <p className="text-xs mt-1 flex items-center gap-1 text-white/60">
              {c.trendUp === true && <TrendingUp size={12} />}
              {c.trendUp === false && <TrendingDown size={12} />}
              {c.trend}
            </p>
          </motion.div>
        ))}
      </div>

      {/* AI Price Suggestion Banner */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
        className="rounded-2xl p-5 flex items-start gap-4"
        style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(245,158,11,0.15)" }}>
          <Lightbulb size={24} style={{ color: "#f59e0b" }} />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#f59e0b" }}>AI Recommendation</p>
          <p className="text-xl font-black" style={{ color: "#f0fdf4" }}>Set your Rice price at <span style={{ color: "#f59e0b" }}>₹28/kg</span></p>
          <p className="text-sm mt-1" style={{ color: "#a7c5a9" }}>Based on current Kharif demand and regional market prices, this price maximises your profit this season.</p>
        </div>
        <Link href="/farmer/upload">
          <button className="f2m-btn text-sm whitespace-nowrap mt-1" style={{ background: "rgba(245,158,11,0.85)", color: "#fff" }}>Apply Suggestion</button>
        </Link>
      </motion.div>

      {/* Seasonal Crops */}
      <div>
        <h2 className="text-lg font-bold mb-4" style={{ color: "#f0fdf4" }}>🌱 Kharif Season — High Demand Crops</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {SEASONAL_CROPS.map((crop, i) => (
            <motion.div key={crop.name} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.07, type: "spring" }}
              whileHover={{ y: -4 }} className="f2m-card p-4 text-center">
              <div className="text-4xl mb-2">{crop.emoji}</div>
              <p className="font-bold text-sm" style={{ color: "#f0fdf4" }}>{crop.name}</p>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full mt-1 inline-block"
                style={{ background: crop.color === "#10b981" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", color: crop.color }}>
                {crop.demand}
              </span>
              <p className="text-sm font-bold mt-1" style={{ color: "#10b981" }}>{crop.trend} ↑</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold" style={{ color: "#f0fdf4" }}>📦 Recent Orders</h2>
          <Link href="/farmer/orders">
            <button className="text-sm font-semibold" style={{ color: "#10b981" }}>View all →</button>
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="f2m-skeleton h-16 rounded-xl" />)}</div>
        ) : recentOrders.length === 0 ? (
          <div className="f2m-card p-8 text-center">
            <ShoppingCart size={40} className="mx-auto mb-3" style={{ color: "#4b5563" }} />
            <p style={{ color: "#a7c5a9" }}>No orders yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order, i) => {
              const STATUS_COLOR: Record<string, string> = { pending: "#f59e0b", accepted: "#60a5fa", shipped: "#a78bfa", delivered: "#10b981", completed: "#10b981", rejected: "#ef4444" };
              return (
                <motion.div key={order.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="f2m-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {order.cropImage && <img src={order.cropImage} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "#f0fdf4" }}>{order.cropName || "Crop"}</p>
                      <p className="text-xs" style={{ color: "#a7c5a9" }}>Buyer · {order.quantity} kg</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold" style={{ color: "#10b981" }}>₹{order.totalPrice?.toLocaleString("en-IN")}</p>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${STATUS_COLOR[order.status] || "#6b7280"}22`, color: STATUS_COLOR[order.status] || "#6b7280" }}>
                      {order.status}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

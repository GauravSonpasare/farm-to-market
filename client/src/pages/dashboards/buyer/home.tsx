import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { apiRequest } from "../../../lib/api";
import { useAuth } from "../../../hooks/use-auth";
import { TrendingUp, TrendingDown, PackageCheck, IndianRupee, Star, ShoppingBag, Search, Loader2 } from "lucide-react";
import { Link } from "wouter";

function CountUp({ target, prefix = "" }: { target: number; prefix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const dur = 1200, steps = 40, step = target / steps;
    let cur = 0;
    const t = setInterval(() => {
      cur += step;
      if (cur >= target) { setVal(target); clearInterval(t); } else setVal(Math.floor(cur));
    }, dur / steps);
    return () => clearInterval(t);
  }, [target]);
  return <span>{prefix}{val.toLocaleString("en-IN")}</span>;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function BuyerHome() {
  const { user } = useAuth();
  const name = (user as any)?.email?.split("@")[0] || "Buyer";
  const [orders, setOrders] = useState<any[]>([]);
  const [crops, setCrops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [oRes, cRes] = await Promise.all([
          apiRequest("GET", "/api/orders/buyer"),
          apiRequest("GET", "/api/crops?status=approved&limit=3"),
        ]);
        const oData = await oRes.json();
        const cData = await cRes.json();
        setOrders(oData.orders || []);
        setCrops(cData.crops || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const spent = orders.reduce((s: number, o: any) => s + (o.totalPrice || 0), 0);
  const delivered = orders.filter((o: any) => ["delivered", "completed"].includes(o.status)).length;

  const statCards = [
    { label: "Total Orders", value: orders.length, prefix: "", icon: <PackageCheck size={22} />, trend: "All time", trendUp: true, grad: "linear-gradient(135deg, #064e3b, #065f46)", glow: "#10b981" },
    { label: "Amount Spent", value: spent, prefix: "₹", icon: <IndianRupee size={22} />, trend: "Lifetime total", trendUp: null, grad: "linear-gradient(135deg, #166534, #14532d)", glow: "#34d399" },
    { label: "Delivered", value: delivered, prefix: "", icon: <Star size={22} />, trend: "Orders completed", trendUp: true, grad: "linear-gradient(135deg, #78350f, #92400e)", glow: "#f59e0b" },
    { label: "Available Crops", value: crops.length || 24, prefix: "", icon: <ShoppingBag size={22} />, trend: "Browse marketplace", trendUp: true, grad: "linear-gradient(135deg, #1e3a5f, #1e40af)", glow: "#60a5fa" },
  ];

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-black" style={{ color: "#f0fdf4" }}>
          {getGreeting()}, {name.charAt(0).toUpperCase() + name.slice(1)} 🛒
        </h1>
        <p className="mt-1" style={{ color: "#a7c5a9" }}>
          Discover fresh produce directly from verified Indian farmers.
        </p>
      </motion.div>

      {/* Quick Search */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Link href="/buyer/browse">
          <div className="flex items-center gap-3 px-5 py-4 rounded-2xl cursor-pointer group"
            style={{ background: "#0e1f16", border: "1px solid rgba(16,185,129,0.2)", transition: "box-shadow 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 0 24px rgba(16,185,129,0.15)")}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
            <Search size={20} style={{ color: "#10b981" }} />
            <span style={{ color: "#6b7280" }}>Search crops by name, type, or region…</span>
          </div>
        </Link>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }} whileHover={{ y: -4 }}
            className="f2m-stat-card p-5"
            style={{ background: c.grad, borderBottom: `3px solid ${c.glow}`, boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white mb-3"
              style={{ background: "rgba(255,255,255,0.1)" }}>{c.icon}</div>
            <div className="text-3xl font-black text-white mb-1">
              {loading ? <div className="f2m-skeleton h-8 w-20 rounded" /> : <CountUp target={c.value} prefix={c.prefix} />}
            </div>
            <p className="text-sm font-semibold text-white/80">{c.label}</p>
            <p className="text-xs mt-1 text-white/60 flex items-center gap-1">
              {c.trendUp === true && <TrendingUp size={12} />}
              {c.trend}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Featured Crops */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold" style={{ color: "#f0fdf4" }}>🌾 Fresh Picks This Season</h2>
          <Link href="/buyer/browse">
            <button className="text-sm font-semibold" style={{ color: "#10b981" }}>Browse all →</button>
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="f2m-skeleton h-52 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(crops.slice(0,3)).map((crop: any, i: number) => (
              <motion.div key={crop.id} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="f2m-crop-card">
                <div className="relative h-44 overflow-hidden">
                  <img src={crop.image || "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400"}
                    alt={crop.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(6,13,20,0.9) 0%, transparent 60%)" }} />
                  <p className="absolute bottom-3 left-3 font-bold text-white text-lg">{crop.name}</p>
                </div>
                <div className="p-4">
                  <p className="text-xl font-black" style={{ color: "#10b981" }}>₹{crop.price}/kg</p>
                  <p className="text-sm mt-1" style={{ color: "#a7c5a9" }}>📍 {crop.location || "India"}</p>
                  <p className="text-sm" style={{ color: "#a7c5a9" }}>{crop.quantity} tons available</p>
                </div>
                <Link href={`/buyer/crops/${crop.id}`}>
                  <button className="add-btn">View & Order →</button>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold" style={{ color: "#f0fdf4" }}>📦 Recent Orders</h2>
          <Link href="/buyer/orders">
            <button className="text-sm font-semibold" style={{ color: "#10b981" }}>View all →</button>
          </Link>
        </div>
        {loading ? <div className="f2m-skeleton h-24 rounded-xl" /> :
         orders.length === 0 ? (
          <div className="f2m-card p-8 text-center">
            <PackageCheck size={40} className="mx-auto mb-3" style={{ color: "#4b5563" }} />
            <p style={{ color: "#a7c5a9" }}>No orders yet. Start shopping!</p>
            <Link href="/buyer/browse">
              <button className="f2m-btn mt-4">Browse Marketplace</button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.slice(0,3).map((order: any, i: number) => {
              const STATUS_COLOR: Record<string, string> = { pending: "#f59e0b", accepted: "#60a5fa", shipped: "#a78bfa", delivered: "#10b981", completed: "#10b981", rejected: "#ef4444" };
              return (
                <motion.div key={order.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="f2m-card p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "#f0fdf4" }}>{order.cropName || "Crop"}</p>
                    <p className="text-xs" style={{ color: "#a7c5a9" }}>{order.quantity} kg · {order.farmerName}</p>
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

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "../../../lib/api";
import { TrendingUp, Users, Sprout, ShoppingCart, IndianRupee, Star, MapPin, Clock } from "lucide-react";
import { CountUp } from "../../../components/ui/count-up";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";

// ─── Seasonal Crop Data ───────────────────────────────────────────────────────
const getSeasonalCrops = () => {
  const month = new Date().getMonth(); // 0-11
  if (month >= 2 && month <= 4) {
    // Spring (Mar-May)
    return [
      { name: "Watermelon", emoji: "🍉", demand: "Very High", trend: "+34%", color: "bg-red-100 text-red-700" },
      { name: "Mango", emoji: "🥭", demand: "High", trend: "+28%", color: "bg-orange-100 text-orange-700" },
      { name: "Cucumber", emoji: "🥒", demand: "High", trend: "+22%", color: "bg-green-100 text-green-700" },
      { name: "Tomato", emoji: "🍅", demand: "Medium", trend: "+15%", color: "bg-red-100 text-red-700" },
      { name: "Coconut", emoji: "🥥", demand: "High", trend: "+19%", color: "bg-amber-100 text-amber-700" },
      { name: "Lemon", emoji: "🍋", demand: "Very High", trend: "+41%", color: "bg-yellow-100 text-yellow-700" },
    ];
  } else if (month >= 5 && month <= 8) {
    // Monsoon (Jun-Sep)
    return [
      { name: "Rice", emoji: "🌾", demand: "Very High", trend: "+52%", color: "bg-emerald-100 text-emerald-700" },
      { name: "Corn", emoji: "🌽", demand: "High", trend: "+38%", color: "bg-yellow-100 text-yellow-700" },
      { name: "Ginger", emoji: "🫚", demand: "Medium", trend: "+21%", color: "bg-amber-100 text-amber-700" },
      { name: "Spinach", emoji: "🥬", demand: "High", trend: "+29%", color: "bg-green-100 text-green-700" },
    ];
  } else if (month >= 9 && month <= 10) {
    // Autumn (Oct-Nov)
    return [
      { name: "Pumpkin", emoji: "🎃", demand: "Very High", trend: "+45%", color: "bg-orange-100 text-orange-700" },
      { name: "Sweet Potato", emoji: "🍠", demand: "High", trend: "+33%", color: "bg-amber-100 text-amber-700" },
      { name: "Pomegranate", emoji: "🫐", demand: "High", trend: "+27%", color: "bg-red-100 text-red-700" },
      { name: "Grapes", emoji: "🍇", demand: "Medium", trend: "+18%", color: "bg-purple-100 text-purple-700" },
    ];
  } else {
    // Winter (Dec-Feb)
    return [
      { name: "Wheat", emoji: "🌾", demand: "Very High", trend: "+48%", color: "bg-amber-100 text-amber-700" },
      { name: "Carrot", emoji: "🥕", demand: "High", trend: "+35%", color: "bg-orange-100 text-orange-700" },
      { name: "Cauliflower", emoji: "🥦", demand: "High", trend: "+31%", color: "bg-green-100 text-green-700" },
      { name: "Peas", emoji: "🫛", demand: "Medium", trend: "+24%", color: "bg-emerald-100 text-emerald-700" },
    ];
  }
};

const SEASON_NAMES = ["Spring", "Spring", "Spring", "Summer", "Summer", "Monsoon", "Monsoon", "Monsoon", "Monsoon", "Autumn", "Autumn", "Winter"];

// ─── Reviews ──────────────────────────────────────────────────────────────────
const REVIEWS = [
  { name: "Rajesh Kumar", role: "Farmer", location: "Punjab", stars: 5, text: "This platform completely changed how I sell my produce. I no longer have to rely on middlemen. Within a week of listing my wheat, I had three buyers! The dashboard is simple and the notifications come instantly." },
  { name: "Priya Sharma", role: "Buyer", location: "Delhi", stars: 5, text: "I run a small catering business and I always struggled to find fresh vegetables at fair prices. Farm-to-Market gives me direct access to farmers. The produce is always fresh and the prices are 30% lower than local markets." },
  { name: "Anand Patel", role: "Farmer", location: "Gujarat", stars: 4, text: "Great platform overall. Listing my mangoes was very easy and the AI demand forecast helped me time my listings perfectly. I sold 2 tons in just 5 days. Would definitely recommend to fellow farmers." },
  { name: "Kavitha Nair", role: "Buyer", location: "Kerala", stars: 5, text: "The ability to chat directly with farmers and understand how they grow their crops gives me so much confidence. I know exactly what I am buying. The rating system also helps me choose trusted farmers quickly." },
  { name: "Suresh Yadav", role: "Farmer", location: "Uttar Pradesh", stars: 5, text: "Before this platform, I used to sell my rice at whatever price the local agent offered. Now I set my own price and have repeat buyers. The admin team is also very responsive and approved my account in hours." },
];

// ─── AnimatedBar component ─────────────────────────────────────────────────────
function AnimatedProgressBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setTimeout(() => setWidth(total > 0 ? (value / total) * 100 : 0), 200);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, total]);
  
  return (
    <div ref={ref} className="space-y-1.5">
      <div className="flex justify-between items-center text-sm font-semibold">
        <span className="text-slate-700">{label}</span>
        <span className="text-slate-800 text-base font-bold">{value}</span>
      </div>
      <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
        <div
          style={{ width: `${width}%`, transition: "width 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)" }}
          className={`h-full rounded-full ${color} shadow-inner`}
        />
      </div>
    </div>
  );
}

export default function AdminAnalytics() {
  const [range, setRange] = useState("all");
  const [overview, setOverview] = useState<any>(null);
  const [monthlySales, setMonthlySales] = useState<any[]>([]);
  const [topCrops, setTopCrops] = useState<any[]>([]);
  const [ordersStatus, setOrdersStatus] = useState<any[]>([]);
  const [recentFarmers, setRecentFarmers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const seasonalCrops = getSeasonalCrops();
  const currentSeason = SEASON_NAMES[new Date().getMonth()];
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      try {
        const qs = `?range=${range}`;
        const [ovRes, msRes, tcRes, osRes, usersRes] = await Promise.all([
          apiRequest("GET", `/api/admin/analytics/overview${qs}`),
          apiRequest("GET", `/api/admin/analytics/monthly-sales${qs}`),
          apiRequest("GET", `/api/admin/analytics/top-crops${qs}`),
          apiRequest("GET", `/api/admin/analytics/orders-by-status${qs}`),
          apiRequest("GET", `/api/admin/users`),
        ]);

        const [ovData, msData, tcData, osData, usersData] = await Promise.all([
          ovRes.json(), msRes.json(), tcRes.json(), osRes.json(), usersRes.json()
        ]);

        setOverview(ovData);
        setMonthlySales(msData.data || []);
        setTopCrops(tcData.data || []);
        setOrdersStatus(osData.data || []);
        
        const farmers = (usersData.users || [])
          .filter((u: any) => u.role === "farmer")
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
        setRecentFarmers(farmers);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [range]);

  const totalOrders = ordersStatus.reduce((a, b) => a + b.value, 0);

  const skeletonCard = (
    <div className="bg-white rounded-2xl p-6 animate-pulse border border-slate-100">
      <div className="h-4 bg-slate-200 rounded mb-3 w-1/2" />
      <div className="h-8 bg-slate-200 rounded mb-2 w-1/3" />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Analytics Overview</h1>
          <p className="text-slate-500 mt-1">Live platform performance and insights.</p>
        </div>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-400 shadow-sm"
        >
          <option value="all">All Time</option>
          <option value="year">This Year</option>
          <option value="month">This Month</option>
          <option value="week">This Week</option>
        </select>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {isLoading ? [1, 2, 3, 4].map(i => <div key={i}>{skeletonCard}</div>) : (
          <>
            {[
              { label: "Total Farmers", value: overview?.totalFarmers ?? 0, emoji: "🌾", gradient: "from-emerald-600 to-emerald-800", icon: <Users size={22} /> },
              { label: "Total Buyers", value: overview?.totalBuyers ?? 0, emoji: "🛒", gradient: "from-blue-600 to-blue-800", icon: <ShoppingCart size={22} /> },
              { label: "Total Orders", value: overview?.totalOrders ?? 0, emoji: "📦", gradient: "from-violet-600 to-violet-800", icon: <TrendingUp size={22} /> },
              { label: "Platform Revenue", value: overview?.totalRevenue ?? 0, emoji: "💰", gradient: "from-amber-600 to-orange-700", icon: <IndianRupee size={22} />, prefix: "₹" },
            ].map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, type: "spring", stiffness: 200 }}
                whileHover={{ translateY: -6, boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}
                className={`bg-gradient-to-br ${card.gradient} p-6 rounded-2xl text-white cursor-default transition-all`}
                style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
              >
                <div className="flex justify-between items-start mb-4">
                  <p className="text-white/80 font-medium text-sm">{card.label}</p>
                  <span className="text-2xl">{card.emoji}</span>
                </div>
                <h3 className="text-3xl font-black tracking-tight">
                  {card.prefix && <span>{card.prefix}</span>}
                  <CountUp end={card.value} />
                </h3>
              </motion.div>
            ))}
          </>
        )}
      </div>

      {/* ── SEASONAL DEMAND ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Sprout className="text-emerald-500" size={22} />
              Top Demanded Crops This Season
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">Based on current <span className="font-semibold text-emerald-600">{currentSeason}</span> season trends</p>
          </div>
          <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-200">🌿 Live Season</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {seasonalCrops.map((crop, i) => (
            <motion.div
              key={crop.name}
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.07, type: "spring" }}
              whileHover={{ scale: 1.03 }}
              className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 hover:shadow-md transition-shadow cursor-default"
            >
              <span className="text-4xl">{crop.emoji}</span>
              <div className="flex-1">
                <p className="font-bold text-slate-800">{crop.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${crop.color}`}>{crop.demand}</span>
                  <span className="text-xs font-bold text-emerald-600">{crop.trend} ↑</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── CHARTS ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-emerald-500" /> Platform Revenue (Last 6 Months)</h3>
          <div className="h-72">
            {monthlySales.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlySales}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 5, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-slate-400 text-center pt-20">No revenue data yet</p>}
          </div>
        </motion.div>

        {/* Orders by Status - Animated Progress Bars */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Orders by Status</h3>
          {ordersStatus.length > 0 ? (
            <div className="space-y-5">
              {ordersStatus.map((item, i) => {
                const colors: Record<string, string> = {
                  Pending: "bg-amber-400",
                  Accepted: "bg-blue-500",
                  Shipped: "bg-violet-500",
                  Delivered: "bg-emerald-500",
                  Completed: "bg-green-600",
                  Rejected: "bg-red-400",
                };
                return (
                  <AnimatedProgressBar
                    key={item.name}
                    label={item.name}
                    value={item.value}
                    total={totalOrders}
                    color={colors[item.name] || "bg-slate-400"}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-slate-400 text-center py-12">No order data yet</div>
          )}
        </motion.div>

        {/* Top Crops Pie */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Top Demanded Crops</h3>
          <div className="h-64">
            {topCrops.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={topCrops} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {topCrops.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-slate-400 text-center pt-20">No order data yet</p>}
          </div>
        </motion.div>
      </div>

      {/* ── RECENTLY JOINED FARMERS TIMELINE ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Clock size={22} className="text-emerald-500" /> Recently Joined Farmers
        </h2>
        {recentFarmers.length === 0 ? (
          <p className="text-slate-400 py-10 text-center">No farmers registered yet</p>
        ) : (
          <div className="relative pl-6">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-400 to-transparent" />
            <div className="space-y-6">
              {recentFarmers.map((farmer, i) => (
                <motion.div
                  key={farmer.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.1, type: "spring" }}
                  className="relative flex items-start gap-4 ml-2"
                >
                  {/* Circle initial */}
                  <div className="absolute -left-8 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
                    {farmer.name?.charAt(0)?.toUpperCase() || "F"}
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex-1 hover:shadow-sm transition-shadow">
                    <div className="flex flex-wrap justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-800">{farmer.name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin size={11} /> {farmer.location || "Location not set"}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase ${
                          farmer.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                          farmer.status === "blocked" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"
                        }`}>{farmer.status}</span>
                        <p className="text-xs text-slate-400 mt-1">{new Date(farmer.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* ── PLATFORM REVIEWS ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Star size={22} className="text-amber-400 fill-amber-400" /> Platform Reviews
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {REVIEWS.map((review, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + i * 0.08, type: "spring" }}
              whileHover={{ scale: 1.02 }}
              className="p-5 rounded-xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 hover:shadow-md transition-all cursor-default"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  review.role === "Farmer" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                }`}>
                  {review.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{review.name}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <span className={`font-semibold ${review.role === "Farmer" ? "text-emerald-600" : "text-blue-600"}`}>{review.role}</span>
                    <span>•</span>
                    <MapPin size={10} /> {review.location}
                  </p>
                </div>
              </div>
              <div className="flex gap-0.5 mb-2">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} size={13} className={s < review.stars ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"} />
                ))}
              </div>
              <p className="text-slate-600 text-sm leading-relaxed italic">"{review.text}"</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

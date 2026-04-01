import { useAuth } from "../../../hooks/use-auth";
import { Link } from "wouter";
import { Sprout, TrendingUp, HandCoins, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { apiRequest } from "../../../lib/api";
import { motion } from "framer-motion";

export default function FarmerHome() {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<any[]>([]);
  const [stats, setStats] = useState({ activeListings: 0, pendingOrders: 0, totalRevenue: 0 });
  const [activity, setActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [predRes, statsRes, notifRes] = await Promise.all([
          apiRequest("GET", "/api/ai/demand-prediction"),
          apiRequest("GET", "/api/orders/farmer/stats"),
          apiRequest("GET", "/api/notifications")
        ]);
        
        const predData = await predRes.json();
        const statsData = await statsRes.json();
        const notifData = await notifRes.json();

        setPredictions(predData.predictions || []);
        setStats(statsData);
        setActivity(notifData.notifications?.slice(0, 5) || []);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Welcome back, {user?.name}! 🌾
          </h1>
          <p className="text-slate-500 mt-1">
            Here's what is happening with your farm today.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/farmer/upload">
            <button className="bg-green-600 text-white px-4 py-2 flex items-center gap-2 rounded-lg hover:bg-green-700 shadow-sm transition-colors">
              <Sprout size={18} />
              <span>Upload Crop</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-lg text-green-600">
            <Sprout size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Active Listings</p>
            <p className="text-2xl font-bold text-slate-800">{isLoading ? "..." : stats.activeListings}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="bg-amber-100 p-3 rounded-lg text-amber-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Pending Orders</p>
            <p className="text-2xl font-bold text-slate-800">{isLoading ? "..." : stats.pendingOrders}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
            <HandCoins size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Revenue</p>
            <p className="text-2xl font-bold text-slate-800">₹{isLoading ? "..." : stats.totalRevenue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* AI Demand Prediction Widget */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Sparkles className="text-indigo-500" /> AI Demand Forecast
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {predictions.map((pred, i) => (
            <motion.div
              key={pred.cropName}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
              className="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-2xl border border-indigo-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800 text-lg">{pred.cropName}</h3>
                <span className="text-2xl">{pred.icon}</span>
              </div>
              <div className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-full mb-3 shadow-xs">
                {pred.demandLevel}
              </div>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                {pred.reason}
              </p>
            </motion.div>
          ))}
          {predictions.length === 0 && (
            <div className="col-span-3 h-32 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl">
              <p className="text-slate-400">Loading forecast...</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {activity.map((item, idx) => (
            <div key={item.id || idx} className="flex items-center gap-4 p-4 rounded-lg bg-slate-50">
              <div className={`w-2 h-2 rounded-full ${item.type === 'order' ? 'bg-amber-500' : 'bg-green-500'}`}></div>
              <p className="text-slate-600">{item.message}</p>
              <span className="text-sm text-slate-400 ml-auto">
                {new Date(item.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
          {!isLoading && activity.length === 0 && (
            <p className="text-slate-400 text-center py-4 italic">No recent activity detected.</p>
          )}
          {isLoading && (
            <div className="animate-pulse space-y-3">
              <div className="h-12 bg-slate-100 rounded-lg"></div>
              <div className="h-12 bg-slate-100 rounded-lg"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useAuth } from "../../../hooks/use-auth";
import { Link } from "wouter";
import { ShoppingBag, PackageCheck, Leaf, Search, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { apiRequest } from "../../../lib/api";
import { motion } from "framer-motion";
import { Button } from "../../../components/ui/button";

export default function BuyerHome() {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<any[]>([]);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const res = await apiRequest("GET", "/api/ai/demand-prediction");
        const data = await res.json();
        setPredictions(data.predictions || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPredictions();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-100 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-slate-500 mt-2">
            Explore fresh produce directly from our verified farmers.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/buyer/browse">
            <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-sm flex items-center gap-2">
              <Search size={18} />
              <span>Browse Marketplace</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center gap-2 hover:shadow-md transition-shadow">
          <div className="bg-emerald-100 p-4 rounded-full text-emerald-600 mb-2">
            <ShoppingBag size={28} />
          </div>
          <p className="text-sm text-slate-500 font-medium">Items in Cart</p>
          <p className="text-2xl font-bold text-slate-800">0</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center gap-2 hover:shadow-md transition-shadow">
          <div className="bg-blue-100 p-4 rounded-full text-blue-600 mb-2">
            <PackageCheck size={28} />
          </div>
          <p className="text-sm text-slate-500 font-medium">Active Orders</p>
          <p className="text-2xl font-bold text-slate-800">1</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center gap-2 text-white hover:shadow-md transition-shadow">
          <div className="bg-white/20 p-4 rounded-full mb-2">
            <Leaf size={28} />
          </div>
          <p className="text-sm text-emerald-50 font-medium">CO2 Saved vs Supermarket</p>
          <p className="text-2xl font-bold">14 kg</p>
        </div>
      </div>

      {/* AI Demand Prediction Widget */}
      <div className="mb-6 mt-8">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Sparkles className="text-emerald-500" /> Market Trends
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {predictions.map((pred, i) => (
            <motion.div
              key={pred.cropName}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
              className="bg-gradient-to-br from-emerald-50 to-white p-5 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800 text-lg">{pred.cropName}</h3>
                <span className="text-2xl">{pred.icon}</span>
              </div>
              <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full mb-3 shadow-xs">
                {pred.demandLevel}
              </div>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                {pred.reason}
              </p>
            </motion.div>
          ))}
          {predictions.length === 0 && (
            <div className="col-span-3 h-32 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl">
              <p className="text-slate-400 animate-pulse">Generating localized market insights...</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">Recent Deliveries</h2>
          <Button variant="ghost" className="text-emerald-600 hover:text-emerald-700">View All</Button>
        </div>
        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
          <PackageCheck size={48} className="mb-4 opacity-50" />
          <p>No recent deliveries.</p>
          <p className="text-sm">When your orders arrive, they'll show up here.</p>
        </div>
      </div>
    </div>
  );
}

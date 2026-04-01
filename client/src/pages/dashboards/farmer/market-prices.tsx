import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { apiRequest } from "../../../lib/api";
import { TrendingUp, AlertTriangle, Loader2 } from "lucide-react";

export default function FarmerMarketPrices() {
  const [marketPrices, setMarketPrices] = useState<any[]>([]);
  const [myCrops, setMyCrops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [marketRes, cropsRes] = await Promise.all([
          apiRequest("GET", "/api/market-prices"),
          apiRequest("GET", "/api/crops/farmer") // Farmer crop fetch endpoint -> actually wait, standard is just all crops, but filtered by farmerId when in farmer context. Actually the backend has GET /api/crops/farmer!
        ]);
        
        const marketData = await marketRes.json();
        const cropsData = await cropsRes.json();
        
        setMarketPrices(marketData.marketPrices || []);
        setMyCrops(cropsData.crops || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-emerald-500 w-10 h-10" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <TrendingUp className="text-emerald-500" /> Market Price Tracker
        </h1>
        <p className="text-slate-500 mt-1">Compare your listed crop prices against current Mandi market rates.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-semibold text-slate-600">Crop Name</th>
              <th className="p-4 font-semibold text-slate-600">Market Price</th>
              <th className="p-4 font-semibold text-slate-600">Your Listed Price</th>
              <th className="p-4 font-semibold text-slate-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {myCrops.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">You have no listed crops yet.</td>
              </tr>
            ) : myCrops.map(crop => {
              const marketMatch = marketPrices.find(m => m.cropName.toLowerCase() === crop.name.toLowerCase());
              
              let statusLabel = <span className="text-slate-400">No Market Data</span>;
              if (marketMatch) {
                if (crop.price <= marketMatch.price) {
                  statusLabel = <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase">Competitive</span>;
                } else if (crop.price > marketMatch.price + 10) {
                   statusLabel = <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center gap-1 uppercase w-max"><AlertTriangle size={12}/> Overpriced</span>;
                } else {
                   statusLabel = <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold uppercase">Slightly High</span>;
                }
              }

              return (
                <tr key={crop.id} className="hover:bg-slate-50">
                  <td className="p-4 font-medium text-slate-800">{crop.name}</td>
                  <td className="p-4 text-emerald-700 font-bold">
                    {marketMatch ? `₹${marketMatch.price} / ${marketMatch.unit}` : "-"}
                  </td>
                  <td className="p-4 text-slate-700 font-bold">₹{crop.price} / kg</td>
                  <td className="p-4">{statusLabel}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold text-slate-800 mb-4">All Current Market Rates</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {marketPrices.map(m => (
            <motion.div key={m.id} initial={{opacity: 0}} animate={{opacity:1}} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-800">{m.cropName}</p>
                <p className="text-xs text-slate-400">{m.location} • updated {new Date(m.updatedAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-emerald-600">₹{m.price}</p>
                <p className="text-xs text-slate-400">per {m.unit}</p>
              </div>
            </motion.div>
          ))}
          {marketPrices.length === 0 && <p className="text-slate-500 col-span-3">No market prices have been recorded recently.</p>}
        </div>
      </div>
    </div>
  );
}

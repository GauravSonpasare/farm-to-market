import { useState, useEffect } from "react";
import { apiRequest } from "../../../lib/api";
import { Loader2, Plus, TrendingUp } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

export default function AdminMarketPrices() {
  const [prices, setPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ cropName: "", price: "", unit: "kg", location: "" });
  const [isOpen, setIsOpen] = useState(false);

  const fetchPrices = async () => {
    try {
      const res = await apiRequest("GET", "/api/market-prices");
      const data = await res.json();
      setPrices(data.marketPrices || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("POST", "/api/market-prices", { ...formData, price: parseFloat(formData.price) });
      setIsOpen(false);
      setFormData({ cropName: "", price: "", unit: "kg", location: "" });
      fetchPrices();
    } catch (err) {
      alert("Failed to update market price");
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-emerald-500 w-10 h-10" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <TrendingUp className="text-emerald-500" /> Market Tracker Admin
          </h1>
          <p className="text-slate-500 mt-1">Manually update baseline market prices for Farmer benchmarking.</p>
        </div>
        
        <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
          <Dialog.Trigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-sm">
              <Plus size={18} /> Update Price
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 z-50 backdrop-blur-sm" />
            <Dialog.Content className="fixed top-[50%] left-[50%] w-[90vw] max-w-[400px] translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-white p-6 shadow-2xl z-50 outline-none">
              <Dialog.Title className="text-xl font-bold text-slate-800 mb-4">Record Market Price</Dialog.Title>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Crop Name</label>
                  <input required type="text" value={formData.cropName} onChange={e => setFormData({...formData, cropName: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g. Wheat" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Price (₹)</label>
                    <input required type="number" min="1" step="0.5" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                    <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      <option value="kg">per kg</option>
                      <option value="quintal">per quintal</option>
                      <option value="ton">per ton</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location / Mandi</label>
                  <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g. Global, Delhi Mandi" />
                </div>
                <button type="submit" className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors mt-6">Save Price Tracker</button>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prices.map(m => (
          <div key={m.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex justify-between items-center group">
            <div>
              <p className="font-bold text-slate-800">{m.cropName}</p>
              <p className="text-xs text-slate-400">{m.location}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-emerald-600">₹{m.price}</p>
              <p className="text-xs text-slate-400">per {m.unit}</p>
            </div>
          </div>
        ))}
        {prices.length === 0 && <p className="text-slate-500 p-8 text-center col-span-3">No prices added yet.</p>}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { apiRequest } from "../../../lib/api";
import { Loader2, CheckCircle, XCircle, Eye, RefreshCw } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

export default function AdminCrops() {
  const [crops, setCrops] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCrop, setSelectedCrop] = useState<any>(null);

  const fetchCrops = async () => {
    try {
      const res = await apiRequest("GET", "/api/admin/crops");
      const data = await res.json();
      setCrops(data.crops || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCrops();
  }, []);

  const handleStatusUpdate = async (cropId: number, newStatus: string) => {
    try {
      await apiRequest("PATCH", `/api/admin/crops/${cropId}/status`, { status: newStatus });
      setCrops(crops.map(c => c.id === cropId ? { ...c, status: newStatus } : c));
    } catch (err) {
      alert("Failed to update status");
    }
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-emerald-500 w-10 h-10" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Crop Listings</h1>
          <p className="text-slate-500 mt-1">Review, approve, or reject crop listings submitted by farmers.</p>
        </div>
        <button onClick={() => { setIsLoading(true); fetchCrops(); }} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-semibold text-slate-600">Crop Info</th>
                <th className="p-4 font-semibold text-slate-600">Farmer</th>
                <th className="p-4 font-semibold text-slate-600">Price/Qty</th>
                <th className="p-4 font-semibold text-slate-600">Status</th>
                <th className="p-4 font-semibold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {crops.map(crop => (
                <tr key={crop.id} className="hover:bg-slate-50">
                  <td className="p-4 font-medium text-slate-800 flex items-center gap-3">
                    <img src={crop.image || "https://images.unsplash.com/photo-1595856407062-817ab0ecdf35"} alt={crop.name} className="w-10 h-10 rounded-lg object-cover" />
                    <div>
                      <p>{crop.name}</p>
                      <p className="text-xs text-slate-500 font-normal">Listed: {new Date(crop.createdAt).toLocaleDateString()}</p>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">{crop.farmerName}</td>
                  <td className="p-4">
                    <p className="font-bold text-emerald-700">₹{crop.price} / kg</p>
                    <p className="text-sm text-slate-500">{crop.quantity} kg avail.</p>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 flex w-max items-center gap-1 rounded-full text-[10px] font-bold uppercase ${
                      crop.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      crop.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {crop.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <Dialog.Root>
                      <Dialog.Trigger asChild>
                        <button onClick={() => setSelectedCrop(crop)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                          <Eye size={18} />
                        </button>
                      </Dialog.Trigger>
                      <Dialog.Portal>
                        <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 z-50 backdrop-blur-sm" />
                        <Dialog.Content className="fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-white p-6 shadow-2xl z-50 focus:outline-none border border-slate-100 overflow-y-auto">
                          <Dialog.Title className="text-xl font-bold text-slate-800 mb-4">Crop Details</Dialog.Title>
                          {selectedCrop && (
                            <div className="space-y-4">
                              <img src={selectedCrop.image || "https://images.unsplash.com/photo-1595856407062-817ab0ecdf35"} alt="Crop" className="w-full h-48 object-cover rounded-xl" />
                              <div>
                                <h3 className="text-xl font-bold text-slate-800">{selectedCrop.name}</h3>
                                <p className="text-slate-500 text-sm">Farmer: {selectedCrop.farmerName}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-100">
                                <div>
                                  <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">Price</p>
                                  <p className="text-lg font-bold text-emerald-700">₹{selectedCrop.price} / kg</p>
                                </div>
                                <div>
                                  <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">Quantity</p>
                                  <p className="text-lg font-bold text-slate-800">{selectedCrop.quantity} kg</p>
                                </div>
                              </div>
                              <div className="flex gap-3 pt-4">
                                <Dialog.Close asChild>
                                  <button onClick={() => handleStatusUpdate(selectedCrop.id, 'rejected')} className="flex-1 py-2 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 transition-colors">Reject</button>
                                </Dialog.Close>
                                <Dialog.Close asChild>
                                  <button onClick={() => handleStatusUpdate(selectedCrop.id, 'approved')} className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors">Approve Listing</button>
                                </Dialog.Close>
                              </div>
                            </div>
                          )}
                          <Dialog.Close asChild>
                            <button className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 bg-white rounded-full">
                              <XCircle size={24} />
                            </button>
                          </Dialog.Close>
                        </Dialog.Content>
                      </Dialog.Portal>
                    </Dialog.Root>

                    {crop.status !== 'approved' && (
                      <button onClick={() => handleStatusUpdate(crop.id, 'approved')} title="Approve" className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                        <CheckCircle size={18} />
                      </button>
                    )}
                    {crop.status !== 'rejected' && (
                      <button onClick={() => handleStatusUpdate(crop.id, 'rejected')} title="Reject" className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <XCircle size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {crops.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">No crops found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

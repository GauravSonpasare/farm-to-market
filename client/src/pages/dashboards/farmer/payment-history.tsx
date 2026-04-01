import { useState, useEffect } from "react";
import { apiRequest } from "../../../lib/api";
import { Loader2, IndianRupee } from "lucide-react";

export default function FarmerPaymentHistory() {
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPayments() {
      try {
        const res = await apiRequest("GET", "/api/payments/farmer");
        const data = await res.json();
        setPayments(data.payments || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPayments();
  }, []);

  const totalEarnings = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-green-500 w-10 h-10" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Earnings & Payments</h1>
        <p className="text-slate-500 mt-1">Track payments received from buyers for your orders.</p>
      </div>

      <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 flex items-center justify-between">
        <div>
          <h3 className="text-emerald-800 font-semibold mb-1">Total Lifetime Earnings</h3>
          <p className="text-4xl font-black text-emerald-600 flex items-center gap-1">
            <IndianRupee size={32} /> {totalEarnings.toFixed(2)}
          </p>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 border border-slate-200 border-dashed rounded-xl">
          <IndianRupee size={64} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-700">No earnings yet</h3>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-semibold text-slate-600">Date</th>
                  <th className="p-4 font-semibold text-slate-600">Order / Crop</th>
                  <th className="p-4 font-semibold text-slate-600">Buyer</th>
                  <th className="p-4 font-semibold text-slate-600">Qty</th>
                  <th className="p-4 font-semibold text-slate-600">Amount Received</th>
                  <th className="p-4 font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-4 text-slate-600">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-slate-800 font-medium">#{p.orderId} - {p.cropName}</td>
                    <td className="p-4 text-slate-600">{p.buyerName}</td>
                    <td className="p-4 text-slate-600">{p.quantity} kg</td>
                    <td className="p-4 text-emerald-600 font-bold">₹{p.amount}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${p.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

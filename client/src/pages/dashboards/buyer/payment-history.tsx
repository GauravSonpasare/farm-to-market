import { useState, useEffect } from "react";
import { apiRequest } from "../../../lib/api";
import { Loader2, Receipt, Download } from "lucide-react";

export default function BuyerPaymentHistory() {
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPayments() {
      try {
        const res = await apiRequest("GET", "/api/payments/buyer");
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

  const handleDownload = (payment: any) => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html>
        <head><title>Receipt - ${payment.transactionId}</title></head>
        <body style="font-family: sans-serif; padding: 40px; max-width: 600px; margin: auto;">
          <h1 style="color: #10b981;">Farm-to-Market</h1>
          <h2>Payment Receipt</h2>
          <hr/>
          <p><strong>Transaction ID:</strong> ${payment.transactionId || 'Pending'}</p>
          <p><strong>Order ID:</strong> ${payment.orderId}</p>
          <p><strong>Date:</strong> ${new Date(payment.createdAt).toLocaleString()}</p>
          <br/>
          <p><strong>Item:</strong> ${payment.cropName}</p>
          <p><strong>Farmer:</strong> ${payment.farmerName}</p>
          <p><strong>Status:</strong> ${payment.status.toUpperCase()}</p>
          <hr/>
          <h3>Total Paid: ₹${payment.amount}</h3>
          <br/>
          <button onclick="window.print()" style="padding: 10px 20px; background: #10b981; color: white; border: none; cursor: pointer;">Print Receipt</button>
        </body>
      </html>
    `);
    win.document.close();
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-emerald-500 w-10 h-10" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Payment History</h1>
        <p className="text-slate-500 mt-1">View your past transactions and download receipts.</p>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 border border-slate-200 border-dashed rounded-xl">
          <Receipt size={64} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-700">No payments yet</h3>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-semibold text-slate-600">Transaction ID</th>
                  <th className="p-4 font-semibold text-slate-600">Date</th>
                  <th className="p-4 font-semibold text-slate-600">Order / Crop</th>
                  <th className="p-4 font-semibold text-slate-600">Farmer</th>
                  <th className="p-4 font-semibold text-slate-600">Amount</th>
                  <th className="p-4 font-semibold text-slate-600">Status</th>
                  <th className="p-4 font-semibold text-slate-600 w-20">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-4 font-mono text-slate-500">{p.transactionId || '---'}</td>
                    <td className="p-4 text-slate-600">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-slate-800 font-medium">#{p.orderId} - {p.cropName}</td>
                    <td className="p-4 text-slate-600">{p.farmerName}</td>
                    <td className="p-4 text-emerald-600 font-bold">₹{p.amount}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${p.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <button onClick={() => handleDownload(p)} disabled={p.status !== 'paid'} className="text-emerald-600 hover:text-emerald-800 disabled:opacity-50 flex items-center gap-1 font-medium">
                        <Download size={16} /> Receipt
                      </button>
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

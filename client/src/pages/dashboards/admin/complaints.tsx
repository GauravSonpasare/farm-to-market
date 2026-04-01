import { useState, useEffect } from "react";
import { apiRequest } from "../../../lib/api";
import { Loader2, MessageSquareWarning, CheckCircle, RefreshCw } from "lucide-react";

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchComplaints = async () => {
    try {
      const res = await apiRequest("GET", "/api/admin/complaints");
      const data = await res.json();
      setComplaints(data.complaints || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleResolve = async (id: number) => {
    try {
      await apiRequest("PATCH", `/api/admin/complaints/${id}/status`, { status: "resolved" });
      setComplaints(complaints.map(c => c.id === id ? { ...c, status: "resolved" } : c));
    } catch (err) {
      alert("Failed to resolve complaint");
    }
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-emerald-500 w-10 h-10" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Support & Complaints</h1>
          <p className="text-slate-500 mt-1">Review issues reported by users and mark them as resolved.</p>
        </div>
        <button onClick={() => { setIsLoading(true); fetchComplaints(); }} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {complaints.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 border border-slate-200 border-dashed rounded-xl">
          <MessageSquareWarning size={64} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-700">No complaints yet</h3>
        </div>
      ) : (
        <div className="grid gap-4">
          {complaints.map(complaint => (
            <div key={complaint.id} className={`p-6 rounded-xl border ${complaint.status === 'resolved' ? 'bg-slate-50 border-slate-200' : 'bg-white border-red-200 shadow-sm'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3 items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg uppercase ${
                    complaint.userRole === 'farmer' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {complaint.userName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{complaint.userName} <span className="text-xs font-normal text-slate-500 uppercase">({complaint.userRole})</span></h3>
                    <p className="text-xs text-slate-500">Order #{complaint.orderId} • {new Date(complaint.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                {complaint.status === 'resolved' ? (
                  <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full text-xs uppercase">
                    <CheckCircle size={14} /> Resolved
                  </span>
                ) : (
                  <button onClick={() => handleResolve(complaint.id)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors">
                    <CheckCircle size={16} /> Mark Resolved
                  </button>
                )}
              </div>
              <div className="bg-slate-50 p-4 rounded-lg font-mono text-sm text-slate-700 whitespace-pre-wrap border border-slate-100">
                {complaint.message}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

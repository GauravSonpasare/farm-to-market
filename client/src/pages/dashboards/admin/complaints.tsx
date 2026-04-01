import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "../../../lib/api";
import { Loader2, MessageSquareWarning, CheckCircle, RefreshCw, Volume2 } from "lucide-react";

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      // Try the public route first, fallback to admin route
      const res = await apiRequest("GET", "/api/complaints");
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

  const ROLE_BADGE: Record<string, string> = {
    farmer: "bg-emerald-100 text-emerald-700",
    buyer: "bg-blue-100 text-blue-700",
    admin: "bg-purple-100 text-purple-700",
  };
  const ROLE_BORDER: Record<string, string> = {
    farmer: "border-l-emerald-500",
    buyer: "border-l-blue-500",
    admin: "border-l-purple-500",
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-emerald-500 w-10 h-10" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Support & Complaints</h1>
          <p className="text-slate-500 mt-1">Review issues reported by farmers and buyers.</p>
        </div>
        <button onClick={() => fetchComplaints()} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
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
          <AnimatePresence>
            {complaints.map((complaint, i) => (
              <motion.div
                key={complaint.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`p-6 rounded-xl border border-l-4 ${ROLE_BORDER[complaint.userRole] || "border-l-slate-300"} ${
                  complaint.status === 'resolved' ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100 shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
                  <div className="flex gap-3 items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg uppercase ${ROLE_BADGE[complaint.userRole] || "bg-slate-100 text-slate-600"}`}>
                      {(complaint.userName || "U").charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{complaint.userName}
                        <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full uppercase ${ROLE_BADGE[complaint.userRole] || "bg-slate-100 text-slate-600"}`}>
                          {complaint.userRole}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">{new Date(complaint.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  {complaint.status === 'resolved' ? (
                    <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full text-xs uppercase">
                      <CheckCircle size={14} /> Resolved
                    </span>
                  ) : (
                    <button onClick={() => handleResolve(complaint.id)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm">
                      <CheckCircle size={16} /> Mark Resolved
                    </button>
                  )}
                </div>
                <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 whitespace-pre-wrap border border-slate-100">
                  {complaint.message}
                </div>
                {complaint.voiceNote && (
                  <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 flex items-center gap-2">
                    <Volume2 size={14} className="text-blue-500 shrink-0" />
                    <span className="text-xs text-blue-600 font-semibold mr-2">Voice Note:</span>
                    <audio src={complaint.voiceNote} controls className="flex-1 h-7" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

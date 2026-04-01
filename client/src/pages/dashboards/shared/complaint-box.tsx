import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "../../../lib/api";
import { Mic, MicOff, Trash2, Send, AlertTriangle, Loader2, Volume2 } from "lucide-react";

const ROLE_COLOR: Record<string, string> = {
  farmer: "border-l-emerald-500",
  buyer: "border-l-blue-500",
  admin: "border-l-purple-500",
};

const ROLE_BADGE: Record<string, string> = {
  farmer: "bg-emerald-100 text-emerald-700",
  buyer: "bg-blue-100 text-blue-700",
  admin: "bg-purple-100 text-purple-700",
};

export default function ComplaintBox() {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [success, setSuccess] = useState(false);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchComplaints = async () => {
    try {
      const res = await apiRequest("GET", "/api/complaints");
      const data = await res.json();
      setComplaints(data.complaints || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingComplaints(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } catch {
      alert("Microphone permission denied. Please allow microphone access.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const clearRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingSeconds(0);
  };

  const handleSubmit = async () => {
    if (!text.trim() && !audioBlob) return;
    setIsSubmitting(true);
    try {
      let voiceNoteUrl = null;
      // Upload voice note via base64 if exists
      if (audioBlob) {
        const reader = new FileReader();
        voiceNoteUrl = await new Promise<string>((res) => {
          reader.onloadend = () => res(reader.result as string);
          reader.readAsDataURL(audioBlob);
        });
      }

      await apiRequest("POST", "/api/complaints", {
        message: text.trim() || "[Voice note only]",
        voiceNote: voiceNoteUrl,
      });

      setText("");
      clearRecording();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
      fetchComplaints();
    } catch (e) {
      alert("Failed to submit complaint. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <AlertTriangle className="text-amber-500" size={28} />
          Complaint Box
        </h1>
        <p className="text-slate-500 mt-1">Share a concern or complaint. All posts are visible to the community.</p>
      </motion.div>

      {/* Submission Form */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe your complaint or concern in detail..."
          rows={4}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-700 text-sm resize-none outline-none focus:ring-2 focus:ring-emerald-400 transition-all placeholder:text-slate-400"
        />

        {/* Voice Note Recorder */}
        <div className="flex flex-wrap items-center gap-3">
          {!audioUrl ? (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                isRecording
                  ? "bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
              {isRecording ? `Recording... ${fmt(recordingSeconds)}` : "Record Voice Note"}
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 flex-1">
              <Volume2 size={16} className="text-emerald-600 shrink-0" />
              <audio src={audioUrl} controls className="flex-1 h-8" />
              <button onClick={clearRecording} className="text-red-400 hover:text-red-600 transition-colors ml-2">
                <Trash2 size={16} />
              </button>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (!text.trim() && !audioBlob)}
            className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Submit
          </button>
        </div>

        <AnimatePresence>
          {success && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 font-medium">
              ✅ Complaint submitted successfully! It is now visible to all users.
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Complaints Feed */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4">Community Complaints Feed</h2>
        {loadingComplaints ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-slate-200 rounded w-full mb-1" />
                <div className="h-3 bg-slate-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
            <AlertTriangle size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">No complaints submitted yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 border-l-4 ${ROLE_COLOR[c.userRole] || "border-l-slate-300"} hover:shadow-md transition-shadow`}
              >
                <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${ROLE_BADGE[c.userRole] || "bg-slate-100 text-slate-700"}`}>
                      {(c.userName || "U").charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{c.userName || "Anonymous"}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${ROLE_BADGE[c.userRole] || "bg-slate-100 text-slate-600"}`}>{c.userRole}</span>
                        {c.userLocation && <span className="text-xs text-slate-400">📍 {c.userLocation}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                    {c.status === "resolved" && (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-1 inline-block">✓ Resolved</span>
                    )}
                  </div>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed bg-slate-50 p-3 rounded-xl">{c.message}</p>
                {c.voiceNote && (
                  <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 flex items-center gap-2">
                    <Volume2 size={14} className="text-blue-500 shrink-0" />
                    <audio src={c.voiceNote} controls className="flex-1 h-7" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

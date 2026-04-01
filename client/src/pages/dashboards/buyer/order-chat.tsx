import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, User } from "lucide-react";
import { apiRequest } from "../../../lib/api";

type Message = {
  id: number;
  senderId: number;
  content: string;
  createdAt: string;
};

interface OrderChatProps {
  orderId: number;
  currentUserId: number;
  otherPartyId: number;
  otherPartyName: string;
}

export default function OrderChat({
  orderId,
  currentUserId,
  otherPartyId,
  otherPartyName,
}: OrderChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isOtherPartyOnline, setIsOtherPartyOnline] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const wsClientRef = useRef<{ sendMsg: (m: any) => void } | null>(null);

  // Fetch initial history
  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await apiRequest("GET", `/api/chat/${orderId}`);
        const data = await res.json();
        setMessages(data.messages || []);
      } catch (err: any) {
        setError("Failed to load history.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchHistory();
  }, [orderId]);

  // Hook into existing WebSocket connection via the hook
  // Wait, useOrderWebSocket connects and gives us messages. However, we need a way to SEND messages from the hook.
  // I will just use a native WebSocket connection for sending, or upgrade the hook to return a sender function.
  // Actually, since useOrderWebSocket is already managing a WebSocket instance, let's create a local ws ref for sending.
  
  useEffect(() => {
    // We'll just instantiate a lightweight send-only connection if needed, 
    // OR we can rely on the useOrderWebSocket to just receive, and we send via REST.
    // However, the backend expects WS messages. Let's create a local WS for this chat component.
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const host = isLocal ? "localhost:3000" : window.location.host;
    const url = `${protocol}://${host}/api/ws`;
    const ws = new WebSocket(url);
    
    ws.onopen = () => {
      setWsConnected(true);
      wsClientRef.current = {
        sendMsg: (m) => ws.send(JSON.stringify(m))
      };
    };

    ws.onclose = () => setWsConnected(false);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "CHAT_MESSAGE" && data.message.orderId === orderId) {
          setMessages((prev) => {
            // deduplicate
            if (prev.find(m => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
        } else if (data.type === "PRESENCE" && data.userId === otherPartyId) {
          setIsOtherPartyOnline(data.online);
        }
      } catch {
        // ignore
      }
    };

    return () => {
      ws.close();
    };
  }, [orderId, otherPartyId]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !wsClientRef.current) return;

    wsClientRef.current.sendMsg({
      type: "CHAT_MESSAGE",
      orderId,
      receiverId: otherPartyId,
      content: inputText.trim()
    });
    
    setInputText("");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[400px] bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
      // Header
      <div className="bg-white px-4 py-3 border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            <User size={16} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 leading-tight">{otherPartyName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-2 h-2 rounded-full ${isOtherPartyOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {isOtherPartyOnline ? 'Online' : 'Offline'}
              </span>
              <span className="text-[10px] text-slate-300 mx-1">|</span>
              <span className={`text-[10px] font-bold ${!wsConnected ? 'text-amber-500 animate-pulse' : 'text-emerald-500'}`}>
                {!wsConnected ? 'Connecting WS...' : 'WS Connected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && <p className="text-xs text-center text-red-500">{error}</p>}
        {messages.length === 0 && !error ? (
          <div className="h-full flex flex-col items-center justify-center space-y-2 text-slate-400">
            <Send size={24} className="opacity-20" />
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    isMe 
                      ? 'bg-emerald-600 text-white rounded-tr-sm' 
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex gap-2 shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-slate-100 border-none rounded-full px-4 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || !wsConnected}
          className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-700 transition-colors"
        >
          <Send size={16} className="-ml-0.5" />
        </button>
      </form>
    </div>
  );
}

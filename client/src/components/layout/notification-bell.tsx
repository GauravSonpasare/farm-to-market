import { useState, useEffect } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Bell, Check, Loader2 } from "lucide-react";
import { apiRequest } from "../../lib/api";
import { requestNotificationPermission, onForegroundMessage } from "../../lib/firebase";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Request permission once component mounts
    requestNotificationPermission();

    // Listen to real-time pushes
    const unsubscribe = onForegroundMessage((payload: any) => {
      console.log('Received foreground message', payload);
      fetchNotifications();
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("GET", "/api/notifications");
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount((data.notifications || []).filter((n: any) => !n.isRead).length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when popover opens just to be sure we have latest
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await apiRequest("PATCH", `/api/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <button className="relative p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors outline-none cursor-pointer">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
              {unreadCount}
            </span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content 
          className="z-50 w-80 bg-white rounded-xl shadow-xl border border-slate-100 p-0 overflow-hidden outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
          sideOffset={8}
          align="end"
        >
          <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800">Notifications</h3>
            {unreadCount > 0 && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">{unreadCount} new</span>}
          </div>
          
          <div className="max-h-[300px] overflow-y-auto bg-white">
            {loading && notifications.length === 0 ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400" /></div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No notifications yet.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map(notif => (
                  <div key={notif.id} className={`p-4 hover:bg-slate-50 transition-colors ${!notif.isRead ? 'bg-emerald-50/30' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={`text-sm ${!notif.isRead ? 'font-medium text-slate-800' : 'text-slate-600'}`}>{notif.message}</p>
                        <p className="text-xs text-slate-400 mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
                      </div>
                      {!notif.isRead && (
                        <button onClick={() => markAsRead(notif.id)} className="shrink-0 p-1 text-emerald-600 hover:bg-emerald-100 rounded transition-colors" title="Mark as read">
                          <Check size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

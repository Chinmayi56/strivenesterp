import React, { useEffect, useState } from "react";
import { useToast } from "../components/Toast";
import { portalService, NotificationItem } from "../services/portalService";
import { Bell, CheckCheck, Check, AlertCircle } from "lucide-react";

export const NotificationsPage: React.FC = () => {
  const { showSuccess, showError } = useToast();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await portalService.getNotifications();
      setNotifications(res.items || []);
      setUnreadCount(res.unread_count || 0);
    } catch (err: any) {
      showError(err.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await portalService.markNotificationRead(id);
      await fetchNotifications();
    } catch (err: any) {
      showError(err.message || "Failed to mark notification read.");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await portalService.markAllNotificationsRead();
      showSuccess(`Marked ${res.marked_read} notifications as read.`, "Notifications");
      await fetchNotifications();
    } catch (err: any) {
      showError(err.message || "Failed to mark all as read.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono font-semibold">
            <Bell className="w-3.5 h-3.5" />
            ANNOUNCEMENTS & NOTIFICATIONS
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">Notification Center</h1>
          <p className="text-xs text-slate-400">System alerts, leave approval decisions, task assignments, and corporate broadcasts.</p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All as Read ({unreadCount})</span>
          </button>
        )}
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No notification history found.
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                  !n.is_read
                    ? "bg-slate-950 border-indigo-500/40 shadow-md shadow-indigo-500/5"
                    : "bg-slate-950/60 border-slate-800/80 opacity-80"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-100">{n.title}</span>
                    {!n.is_read && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-indigo-500 text-slate-950 uppercase">
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                  <p className="text-[10px] text-slate-500 font-mono pt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>

                {!n.is_read && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="px-2.5 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-[11px] font-medium border border-indigo-500/30 flex items-center gap-1 shrink-0"
                  >
                    <Check className="w-3 h-3" />
                    <span>Mark Read</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

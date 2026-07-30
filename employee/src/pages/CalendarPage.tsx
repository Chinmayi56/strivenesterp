import React, { useEffect, useState } from "react";
import { useToast } from "../components/Toast";
import { portalService, CalendarEvent } from "../services/portalService";
import { Calendar, Clock, CheckSquare, FolderKanban, AlertCircle } from "lucide-react";

export const CalendarPage: React.FC = () => {
  const { showError } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await portalService.getCalendarEvents();
      setEvents(res || []);
    } catch (err: any) {
      showError(err.message || "Failed to load calendar events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-mono font-semibold">
          <Calendar className="w-3.5 h-3.5" />
          PERSONAL WORK CALENDAR
        </div>
        <h1 className="text-2xl font-bold text-slate-100 mt-1">Employee Calendar</h1>
        <p className="text-xs text-slate-400">View upcoming tasks, project milestones, approved leaves, and meetings in sequence.</p>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-100">Upcoming Scheduled Events</h3>

        {events.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No calendar events or task deadlines scheduled for this month.
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((evt) => (
              <div key={evt.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${
                    evt.type === "TASK" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30" :
                    evt.type === "PROJECT_DEADLINE" ? "bg-amber-500/10 text-amber-400 border border-amber-500/30" :
                    evt.type === "LEAVE" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30" :
                    "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  }`}>
                    {evt.type === "TASK" ? <CheckSquare className="w-4 h-4" /> :
                     evt.type === "PROJECT_DEADLINE" ? <FolderKanban className="w-4 h-4" /> :
                     evt.type === "LEAVE" ? <Clock className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{evt.title}</h4>
                    <p className="text-[11px] text-slate-400">{evt.details || evt.type}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="px-2.5 py-1 rounded text-[11px] font-mono font-bold bg-slate-900 text-slate-300 border border-slate-800">
                    {evt.date}
                  </span>
                  <p className="text-[10px] font-mono font-semibold text-slate-500 mt-1 uppercase">{evt.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

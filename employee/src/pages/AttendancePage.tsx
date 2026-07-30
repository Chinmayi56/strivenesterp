import React, { useEffect, useState } from "react";
import { useToast } from "../components/Toast";
import { portalService, AttendanceRecord, AttendanceMonthlySummary } from "../services/portalService";
import { CalendarCheck, LogIn, LogOut, Clock, Calendar, Search } from "lucide-react";

export const AttendancePage: React.FC = () => {
  const { showSuccess, showError } = useToast();

  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceMonthlySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [today, hist, sum] = await Promise.all([
        portalService.getTodayAttendance(),
        portalService.getAttendanceHistory(startDate || undefined, endDate || undefined),
        portalService.getAttendanceSummary(currentYear, currentMonth),
      ]);
      setTodayRecord(today);
      setHistory(hist.items || []);
      setSummary(sum);
    } catch (err: any) {
      showError(err.message || "Failed to load attendance records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      await portalService.checkIn(notes);
      showSuccess("Successfully checked in!", "Attendance");
      setNotes("");
      await fetchData();
    } catch (err: any) {
      showError(err.response?.data?.message || err.message || "Check-in failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setActionLoading(true);
      await portalService.checkOut(notes);
      showSuccess("Successfully checked out!", "Attendance");
      setNotes("");
      await fetchData();
    } catch (err: any) {
      showError(err.response?.data?.message || err.message || "Check-out failed.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold">
            <CalendarCheck className="w-3.5 h-3.5" />
            ATTENDANCE & TIME TRACKING
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">Attendance Self-Service Log</h1>
          <p className="text-xs text-slate-400">Clock in/out daily and monitor your shift working hours.</p>
        </div>

        {/* Check-in / out actions */}
        <div className="flex items-center gap-3">
          {!todayRecord?.check_in_time ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Check-in note..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500"
              />
              <button
                onClick={handleCheckIn}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <LogIn className="w-4 h-4" />
                <span>Clock In</span>
              </button>
            </div>
          ) : !todayRecord?.check_out_time ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Check-out note..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500"
              />
              <button
                onClick={handleCheckOut}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <LogOut className="w-4 h-4" />
                <span>Clock Out</span>
              </button>
            </div>
          ) : (
            <div className="px-4 py-2 rounded-xl bg-slate-950 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              Today's Shift Completed ({todayRecord.working_hours} Hours)
            </div>
          )}
        </div>
      </div>

      {/* Monthly Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <p className="text-[11px] text-slate-400">Total Logged</p>
            <p className="text-xl font-bold font-mono text-slate-100">{summary.total_days} Days</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <p className="text-[11px] text-slate-400">Present</p>
            <p className="text-xl font-bold font-mono text-emerald-400">{summary.present_days} Days</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <p className="text-[11px] text-slate-400">Late Arrivals</p>
            <p className="text-xl font-bold font-mono text-amber-400">{summary.late_days} Days</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <p className="text-[11px] text-slate-400">Absent</p>
            <p className="text-xl font-bold font-mono text-rose-400">{summary.absent_days} Days</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <p className="text-[11px] text-slate-400">Leaves Taken</p>
            <p className="text-xl font-bold font-mono text-indigo-400">{summary.leave_days} Days</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <p className="text-[11px] text-slate-400">Working Hours</p>
            <p className="text-xl font-bold font-mono text-cyan-400">{summary.total_working_hours} hrs</p>
          </div>
        </div>
      )}

      {/* Filters & Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-sm font-bold text-slate-100">Attendance History Logs</h3>
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300"
            />
            <span className="text-slate-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Check In</th>
                <th className="p-3">Check Out</th>
                <th className="p-3">Hours</th>
                <th className="p-3">Status</th>
                <th className="p-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    No attendance records logged for the selected period.
                  </td>
                </tr>
              ) : (
                history.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-800/30">
                    <td className="p-3 font-mono text-slate-200">{record.date}</td>
                    <td className="p-3 text-emerald-400 font-mono">
                      {record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString() : "-"}
                    </td>
                    <td className="p-3 text-amber-400 font-mono">
                      {record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString() : "-"}
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-300">{record.working_hours} h</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        record.status === "PRESENT" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" :
                        record.status === "LATE" ? "bg-amber-500/10 text-amber-400 border border-amber-500/30" :
                        "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 max-w-xs truncate">{record.notes || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

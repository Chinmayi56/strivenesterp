import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../components/Toast";
import {
  Briefcase,
  RefreshCw,
  UserCheck,
  Clock,
  CalendarCheck,
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  Bell,
  CheckSquare,
  FileText,
  Calendar,
  LogIn,
  LogOut,
  ArrowRight,
} from "lucide-react";
import { formatDate, formatRoleName } from "../utils/formatters";
import { portalService, EmployeeDashboardSummary } from "../services/portalService";
import { Link } from "react-router-dom";

export const DashboardPage: React.FC = () => {
  const { user, refresh } = useAuth();
  const { showSuccess, showError } = useToast();

  const [dashboardData, setDashboardData] = useState<EmployeeDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkInNote, setCheckInNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await portalService.getDashboardSummary();
      setDashboardData(data);
    } catch (err: any) {
      showError(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      await portalService.checkIn(checkInNote || "Checked in from dashboard");
      showSuccess("Successfully checked in for today!", "Attendance Check-In");
      setCheckInNote("");
      await fetchDashboard();
    } catch (err: any) {
      showError(err.response?.data?.message || err.message || "Check-in failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setActionLoading(true);
      await portalService.checkOut("Checked out from dashboard");
      showSuccess("Successfully checked out for today!", "Attendance Check-Out");
      await fetchDashboard();
    } catch (err: any) {
      showError(err.response?.data?.message || err.message || "Check-out failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const todayAtt = dashboardData?.today_attendance;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 border border-slate-800 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono font-semibold">
            <Briefcase className="w-3.5 h-3.5" />
            EMPLOYEE PORTAL DASHBOARD
          </div>
          <h2 className="text-2xl font-bold text-slate-100">
            Welcome back, {user?.first_name} {user?.last_name}!
          </h2>
          <p className="text-xs text-slate-400">
            Employee ID: <span className="text-indigo-300 font-mono font-semibold">{user?.employee_id || "EMP-1001"}</span> • Department: <span className="text-slate-200 font-medium">{user?.department || "Engineering"}</span>
          </p>
        </div>

        {/* Attendance Action Box */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {!todayAtt?.check_in_time ? (
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
              <input
                type="text"
                placeholder="Optional check-in note..."
                value={checkInNote}
                onChange={(e) => setCheckInNote(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full sm:w-48"
              />
              <button
                onClick={handleCheckIn}
                disabled={actionLoading}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap"
              >
                <LogIn className="w-4 h-4" />
                <span>Clock In Now</span>
              </button>
            </div>
          ) : !todayAtt?.check_out_time ? (
            <div className="flex items-center justify-between gap-4 w-full sm:w-auto">
              <div className="text-xs">
                <span className="text-slate-400">Clocked In: </span>
                <span className="text-emerald-400 font-mono font-bold">
                  {new Date(todayAtt.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <button
                onClick={handleCheckOut}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
              >
                <LogOut className="w-4 h-4" />
                <span>Clock Out</span>
              </button>
            </div>
          ) : (
            <div className="text-xs text-slate-300 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Shift Completed Today ({todayAtt.working_hours} hrs)</span>
            </div>
          )}
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Today's Attendance</span>
            <CalendarCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono">
            {todayAtt?.status || "NOT CLOCKED IN"}
          </div>
          <div className="text-[11px] text-slate-500">
            {todayAtt?.check_in_time ? `Clocked in at ${new Date(todayAtt.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : "No shift logged today"}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Recent Leave Request</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-indigo-300 font-mono">
            {dashboardData?.recent_leave ? dashboardData.recent_leave.status : "NO LEAVE"}
          </div>
          <div className="text-[11px] text-slate-500">
            {dashboardData?.recent_leave ? `${dashboardData.recent_leave.leave_type} (${dashboardData.recent_leave.total_days} days)` : "No pending leave applications"}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Assigned Projects</span>
            <FolderKanban className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-300 font-mono">
            {dashboardData?.assigned_projects_count ?? 0} Projects
          </div>
          <div className="text-[11px] text-slate-500">Active project memberships</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Tasks</span>
            <CheckSquare className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-cyan-300 font-mono">
            {dashboardData?.pending_tasks_count ?? 0} Tasks
          </div>
          <div className="text-[11px] text-slate-500">Tasks requiring your attention</div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Deadlines */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Upcoming Task Deadlines</span>
            </h3>
            <Link to="/tasks" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold">
              <span>View All Tasks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {!dashboardData?.upcoming_deadlines?.length ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No upcoming task deadlines in the next 14 days.
            </div>
          ) : (
            <div className="space-y-3">
              {dashboardData.upcoming_deadlines.map((task) => (
                <div key={task.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">{task.task_name}</p>
                    <p className="text-[11px] text-slate-400">
                      Project: <span className="text-slate-300">{task.project_name || "General"}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      Due: {task.due_date}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase">{task.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications & Announcements */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-400" />
              <span>Recent Activity</span>
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              {dashboardData?.unread_notifications_count ?? 0} Unread
            </span>
          </div>

          {!dashboardData?.recent_activity?.length ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No recent activity logs found.
            </div>
          ) : (
            <div className="space-y-3">
              {dashboardData.recent_activity.map((n) => (
                <div key={n.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1">
                  <div className="flex justify-between items-center text-slate-300 font-semibold">
                    <span>{n.title}</span>
                    <span className="text-[10px] text-slate-500">{new Date(n.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

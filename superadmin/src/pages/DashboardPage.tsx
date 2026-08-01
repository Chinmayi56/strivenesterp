import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../components/Toast";
import { employeeService } from "../services/employeeService";
import { auditService } from "../services/auditService";
import { EmployeeStatsSummary, Employee } from "../types/employee";
import { AuditLog } from "../types/api";
import { Skeleton } from "../components/Skeleton";
import {
  ShieldCheck,
  RefreshCw,
  Users,
  UserCheck,
  UserX,
  ShieldAlert,
  ArrowRight,
  Clock,
  Globe,
  Lock,
  Terminal,
  Key,
} from "lucide-react";
import { formatDate, formatRoleName } from "../utils/formatters";
import { api } from "../api/axios";

export const DashboardPage: React.FC = () => {
  const { user, accessToken, refreshToken, refresh, getCurrentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [stats, setStats] = useState<EmployeeStatsSummary | null>(null);
  const [recentAudits, setRecentAudits] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [interceptorLog, setInterceptorLog] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, auditData] = await Promise.all([
        employeeService.getEmployeeStats(),
        auditService.getAuthenticationLogs({ page: 1, size: 5 }),
      ]);
      setStats(statsData);
      setRecentAudits(auditData.items || []);
    } catch (err: any) {
      showError("Failed to load real-time system metrics.", "Dashboard Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
      showSuccess("Token rotation executed successfully. Issued new JWT pairs.", "Token Rotated");
    } catch (err: any) {
      showError(err.message || "Token refresh failed.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleVerifySession = async () => {
    setVerifying(true);
    try {
      const updatedUser = await getCurrentUser();
      if (updatedUser) {
        showSuccess(`Authenticated session active for ${updatedUser.email}.`, "Session Verified");
      }
    } catch (err: any) {
      showError("Session verification failed.");
    } finally {
      setVerifying(false);
    }
  };

  const handleTriggerInterceptorTest = async () => {
    setInterceptorLog("Testing Axios 401 Auto-Refresh Interceptor...");
    try {
      const res = await api.get("/v1/auth/me");
      setInterceptorLog(`Interceptor Test Result: STATUS ${res.status} OK. Session valid.`);
      showSuccess("Axios interceptor validated JWT session.", "Interceptor OK");
    } catch (err: any) {
      setInterceptorLog(`Interceptor Error: ${err.message}`);
      showError("Interceptor test error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/40 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            SUPER ADMIN ENTERPRISE CONTROL
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            Welcome back, {user?.first_name} {user?.last_name}!
          </h2>
          <p className="text-xs text-slate-400">
            Logged in as <span className="text-amber-300 font-semibold">{user?.email}</span> with role <span className="text-amber-400 font-mono font-bold">{user?.role}</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync Data</span>
          </button>

          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Rotate Token</span>
          </button>

          <button
            onClick={handleVerifySession}
            disabled={verifying}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Verify /auth/me</span>
          </button>
        </div>
      </div>

      {/* Real Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate("/employees")}
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-2 hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Employees</span>
            <Users className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div className="text-2xl font-black text-slate-100 font-mono">
              {stats?.total_employees || 0}
            </div>
          )}
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>Registered workforce records</span>
            <ArrowRight className="w-3 h-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        <div
          onClick={() => navigate("/employees?status=ACTIVE")}
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-2 hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Employees</span>
            <UserCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {stats?.active_employees || 0}
            </div>
          )}
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>Active & verified profiles</span>
            <ArrowRight className="w-3 h-3 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        <div
          onClick={() => navigate("/employees?status=PENDING")}
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-2 hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Approvals</span>
            <Clock className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div className="text-2xl font-black text-amber-400 font-mono">
              {stats?.pending_employees || 0}
            </div>
          )}
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>Awaiting admin review</span>
            <ArrowRight className="w-3 h-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        <div
          onClick={() => navigate("/employees?status=BLOCKED")}
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-2 hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Blocked / Inactive</span>
            <UserX className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
          </div>
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div className="text-2xl font-black text-rose-400 font-mono">
              {(stats?.blocked_employees || 0) + (stats?.inactive_employees || 0)}
            </div>
          )}
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>Restricted or inactive accounts</span>
            <ArrowRight className="w-3 h-3 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Employee Onboarding */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <span>Recent Employee Onboarding</span>
            </h3>
            <button
              onClick={() => navigate("/employees")}
              className="text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !stats?.recent_employees || stats.recent_employees.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No recent employee records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Employee</th>
                    <th className="py-2.5 px-3">Role & ID</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Joined</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {stats.recent_employees.map((emp: Employee) => (
                    <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-100 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-amber-300 font-bold flex items-center justify-center text-xs shrink-0">
                            {emp.first_name?.charAt(0)}
                          </div>
                          <div>
                            <div>{emp.full_name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{emp.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                        <div className="text-amber-300 font-bold">{emp.employee_id}</div>
                        <div className="text-[10px] text-slate-500">{emp.role}</div>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                            emp.status === "ACTIVE"
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              : emp.status === "PENDING"
                              ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                              : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                          }`}
                        >
                          {emp.status}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {formatDate(emp.created_at)}
                      </td>

                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/employees/${emp.id}`)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-all"
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Security Audit Telemetry Stream */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Security Audit Stream</span>
              </h3>
              <button
                onClick={() => navigate("/audit-logs")}
                className="text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
              >
                <span>All Logs</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {loading ? (
              <div className="space-y-3 pt-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : recentAudits.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No recent security telemetry logs.
              </div>
            ) : (
              <div className="space-y-2.5 pt-3">
                {recentAudits.map((log) => {
                  const isError = log.event_type.includes("FAILED") || log.event_type.includes("LOCKED");
                  return (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span
                          className={`font-bold ${
                            isError ? "text-rose-400" : "text-emerald-400"
                          }`}
                        >
                          {log.event_type}
                        </span>
                        <span className="text-slate-500">{formatDate(log.created_at)}</span>
                      </div>
                      <div className="text-slate-300 text-[11px] truncate">{log.description}</div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {log.ip_address || "127.0.0.1"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between items-center font-mono">
            <span>Authentication Rate Limiter</span>
            <span className="text-emerald-400 font-bold">5 REQ / SEC</span>
          </div>
        </div>
      </div>

      {/* JWT & Interceptor Session Debugger */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-400" />
            <span>JWT Security Token & Session Inspector</span>
          </h3>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Active JWT Context
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400 font-mono">
              <span>Access Token (Bearer Authorization):</span>
              <span className="text-amber-400">Bearer Token</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 break-all select-all max-h-24 overflow-y-auto">
              {accessToken ? `${accessToken.substring(0, 120)}...` : "No access token active"}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400 font-mono">
              <span>Refresh Token (Rotated State):</span>
              <span className="text-indigo-400">Rotation Hash</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-400 break-all select-all max-h-24 overflow-y-auto">
              {refreshToken ? `${refreshToken.substring(0, 120)}...` : "No refresh token active"}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Last Authentication: <span className="text-slate-200 font-medium">{formatDate(user?.last_login)}</span>
          </div>
          <button
            onClick={handleTriggerInterceptorTest}
            className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 text-xs font-medium transition-all flex items-center gap-1.5"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Test 401 Interceptor</span>
          </button>
        </div>

        {interceptorLog && (
          <div className="p-3 rounded-xl bg-slate-950 border border-indigo-500/30 text-xs font-mono text-indigo-200">
            {interceptorLog}
          </div>
        )}
      </div>
    </div>
  );
};

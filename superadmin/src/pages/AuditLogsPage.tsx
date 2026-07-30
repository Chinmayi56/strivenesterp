import React, { useEffect, useState } from "react";
import { auditService } from "../services/auditService";
import { AuditLog } from "../types/api";
import { useToast } from "../components/Toast";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Skeleton } from "../components/Skeleton";
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Globe,
  Clock,
  User,
} from "lucide-react";
import { formatDate } from "../utils/formatters";

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [size, setSize] = useState<number>(10);
  const [eventType, setEventType] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  const { showError } = useToast();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await auditService.getAuthenticationLogs({
        page,
        size,
        event_type: eventType || undefined,
        search: search.trim() || undefined,
      });
      setLogs(data.items);
      setTotal(data.total);
    } catch (err: any) {
      showError("Failed to fetch security audit logs.", "Audit API Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, size, eventType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const totalPages = Math.ceil(total / size) || 1;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-amber-400 mb-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            SECURITY AUDIT TELEMETRY
          </div>
          <h2 className="text-xl font-bold text-slate-100">Authentication Security Audit Logs</h2>
          <p className="text-xs text-slate-400">
            Real-time security telemetry recording login attempts, lockouts, password resets, and token events.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by IP, description, or event..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 text-slate-200 text-xs rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Event:</span>
          </div>

          <select
            value={eventType}
            onChange={(e) => {
              setEventType(e.target.value);
              setPage(1);
            }}
            className="py-2 px-3 bg-slate-950 text-slate-200 text-xs rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 font-mono"
          >
            <option value="">All Security Events</option>
            <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
            <option value="LOGIN_FAILED">LOGIN_FAILED</option>
            <option value="ACCOUNT_LOCKED">ACCOUNT_LOCKED</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="REFRESH_TOKEN">REFRESH_TOKEN</option>
            <option value="PASSWORD_RESET_REQUEST">PASSWORD_RESET_REQUEST</option>
            <option value="PASSWORD_RESET">PASSWORD_RESET</option>
            <option value="USER_REGISTRATION">USER_REGISTRATION</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-300">No Audit Logs Found</h3>
            <p className="text-xs text-slate-500">
              No security events match the selected criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">User Agent</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {logs.map((log) => {
                  const isErrorEvent =
                    log.event_type.includes("FAILED") || log.event_type.includes("LOCKED");
                  const isSuccessEvent = log.event_type.includes("SUCCESS");

                  return (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] border ${
                            isErrorEvent
                              ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                              : isSuccessEvent
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                          }`}
                        >
                          {log.event_type}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-200">
                        {log.description}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Globe className="w-3 h-3 text-slate-500" />
                          {log.ip_address || "127.0.0.1"}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 max-w-xs truncate">
                        {log.user_agent || "System Client"}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {formatDate(log.created_at)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <span className="text-slate-200 font-bold">{logs.length}</span> of{" "}
            <span className="text-slate-200 font-bold">{total}</span> security audit logs
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-mono text-slate-300 px-2">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

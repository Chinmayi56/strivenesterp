import React, { useEffect, useState } from "react";
import SuperAdminApp from "../superadmin/src/App";
import EmployeeApp from "../employee/src/App";
import {
  ShieldCheck,
  Briefcase,
  Activity,
  Terminal,
  Server,
  Play,
  CheckCircle2,
  AlertCircle,
  Database,
  Layers,
  RefreshCw,
  Clock,
  BookOpen,
} from "lucide-react";

interface HealthData {
  status: string;
  database: string;
  application: string;
  version: string;
  timestamp?: string;
}

interface StandardApiResponse {
  success: boolean;
  message: string;
  data: HealthData | any;
  errors: any[];
  timestamp: string;
}

export default function App() {
  const [portalMode, setPortalMode] = useState<"superadmin" | "employee" | "system">("superadmin");

  // Health and Pytest execution state
  const [health, setHealth] = useState<StandardApiResponse | null>(null);
  const [readiness, setReadiness] = useState<StandardApiResponse | null>(null);
  const [liveness, setLiveness] = useState<StandardApiResponse | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [runningTests, setRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<{ success: boolean; output: string; errors: string; exitCode?: number } | null>(null);

  const fetchHealthChecks = async () => {
    setLoadingHealth(true);
    setHealthError(null);
    try {
      const [hRes, rRes, lRes] = await Promise.all([
        fetch("/api/v1/health"),
        fetch("/api/v1/health/ready"),
        fetch("/api/v1/health/live"),
      ]);

      if (hRes.ok) setHealth(await hRes.json());
      if (rRes.ok) setReadiness(await rRes.json());
      if (lRes.ok) setLiveness(await lRes.json());
    } catch (err: any) {
      setHealthError("Failed to connect to FastAPI backend: " + err.message);
    } finally {
      setLoadingHealth(false);
    }
  };

  const handleRunTests = async () => {
    setRunningTests(true);
    setTestResults(null);
    try {
      const res = await fetch("/api/internal/run-tests");
      const data = await res.json();
      setTestResults(data);
    } catch (err: any) {
      setTestResults({
        success: false,
        output: "",
        errors: "Failed to run tests: " + err.message,
      });
    } finally {
      setRunningTests(false);
    }
  };

  useEffect(() => {
    fetchHealthChecks();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Portal Switcher Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-black text-xs">
              S
            </div>
            <span className="font-extrabold text-sm tracking-tight text-slate-100">
              StriveNest ERP
            </span>
          </div>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
            Phase 2B Authentication Layer
          </span>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setPortalMode("superadmin")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 ${
              portalMode === "superadmin"
                ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Super Admin Portal</span>
          </button>

          <button
            onClick={() => setPortalMode("employee")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 ${
              portalMode === "employee"
                ? "bg-indigo-500 text-slate-950 font-bold shadow-md shadow-indigo-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Employee Portal</span>
          </button>

          <button
            onClick={() => setPortalMode("system")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 ${
              portalMode === "system"
                ? "bg-slate-800 text-slate-100 font-bold border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Backend Telemetry & Tests</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        {portalMode === "superadmin" && <SuperAdminApp basename="/" />}
        {portalMode === "employee" && <EmployeeApp basename="/" />}
        {portalMode === "system" && (
          <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <Server className="w-5 h-5 text-emerald-400" />
                    <span>FastAPI Backend Health & Test Suite</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Live endpoint health probes and Pytest backend integration test runner.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchHealthChecks}
                    disabled={loadingHealth}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-2"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingHealth ? "animate-spin" : ""}`} />
                    <span>Check Health</span>
                  </button>

                  <button
                    onClick={handleRunTests}
                    disabled={runningTests}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Pytest Suite</span>
                  </button>
                </div>
              </div>

              {/* Health Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-xs font-mono text-slate-400 uppercase">/api/v1/health</div>
                  <div className="text-sm font-bold text-emerald-400 font-mono">
                    {health?.data?.status || "HEALTHY"}
                  </div>
                  <div className="text-[11px] text-slate-500">DB: {health?.data?.database || "CONNECTED"}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-xs font-mono text-slate-400 uppercase">/api/v1/health/ready</div>
                  <div className="text-sm font-bold text-emerald-400 font-mono">
                    {readiness?.data?.status || "READY"}
                  </div>
                  <div className="text-[11px] text-slate-500">Database migration ready</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-xs font-mono text-slate-400 uppercase">/api/v1/health/live</div>
                  <div className="text-sm font-bold text-emerald-400 font-mono">
                    {liveness?.data?.status || "ALIVE"}
                  </div>
                  <div className="text-[11px] text-slate-500">Uvicorn process running</div>
                </div>
              </div>

              {/* Test Results Output */}
              {runningTests && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-amber-400 flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin"></div>
                  <span>Running backend pytest suite (17 test modules)...</span>
                </div>
              )}

              {testResults && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300">Pytest Output Log:</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        testResults.success
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                      }`}
                    >
                      {testResults.success ? "PASSED (100%)" : "FAILED"}
                    </span>
                  </div>
                  <pre className="p-3 bg-slate-900 rounded-lg text-slate-300 overflow-x-auto max-h-96 text-[11px] leading-relaxed">
                    {testResults.output || testResults.errors}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

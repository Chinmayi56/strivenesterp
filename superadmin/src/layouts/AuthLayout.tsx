import React from "react";
import { ShieldCheck, Cpu } from "lucide-react";

export const AuthLayout: React.FC<{ children: React.ReactNode; subtitle?: string }> = ({
  children,
  subtitle = "Enterprise Super Admin Security Portal",
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden selection:bg-amber-500 selection:text-slate-950">
      {/* Background ambient lighting & mesh glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none"></div>

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Branding header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-amber-500/30 text-amber-400 text-xs font-semibold shadow-xl backdrop-blur-md">
            <ShieldCheck className="w-4 h-4" />
            <span>StriveNest ERP</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
          </div>

          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">
            Super Admin Portal
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Card container */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl shadow-black/60 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-indigo-500"></div>
          {children}
        </div>

        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-2 font-mono">
          <Cpu className="w-3.5 h-3.5 text-amber-500/60" />
          <span>Secured by StriveNest Guard™ v2.5.0</span>
        </div>
      </div>
    </div>
  );
};

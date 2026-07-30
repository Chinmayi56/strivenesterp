import React from "react";
import { useAuth } from "../hooks/useAuth";
import { LogOut, User, Bell, Briefcase } from "lucide-react";
import { formatRoleName } from "../utils/formatters";

export const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
          <Briefcase className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-100 tracking-wide">StriveNest ERP</h1>
          <p className="text-[11px] text-indigo-400/90 font-mono tracking-tight font-medium">
            EMPLOYEE PORTAL
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500"></span>
        </button>

        <div className="h-6 w-px bg-slate-800"></div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-bold flex items-center justify-center text-xs">
            {user?.first_name?.charAt(0) || "E"}
            {user?.last_name?.charAt(0) || "P"}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold text-slate-200">
              {user?.first_name} {user?.last_name}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {formatRoleName(user?.role)}
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 text-xs font-medium transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

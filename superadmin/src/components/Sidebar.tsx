import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShieldAlert,
  UserCheck,
  Users,
  KeyRound,
  CalendarDays,
} from "lucide-react";

export const Sidebar: React.FC = () => {
  const navItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },

  {
    label: "Employee Directory",
    path: "/employees",
    icon: Users,
  },

  {
    label: "Leave Management",
    path: "/admin/leaves",
    icon: CalendarDays,
  },

  {
    label: "Security Audit Logs",
    path: "/audit-logs",
    icon: ShieldAlert,
  },

  {
    label: "Security Policies",
    path: "/security",
    icon: KeyRound,
  },

  {
    label: "Admin Profile",
    path: "/profile",
    icon: UserCheck,
  },
];

  return (
    <aside className="w-64 bg-slate-950/60 border-r border-slate-800/80 p-4 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
            Core Modules
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-lg shadow-amber-500/5"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800/60">
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
            System Environment
          </p>
          <div className="mx-1 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-2">
            <div className="flex justify-between items-center text-slate-400 text-[11px]">
              <span>JWT Auth Status</span>
              <span className="text-emerald-400 font-mono font-bold">ACTIVE</span>
            </div>
            <div className="flex justify-between items-center text-slate-400 text-[11px]">
              <span>Token Refresh</span>
              <span className="text-amber-400 font-mono font-bold">ROTATION</span>
            </div>
            <div className="flex justify-between items-center text-slate-400 text-[11px]">
              <span>Security Level</span>
              <span className="text-indigo-400 font-mono font-bold">ENTERPRISE</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 bg-slate-900/40 border border-slate-800/60 rounded-xl text-[11px] text-slate-500 text-center font-mono">
        StriveNest v2.5.0
      </div>
    </aside>
  );
};

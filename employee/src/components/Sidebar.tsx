import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  UserCheck,
  CalendarCheck,
  Clock,
  FileText,
  FolderKanban,
  CheckSquare,
  Calendar,
  Bell,
  Settings,
} from "lucide-react";

export const Sidebar: React.FC = () => {
  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Attendance", path: "/attendance", icon: CalendarCheck },
    { label: "Leave Requests", path: "/leave", icon: Clock },
    { label: "My Projects", path: "/projects", icon: FolderKanban },
    { label: "Tasks", path: "/tasks", icon: CheckSquare },
    { label: "Calendar", path: "/calendar", icon: Calendar },
    { label: "My Documents", path: "/documents", icon: FileText },
    { label: "Notifications", path: "/notifications", icon: Bell },
    { label: "My Profile", path: "/profile", icon: UserCheck },
    { label: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-950/60 border-r border-slate-800/80 p-4 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
            Employee Workspace
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
                        ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shadow-lg shadow-indigo-500/5"
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
            Active Employee Session
          </p>
          <div className="mx-1 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-2">
            <div className="flex justify-between items-center text-slate-400 text-[11px]">
              <span>Auth Status</span>
              <span className="text-emerald-400 font-mono font-bold">VERIFIED</span>
            </div>
            <div className="flex justify-between items-center text-slate-400 text-[11px]">
              <span>Token Refresh</span>
              <span className="text-indigo-400 font-mono font-bold">AUTOMATIC</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 bg-slate-900/40 border border-slate-800/60 rounded-xl text-[11px] text-slate-500 text-center font-mono">
        StriveNest Employee Portal v2.5
      </div>
    </aside>
  );
};

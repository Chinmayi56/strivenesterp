import React from "react";
import { useAuth } from "../hooks/useAuth";
import { UserCheck, ShieldCheck, Mail, Building, Briefcase, Phone, Clock } from "lucide-react";
import { formatDate, formatRoleName } from "../utils/formatters";

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="pb-4 border-b border-slate-800">
        <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-amber-400 mb-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          SYSTEM ADMINISTRATOR PROFILE
        </div>
        <h2 className="text-xl font-bold text-slate-100">Super Admin Security Credentials</h2>
        <p className="text-xs text-slate-400">
          Super Admin administrative account and role authorizations.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-xl flex items-center justify-center">
            {user?.first_name?.charAt(0)}
            {user?.last_name?.charAt(0)}
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-100">
              {user?.first_name} {user?.last_name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2.5 py-0.5 rounded text-xs font-bold font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30">
                {formatRoleName(user?.role)}
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {user?.status}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-2 text-slate-400 font-mono">
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              <span>Email Address</span>
            </div>
            <div className="text-slate-100 font-semibold">{user?.email}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-2 text-slate-400 font-mono">
              <Building className="w-3.5 h-3.5 text-amber-400" />
              <span>Department</span>
            </div>
            <div className="text-slate-100 font-semibold">{user?.department || "Executive Management"}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-2 text-slate-400 font-mono">
              <Briefcase className="w-3.5 h-3.5 text-amber-400" />
              <span>Position</span>
            </div>
            <div className="text-slate-100 font-semibold">{user?.position || "Chief Systems Administrator"}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-2 text-slate-400 font-mono">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>Phone</span>
            </div>
            <div className="text-slate-100 font-semibold">{user?.phone || "+1 (800) 555-0199"}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1 sm:col-span-2">
            <div className="flex items-center gap-2 text-slate-400 font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Last Login Time</span>
            </div>
            <div className="text-slate-100 font-mono font-semibold">{formatDate(user?.last_login)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

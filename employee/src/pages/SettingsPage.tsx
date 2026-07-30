import React, { useState } from "react";
import { useToast } from "../components/Toast";
import { portalService } from "../services/portalService";
import { Key, Lock, ShieldCheck, CheckCircle2, UserCheck } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      showError("Please fill out all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      showError("New password and confirm password do not match.");
      return;
    }

    if (newPassword.length < 8) {
      showError("New password must be at least 8 characters long.");
      return;
    }

    try {
      setLoading(true);
      await portalService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      showSuccess("Password updated successfully! Please use your new password next time.", "Security Settings");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      showError(err.response?.data?.message || err.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono font-semibold">
          <Key className="w-3.5 h-3.5" />
          PORTAL SECURITY & ACCOUNT SETTINGS
        </div>
        <h1 className="text-2xl font-bold text-slate-100 mt-1">Account & Security Settings</h1>
        <p className="text-xs text-slate-400">Update your account credentials and review self-service authentication parameters.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Change Password Card */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Lock className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-100">Change Account Password</h3>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">New Password (Min 8 chars)</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
            >
              Update Password
            </button>
          </form>
        </div>

        {/* Security Summary Card */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">Security Parameters</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex justify-between font-mono text-slate-300">
                <span>Employee Account Email</span>
                <span className="text-indigo-400 font-bold">{user?.email}</span>
              </div>
              <p className="text-[11px] text-slate-500">Primary authentication identifier</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex justify-between font-mono text-slate-300">
                <span>Account Authorization</span>
                <span className="text-emerald-400 font-bold">RBAC VERIFIED</span>
              </div>
              <p className="text-[11px] text-slate-500">Access role: {user?.role || "EMPLOYEE"}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex justify-between font-mono text-slate-300">
                <span>Token Refresh Mode</span>
                <span className="text-cyan-400 font-bold">AUTOMATIC</span>
              </div>
              <p className="text-[11px] text-slate-500">Axios response interceptor rotates JWT silently</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

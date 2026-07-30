import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, KeyRound, ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { AuthLayout } from "../layouts/AuthLayout";
import { FormInput } from "../components/FormInput";
import { employeeAuthService } from "../services/authService";
import { useToast } from "../components/Toast";
import { validatePasswordStrength } from "../utils/validators";

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenFromQuery = searchParams.get("token") || "";

  const [resetToken, setResetToken] = useState(tokenFromQuery);
  const [newPassword, setNewPassword] = useState("NewEmployeePass123!");
  const [confirmPassword, setConfirmPassword] = useState("NewEmployeePass123!");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (tokenFromQuery) {
      setResetToken(tokenFromQuery);
    }
  }, [tokenFromQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!resetToken.trim()) {
      setErrorMsg("Please provide a valid reset token.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    const { isValid, message } = validatePasswordStrength(newPassword);
    if (!isValid) {
      setErrorMsg(message);
      return;
    }

    setLoading(true);
    try {
      await employeeAuthService.resetPassword(resetToken.trim(), newPassword);
      setSuccess(true);
      showSuccess("Your password has been reset successfully.", "Password Updated");
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to reset password.";
      setErrorMsg(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout subtitle="Set a new secure employee password">
      <div className="space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <KeyRound className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-slate-100">Reset Password</h2>
        </div>

        {success ? (
          <div className="space-y-4 text-center py-2 animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-100">Password Reset Complete</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your password was updated. You may now sign in with your new credentials.
              </p>
            </div>

            <button
              onClick={() => navigate("/login")}
              className="w-full py-3 px-4 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              <span>Back to Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs">
                {errorMsg}
              </div>
            )}

            <FormInput
              label="Reset Token"
              type="text"
              placeholder="Paste reset token..."
              value={resetToken}
              onChange={(e) => setResetToken(e.target.value)}
              icon={<ShieldCheck className="w-4 h-4" />}
              required
            />

            <FormInput
              label="New Password"
              isPassword
              placeholder="••••••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              required
            />

            <FormInput
              label="Confirm New Password"
              isPassword
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-60"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Reset Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="pt-2 border-t border-slate-800 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

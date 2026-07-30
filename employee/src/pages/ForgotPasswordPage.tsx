import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, KeyRound, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { AuthLayout } from "../layouts/AuthLayout";
import { FormInput } from "../components/FormInput";
import { employeeAuthService } from "../services/authService";
import { useToast } from "../components/Toast";
import { isValidEmail } from "../utils/validators";

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("john.smith@strivenest.com");
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isValidEmail(email)) {
      setErrorMsg("Please enter a valid corporate email address.");
      return;
    }

    setLoading(true);
    try {
      const data = await employeeAuthService.forgotPassword(email);
      if (data.reset_token) {
        setResetToken(data.reset_token);
        showSuccess("Password reset token generated successfully.", "Token Issued");
      } else {
        showSuccess(data.message, "Password Reset Dispatched");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to initiate password reset.";
      setErrorMsg(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout subtitle="Reset your employee account password">
      <div className="space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <KeyRound className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-slate-100">Forgot Password</h2>
        </div>

        {resetToken ? (
          <div className="space-y-4 text-center py-2 animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-100">Reset Token Issued</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                A password reset token has been issued for <span className="text-indigo-300 font-mono">{email}</span>.
              </p>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-left space-y-1">
              <div className="text-[10px] text-slate-500 font-mono uppercase">Reset Token:</div>
              <div className="text-xs font-mono text-indigo-300 break-all select-all font-semibold">
                {resetToken}
              </div>
            </div>

            <button
              onClick={() => navigate(`/reset-password?token=${encodeURIComponent(resetToken)}`)}
              className="w-full py-3 px-4 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              <span>Proceed to Reset Password</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <p className="text-xs text-slate-300 leading-relaxed">
              Enter your corporate email address to receive password recovery instructions.
            </p>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs">
                {errorMsg}
              </div>
            )}

            <FormInput
              label="Corporate Email"
              type="email"
              placeholder="john.smith@strivenest.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
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
                  <span>Send Recovery Email</span>
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

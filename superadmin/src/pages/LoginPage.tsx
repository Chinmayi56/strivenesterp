import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  LogIn,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

import { AuthLayout } from "../layouts/AuthLayout";
import { FormInput } from "../components/FormInput";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../components/Toast";
import { isValidEmail } from "../utils/validators";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const { login } = useAuth();
  const { showSuccess, showError } = useToast();

  const [email, setEmail] = useState("admin@strivenest.com");
  const [password, setPassword] = useState("Admin@123");
  const [rememberMe, setRememberMe] = useState(true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleQuickFill = () => {
    setEmail("admin@strivenest.com");
    setPassword("Admin@123");
    setErrorMsg(null);
  };

  const validateForm = (): boolean => {
    if (!email.trim()) {
      setErrorMsg("Corporate email is required.");
      return false;
    }

    if (!isValidEmail(email)) {
      setErrorMsg("Please enter a valid corporate email.");
      return false;
    }

    if (!password.trim()) {
      setErrorMsg("Password is required.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setErrorMsg(null);

    if (!validateForm()) return;

    try {
      setSubmitting(true);

      await login({
        email: email.trim(),
        password,
        remember_me: rememberMe,
      });

      showSuccess(
        "Welcome back Super Administrator.",
        "Authentication Successful"
      );

      navigate("/dashboard");
    } catch (err: any) {
      const status = err?.response?.status;

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Invalid email or password.";

      if (status === 423) {
        setErrorMsg(
          "Your account has been temporarily locked due to multiple failed login attempts."
        );

        showError(
          "Account Locked",
          "Please try again later."
        );
      } else if (status === 401) {
        setErrorMsg(
          "Invalid email or password."
        );

        showError(
          "Authentication Failed",
          "Please verify your credentials."
        );
      } else {
        setErrorMsg(message);

        showError(
          "Login Failed",
          message
        );
      }
    } finally {
      setSubmitting(false);
    }
  };
    return (
    <AuthLayout subtitle="Enterprise Super Admin Security Portal">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">
              Secure Sign In
            </h2>
          </div>

          <button
            type="button"
            onClick={handleQuickFill}
            className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-medium text-amber-300 transition hover:bg-amber-500/20"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Demo Prefill
          </button>
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-300">
            <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <span className="text-sm leading-relaxed">
              {errorMsg}
            </span>
          </div>
        )}

        {/* Email */}
        <FormInput
          label="Corporate Email"
          type="email"
          placeholder="admin@strivenest.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="w-4 h-4" />}
          required
        />

        {/* Password */}
        <FormInput
          label="Password"
          isPassword
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock className="w-4 h-4" />}
          required
        />

        {/* Remember */}
        <div className="flex items-center justify-between text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-slate-300">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) =>
                setRememberMe(e.target.checked)
              }
              className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-amber-500 focus:ring-amber-500"
            />
            Remember Me
          </label>

          <Link
            to="/forgot-password"
            className="font-medium text-amber-400 transition hover:text-amber-300"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3.5 font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:scale-[1.02] hover:from-amber-400 hover:to-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900"></div>
              Authenticating...
            </>
          ) : (
            <>
              <LogIn className="h-5 w-5" />
              Authenticate Session
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        {/* Divider */}
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>

          <div className="relative flex justify-center">
            <span className="bg-slate-900 px-3 text-xs text-slate-500">
              Enterprise Access
            </span>
          </div>
        </div>

        {/* Security Card */}
        <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-slate-900 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-6 w-6 text-amber-400" />

            <div>
              <h3 className="font-semibold text-white">
                Enterprise Security
              </h3>

              <p className="mt-1 text-xs leading-6 text-slate-400">
                Your login session is protected with JWT
                Authentication, Password Hashing, Refresh
                Tokens, Secure API Validation and Enterprise
                Access Control.
              </p>
            </div>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
          <h4 className="mb-2 text-sm font-semibold text-amber-300">
            Demo Credentials
          </h4>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex justify-between">
              <span>Email</span>
              <span className="font-mono">
                admin@strivenest.com
              </span>
            </div>

            <div className="flex justify-between">
              <span>Password</span>
              <span className="font-mono">
                Admin@123
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} StriveNest Technologies
          <br />
          Enterprise Resource Planning Platform
        </div>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
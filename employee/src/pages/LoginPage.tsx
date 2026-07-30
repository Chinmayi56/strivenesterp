import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  LogIn,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import { AuthLayout } from "../layouts/AuthLayout";
import { FormInput } from "../components/FormInput";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../components/Toast";
import { isValidEmail } from "../utils/validators";

const DEMO_EMAIL = "admin@strivenest.com";
const DEMO_PASSWORD = "Admin@123";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const { login } = useAuth();
  const { showSuccess, showError } = useToast();

  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fillDemoCredentials = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setErrorMessage("");
  };

  const validateForm = (): boolean => {
    if (!email.trim()) {
      setErrorMessage("Corporate email is required.");
      return false;
    }

    if (!isValidEmail(email)) {
      setErrorMessage("Please enter a valid corporate email.");
      return false;
    }

    if (!password.trim()) {
      setErrorMessage("Password is required.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setErrorMessage("");

    if (!validateForm()) return;

    try {
      setLoading(true);

      await login({
        email: email.trim(),
        password,
        remember_me: rememberMe,
      });

      showSuccess(
        "Welcome back Super Administrator.",
        "Authentication Successful"
      );

      navigate("/dashboard", { replace: true });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Invalid email or password.";

      if (error?.response?.status === 423) {
        setErrorMessage(
          "Your account has been temporarily locked. Please try again later."
        );
      } else {
        setErrorMessage(message);
      }

      showError(message, "Authentication Failed");
    } finally {
      setLoading(false);
    }
  };
    return (
    <AuthLayout subtitle="Authenticate with your Super Administrator credentials">
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <LogIn className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">
              Secure Login
            </h2>
          </div>

          <button
            type="button"
            onClick={fillDemoCredentials}
            className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300 transition hover:bg-amber-500/20"
          >
            <Sparkles className="w-3 h-3" />
            Demo
          </button>
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-red-300">
            <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{errorMessage}</span>
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
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock className="w-4 h-4" />}
          required
        />

        {/* Remember */}
        <div className="flex items-center justify-between text-sm">

          <label className="flex items-center gap-2 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-amber-500"
            />
            Remember Me
          </label>

          <Link
            to="/forgot-password"
            className="text-amber-400 hover:text-amber-300"
          >
            Forgot Password?
          </Link>

        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 font-semibold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
              Authenticating...
            </>
          ) : (
            <>
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
              Enterprise Security
            </span>
          </div>
        </div>

        {/* Security Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-center">
          <h3 className="mb-1 text-sm font-semibold text-white">
            StriveNest Guard™
          </h3>

          <p className="text-xs leading-6 text-slate-400">
            Protected using enterprise-grade JWT authentication,
            encrypted password hashing, secure PostgreSQL storage,
            automatic session management, and role-based access
            control.
          </p>
        </div>

      </form>
    </AuthLayout>
  );
};

export default LoginPage;
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicRoute } from "./PublicRoute";
import { LoginPage } from "../pages/LoginPage";
import { ForgotPasswordPage } from "../pages/ForgotPasswordPage";
import { ResetPasswordPage } from "../pages/ResetPasswordPage";
import { DashboardPage } from "../pages/DashboardPage";
import { AuditLogsPage } from "../pages/AuditLogsPage";
import { ProfilePage } from "../pages/ProfilePage";
import { EmployeeListPage } from "../pages/EmployeeListPage";
import { EmployeeDetailPage } from "../pages/EmployeeDetailPage";
import LeaveManagementPage from "../pages/leave/leaveManagementPage";

export const SuperAdminRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN"]} />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/employees" element={<EmployeeListPage />} />
        <Route path="/employees/:id" element={<EmployeeDetailPage />} />
        <Route path="/audit-logs" element={<AuditLogsPage />} />
        <Route path="/users" element={<EmployeeListPage />} />
        <Route path="/security" element={<AuditLogsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin/leaves" element={<LeaveManagementPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

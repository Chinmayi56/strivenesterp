import { api } from "../api/axios";
import { ApiResponse } from "../types/api";
import {
  EmployeeLoginCredentials,
  EmployeeTokenResponseData,
  EmployeeForgotPasswordData,
  EmployeeResetPasswordData,
} from "../types/auth";
import { EmployeeUser } from "../types/user";

export const employeeAuthService = {
  async login(credentials: EmployeeLoginCredentials): Promise<EmployeeTokenResponseData> {
    const response = await api.post<ApiResponse<EmployeeTokenResponseData>>("/auth/login", {
      email: credentials.email,
      password: credentials.password,
    });
    return response.data.data;
  },

  async logout(refreshToken: string): Promise<void> {
    await api.post<ApiResponse<{ revoked: boolean }>>("/auth/logout", {
      refresh_token: refreshToken,
    });
  },

  async getCurrentUser(): Promise<EmployeeUser> {
    const response = await api.get<ApiResponse<EmployeeUser>>("/auth/me");
    return response.data.data;
  },

  async refreshToken(refreshToken: string): Promise<EmployeeTokenResponseData> {
    const response = await api.post<ApiResponse<EmployeeTokenResponseData>>("/auth/refresh", {
      refresh_token: refreshToken,
    });
    return response.data.data;
  },

  async forgotPassword(email: string): Promise<EmployeeForgotPasswordData> {
    const response = await api.post<ApiResponse<EmployeeForgotPasswordData>>("/auth/forgot-password", {
      email,
    });
    return response.data.data;
  },

  async resetPassword(resetToken: string, newPassword: string): Promise<EmployeeResetPasswordData> {
    const response = await api.post<ApiResponse<EmployeeResetPasswordData>>("/auth/reset-password", {
      reset_token: resetToken,
      new_password: newPassword,
    });
    return response.data.data;
  },
};

import { api } from "../api/axios";
import { ApiResponse } from "../types/api";
import {
  LoginCredentials,
  TokenResponseData,
  ForgotPasswordData,
  ResetPasswordData,
} from "../types/auth";
import { User } from "../types/user";

export const authService = {
  async login(credentials: LoginCredentials): Promise<TokenResponseData> {
    const response = await api.post<ApiResponse<TokenResponseData>>("/auth/login", {
      email: credentials.email,
      password: credentials.password,
    });
    return response.data.data;
  },

  async logout(refreshToken: string): Promise<void> {
    await api.post<ApiResponse<{ revoked: boolean }>>("/v1/auth/logout", {
      refresh_token: refreshToken,
    });
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<ApiResponse<User>>("/v1/auth/me");
    return response.data.data;
  },

  async refreshToken(refreshToken: string): Promise<TokenResponseData> {
    const response = await api.post<ApiResponse<TokenResponseData>>("/v1/auth/refresh", {
      refresh_token: refreshToken,
    });
    return response.data.data;
  },

  async forgotPassword(email: string): Promise<ForgotPasswordData> {
    const response = await api.post<ApiResponse<ForgotPasswordData>>("/v1/auth/forgot-password", {
      email,
    });
    return response.data.data;
  },

  async resetPassword(resetToken: string, newPassword: string): Promise<ResetPasswordData> {
    const response = await api.post<ApiResponse<ResetPasswordData>>("/v1/auth/reset-password", {
      reset_token: resetToken,
      new_password: newPassword,
    });
    return response.data.data;
  },
};

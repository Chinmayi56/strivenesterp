import { User, UserRole } from "./user";

export interface LoginCredentials {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface TokenResponseData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface ForgotPasswordData {
  message: string;
  reset_token?: string | null;
}

export interface ResetPasswordData {
  reset_completed: boolean;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  role: UserRole | null;
  loading: boolean;
  authenticated: boolean;
}

import { EmployeeUser, EmployeeRole } from "./user";

export interface EmployeeLoginCredentials {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface EmployeeTokenResponseData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: EmployeeUser;
}

export interface EmployeeForgotPasswordData {
  message: string;
  reset_token?: string | null;
}

export interface EmployeeResetPasswordData {
  reset_completed: boolean;
}

export interface EmployeeAuthState {
  user: EmployeeUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  role: EmployeeRole | null;
  loading: boolean;
  authenticated: boolean;
}

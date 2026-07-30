export type UserRole = 
  | "SUPER_ADMIN" 
  | "HR_MANAGER" 
  | "DEPARTMENT_HEAD" 
  | "EMPLOYEE" 
  | "CONTRACTOR";

export type UserStatus = 
  | "ACTIVE" 
  | "INACTIVE" 
  | "PENDING_VERIFICATION" 
  | "BLOCKED";

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  department?: string | null;
  position?: string | null;
  phone?: string | null;
  status: UserStatus;
  is_verified: boolean;
  last_login?: string | null;
  created_at: string;
  updated_at: string;
  full_name?: string;
}

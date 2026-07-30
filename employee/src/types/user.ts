export type EmployeeRole = 
  | "EMPLOYEE" 
  | "HR_MANAGER" 
  | "DEPARTMENT_HEAD" 
  | "CONTRACTOR" 
  | "SUPER_ADMIN";

export type EmployeeStatus = 
  | "ACTIVE" 
  | "INACTIVE" 
  | "PENDING_VERIFICATION" 
  | "BLOCKED";

export interface EmployeeUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: EmployeeRole;
  department?: string | null;
  position?: string | null;
  phone?: string | null;
  status: EmployeeStatus;
  is_verified: boolean;
  last_login?: string | null;
  created_at: string;
  updated_at: string;
  full_name?: string;
}

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
  id: number;

  employee_id: string;

  first_name: string;

  last_name: string;

  email: string;

  role: EmployeeRole;

  department?: string;

  position?: string;

  phone?: string;

  status?: string;

  is_active?: boolean;

  last_login?: string | null;
}
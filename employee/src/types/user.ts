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
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  status: string;
  is_active: boolean;
}

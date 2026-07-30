
export type EmployeeRole =
  | "SUPER_ADMIN"
  | "SUB_ADMIN"
  | "HR_MANAGER"
  | "DEPARTMENT_HEAD"
  | "EMPLOYEE"
  | "CONTRACTOR";

export type EmployeeStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "PENDING"
  | "PENDING_VERIFICATION"
  | "REJECTED"
  | "BLOCKED";
  
  export interface EmployeeProfile {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone?: string | null;
  role: string;
  department_id?: string | null;
  department?: string | null;
  designation_id?: string | null;
  designation?: string | null;
  profile_image?: string | null;
  status: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string | null;
}

export interface EmployeeUser {
  id: number;

  employee_id: string;

  first_name: string;

  last_name: string;

  full_name?: string;

  email: string;

  role: EmployeeRole;

  department?: string | null;

  department_id?: string | null;

  designation?: string | null;

  designation_id?: string | null;

  position?: string | null;

  phone?: string | null;

  profile_image?: string | null;

  status?: EmployeeStatus;

  is_active?: boolean;

  is_verified?: boolean;

  created_at?: string;

  updated_at?: string;

  last_login?: string | null;
}

export interface EmployeeSelfUpdatePayload {
  first_name?: string;
  last_name?: string;
  phone?: string;
  profile_image?: string;
}

export interface EmployeeDocument {
  id: string;
  employee_id: string;
  document_type: string;
  document_name: string;
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  status: string;
  uploaded_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentCreatePayload {
  document_type: string;
  document_name: string;
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
}

export interface EmployeeAuditLog {
  id: string;
  employee_id: string;
  performed_by?: string | null;
  performer_name?: string | null;
  action: string;
  details?: string | null;
  ip_address?: string | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  size: number;
  items: T[];
}

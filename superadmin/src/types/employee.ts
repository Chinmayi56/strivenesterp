export type EmployeeStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'REJECTED' | 'DELETED';
export type UserRole = 'SUPER_ADMIN' | 'EMPLOYEE';

export interface Employee {
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
  status: EmployeeStatus;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string | null;
}

export interface EmployeeCreatePayload {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  department?: string;
  designation?: string;
  role?: string;
  status?: string;
  password?: string;
  employee_id?: string;
  is_verified?: boolean;
}

export interface EmployeeUpdatePayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  department?: string;
  designation?: string;
  role?: string;
  status?: string;
  is_active?: boolean;
  is_verified?: boolean;
  profile_image?: string;
}

export interface EmployeeFilterParams {
  page?: number;
  size?: number;
  search?: string;
  department?: string;
  designation?: string;
  role?: string;
  status?: string;
  is_active?: boolean;
  is_verified?: boolean;
  include_deleted?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
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
  pages?: number;
  items: T[];
}

export interface EmployeeStatsSummary {
  total_employees: number;
  active_employees: number;
  pending_employees: number;
  inactive_employees: number;
  blocked_employees: number;
  deleted_employees: number;
  verified_employees: number;
  recent_employees: Employee[];
}

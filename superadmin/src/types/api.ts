export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  errors: any[];
  timestamp: string;
}

export interface PaginatedResponse<T = any> {
  total: number;
  page: number;
  size: number;
  items: T[];
}

export interface AuditLog {
  id: string;
  user_id?: string | null;
  event_type: string;
  description: string;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

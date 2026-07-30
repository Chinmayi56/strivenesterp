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

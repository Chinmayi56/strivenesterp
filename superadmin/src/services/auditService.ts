import { api } from "../api/axios";
import { ApiResponse, PaginatedResponse, AuditLog } from "../types/api";

export interface AuditLogQueryParams {
  page?: number;
  size?: number;
  event_type?: string;
  user_id?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
}

export const auditService = {
  async getAuthenticationLogs(params?: AuditLogQueryParams): Promise<PaginatedResponse<AuditLog>> {
    const response = await api.get<ApiResponse<PaginatedResponse<AuditLog>>>("/audit/authentication", {
      params,
    });
    return response.data.data;
  },
};

import { api } from "../api/axios";
import {
  EmployeeProfile,
  EmployeeSelfUpdatePayload,
  EmployeeDocument,
  DocumentCreatePayload,
  EmployeeAuditLog,
  PaginatedResponse,
} from "../types/employee";

export const employeeService = {
  async getMyProfile(): Promise<EmployeeProfile> {
    const response = await api.get("/employees/me");
    return response.data;
  },

  async updateMyProfile(payload: EmployeeSelfUpdatePayload): Promise<EmployeeProfile> {
    const response = await api.put("/employees/me/profile", payload);
    return response.data;
  },

  async getMyDocuments(page = 1, size = 20): Promise<PaginatedResponse<EmployeeDocument>> {
    const response = await api.get("/employees/me/documents", { params: { page, size } });
    return response.data;
  },

  async uploadMyDocument(payload: DocumentCreatePayload): Promise<EmployeeDocument> {
    const response = await api.post("/employees/me/documents", payload);
    return response.data;
  },

  async deleteMyDocument(documentId: string): Promise<{ message: string }> {
    const response = await api.delete(`/employees/me/documents/${documentId}`);
    return response.data;
  },

  async getMyAuditLogs(page = 1, size = 20): Promise<PaginatedResponse<EmployeeAuditLog>> {
    const response = await api.get("/employees/me/audit-logs", { params: { page, size } });
    return response.data;
  },
};

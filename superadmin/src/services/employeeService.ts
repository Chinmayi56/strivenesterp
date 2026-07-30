import { api } from "../api/axios";
import {
  Employee,
  EmployeeCreatePayload,
  EmployeeUpdatePayload,
  EmployeeFilterParams,
  EmployeeDocument,
  DocumentCreatePayload,
  EmployeeAuditLog,
  PaginatedResponse,
  EmployeeStatsSummary,
} from "../types/employee";

export const employeeService = {
  async getEmployeeStats(): Promise<EmployeeStatsSummary> {
    const response = await api.get("/employees/stats/summary");
    return response.data;
  },

  async getEmployees(params?: EmployeeFilterParams): Promise<PaginatedResponse<Employee>> {
    const response = await api.get("/employees", { params });
    return response.data;
  },

  async getEmployeeById(id: string): Promise<Employee> {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },

  async createEmployee(payload: EmployeeCreatePayload): Promise<Employee> {
    const response = await api.post("/employees", payload);
    return response.data;
  },

  async updateEmployee(id: string, payload: EmployeeUpdatePayload): Promise<Employee> {
    const response = await api.put(`/employees/${id}`, payload);
    return response.data;
  },

  async deleteEmployee(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  },

  async restoreEmployee(id: string): Promise<Employee> {
    const response = await api.post(`/employees/${id}/restore`);
    return response.data;
  },

  async approveEmployee(id: string): Promise<Employee> {
    const response = await api.post(`/employees/${id}/approve`);
    return response.data;
  },

  async rejectEmployee(id: string, reason?: string): Promise<Employee> {
    const response = await api.post(`/employees/${id}/reject`, null, {
      params: { reason },
    });
    return response.data;
  },

  async updateEmployeeStatus(id: string, status: string, reason?: string): Promise<Employee> {
    const response = await api.patch(`/employees/${id}/status`, { status, reason });
    return response.data;
  },

  async getEmployeeDocuments(id: string, page = 1, size = 20): Promise<PaginatedResponse<EmployeeDocument>> {
    const response = await api.get(`/employees/${id}/documents`, { params: { page, size } });
    return response.data;
  },

  async uploadEmployeeDocument(id: string, payload: DocumentCreatePayload): Promise<EmployeeDocument> {
    const response = await api.post(`/employees/${id}/documents`, payload);
    return response.data;
  },

  async deleteEmployeeDocument(id: string, documentId: string): Promise<{ message: string }> {
    const response = await api.delete(`/employees/${id}/documents/${documentId}`);
    return response.data;
  },

  async getEmployeeAuditLogs(id: string, page = 1, size = 20): Promise<PaginatedResponse<EmployeeAuditLog>> {
    const response = await api.get(`/employees/${id}/audit-logs`, { params: { page, size } });
    return response.data;
  },
};

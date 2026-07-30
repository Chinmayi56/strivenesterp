import { api } from "../api/axios";
import { ApiResponse } from "../types/api";

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  check_in_time?: string | null;
  check_out_time?: string | null;
  working_hours: number;
  status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE" | "HALF_DAY";
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendancePaginatedResponse {
  total: int;
  page: int;
  size: int;
  pages: int;
  items: AttendanceRecord[];
}

export interface AttendanceMonthlySummary {
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  leave_days: number;
  total_working_hours: number;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  submitted_date: string;
  approval_date?: string | null;
  approver_id?: string | null;
  approver_note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeavePaginatedResponse {
  total: number;
  page: number;
  size: number;
  pages: number;
  items: LeaveRequest[];
}

export interface ProjectMember {
  id: string;
  project_id: string;
  employee_id: string;
  role_in_project: string;
  created_at: string;
  employee_name?: string | null;
  employee_email?: string | null;
}

export interface Project {
  id: string;
  project_name: string;
  client_name?: string | null;
  description?: string | null;
  status: string;
  priority: string;
  start_date?: string | null;
  deadline?: string | null;
  submission_date?: string | null;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
  members: ProjectMember[];
}

export interface ProjectPaginatedResponse {
  total: number;
  page: number;
  size: number;
  pages: number;
  items: Project[];
}

export interface Task {
  id: string;
  task_name: string;
  project_id?: string | null;
  project_name?: string | null;
  assigned_to_id: string;
  created_by_id?: string | null;
  description?: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "TODO" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED" | "OVERDUE";
  progress_percentage: number;
  start_date?: string | null;
  due_date?: string | null;
  completed_date?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskPaginatedResponse {
  total: number;
  page: number;
  size: number;
  pages: number;
  items: Task[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: "TASK" | "PROJECT_DEADLINE" | "LEAVE" | "ATTENDANCE" | "MEETING";
  date: string;
  start_time?: string | null;
  end_time?: string | null;
  status: string;
  details?: string | null;
}

export interface NotificationItem {
  id: string;
  employee_id: string;
  title: string;
  message: string;
  notification_type: string;
  entity_type?: string | null;
  entity_id?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationPaginatedResponse {
  total: number;
  page: number;
  size: number;
  pages: number;
  unread_count: number;
  items: NotificationItem[];
}

export interface EmployeeDashboardSummary {
  employee: any;
  today_attendance?: AttendanceRecord | null;
  recent_leave?: LeaveRequest | null;
  assigned_projects_count: number;
  pending_tasks_count: number;
  upcoming_deadlines: Task[];
  recent_documents: any[];
  unread_notifications_count: number;
  recent_activity: NotificationItem[];
}

export const portalService = {
  // Dashboard
  async getDashboardSummary(): Promise<EmployeeDashboardSummary> {
    const res = await api.get<EmployeeDashboardSummary>("/portal/dashboard");
    return res.data;
  },

  // Attendance
  async getTodayAttendance(): Promise<AttendanceRecord | null> {
    const res = await api.get<AttendanceRecord | null>("/attendance/today");
    return res.data;
  },

  async checkIn(notes?: string): Promise<AttendanceRecord> {
    const res = await api.post<AttendanceRecord>("/attendance/check-in", { notes });
    return res.data;
  },

  async checkOut(notes?: string): Promise<AttendanceRecord> {
    const res = await api.post<AttendanceRecord>("/attendance/check-out", { notes });
    return res.data;
  },

  async getAttendanceHistory(startDate?: string, endDate?: string, page = 1, size = 20): Promise<AttendancePaginatedResponse> {
    const params: any = { page, size };
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    const res = await api.get<AttendancePaginatedResponse>("/attendance/history", { params });
    return res.data;
  },

  async getAttendanceSummary(year: number, month: number): Promise<AttendanceMonthlySummary> {
    const res = await api.get<AttendanceMonthlySummary>("/attendance/summary", { params: { year, month } });
    return res.data;
  },

  // Leave
  async getLeaves(status?: string, page = 1, size = 20): Promise<LeavePaginatedResponse> {
    const params: any = { page, size };
    if (status) params.status = status;
    const res = await api.get<LeavePaginatedResponse>("/leaves", { params });
    return res.data;
  },

  async createLeave(payload: { leave_type: string; start_date: string; end_date: string; reason: string }): Promise<LeaveRequest> {
    const res = await api.post<LeaveRequest>("/leaves", payload);
    return res.data;
  },

  async cancelLeave(leaveId: string): Promise<LeaveRequest> {
    const res = await api.post<LeaveRequest>(`/leaves/${leaveId}/cancel`);
    return res.data;
  },

  // Projects
  async getProjects(status?: string, page = 1, size = 20): Promise<ProjectPaginatedResponse> {
    const params: any = { page, size };
    if (status) params.status = status;
    const res = await api.get<ProjectPaginatedResponse>("/projects", { params });
    return res.data;
  },

  // Tasks
  async getTasks(status?: string, priority?: string, page = 1, size = 20): Promise<TaskPaginatedResponse> {
    const params: any = { page, size };
    if (status) params.status = status;
    if (priority) params.priority = priority;
    const res = await api.get<TaskPaginatedResponse>("/tasks", { params });
    return res.data;
  },

  async updateTaskStatus(taskId: string, payload: { status: string; progress_percentage?: number; notes?: string }): Promise<Task> {
    const res = await api.patch<Task>(`/tasks/${taskId}/status`, payload);
    return res.data;
  },

  // Calendar
  async getCalendarEvents(startDate?: string, endDate?: string): Promise<CalendarEvent[]> {
    const params: any = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    const res = await api.get<CalendarEvent[]>("/calendar/events", { params });
    return res.data;
  },

  // Notifications
  async getNotifications(page = 1, size = 20): Promise<NotificationPaginatedResponse> {
    const res = await api.get<NotificationPaginatedResponse>("/notifications", { params: { page, size } });
    return res.data;
  },

  async markNotificationRead(id: string): Promise<NotificationItem> {
    const res = await api.patch<NotificationItem>(`/notifications/${id}/read`);
    return res.data;
  },

  async markAllNotificationsRead(): Promise<{ status: string; marked_read: number }> {
    const res = await api.post<{ status: string; marked_read: number }>("/notifications/read-all");
    return res.data;
  },

  // Settings / Change Password
  async changePassword(payload: { current_password: string; new_password: string; confirm_password: string }): Promise<{ status: string; message: string }> {
    const res = await api.post<ApiResponse<{ status: string; message: string }>>("/auth/change-password", payload);
    return res.data.data;
  },
};

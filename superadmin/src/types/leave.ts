export type LeaveStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export type LeaveType =
  | "CASUAL"
  | "SICK"
  | "PAID";

export interface LeaveRequest {
  id: string;
  employee_id: string;
  employee_name?: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string;
  status: LeaveStatus;
}

export interface LeaveStatistics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface ApproveLeavePayload {
  id: string;
}

export interface RejectLeavePayload {
  id: string;
  reason?: string;
}
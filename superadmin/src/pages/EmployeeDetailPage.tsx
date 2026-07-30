import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  UserCheck,
  Building,
  Award,
  Shield,
  Mail,
  Phone,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  History,
  Lock,
  Trash2,
  RotateCcw,
  Plus,
  ExternalLink,
  ShieldAlert,
  User,
  Globe,
  RefreshCw,
  Edit,
} from "lucide-react";
import { Employee, EmployeeDocument, EmployeeAuditLog } from "../types/employee";
import { employeeService } from "../services/employeeService";
import { useToast } from "../components/Toast";
import { formatDate } from "../utils/formatters";
import { EmployeeEditModal } from "./EmployeeEditModal";
import { EmployeeDocumentModal } from "./EmployeeDocumentModal";

export const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [auditLogs, setAuditLogs] = useState<EmployeeAuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"overview" | "documents" | "security" | "audit">("overview");

  // Modals
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  // Status Change State
  const [statusReason, setStatusReason] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchEmployeeDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const empData = await employeeService.getEmployeeById(id);
      setEmployee(empData);

      // Fetch documents and audit history in parallel
      const [docsRes, logsRes] = await Promise.all([
        employeeService.getEmployeeDocuments(id),
        employeeService.getEmployeeAuditLogs(id),
      ]);
      setDocuments(docsRes.items);
      setAuditLogs(logsRes.items);
    } catch (err: any) {
      showError(err.message || "Failed to load employee details.", "API Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="p-12 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
        <p className="text-xs text-slate-400 font-mono">Loading Employee Profile & Audit Telemetry...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-12 text-center space-y-4 bg-slate-900 border border-slate-800 rounded-2xl">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
        <h3 className="text-base font-bold text-slate-100">Employee Record Not Found</h3>
        <p className="text-xs text-slate-400">The requested employee record could not be found or has been permanently removed.</p>
        <button
          onClick={() => navigate("/employees")}
          className="px-4 py-2 bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 hover:bg-slate-700 transition-colors"
        >
          Return to Employee Directory
        </button>
      </div>
    );
  }

  const handleApprove = async () => {
    try {
      await employeeService.approveEmployee(employee.id);
      showSuccess(`Employee ${employee.full_name} approved!`, "Employee Approved");
      fetchEmployeeDetails();
    } catch (err: any) {
      showError(err.message || "Failed to approve employee.", "Approval Error");
    }
  };

  const handleReject = async () => {
    const reason = prompt("Enter reason for rejecting this employee application:");
    if (reason === null) return;
    try {
      await employeeService.rejectEmployee(employee.id, reason);
      showSuccess(`Employee ${employee.full_name} rejected.`, "Employee Rejected");
      fetchEmployeeDetails();
    } catch (err: any) {
      showError(err.message || "Failed to reject employee.", "Rejection Error");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatusLoading(true);
    try {
      await employeeService.updateEmployeeStatus(employee.id, newStatus, statusReason);
      showSuccess(`Status updated to ${newStatus}.`, "Status Updated");
      setStatusReason("");
      fetchEmployeeDetails();
    } catch (err: any) {
      showError(err.message || "Failed to update status.", "Status Error");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to soft-delete employee ${employee.full_name}?`)) return;
    try {
      await employeeService.deleteEmployee(employee.id);
      showSuccess("Employee soft-deleted.", "Employee Deleted");
      fetchEmployeeDetails();
    } catch (err: any) {
      showError(err.message || "Failed to delete employee.", "Delete Error");
    }
  };

  const handleRestore = async () => {
    try {
      await employeeService.restoreEmployee(employee.id);
      showSuccess("Employee record restored.", "Employee Restored");
      fetchEmployeeDetails();
    } catch (err: any) {
      showError(err.message || "Failed to restore employee.", "Restore Error");
    }
  };

  const handleDeleteDocument = async (docId: string, docName: string) => {
    if (!confirm(`Remove document '${docName}'?`)) return;
    try {
      await employeeService.deleteEmployeeDocument(employee.id, docId);
      showSuccess(`Document '${docName}' removed.`, "Document Deleted");
      fetchEmployeeDetails();
    } catch (err: any) {
      showError(err.message || "Failed to delete document.", "Document Error");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">ACTIVE</span>;
      case "PENDING":
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">PENDING APPROVAL</span>;
      case "INACTIVE":
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-500/10 border border-slate-500/30 text-slate-400">INACTIVE</span>;
      case "BLOCKED":
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 border border-rose-500/30 text-rose-400">BLOCKED</span>;
      case "REJECTED":
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 border border-rose-500/30 text-rose-300">REJECTED</span>;
      case "DELETED":
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800 border border-slate-700 text-slate-500">SOFT DELETED</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/employees")}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
              <Link to="/employees" className="hover:underline text-amber-400">Employees</Link>
              <span>/</span>
              <span>{employee.employee_id}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100">{employee.full_name}</h2>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {employee.status === "PENDING" && (
            <>
              <button
                onClick={handleApprove}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Approve
              </button>
              <button
                onClick={handleReject}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
            </>
          )}

          <button
            onClick={() => setIsEditOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all flex items-center gap-1.5"
          >
            <Edit className="w-3.5 h-3.5" /> Edit Profile
          </button>

          {employee.status === "DELETED" ? (
            <button
              onClick={handleRestore}
              className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restore Record
            </button>
          ) : (
            <button
              onClick={handleDelete}
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Soft Delete
            </button>
          )}
        </div>
      </div>

      {/* Main Profile Summary Card */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black text-2xl shadow-xl shadow-amber-500/20">
              {employee.first_name[0]}{employee.last_name[0]}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-100">{employee.full_name}</h1>
                <span className="px-2.5 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-amber-400 font-mono text-xs font-bold">
                  {employee.employee_id}
                </span>
                {getStatusBadge(employee.status)}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" /> {employee.email}
                </span>
                {employee.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500" /> {employee.phone}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-500" /> {employee.department || "General"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-slate-500" /> {employee.designation || "Employee"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs text-slate-300">
            <Shield className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-mono">System Role</span>
              <span className="font-bold text-slate-200">{employee.role}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "overview"
              ? "border-amber-500 text-amber-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <User className="w-4 h-4" /> Overview & Profile
        </button>

        <button
          onClick={() => setActiveTab("documents")}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "documents"
              ? "border-amber-500 text-amber-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileText className="w-4 h-4" /> Documents ({documents.length})
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "security"
              ? "border-amber-500 text-amber-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Lock className="w-4 h-4" /> Status & Security
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "audit"
              ? "border-amber-500 text-amber-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <History className="w-4 h-4" /> Audit Log ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <User className="w-4 h-4 text-amber-400" /> Personal Details
            </h3>

            <div className="grid grid-cols-2 gap-4 text-slate-300">
              <div>
                <span className="text-slate-500 block mb-0.5 font-mono text-[10px]">FIRST NAME</span>
                <span className="font-semibold text-slate-100">{employee.first_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5 font-mono text-[10px]">LAST NAME</span>
                <span className="font-semibold text-slate-100">{employee.last_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5 font-mono text-[10px]">EMAIL ADDRESS</span>
                <span className="font-mono text-slate-200">{employee.email}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5 font-mono text-[10px]">PHONE</span>
                <span className="font-mono text-slate-200">{employee.phone || "N/A"}</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Building className="w-4 h-4 text-amber-400" /> Organization & Account Meta
            </h3>

            <div className="grid grid-cols-2 gap-4 text-slate-300">
              <div>
                <span className="text-slate-500 block mb-0.5 font-mono text-[10px]">DEPARTMENT</span>
                <span className="font-semibold text-slate-100">{employee.department || "General"}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5 font-mono text-[10px]">DESIGNATION</span>
                <span className="font-semibold text-slate-100">{employee.designation || "Employee"}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5 font-mono text-[10px]">ACCOUNT STATUS</span>
                <span>{getStatusBadge(employee.status)}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5 font-mono text-[10px]">IDENTITY VERIFIED</span>
                <span className={employee.is_verified ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                  {employee.is_verified ? "Verified" : "Unverified"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5 font-mono text-[10px]">CREATED AT</span>
                <span className="font-mono text-slate-400">{formatDate(employee.created_at)}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5 font-mono text-[10px]">LAST LOGIN</span>
                <span className="font-mono text-slate-400">{employee.last_login ? formatDate(employee.last_login) : "Never"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DOCUMENTS */}
      {activeTab === "documents" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Employee Documents</h3>
              <p className="text-xs text-slate-400">Attached identity, verification, and contract records.</p>
            </div>
            <button
              onClick={() => setIsDocModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Upload Document
            </button>
          </div>

          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
            {documents.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                <h4 className="text-xs font-semibold text-slate-300">No Documents Uploaded</h4>
                <p className="text-[11px] text-slate-500">No verification or employee files attached yet.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                  <tr>
                    <th className="py-3 px-4">Document Type</th>
                    <th className="py-3 px-4">Document Name</th>
                    <th className="py-3 px-4">File Name</th>
                    <th className="py-3 px-4">Size</th>
                    <th className="py-3 px-4">Uploaded Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-amber-400">{doc.document_type}</td>
                      <td className="py-3 px-4 font-medium text-slate-100">{doc.document_name}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{doc.file_name}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{(doc.file_size / 1024).toFixed(1)} KB</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{formatDate(doc.created_at)}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-400 hover:underline font-semibold"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> View
                        </a>
                        <button
                          onClick={() => handleDeleteDocument(doc.id, doc.document_name)}
                          className="text-rose-400 hover:text-rose-300 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: STATUS & SECURITY */}
      {activeTab === "security" && (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6 max-w-xl">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" /> Account Status Transition
            </h3>
            <p className="text-xs text-slate-400 pt-1">
              Manually transition employee status between ACTIVE, INACTIVE, BLOCKED, PENDING, or REJECTED with mandatory audit reason.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block mb-1 text-slate-300 font-medium">Status Transition Reason</label>
              <textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Specify reason for changing status (e.g. Identity verification passed, Security hold, Onboarding completed)..."
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                rows={3}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                onClick={() => handleStatusChange("ACTIVE")}
                disabled={statusLoading || employee.status === "ACTIVE"}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs disabled:opacity-30 transition-all"
              >
                Set ACTIVE
              </button>

              <button
                onClick={() => handleStatusChange("INACTIVE")}
                disabled={statusLoading || employee.status === "INACTIVE"}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs disabled:opacity-30 transition-all border border-slate-700"
              >
                Set INACTIVE
              </button>

              <button
                onClick={() => handleStatusChange("BLOCKED")}
                disabled={statusLoading || employee.status === "BLOCKED"}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs disabled:opacity-30 transition-all"
              >
                Block Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOG */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-100">Lifecycle Audit Telemetry</h3>
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
            {auditLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">No audit logs recorded yet.</div>
            ) : (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                  <tr>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Details</th>
                    <th className="py-3 px-4">Performed By</th>
                    <th className="py-3 px-4">IP Address</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">{log.action}</td>
                      <td className="py-3 px-4 font-medium text-slate-200">{log.details || "—"}</td>
                      <td className="py-3 px-4 text-slate-400">{log.performer_name || log.performed_by || "System"}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{log.ip_address || "127.0.0.1"}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{formatDate(log.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <EmployeeEditModal
        employee={employee}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={fetchEmployeeDetails}
      />

      <EmployeeDocumentModal
        employeeId={employee.id}
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        onSuccess={fetchEmployeeDetails}
      />
    </div>
  );
};

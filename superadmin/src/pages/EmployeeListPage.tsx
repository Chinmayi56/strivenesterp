import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Users,
  Search,
  Filter,
  UserPlus,
  RefreshCw,
  Building,
  Award,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";
import { Employee, EmployeeFilterParams } from "../types/employee";
import { employeeService } from "../services/employeeService";
import { useToast } from "../components/Toast";
import { formatDate } from "../utils/formatters";
import { EmployeeCreateModal } from "./EmployeeCreateModal";
import { EmployeeEditModal } from "./EmployeeEditModal";

export const EmployeeListPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedEditEmp, setSelectedEditEmp] = useState<Employee | null>(null);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params: EmployeeFilterParams = {
        page,
        size,
        search: search.trim() || undefined,
        department: department || undefined,
        role: role || undefined,
        status: status || undefined,
        include_deleted: includeDeleted,
      };
      const res = await employeeService.getEmployees(params);
      setEmployees(res.items);
      setTotal(res.total);
    } catch (err: any) {
      showError(err.message || "Failed to fetch employee list.", "API Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [page, size, department, role, status, includeDeleted]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEmployees();
  };

  const handleApprove = async (emp: Employee) => {
    try {
      await employeeService.approveEmployee(emp.id);
      showSuccess(`Employee ${emp.full_name} approved!`, "Employee Approved");
      fetchEmployees();
    } catch (err: any) {
      showError(err.message || "Failed to approve employee.", "Approval Error");
    }
  };

  const handleReject = async (emp: Employee) => {
    const reason = prompt("Reason for rejecting this employee:");
    if (reason === null) return;
    try {
      await employeeService.rejectEmployee(emp.id, reason);
      showSuccess(`Employee ${emp.full_name} rejected.`, "Employee Rejected");
      fetchEmployees();
    } catch (err: any) {
      showError(err.message || "Failed to reject employee.", "Rejection Error");
    }
  };

  const handleDelete = async (emp: Employee) => {
    if (!confirm(`Are you sure you want to soft-delete employee ${emp.full_name}?`)) return;
    try {
      await employeeService.deleteEmployee(emp.id);
      showSuccess(`Employee ${emp.full_name} soft-deleted.`, "Employee Deleted");
      fetchEmployees();
    } catch (err: any) {
      showError(err.message || "Failed to delete employee.", "Delete Error");
    }
  };

  const handleRestore = async (emp: Employee) => {
    try {
      await employeeService.restoreEmployee(emp.id);
      showSuccess(`Employee ${emp.full_name} restored.`, "Employee Restored");
      fetchEmployees();
    } catch (err: any) {
      showError(err.message || "Failed to restore employee.", "Restore Error");
    }
  };

  const totalPages = Math.ceil(total / size) || 1;

  // Stat Counters
  const activeCount = employees.filter((e) => e.status === "ACTIVE").length;
  const pendingCount = employees.filter((e) => e.status === "PENDING").length;

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "ACTIVE":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">ACTIVE</span>;
      case "PENDING":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">PENDING</span>;
      case "INACTIVE":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 border border-slate-500/30 text-slate-400">INACTIVE</span>;
      case "BLOCKED":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 border border-rose-500/30 text-rose-400">BLOCKED</span>;
      case "REJECTED":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 border border-rose-500/30 text-rose-300">REJECTED</span>;
      case "DELETED":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-500">DELETED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">{st}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-amber-400 mb-1">
            <Users className="w-3.5 h-3.5" />
            HUMAN RESOURCES MANAGEMENT
          </div>
          <h2 className="text-xl font-bold text-slate-100">Employee Directory & Lifecycle</h2>
          <p className="text-xs text-slate-400">Manage employee profiles, approval workflows, department assignments, and audit logs.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchEmployees}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Directory</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Onboard Employee</span>
          </button>
        </div>
      </div>

      {/* Counter Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <span className="text-[10px] text-slate-500 uppercase font-mono font-semibold block">Total Personnel</span>
          <span className="text-xl font-black text-slate-100 font-mono mt-1 block">{total}</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <span className="text-[10px] text-emerald-500 uppercase font-mono font-semibold block">Active Personnel</span>
          <span className="text-xl font-black text-emerald-400 font-mono mt-1 block">{activeCount}</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <span className="text-[10px] text-amber-500 uppercase font-mono font-semibold block">Pending Approval</span>
          <span className="text-xl font-black text-amber-400 font-mono mt-1 block">{pendingCount}</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold block">Soft Deleted Included</span>
          <span className="text-xl font-black text-slate-300 font-mono mt-1 block">{includeDeleted ? "Yes" : "No"}</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col lg:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Employee ID, Name, Email, or Phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 text-slate-200 text-xs rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <select
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setPage(1);
            }}
            className="py-2 px-3 bg-slate-950 text-slate-200 text-xs rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Finance">Finance</option>
            <option value="Sales & Marketing">Sales & Marketing</option>
            <option value="Operations">Operations</option>
          </select>

          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
            className="py-2 px-3 bg-slate-950 text-slate-200 text-xs rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 font-mono"
          >
            <option value="">All Roles</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            <option value="EMPLOYEE">EMPLOYEE</option>
          </select>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="py-2 px-3 bg-slate-950 text-slate-200 text-xs rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 font-mono"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="BLOCKED">BLOCKED</option>
            <option value="REJECTED">REJECTED</option>
          </select>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(e) => {
                setIncludeDeleted(e.target.checked);
                setPage(1);
              }}
              className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500"
            />
            <span>Show Deleted</span>
          </label>
        </div>
      </div>

      {/* Employee Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-mono">Loading directory...</div>
        ) : employees.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Users className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-300">No Employees Found</h3>
            <p className="text-xs text-slate-500">No employee records match the given criteria or directory is empty.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Employee ID</th>
                  <th className="py-3.5 px-4">Employee Name & Email</th>
                  <th className="py-3.5 px-4">Department & Designation</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Joined Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400 whitespace-nowrap">
                      {emp.employee_id}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200 text-xs">
                          {emp.first_name[0]}{emp.last_name[0]}
                        </div>
                        <div>
                          <div className="font-bold text-slate-100">{emp.full_name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{emp.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-200">{emp.department || "General"}</div>
                      <div className="text-[11px] text-slate-500">{emp.designation || "Employee"}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                        {emp.role}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">{getStatusBadge(emp.status)}</td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {formatDate(emp.created_at)}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/employees/${emp.id}`)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="View Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setSelectedEditEmp(emp)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 transition-colors"
                          title="Edit Employee"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {emp.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleApprove(emp)}
                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                              title="Approve Employee"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleReject(emp)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                              title="Reject Employee"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {emp.status === "DELETED" ? (
                          <button
                            onClick={() => handleRestore(emp)}
                            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-colors"
                            title="Restore Employee"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDelete(emp)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                            title="Soft Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <span className="text-slate-200 font-bold">{employees.length}</span> of{" "}
            <span className="text-slate-200 font-bold">{total}</span> employees
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 hover:bg-slate-800 disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-mono text-slate-300 px-2">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 hover:bg-slate-800 disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EmployeeCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchEmployees}
      />

      <EmployeeEditModal
        employee={selectedEditEmp}
        isOpen={!!selectedEditEmp}
        onClose={() => setSelectedEditEmp(null)}
        onSuccess={fetchEmployees}
      />
    </div>
  );
};

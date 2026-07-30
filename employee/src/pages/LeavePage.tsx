import React, { useEffect, useState } from "react";
import { useToast } from "../components/Toast";
import { portalService, LeaveRequest } from "../services/portalService";
import { Clock, Plus, X, Calendar, AlertCircle } from "lucide-react";

export const LeavePage: React.FC = () => {
  const { showSuccess, showError } = useToast();

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [leaveType, setLeaveType] = useState("CASUAL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await portalService.getLeaves();
      setLeaves(res.items || []);
    } catch (err: any) {
      showError(err.message || "Failed to load leave requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) {
      showError("Please fill out all required fields.");
      return;
    }

    try {
      setSubmitting(true);
      await portalService.createLeave({
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim(),
      });
      showSuccess("Leave request submitted for approval!", "Leave Management");
      setIsModalOpen(false);
      setStartDate("");
      setEndDate("");
      setReason("");
      await fetchLeaves();
    } catch (err: any) {
      showError(err.response?.data?.message || err.message || "Failed to submit leave request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelLeave = async (leaveId: string) => {
    try {
      await portalService.cancelLeave(leaveId);
      showSuccess("Leave request cancelled.", "Leave Management");
      await fetchLeaves();
    } catch (err: any) {
      showError(err.response?.data?.message || err.message || "Failed to cancel leave request.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono font-semibold">
            <Clock className="w-3.5 h-3.5" />
            LEAVE & TIME OFF PORTAL
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">Leave Self-Service</h1>
          <p className="text-xs text-slate-400">Request paid time off, medical, or casual leaves and track approval status.</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Request Leave</span>
        </button>
      </div>

      {/* Leave Requests Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-100">My Leave Applications</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="p-3">Type</th>
                <th className="p-3">Dates</th>
                <th className="p-3">Total Days</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Status</th>
                <th className="p-3">Submitted</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {leaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">
                    No leave requests found. Click "Request Leave" above to apply.
                  </td>
                </tr>
              ) : (
                leaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-slate-800/30">
                    <td className="p-3 font-bold text-indigo-300 font-mono">{leave.leave_type}</td>
                    <td className="p-3 text-slate-200 font-mono">
                      {leave.start_date} → {leave.end_date}
                    </td>
                    <td className="p-3 font-mono text-slate-300 font-bold">{leave.total_days} Days</td>
                    <td className="p-3 text-slate-400 max-w-xs truncate">{leave.reason}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        leave.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" :
                        leave.status === "PENDING" ? "bg-amber-500/10 text-amber-400 border border-amber-500/30" :
                        leave.status === "CANCELLED" ? "bg-slate-800 text-slate-400" :
                        "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                      }`}>
                        {leave.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 text-[11px]">{new Date(leave.submitted_date).toLocaleDateString()}</td>
                    <td className="p-3 text-right">
                      {(leave.status === "PENDING" || leave.status === "APPROVED") && (
                        <button
                          onClick={() => handleCancelLeave(leave.id)}
                          className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-medium border border-rose-500/30"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>Apply for Leave</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                >
                  <option value="CASUAL">Casual Leave</option>
                  <option value="ANNUAL">Annual Leave / PTO</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="MATERNITY">Maternity / Paternity</option>
                  <option value="UNPAID">Unpaid Leave</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Reason for Leave</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide a reason for leave..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold disabled:opacity-50"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

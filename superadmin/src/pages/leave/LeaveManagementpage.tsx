import React, { useEffect, useState } from "react";
import {
  CalendarDays,
  Clock3,
  CheckCircle2,
  XCircle,
  Hourglass,
} from "lucide-react";

import { api } from "../../api/axios"; // Adjust path if needed

const LeaveManagementPage = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaves = async () => {
    try {
      setLoading(true);

      const response = await api.get("/admin/leaves");

      // Backend returns:
      // {
      //   success: true,
      //   data: [...],
      //   message: "...",
      // }
      console.log("FULL RESPONSE:", response.data);
    console.log("LEAVES:", response.data.data);
      setLeaves(response.data.data || []);
    } catch (error) {
      console.error("Failed to load leave requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const approveLeave = async (leaveId: string) => {
  try {
    await api.patch(`/admin/leaves/${leaveId}/approve`);

    await fetchLeaves();

    alert("Leave approved successfully.");
  } catch (error) {
    console.error("Approve Error:", error);
    alert("Failed to approve leave.");
  }
};

const rejectLeave = async (leaveId: string) => {
  try {
    await api.patch(`/admin/leaves/${leaveId}/reject`);

    await fetchLeaves();

    alert("Leave rejected successfully.");
  } catch (error) {
    console.error("Reject Error:", error);
    alert("Failed to reject leave.");
  }
};

  useEffect(() => {
    fetchLeaves();
  }, []);

  const pendingCount = leaves.filter(
    (leave) => leave.status === "PENDING"
  ).length;

  const approvedCount = leaves.filter(
    (leave) => leave.status === "APPROVED"
  ).length;

  const rejectedCount = leaves.filter(
    (leave) => leave.status === "REJECTED"
  ).length;

  const totalCount = leaves.length;

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6 p-6">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold text-white">
            Leave Management
          </h1>

          <p className="mt-2 text-slate-400">
            Review, approve and manage employee leave requests.
          </p>

        </div>

        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2">

          <CalendarDays className="h-5 w-5 text-amber-400" />

          <span className="text-sm font-semibold text-amber-300">
            Enterprise Leave Center
          </span>

        </div>

      </div>

      {/* Statistics */}

      <div className="grid gap-5 md:grid-cols-4">

        {/* Pending */}

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs uppercase text-slate-400">
                Pending
              </p>

              <h2 className="mt-2 text-3xl font-bold text-yellow-400">
                {loading ? "..." : pendingCount}
              </h2>

            </div>

            <Hourglass className="h-10 w-10 text-yellow-400" />

          </div>

        </div>

        {/* Approved */}

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs uppercase text-slate-400">
                Approved
              </p>

              <h2 className="mt-2 text-3xl font-bold text-emerald-400">
                {loading ? "..." : approvedCount}
              </h2>

            </div>

            <CheckCircle2 className="h-10 w-10 text-emerald-400" />

          </div>

        </div>

        {/* Rejected */}

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs uppercase text-slate-400">
                Rejected
              </p>

              <h2 className="mt-2 text-3xl font-bold text-red-400">
                {loading ? "..." : rejectedCount}
              </h2>

            </div>

            <XCircle className="h-10 w-10 text-red-400" />

          </div>

        </div>

        {/* Total */}

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs uppercase text-slate-400">
                Total Requests
              </p>

              <h2 className="mt-2 text-3xl font-bold text-indigo-400">
                {loading ? "..." : totalCount}
              </h2>

            </div>

            <Clock3 className="h-10 w-10 text-indigo-400" />

          </div>

        </div>

      </div>

      {/* PART 2 STARTS HERE */}

            {/* Leave Table */}

      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">

        <div className="border-b border-slate-800 px-6 py-4">

          <h2 className="text-lg font-semibold text-white">
            Employee Leave Requests
          </h2>

        </div>

        <div className="overflow-x-auto">

          <table className="min-w-full">

            <thead className="bg-slate-950">

              <tr>

                <th className="px-6 py-4 text-left text-xs uppercase text-slate-400">
                  Employee
                </th>

                <th className="px-6 py-4 text-left text-xs uppercase text-slate-400">
                  Leave Type
                </th>

                <th className="px-6 py-4 text-left text-xs uppercase text-slate-400">
                  Start Date
                </th>

                <th className="px-6 py-4 text-left text-xs uppercase text-slate-400">
                  End Date
                </th>

                <th className="px-6 py-4 text-left text-xs uppercase text-slate-400">
                  Reason
                </th>

                <th className="px-6 py-4 text-left text-xs uppercase text-slate-400">
                  Status
                </th>

                <th className="px-6 py-4 text-left text-xs uppercase text-slate-400">
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {loading ? (

                <tr>

                  <td
                    colSpan={7}
                    className="py-10 text-center text-slate-400"
                  >
                    Loading leave requests...
                  </td>

                </tr>

              ) : leaves.length === 0 ? (

                <tr>

                  <td
                    colSpan={7}
                    className="py-10 text-center text-slate-500"
                  >
                    No leave requests found.
                  </td>

                </tr>

              ) : (

                leaves.map((leave) => (

                  <tr
                    key={leave.id}
                    className="border-b border-slate-800 hover:bg-slate-800/40 transition"
                  >

                    <td className="px-6 py-4 font-medium text-white">
  {leave.employee_name || "-"}
</td>

                    <td className="px-6 py-4 text-slate-300">
                      {leave.leave_type}
                    </td>

                    <td className="px-6 py-4 text-slate-300">
                      {formatDate(leave.start_date)}
                    </td>

                    <td className="px-6 py-4 text-slate-300">
                      {formatDate(leave.end_date)}
                    </td>

                    <td className="px-6 py-4 max-w-xs text-slate-300">
                      <div className="truncate">
                        {leave.reason}
                      </div>
                    </td>

                    <td className="px-6 py-4">

                      {leave.status === "PENDING" && (
                        <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-semibold text-yellow-400">
                          Pending
                        </span>
                      )}

                      {leave.status === "APPROVED" && (
                        <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400">
                          Approved
                        </span>
                      )}

                      {leave.status === "REJECTED" && (
                        <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-400">
                          Rejected
                        </span>
                      )}

                    </td>

                    <td className="px-6 py-4">

                      {leave.status === "PENDING" ? (

                        <div className="flex gap-2">

                          <button
                            onClick={() => approveLeave(leave.id)}
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                          >
                            Approve
                          </button>

                          <button
                            onClick={() => rejectLeave(leave.id)}
                            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                          >
                            Reject
                          </button>

                        </div>

                      ) : (

                        <span className="text-sm text-slate-500">
                          Completed
                        </span>

                      )}

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>

  );

}; 

export default LeaveManagementPage;
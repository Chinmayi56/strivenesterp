import React, { useEffect, useState } from "react";
import { useToast } from "../components/Toast";
import { portalService, Task } from "../services/portalService";
import { CheckSquare, Edit, X, Calendar, AlertCircle, ArrowUpRight } from "lucide-react";

export const TasksPage: React.FC = () => {
  const { showSuccess, showError } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [status, setStatus] = useState("TODO");
  const [progress, setProgress] = useState(0);
  const [notes, setNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await portalService.getTasks();
      setTasks(res.items || []);
    } catch (err: any) {
      showError(err.message || "Failed to load assigned tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const openUpdateModal = (task: Task) => {
    setSelectedTask(task);
    setStatus(task.status);
    setProgress(task.progress_percentage || 0);
    setNotes(task.notes || "");
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    try {
      setUpdating(true);
      await portalService.updateTaskStatus(selectedTask.id, {
        status,
        progress_percentage: progress,
        notes,
      });
      showSuccess("Task status updated!", "Task Management");
      setSelectedTask(null);
      await fetchTasks();
    } catch (err: any) {
      showError(err.response?.data?.message || err.message || "Failed to update task.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-semibold">
          <CheckSquare className="w-3.5 h-3.5" />
          WORKFLOW TASK BOARD
        </div>
        <h1 className="text-2xl font-bold text-slate-100 mt-1">My Assigned Tasks</h1>
        <p className="text-xs text-slate-400">Track task progress, update completion percentages, and manage work items.</p>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-100">Tasks List</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="p-3">Task Name</th>
                <th className="p-3">Project</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Status</th>
                <th className="p-3">Progress</th>
                <th className="p-3">Due Date</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">
                    No assigned tasks found.
                  </td>
                </tr>
              ) : (
                tasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/30">
                    <td className="p-3 font-semibold text-slate-100">{t.task_name}</td>
                    <td className="p-3 text-indigo-300 font-medium">{t.project_name || "General Work"}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        t.priority === "URGENT" ? "bg-rose-500/10 text-rose-400 border border-rose-500/30" :
                        t.priority === "HIGH" ? "bg-amber-500/10 text-amber-400 border border-amber-500/30" :
                        "bg-slate-800 text-slate-300"
                      }`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        t.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" :
                        t.status === "IN_PROGRESS" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30" :
                        t.status === "BLOCKED" ? "bg-rose-500/10 text-rose-400 border border-rose-500/30" :
                        "bg-slate-800 text-slate-400"
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-300">{t.progress_percentage}%</td>
                    <td className="p-3 font-mono text-amber-400 text-[11px]">{t.due_date || "-"}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => openUpdateModal(t)}
                        className="px-2.5 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-[11px] font-medium border border-indigo-500/30 flex items-center gap-1 ml-auto"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Update Status</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Update Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-cyan-400" />
                <span>Update Task Status</span>
              </h3>
              <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <p className="font-bold text-slate-200">{selectedTask.task_name}</p>
              <p className="text-slate-400 text-[11px]">{selectedTask.description || "No description."}</p>
            </div>

            <form onSubmit={handleUpdateTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="BLOCKED">Blocked</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Progress Percentage</span>
                  <span className="font-mono font-bold text-indigo-300">{progress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Update Notes</label>
                <textarea
                  rows={2}
                  placeholder="Add notes or status updates..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold disabled:opacity-50"
                >
                  Save Progress
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

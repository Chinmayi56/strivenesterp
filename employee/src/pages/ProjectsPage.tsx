import React, { useEffect, useState } from "react";
import { useToast } from "../components/Toast";
import { portalService, Project } from "../services/portalService";
import { FolderKanban, Users, Calendar, CheckCircle2, Clock } from "lucide-react";

export const ProjectsPage: React.FC = () => {
  const { showError } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await portalService.getProjects();
      setProjects(res.items || []);
    } catch (err: any) {
      showError(err.message || "Failed to load assigned projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-semibold">
          <FolderKanban className="w-3.5 h-3.5" />
          PROJECT MEMBERSHIPS
        </div>
        <h1 className="text-2xl font-bold text-slate-100 mt-1">My Assigned Projects</h1>
        <p className="text-xs text-slate-400">View project goals, deadlines, team contributors, and completion progress.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.length === 0 ? (
          <div className="col-span-2 p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-500">
            No active project memberships assigned to your profile.
          </div>
        ) : (
          projects.map((proj) => (
            <div key={proj.id} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                    {proj.client_name || "Internal Project"}
                  </span>
                  <h3 className="text-base font-bold text-slate-100">{proj.project_name}</h3>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                  proj.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" :
                  proj.status === "IN_PROGRESS" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30" :
                  "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                }`}>
                  {proj.status}
                </span>
              </div>

              <p className="text-xs text-slate-400 line-clamp-2">{proj.description || "No description provided."}</p>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Project Progress</span>
                  <span className="text-indigo-300 font-bold">{proj.progress_percentage}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300"
                    style={{ width: `${proj.progress_percentage}%` }}
                  />
                </div>
              </div>

              {/* Project Members */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>{proj.members?.length || 0} Team Members</span>
                </div>
                {proj.deadline && (
                  <div className="flex items-center gap-1.5 text-amber-400 font-mono text-[11px]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Deadline: {proj.deadline}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

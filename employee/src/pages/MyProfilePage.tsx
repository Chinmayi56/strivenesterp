import React, { useEffect, useState } from "react";
import {
  User,
  Mail,
  Phone,
  Building,
  Award,
  Shield,
  FileText,
  History,
  CheckCircle,
  Clock,
  Edit3,
  Plus,
  ExternalLink,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { EmployeeProfile, EmployeeDocument, EmployeeAuditLog } from "../types/employee";
import { employeeService } from "../services/employeeService";
import { useToast } from "../components/Toast";
import { formatDate } from "../utils/formatters";
import { MyDocumentModal } from "./MyDocumentModal";

export const MyProfilePage: React.FC = () => {
  const { showSuccess, showError } = useToast();

  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [auditLogs, setAuditLogs] = useState<EmployeeAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "documents" | "audit">("profile");

  // Edit State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [updating, setUpdating] = useState(false);

  // Document Upload Modal
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const data = await employeeService.getMyProfile();
      setProfile(data);
      setFirstName(data.first_name);
      setLastName(data.last_name);
      setPhone(data.phone || "");

      // Fetch documents and audit history in parallel
      const [docsRes, logsRes] = await Promise.all([
        employeeService.getMyDocuments(),
        employeeService.getMyAuditLogs(),
      ]);
      setDocuments(docsRes.items);
      setAuditLogs(logsRes.items);
    } catch (err: any) {
      showError(err.message || "Failed to load employee profile.", "Profile Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const updated = await employeeService.updateMyProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim() || undefined,
      });
      setProfile(updated);
      showSuccess("Your profile details have been updated successfully.", "Profile Updated");
    } catch (err: any) {
      showError(err.message || "Failed to update profile.", "Update Error");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteDocument = async (docId: string, docName: string) => {
    if (!confirm(`Are you sure you want to delete document '${docName}'?`)) return;
    try {
      await employeeService.deleteMyDocument(docId);
      showSuccess(`Document '${docName}' deleted.`, "Document Deleted");
      fetchProfileData();
    } catch (err: any) {
      showError(err.message || "Failed to delete document.", "Delete Error");
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
        <p className="text-xs text-slate-400 font-mono">Loading Your Employee Profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs font-mono">
        Failed to load employee profile data.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-indigo-400 mb-1">
            <User className="w-3.5 h-3.5" />
            EMPLOYEE SELF-SERVICE PORTAL
          </div>
          <h2 className="text-xl font-bold text-slate-100">My Profile & Documents</h2>
          <p className="text-xs text-slate-400">View personal details, upload identity documents, and track profile activity.</p>
        </div>

        <button
          onClick={fetchProfileData}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Main Profile Summary Card */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-500/20">
              {profile.first_name[0]}{profile.last_name[0]}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-100">{profile.full_name}</h1>
                <span className="px-2.5 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-indigo-400 font-mono text-xs font-bold">
                  {profile.employee_id}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  {profile.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" /> {profile.email}
                </span>
                {profile.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500" /> {profile.phone}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-500" /> {profile.department || "General"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-slate-500" /> {profile.designation || "Employee"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
            <Shield className="w-4 h-4 text-indigo-400" />
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Role</span>
              <span className="font-bold text-slate-200">{profile.role}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab("profile")}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "profile"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <User className="w-4 h-4" /> Personal Information
        </button>

        <button
          onClick={() => setActiveTab("documents")}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "documents"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileText className="w-4 h-4" /> My Documents ({documents.length})
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "audit"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <History className="w-4 h-4" /> My Activity Log ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: PROFILE EDIT FORM */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          {/* Form */}
          <div className="md:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Edit3 className="w-4 h-4 text-indigo-400" /> Edit Personal Information
            </h3>

            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-slate-300 font-medium">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-300 font-medium">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-300 font-medium">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-500 font-medium">Work Email (Managed by Admin)</label>
                  <input
                    type="text"
                    disabled
                    value={profile.email}
                    className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800/80 rounded-xl text-slate-400 cursor-not-allowed font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
                >
                  {updating ? "Saving Changes..." : "Save Profile Details"}
                </button>
              </div>
            </form>
          </div>

          {/* Read-only Enterprise Attributes */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 h-fit">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Shield className="w-4 h-4 text-indigo-400" /> Enterprise Attributes
            </h3>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] text-slate-500 font-mono uppercase block">EMPLOYEE ID</span>
                <span className="font-mono font-bold text-amber-400">{profile.employee_id}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-mono uppercase block">DEPARTMENT</span>
                <span className="font-semibold text-slate-200">{profile.department || "General"}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-mono uppercase block">DESIGNATION</span>
                <span className="font-semibold text-slate-200">{profile.designation || "Employee"}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-mono uppercase block">IDENTITY VERIFICATION</span>
                <span className={profile.is_verified ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                  {profile.is_verified ? "Verified Identity" : "Pending Verification"}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-mono uppercase block">MEMBER SINCE</span>
                <span className="font-mono text-slate-400">{formatDate(profile.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MY DOCUMENTS */}
      {activeTab === "documents" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100">My Attached Documents</h3>
              <p className="text-xs text-slate-400">Manage your identity documents, certifications, and compliance attachments.</p>
            </div>
            <button
              onClick={() => setIsDocModalOpen(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Upload Document
            </button>
          </div>

          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
            {documents.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                <h4 className="text-xs font-semibold text-slate-300">No Documents Uploaded</h4>
                <p className="text-[11px] text-slate-500">You have not uploaded any personal or verification files yet.</p>
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
                      <td className="py-3 px-4 font-mono font-semibold text-indigo-400">{doc.document_type}</td>
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

      {/* TAB 3: ACTIVITY LOG */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-100">My Activity Log</h3>
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
            {auditLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">No activity logs recorded.</div>
            ) : (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                  <tr>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Details</th>
                    <th className="py-3 px-4">IP Address</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-400">{log.action}</td>
                      <td className="py-3 px-4 font-medium text-slate-200">{log.details || "—"}</td>
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

      {/* Modal */}
      <MyDocumentModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        onSuccess={fetchProfileData}
      />
    </div>
  );
};

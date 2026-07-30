import React, { useEffect, useState } from "react";
import { useToast } from "../components/Toast";
import { FileText, Download, Plus, X, UploadCloud, Eye } from "lucide-react";
import { api } from "../api/axios";

export interface EmployeeDocumentItem {
  id: string;
  employee_id: string;
  document_name: string;
  document_type: string;
  file_path: string;
  file_size_bytes?: number | null;
  mime_type?: string | null;
  uploaded_at: string;
}

export const DocumentsPage: React.FC = () => {
  const { showSuccess, showError } = useToast();

  const [documents, setDocuments] = useState<EmployeeDocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] = useState("PAYSTUB");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ items: EmployeeDocumentItem[] }>("/employees/me/documents");
      setDocuments(res.data.items || []);
    } catch (err: any) {
      showError(err.message || "Failed to load employee documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentName.trim() || !selectedFile) {
      showError("Please provide a document title and choose a file.");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("document_name", documentName.trim());
      formData.append("document_type", documentType);
      formData.append("file", selectedFile);

      await api.post("/employees/me/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showSuccess("Document uploaded successfully!", "Document Vault");
      setIsModalOpen(false);
      setDocumentName("");
      setSelectedFile(null);
      await fetchDocuments();
    } catch (err: any) {
      showError(err.response?.data?.message || err.message || "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono font-semibold">
            <FileText className="w-3.5 h-3.5" />
            EMPLOYEE DOCUMENT VAULT
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">My Personal Documents</h1>
          <p className="text-xs text-slate-400">Access corporate paystubs, employment agreements, tax forms, and IDs.</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.length === 0 ? (
          <div className="col-span-full p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-500">
            No personal documents uploaded to your vault yet.
          </div>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="flex items-start justify-between gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-950 text-indigo-300 border border-slate-800">
                  {doc.document_type}
                </span>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-100 truncate">{doc.document_name}</h4>
                <p className="text-[10px] text-slate-500 font-mono">
                  Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 font-mono">
                  {doc.file_size_bytes ? `${Math.round(doc.file_size_bytes / 1024)} KB` : "Document"}
                </span>
                <a
                  href={`/api/v1/documents/${doc.id}/download`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center gap-1"
                >
                  <Download className="w-3 h-3 text-indigo-400" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-blue-400" />
                <span>Upload Vault Document</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Tax W-2 Form 2026"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Category</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                >
                  <option value="PAYSTUB">Paystub / Compensation</option>
                  <option value="CONTRACT">Employment Contract</option>
                  <option value="TAX_FORM">Tax Document</option>
                  <option value="GOVERNMENT_ID">Government ID / Passport</option>
                  <option value="CERTIFICATION">Certification / Degree</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">File Attachment</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700"
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
                  disabled={uploading}
                  className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold disabled:opacity-50"
                >
                  Upload File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

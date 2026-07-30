import React, { useState } from "react";
import { X, FileText, UploadCloud, CheckCircle2 } from "lucide-react";
import { DocumentCreatePayload } from "../types/employee";
import { employeeService } from "../services/employeeService";
import { useToast } from "../components/Toast";

interface Props {
  employeeId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EmployeeDocumentModal: React.FC<Props> = ({ employeeId, isOpen, onClose, onSuccess }) => {
  const [documentType, setDocumentType] = useState("ID Proof");
  const [documentName, setDocumentName] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileSize, setFileSize] = useState(1024 * 500); // 500 KB default
  const [mimeType, setMimeType] = useState("application/pdf");
  const [loading, setLoading] = useState(false);

  const { showSuccess, showError } = useToast();

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setDocumentName(file.name.replace(/\.[^/.]+$/, ""));
      setFileSize(file.size);
      setMimeType(file.type || "application/octet-stream");
      setFileUrl(`/uploads/documents/${file.name}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentName || !fileName) {
      showError("Please specify document name and select or enter a file.", "Validation Error");
      return;
    }

    setLoading(true);
    try {
      const payload: DocumentCreatePayload = {
        document_type: documentType,
        document_name: documentName.trim(),
        file_name: fileName.trim(),
        file_url: fileUrl.trim() || `/uploads/documents/${fileName.trim()}`,
        file_size: fileSize,
        mime_type: mimeType,
      };

      await employeeService.uploadEmployeeDocument(employeeId, payload);
      showSuccess(`Document '${documentName}' attached successfully.`, "Document Attached");
      onSuccess();
      onClose();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || "Failed to attach document.";
      showError(errMsg, "Upload Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Attach Employee Document</h3>
              <p className="text-xs text-slate-400">Upload identity proof, qualification certificates, or contract files.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-200">
          <div>
            <label className="block mb-1 font-medium text-slate-300">Document Type</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
            >
              <option value="ID Proof">ID Proof (Passport / Driver's License / SSN)</option>
              <option value="Address Proof">Address Proof (Utility Bill / Lease)</option>
              <option value="Resume">Resume / CV</option>
              <option value="Offer Letter">Offer Letter</option>
              <option value="Joining Document">Joining Document / Contract</option>
              <option value="Education Certificate">Education Certificate</option>
              <option value="Experience Certificate">Experience Certificate</option>
              <option value="Other">Other Document</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 font-medium text-slate-300">
              Document Display Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="e.g. Passport Copy - 2026"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* File Picker / Drag & Drop Dropzone */}
          <div>
            <label className="block mb-1 font-medium text-slate-300">Select File</label>
            <div className="relative border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/60 rounded-2xl p-6 text-center transition-colors">
              <input
                type="file"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <UploadCloud className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              {fileName ? (
                <div className="space-y-1">
                  <p className="font-semibold text-emerald-400 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> {fileName}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {(fileSize / 1024).toFixed(1)} KB — {mimeType}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-slate-300 font-medium">Click to choose file or drag & drop</p>
                  <p className="text-[11px] text-slate-500">PDF, PNG, JPG, DOCX (Max 10MB)</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? "Uploading..." : "Attach Document"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

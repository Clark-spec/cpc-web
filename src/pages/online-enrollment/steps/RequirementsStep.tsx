import { useState, useRef } from "react";
import { useEnrollment } from "@/components/features/online-enrollment/hooks/useEnrollment";

export function RequirementsStep() {
  const { state, updateRequirementFile } = useEnrollment();
  const [dragActive, setDragActive] = useState(false);
  const fileInputs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleFileChange = (id: string, file: File) => {
    if (file) {
      updateRequirementFile(id, file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/") || file.type === "application/pdf") {
        handleFileChange(id, file);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "success";
      case "uploaded":
        return "success";
      case "rejected":
        return "error";
      default:
        return "pending";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "verified":
        return "Verified";
      case "uploaded":
        return "Uploaded";
      case "rejected":
        return "Rejected";
      default:
        return "Pending";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-cpc-navy">Upload Requirements</h3>
        <p className="text-sm text-enroll-text">
          Upload all required documents to complete your enrollment.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {state.requirements.map((requirement) => (
          <div key={requirement.id} className="space-y-2">
            <label className="block text-sm font-semibold text-cpc-navy">
              {requirement.name} *
            </label>
            
            {requirement.status === "pending" ? (
              <div
                className={`enroll-upload-box ${dragActive ? "drag-active" : ""}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={(e) => handleDrop(e, requirement.id)}
                onClick={() => fileInputs.current[requirement.id]?.click()}
              >
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="enroll-upload-icon"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <div className="enroll-upload-title">Click to upload or drag and drop</div>
                <div className="enroll-upload-hint">
                  {requirement.type === "ID Photo" ? 
                    "JPG, PNG max 2MB" : 
                    "PDF, DOC max 5MB"
                  }
                </div>
                <input
                  ref={(el) => { fileInputs.current[requirement.id] = el; }}
                  type="file"
                  className="hidden"
                  accept={requirement.type === "ID Photo" ? "image/*" : ".pdf,.doc,.docx"}
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileChange(requirement.id, e.target.files[0]);
                    }
                  }}
                />
              </div>
            ) : (
              <div className={`enroll-upload-box completed`}>
                <div className="enroll-upload-file">
                  <div className="enroll-upload-file-info">
                    <div className="enroll-upload-file-name">
                      {requirement.fileName}
                    </div>
                    <div className="enroll-upload-file-size">
                      {requirement.fileSize && formatFileSize(requirement.fileSize)}
                    </div>
                  </div>
                  <div className={`enroll-upload-status ${getStatusColor(requirement.status)}`}>
                    {getStatusText(requirement.status)}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-enroll-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-enroll-text">
            Documents Ready: {state.requirements.filter(r => r.status !== "pending").length} of {state.requirements.length}
          </span>
          <span className="text-sm font-semibold text-cpc-navy">
            {state.requirements.filter(r => r.status === "verified").length} Verified
          </span>
        </div>
      </div>
    </div>
  );
}
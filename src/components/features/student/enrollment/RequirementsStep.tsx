import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { useEnrollment } from "@/components/features/student/enrollment/useEnrollment";
import { CameraCaptureModal } from "@/components/ui/camera-capture-modal";
import { validateRequirementFile } from "@/components/features/student/enrollment/validation";
import type { RequirementDocument } from "@/components/features/student/enrollment/mockData";

export function RequirementsStep() {
  const { state, updateRequirementFile } = useEnrollment();
  const [dragTarget, setDragTarget] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cameraTarget, setCameraTarget] = useState<RequirementDocument | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFileChange = (requirement: RequirementDocument, file: File) => {
    const error = validateRequirementFile(requirement, file);

    setErrors((prev) => {
      const next = { ...prev };
      if (error) next[requirement.id] = error;
      else delete next[requirement.id];
      return next;
    });

    if (!error) updateRequirementFile(requirement.id, file);
  };

  const handleDrag = (event: React.DragEvent, id: string, active: boolean) => {
    event.preventDefault();
    event.stopPropagation();
    setDragTarget((current) => {
      if (active) return id;
      return current === id ? null : current;
    });
  };

  const handleDrop = (event: React.DragEvent, requirement: RequirementDocument) => {
    event.preventDefault();
    event.stopPropagation();
    setDragTarget(null);

    const file = event.dataTransfer.files?.[0];
    if (file) handleFileChange(requirement, file);
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

  const cameraTargetIsIdPhoto = cameraTarget?.type === "ID Photo";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-enroll-heading mb-2">Submit Your Requirements</h3>
        <p className="text-sm text-enroll-muted">
          Upload the necessary documents required for your enrollment application. Ensure that all uploaded files are clear, complete, and readable.
        </p>
        <p className="text-xs text-enroll-text mt-1">
          You can upload a file or take a photo of each document. Review the accepted formats and
          file size limits before uploading.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {state.requirements.map((requirement) => (
          <div key={requirement.id} className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="block text-sm font-semibold text-enroll-heading">
                {requirement.name} *
              </label>
              {requirement.status === "pending" && (
                <button
                  type="button"
                  onClick={() => setCameraTarget(requirement)}
                  className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-enroll-border bg-enroll-card px-3 py-1.5 font-poppins text-xs font-semibold text-enroll-primary transition-colors hover:bg-enroll-hero-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-enroll-primary"
                >
                  <Camera className="h-3.5 w-3.5" aria-hidden />
                  Take Photo
                </button>
              )}
            </div>

            {requirement.status === "pending" ? (
              <div
                className={`enroll-upload-box ${dragTarget === requirement.id ? "drag-active" : ""}`}
                onDragEnter={(e) => handleDrag(e, requirement.id, true)}
                onDragLeave={(e) => handleDrag(e, requirement.id, false)}
                onDragOver={(e) => handleDrag(e, requirement.id, true)}
                onDrop={(e) => handleDrop(e, requirement)}
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
                  {requirement.type === "ID Photo" ? "JPG, PNG max 2MB" : "PDF, DOC, JPG max 5MB"}
                </div>

                <input
                  ref={(el) => {
                    fileInputs.current[requirement.id] = el;
                  }}
                  type="file"
                  className="hidden"
                  accept={requirement.type === "ID Photo" ? "image/jpeg,image/png" : ".pdf,.doc,.docx,image/jpeg,image/png"}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) handleFileChange(requirement, file);
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

            {errors[requirement.id] && (
              <span className="enroll-form-error" role="alert">
                {errors[requirement.id]}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-enroll-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-enroll-text">
            Documents Ready: {state.requirements.filter(r => r.status !== "pending").length} of {state.requirements.length}
          </span>
          <span className="text-sm font-semibold text-enroll-heading">
            {state.requirements.filter(r => r.status === "verified").length} Verified
          </span>
        </div>
      </div>

      <CameraCaptureModal
        open={cameraTarget !== null}
        onClose={() => setCameraTarget(null)}
        onCapture={(file) => {
          if (cameraTarget) handleFileChange(cameraTarget, file);
        }}
        title={
          cameraTargetIsIdPhoto
            ? "Take your ID photo"
            : `Capture ${cameraTarget?.name ?? "document"}`
        }
        description={
          cameraTargetIsIdPhoto
            ? "Position your face within the frame and take a clear photo. It will be attached as your ID Photo requirement."
            : "Place the document on a flat surface, fill the frame, and capture. Make sure the text is clear and readable."
        }
        fileNamePrefix={cameraTarget?.id ?? "document"}
        captureLabel={cameraTargetIsIdPhoto ? "Take Photo" : "Capture Document"}
      />
    </div>
  );
}
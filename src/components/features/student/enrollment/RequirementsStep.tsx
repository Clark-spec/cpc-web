import { useRef, useState } from "react";
import { Camera, ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useEnrollment } from "@/components/features/student/enrollment/useEnrollment";
import { CameraCaptureModal } from "@/components/ui/camera-capture-modal";
import { validateRequirementFile } from "@/components/features/student/enrollment/validation";
import type { RequirementDocument } from "@/components/features/student/enrollment/mockData";

export function RequirementsStep() {
  const { state, updateRequirementFile, updateRequirements } = useEnrollment();
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

  const handleRemoveFile = (requirement: RequirementDocument) => {
    updateRequirements(
      state.requirements.map((req) =>
        req.id === requirement.id
          ? {
              ...req,
              fileName: undefined,
              fileSize: undefined,
              uploadDate: undefined,
              status: "pending" as const,
            }
          : req,
      ),
    );

    setErrors((prev) => {
      if (!(requirement.id in prev)) return prev;
      const next = { ...prev };
      delete next[requirement.id];
      return next;
    });
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
        <h3 className="mb-2 text-lg font-semibold text-enroll-heading sm:text-xl">Submit Your Requirements</h3>
        <p className="text-sm text-enroll-muted">
          Upload the necessary documents required for your enrollment application. Ensure that all uploaded files are clear, complete, and readable.
        </p>
        <p className="text-xs text-enroll-text mt-1">
          You can upload a file, retake a photo, or remove an uploaded document to replace it.
          Review the accepted formats and file size limits before uploading.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        {state.requirements.map((requirement) => (
          <div key={requirement.id} className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <label className="block text-sm font-semibold text-enroll-heading">
                {requirement.name} *
              </label>
              {requirement.status !== "pending" && (
                <button
                  type="button"
                  onClick={() => setCameraTarget(requirement)}
                  className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-enroll-border bg-enroll-card px-3 py-1.5 font-poppins text-xs font-semibold text-enroll-primary transition-colors hover:bg-enroll-hero-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-enroll-primary"
                >
                  <Camera className="h-3.5 w-3.5" aria-hidden />
                  Retake Photo
                </button>
              )}
            </div>

            {requirement.status === "pending" ? (
              <div
                className={cn(
                  "rounded-[14px] border-2 border-dashed px-3 py-5 text-center transition-colors",
                  dragTarget === requirement.id
                    ? "border-enroll-primary bg-[#E8ECF8]"
                    : "border-enroll-border bg-enroll-hero-bg",
                )}
                onDragEnter={(e) => handleDrag(e, requirement.id, true)}
                onDragLeave={(e) => handleDrag(e, requirement.id, false)}
                onDragOver={(e) => handleDrag(e, requirement.id, true)}
                onDrop={(e) => handleDrop(e, requirement)}
              >
                <ImagePlus className="mx-auto h-7 w-7 text-enroll-primary" aria-hidden />
                <p className="mt-2 font-poppins text-[13px] font-semibold text-enroll-heading">
                  Add your {requirement.name}
                </p>
                <p className="mt-0.5 font-poppins text-[11px] text-enroll-muted">
                  {requirement.type === "ID Photo" ? "JPG, PNG max 2MB" : "PDF, DOC, JPG max 5MB"}
                </p>

                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputs.current[requirement.id]?.click()}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-enroll-border bg-white px-3 py-1.5 font-poppins text-[11px] font-semibold text-enroll-primary transition-colors hover:border-enroll-primary/40 hover:bg-enroll-hero-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-enroll-primary"
                  >
                    <ImagePlus className="h-3.5 w-3.5" aria-hidden />
                    {requirement.type === "ID Photo" ? "Upload photo" : "Upload file"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCameraTarget(requirement)}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-enroll-primary-hover px-3 py-1.5 font-poppins text-[11px] font-semibold text-white shadow-[0_4px_12px_rgba(11,44,140,0.22)] transition-colors hover:bg-enroll-heading focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-enroll-primary"
                  >
                    <Camera className="h-3.5 w-3.5" aria-hidden />
                    Use camera
                  </button>
                </div>

                <p className="mt-2 font-poppins text-[10px] text-enroll-muted">
                  You can also drag and drop the file here.
                </p>

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
              <div className="enroll-upload-box completed">
                <div className="enroll-upload-file">
                  <div className="enroll-upload-file-info min-w-0">
                    <div className="enroll-upload-file-name truncate" title={requirement.fileName}>
                      {requirement.fileName}
                    </div>
                    <div className="enroll-upload-file-size">
                      {requirement.fileSize && formatFileSize(requirement.fileSize)}
                    </div>
                  </div>
                  <div className="enroll-upload-file-actions flex shrink-0 items-center gap-2">
                    <div className={`enroll-upload-status ${getStatusColor(requirement.status)}`}>
                      {getStatusText(requirement.status)}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(requirement)}
                      aria-label={`Remove ${requirement.name} file`}
                      title="Remove file"
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-enroll-border bg-enroll-card text-enroll-muted transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-enroll-primary"
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
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
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
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
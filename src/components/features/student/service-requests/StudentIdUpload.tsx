import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import {
  ACCEPTED_DOCUMENT_LABEL,
  ACCEPTED_DOCUMENT_TYPES,
  type RequestDocument,
} from "@/services/serviceRequests/student";
import { formatFileSize } from "@/components/features/student/service-requests/format";

type StudentIdUploadProps = {
  files: File[];
  savedDocument: RequestDocument | null;
  maxFiles: number;
  progress: number | null;
  disabled?: boolean;
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
  onRemoveSaved: () => void;
};

function ImagePlusIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="3" y="4" width="15" height="15" rx="2.5" />
      <circle cx="8" cy="9" r="1.5" />
      <path d="m4 16 4-4 3.5 3.5L15 12l3 3" />
      <path d="M20 6v5M17.5 8.5h5" />
    </svg>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.6l1.1-1.6A1.5 1.5 0 0 1 9.4 4h5.2a1.5 1.5 0 0 1 1.2.6L16.9 6h1.6A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5Z" />
      <circle cx="12" cy="12.5" r="3.2" />
    </svg>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 16.5h4" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function RemoveButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title="Remove photo"
      className="absolute top-1.5 right-1.5 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-white/95 text-sr-text shadow-[0_2px_6px_rgba(15,36,104,0.25)] ring-1 ring-black/10 transition-colors hover:bg-sr-danger hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sr-primary disabled:cursor-not-allowed disabled:opacity-50"
    >
      <CloseIcon className="h-3 w-3" />
    </button>
  );
}

function FileCard({
  file,
  index,
  disabled,
  onRemove,
}: {
  file: File;
  index: number;
  disabled: boolean;
  onRemove: () => void;
}) {
  const preview = useMemo(
    () => (file.type.startsWith("image/") ? URL.createObjectURL(file) : null),
    [file],
  );

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  return (
    <li className="relative overflow-hidden rounded-[10px] border border-sr-border bg-white">
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-sr-section">
        {preview ? (
          <img
            src={preview}
            alt={`Student ID photo ${index + 1}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <FileIcon className="h-8 w-8 text-sr-primary" />
        )}
        <RemoveButton
          label={`Remove photo ${index + 1}`}
          disabled={disabled}
          onClick={onRemove}
        />
      </div>
      <div className="px-2 py-1.5">
        <p className="truncate font-poppins text-[11px] font-medium text-sr-text">{file.name}</p>
        <p className="font-poppins text-[10px] text-sr-muted">{formatFileSize(file.size)}</p>
      </div>
    </li>
  );
}

export function StudentIdUpload({
  files,
  savedDocument,
  maxFiles,
  progress,
  disabled = false,
  onAdd,
  onRemove,
  onRemoveSaved,
}: StudentIdUploadProps) {
  const pickerId = useId();
  const cameraId = useId();
  const pickerRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const busy = progress !== null;
  const blocked = disabled || busy;
  const total = files.length + (savedDocument ? 1 : 0);
  const full = total >= maxFiles;

  function openPicker() {
    if (blocked) return;
    pickerRef.current?.click();
  }

  function openCamera() {
    if (blocked) return;
    cameraRef.current?.click();
  }

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-poppins text-[11px] font-medium text-sr-text">
          Photos{" "}
          <span className={cn("font-semibold", full ? "text-[#1E8A57]" : "text-sr-muted")}>
            {total}/{maxFiles}
          </span>
        </p>
        <p className="font-poppins text-[10px] text-sr-muted">
          Min 1 · Max {maxFiles} photo{maxFiles === 1 ? "" : "s"}
        </p>
      </div>

      <input
        ref={pickerRef}
        id={pickerId}
        type="file"
        multiple
        className="sr-only"
        accept={ACCEPTED_DOCUMENT_TYPES.join(",")}
        disabled={blocked}
        onChange={(event) => {
          onAdd(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />
      <input
        ref={cameraRef}
        id={cameraId}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        disabled={blocked}
        onChange={(event) => {
          onAdd(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />

      {total > 0 && (
        <ul className="grid grid-cols-2 gap-2.5">
          {files.map((file, index) => (
            <FileCard
              key={`${file.name}-${file.lastModified}-${index}`}
              file={file}
              index={index}
              disabled={blocked}
              onRemove={() => onRemove(index)}
            />
          ))}

          {savedDocument && (
            <li className="relative overflow-hidden rounded-[10px] border border-sr-border bg-white">
              <div className="relative flex aspect-[4/3] items-center justify-center bg-sr-section">
                <FileIcon className="h-8 w-8 text-sr-primary" />
                <RemoveButton
                  label="Remove saved draft photo"
                  disabled={blocked}
                  onClick={onRemoveSaved}
                />
              </div>
              <div className="px-2 py-1.5">
                <p className="truncate font-poppins text-[11px] font-medium text-sr-text">
                  {savedDocument.name}
                </p>
                <p className="font-poppins text-[10px] text-sr-muted">
                  {formatFileSize(savedDocument.size)} · Saved draft
                </p>
              </div>
            </li>
          )}
        </ul>
      )}

      {!full && (
        <div
          onDragEnter={(event) => {
            event.preventDefault();
            if (!blocked) setDragActive(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            if (!blocked) setDragActive(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setDragActive(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            if (!blocked) onAdd(Array.from(event.dataTransfer.files));
          }}
          className={cn(
            "rounded-[10px] border-2 border-dashed px-3 text-center transition-colors",
            total === 0 ? "py-6" : "py-3",
            dragActive
              ? "border-sr-primary bg-[#EEF4FF]"
              : "border-[#CBD8F0] bg-[#F8FAFF]",
            blocked && "opacity-60",
          )}
        >
          {total === 0 ? (
            <>
              <ImagePlusIcon className="mx-auto h-7 w-7 text-sr-primary" />
              <p className="mt-2 font-poppins text-[13px] font-semibold text-sr-text">
                Add photos of your student ID
              </p>
              <p className="mt-0.5 font-poppins text-[11px] text-sr-muted">
                {ACCEPTED_DOCUMENT_LABEL} · up to {maxFiles} photos
              </p>
            </>
          ) : (
            <p className="font-poppins text-[11px] text-sr-muted">
              Add another photo (front and back)
            </p>
          )}

          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={openPicker}
              disabled={blocked}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-sr-border bg-white px-3 py-1.5 font-poppins text-[11px] font-semibold text-sr-primary transition-colors hover:border-sr-primary/40 hover:bg-sr-section focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sr-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ImagePlusIcon className="h-3.5 w-3.5" />
              Upload photo
            </button>
            <button
              type="button"
              onClick={openCamera}
              disabled={blocked}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-sr-primary px-3 py-1.5 font-poppins text-[11px] font-semibold text-white shadow-[0_4px_12px_rgba(27,47,158,0.22)] transition-colors hover:bg-cpc-navy-top focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sr-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CameraIcon className="h-3.5 w-3.5" />
              Use camera
            </button>
          </div>

          {total === 0 && (
            <p className="mt-2 font-poppins text-[10px] text-sr-muted">
              You can also drag and drop the photos here.
            </p>
          )}
        </div>
      )}

      {busy && (
        <div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-sr-section">
            <div
              className="h-full rounded-full bg-sr-primary transition-all duration-200"
              style={{ width: `${progress ?? 0}%` }}
            />
          </div>
          <p className="mt-1.5 font-poppins text-[10px] text-sr-muted">
            Uploading your student ID… {progress ?? 0}%
          </p>
        </div>
      )}
    </div>
  );
}

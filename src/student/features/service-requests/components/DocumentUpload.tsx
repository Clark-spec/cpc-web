import { useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import {
  ACCEPTED_DOCUMENT_LABEL,
  ACCEPTED_DOCUMENT_TYPES,
  type RequestDocument,
} from "@/student/services/serviceRequests";
import { formatFileSize } from "../utils/format";

type DocumentUploadProps = {
  file: File | null;
  savedDocument: RequestDocument | null;
  progress: number | null;
  disabled?: boolean;
  onSelect: (file: File) => void;
  onRemove: () => void;
};

function CloudUploadIcon({ className }: { className?: string }) {
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
      <path d="M7 18a4.5 4.5 0 0 1-.6-8.96A5.5 5.5 0 0 1 17.2 8.6 3.9 3.9 0 0 1 18 18" />
      <path d="M12 12v6" />
      <path d="m9.5 14.5 2.5-2.5 2.5 2.5" />
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

export function DocumentUpload({
  file,
  savedDocument,
  progress,
  disabled = false,
  onSelect,
  onRemove,
}: DocumentUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const busy = progress !== null;
  const name = file?.name ?? savedDocument?.name ?? "";
  const size = file?.size ?? savedDocument?.size ?? 0;
  const hasDocument = Boolean(file || savedDocument);

  function openPicker() {
    if (disabled || busy) return;
    inputRef.current?.click();
  }

  function accept(files: FileList | null) {
    const next = files?.[0];
    if (next) onSelect(next);
  }

  return (
    <div>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        className="sr-only"
        accept={ACCEPTED_DOCUMENT_TYPES.join(",")}
        disabled={disabled || busy}
        onChange={(event) => {
          accept(event.target.files);
          event.target.value = "";
        }}
      />

      {hasDocument ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 rounded-[10px] border border-sr-border bg-white px-3 py-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sr-section text-sr-primary">
              <FileIcon className="h-[18px] w-[18px]" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate font-poppins text-[13px] font-medium text-sr-text">{name}</p>
              <p className="font-poppins text-[11px] text-sr-muted">
                {formatFileSize(size)} · {file ? "Ready to upload" : "Saved in your draft"}
              </p>
            </div>

            <span
              className={cn(
                "rounded-full border px-2.5 py-0.5 font-poppins text-[10px] font-semibold",
                file
                  ? "border-[#C4EBD9] bg-[#E3F7EE] text-[#1E8A57]"
                  : "border-[#CFE0FF] bg-[#E8F1FF] text-[#2F5FD0]",
              )}
            >
              {file ? "Ready" : "Saved draft"}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openPicker}
                disabled={disabled || busy}
                className="rounded-md px-2 py-1 font-poppins text-[11px] font-semibold text-sr-primary transition-colors hover:bg-sr-section disabled:cursor-not-allowed disabled:opacity-50"
              >
                Replace
              </button>
              {file && (
                <button
                  type="button"
                  onClick={onRemove}
                  disabled={disabled || busy}
                  className="rounded-md px-2 py-1 font-poppins text-[11px] font-semibold text-sr-danger transition-colors hover:bg-[#FDECEC] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

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
      ) : (
        <button
          type="button"
          onClick={openPicker}
          onDragEnter={(event) => {
            event.preventDefault();
            if (!disabled) setDragActive(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setDragActive(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setDragActive(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            if (!disabled) accept(event.dataTransfer.files);
          }}
          disabled={disabled}
          className={cn(
            "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-[10px] border-2 border-dashed px-4 py-6 text-center transition-colors",
            dragActive
              ? "border-sr-primary bg-[#EEF4FF]"
              : "border-[#CBD8F0] bg-[#F8FAFF] hover:border-sr-primary hover:bg-[#F3F8FF]",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          <CloudUploadIcon className="h-8 w-8 text-sr-primary" />
          <span className="font-poppins text-[13px] font-semibold text-sr-text">
            Click to upload or drag and drop
          </span>
          <span className="font-poppins text-[11px] text-sr-muted">{ACCEPTED_DOCUMENT_LABEL}</span>
        </button>
      )}
    </div>
  );
}

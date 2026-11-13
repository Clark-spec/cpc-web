import { useRef, useState, type ChangeEvent } from "react";
import { Camera, LoaderCircle, Trash } from "lucide-react";
import { cn } from "@/lib/cn";
import { showError, showInfo, showSuccess } from "@/lib/feedback";
import { initialsFromName } from "@/components/features/student/profile/format";
import { uploadAvatar } from "@/services/studentProfile";

type AvatarUploaderProps = {
  fullName: string;
  value?: string;
  editing: boolean;
  onChange: (dataUrl: string) => void;
};

/**
 * Circular avatar. In edit mode the camera button opens a file picker; the
 * service validates type/size and returns a square, 256px base64 preview.
 */
export function AvatarUploader({ fullName, value, editing, onChange }: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset so picking the same file again still fires onChange.
    event.target.value = "";
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      const dataUrl = await uploadAvatar(file);
      onChange(dataUrl);
      showSuccess("Profile photo ready", "Save your profile to keep this photo.");
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : "We couldn't use that image.";
      setError(message);
      showError("Could not use that photo", message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <div
          className={cn(
            "flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-cpc-blue-accent shadow-[0_10px_28px_rgba(15,36,104,0.22)] sm:h-32 sm:w-32",
            editing && "ring-2 ring-cpc-blue-accent/40",
          )}
        >
          {value ? (
            <img
              src={value}
              alt={`${fullName} profile photo`}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="font-poppins text-3xl font-bold tracking-wide text-white" aria-hidden>
              {initialsFromName(fullName)}
            </span>
          )}

          {uploading && (
            <span className="absolute inset-0 flex items-center justify-center bg-cpc-navy-deep/55">
              <LoaderCircle className="h-6 w-6 animate-spin text-white motion-reduce:animate-none" aria-hidden />
              <span className="sr-only">Processing photo</span>
            </span>
          )}
        </div>

        {editing && (
          <button
            id="profile-avatar-button"
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="absolute right-0 bottom-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-cpc-blue-accent text-white ring-4 ring-white transition-colors hover:bg-cpc-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-navy disabled:cursor-wait disabled:opacity-70"
            aria-label={value ? "Change profile photo" : "Add profile photo"}
            title={value ? "Change profile photo" : "Add profile photo"}
          >
            <Camera className="h-4 w-4" aria-hidden />
          </button>
        )}

          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg"
            aria-label="Profile photo"
            className="sr-only"
            onChange={handleFile}
            tabIndex={-1}
          />
      </div>

      {editing && value && (
        <button
          type="button"
          onClick={() => {
            setError(null);
            onChange("");
            showInfo("Profile photo removed", "Save your profile to keep this change.");
          }}
          className="inline-flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 font-poppins text-[11px] font-medium text-cpc-heading-soft transition-colors hover:text-rose-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
        >
          <Trash className="h-3 w-3" aria-hidden />
          Remove photo
        </button>
      )}

      {editing && (
        <p className="max-w-[9rem] text-center font-poppins text-[10px] leading-snug text-cpc-heading-soft">
          PNG or JPG, max 2 MB
        </p>
      )}

      {error && (
        <p role="alert" className="max-w-[12rem] text-center font-poppins text-[11px] leading-snug text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";

type CameraCaptureModalProps = {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  title?: string;
  description?: string;
  fileNamePrefix?: string;
  captureLabel?: string;
};

type CameraStatus = "starting" | "ready" | "error";

const MAX_CAPTURE_EDGE = 1600;

function captureDimensions(width: number, height: number) {
  const longest = Math.max(width, height);
  if (longest <= MAX_CAPTURE_EDGE) return { width, height };

  const scale = MAX_CAPTURE_EDGE / longest;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

function cameraErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") {
      return "Camera permission was denied. Allow camera access in your browser settings, or upload a file instead.";
    }
    if (error.name === "NotFoundError") {
      return "No camera was found on this device. You can upload a file instead.";
    }
    if (error.name === "NotReadableError") {
      return "The camera is busy or unavailable. Close other apps using it and try again.";
    }
  }
  return "The camera could not be started. Check your device permissions or upload a file instead.";
}

/** Captures a photo from the device camera and returns it as a JPEG file. */
export function CameraCaptureModal({
  open,
  onClose,
  onCapture,
  title = "Take a photo",
  description = "Position the subject in the frame, then capture. The photo will be attached to your complaint.",
  fileNamePrefix = "complaint-photo",
  captureLabel = "Take Photo",
}: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("starting");
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!open) return;

    const video = videoRef.current;
    let cancelled = false;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("error");
        setError("Camera access is not supported in this browser. You can upload a file instead.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => undefined);
        }
        if (!cancelled) setStatus("ready");
      } catch (cause) {
        if (cancelled) return;
        setStatus("error");
        setError(cameraErrorMessage(cause));
      }
    }

    void startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (video) video.srcObject = null;
    };
  }, [open, attempt]);

  function handleCapture() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setStatus("error");
      setError("The camera is not ready yet. Please wait a moment and try again.");
      return;
    }

    const canvas = document.createElement("canvas");
    const dimensions = captureDimensions(video.videoWidth, video.videoHeight);
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const context = canvas.getContext("2d");

    if (!context) {
      setStatus("error");
      setError("The photo could not be captured. Please try again or upload a file instead.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setStatus("error");
          setError("The photo could not be captured. Please try again or upload a file instead.");
          return;
        }

        onCapture(new File([blob], `${fileNamePrefix}-${Date.now()}.jpg`, { type: "image/jpeg" }));
        onClose();
      },
      "image/jpeg",
      0.9,
    );
  }

  return (
    <Modal open={open} onClose={onClose} labelledBy="camera-capture-title" className="sm:max-w-xl">
      <div className="p-5 sm:p-6">
        <div className="pr-8">
          <h2
            id="camera-capture-title"
            className="font-poppins text-lg leading-tight font-bold text-cpc-navy-text"
          >
            {title}
          </h2>
          <p className="mt-1 font-poppins text-xs leading-relaxed text-cpc-heading-soft">
            {description}
          </p>
        </div>

        <div className="relative mt-4 overflow-hidden rounded-xl border border-cpc-input-border bg-cpc-navy-deep">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            aria-label="Camera preview"
            className={cn(
              "aspect-video w-full object-cover",
              status !== "ready" && "opacity-0",
            )}
          />

          {status === "starting" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
              <p className="font-poppins text-xs">Starting camera…</p>
            </div>
          )}

          {status === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-5 py-6 text-center text-white">
              <AlertTriangle className="h-6 w-6 text-amber-300" aria-hidden />
              <p className="font-poppins text-sm font-semibold">Camera unavailable</p>
              <p className="max-w-sm font-poppins text-xs leading-relaxed text-white/80">{error}</p>
              <button
                type="button"
                onClick={() => {
                  setStatus("starting");
                  setError(null);
                  setAttempt((current) => current + 1);
                }}
                className="mt-1 cursor-pointer rounded-lg bg-white/15 px-3 py-1.5 font-poppins text-xs font-semibold text-white transition-colors hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Try again
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="cpc-btn cpc-btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCapture}
            disabled={status !== "ready"}
            className="cpc-btn cpc-btn-primary"
          >
            <Camera className="h-4 w-4" aria-hidden />
            {captureLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

import { useRef, useState } from "react";
import {
  Check,
  Eraser,
  Loader2,
  PenLine,
  ShieldCheck,
  Type,
  Upload,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Modal } from "@/components/ui/modal";
import {
  clearSavedSignature,
  getSavedSignature,
  saveSignature,
} from "../../services/adminService";
import type { OfficeId } from "@/features/clearance/types";
import type { SavedSignature, SignatureMethod, SignaturePayload } from "../../types";

const FONTS: Array<{ id: string; label: string; className: string }> = [
  { id: "dancing", label: "Dancing Script", className: "signature-font-dancing" },
  { id: "vibes", label: "Great Vibes", className: "signature-font-vibes" },
  { id: "caveat", label: "Caveat", className: "signature-font-caveat" },
];

const METHOD_LABELS: Record<SignatureMethod, string> = {
  draw: "Draw",
  type: "Type",
  upload: "Upload",
};

type SignaturePadModalProps = {
  open: boolean;
  onClose: () => void;
  /** Number of requests being signed at once (bulk approve). */
  count: number;
  office: OfficeId;
  signerName: string;
  userId: string;
  busy: boolean;
  onConfirm: (payload: SignaturePayload) => Promise<void> | void;
};

/** Draws typed text onto a canvas and returns a transparent PNG data URL. */
async function renderTypedSignature(text: string, fontId: string): Promise<string> {
  const font = FONTS.find((entry) => entry.id === fontId) ?? FONTS[0];
  const family =
    font.id === "vibes"
      ? '"Great Vibes", cursive'
      : font.id === "caveat"
        ? '"Caveat", cursive'
        : '"Dancing Script", cursive';

  try {
    await document.fonts.load(`64px ${family}`);
  } catch {
    // Best-effort; the canvas falls back to cursive.
  }

  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 200;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#1b2f9e";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  let size = 84;
  ctx.font = `${size}px ${family}`;
  while (ctx.measureText(text).width > canvas.width - 40 && size > 28) {
    size -= 4;
    ctx.font = `${size}px ${family}`;
  }

  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  return canvas.toDataURL("image/png");
}

/**
 * Staff signature capture.
 *
 * Flow: draw / type / upload -> base64 PNG -> optional "save for next time"
 * -> onConfirm(SignaturePayload) -> adminService writes the image into the
 * shared student clearance record, which the student portal then renders.
 */
export function SignaturePadModal({
  open,
  onClose,
  count,
  office,
  signerName,
  userId,
  busy,
  onConfirm,
}: SignaturePadModalProps) {
  const [method, setMethod] = useState<SignatureMethod>("draw");
  const [typedName, setTypedName] = useState(signerName);
  const [fontId, setFontId] = useState(FONTS[0].id);
  const [uploaded, setUploaded] = useState<string | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [certified, setCertified] = useState(false);
  const [remember, setRemember] = useState(false);
  const [saved, setSaved] = useState<SavedSignature | null>(() => getSavedSignature(userId));
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const pointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDraw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(event.pointerId);
    drawing.current = true;
    lastPoint.current = pointFromEvent(event);
  };

  const moveDraw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const point = pointFromEvent(event);
    const last = lastPoint.current ?? point;

    ctx.strokeStyle = "#1b2f9e";
    ctx.lineWidth = 3.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();

    lastPoint.current = point;
    setHasDrawn(true);
  };

  const endDraw = () => {
    drawing.current = false;
    lastPoint.current = null;
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose a PNG or JPG image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("The signature image must be 2 MB or smaller.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setUploaded(typeof reader.result === "string" ? reader.result : null);
      setError(null);
    };
    reader.onerror = () => setError("We couldn't read that file. Please try another image.");
    reader.readAsDataURL(file);
  };

  const useSaved = () => {
    if (!saved) return;
    setMethod("upload");
    setUploaded(saved.image);
    setError(null);
  };

  const buildImage = async (): Promise<string | null> => {
    if (method === "draw") {
      if (!hasDrawn) return null;
      return canvasRef.current?.toDataURL("image/png") ?? null;
    }
    if (method === "type") {
      if (!typedName.trim()) return null;
      return renderTypedSignature(typedName.trim(), fontId);
    }
    return uploaded;
  };

  const submit = async () => {
    setError(null);
    if (!certified) {
      setError("Please certify that this signature is legally binding before continuing.");
      return;
    }

    const image = await buildImage();
    if (!image) {
      setError(
        method === "draw"
          ? "Draw your signature in the box first."
          : method === "type"
            ? "Enter the name you want to sign with."
            : "Upload a signature image first.",
      );
      return;
    }

    if (remember) {
      const record: SavedSignature = {
        image,
        signerName,
        method,
        savedAt: new Date().toISOString(),
      };
      saveSignature(userId, record);
      setSaved(record);
    }

    await onConfirm({
      image,
      signerName,
      office,
      signedAt: new Date().toISOString(),
    });
  };

  const methods: Array<{ id: SignatureMethod; icon: typeof PenLine }> = [
    { id: "draw", icon: PenLine },
    { id: "type", icon: Type },
    { id: "upload", icon: Upload },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy="signature-pad-title"
      className="sm:max-w-xl"
    >
      <div className="p-5 sm:p-6">
        <div className="pr-8">
          <h2
            id="signature-pad-title"
            className="font-poppins text-lg font-semibold text-cpc-navy-text"
          >
            Sign clearance {count > 1 ? `(${count} requests)` : ""}
          </h2>
          <p className="mt-1 font-poppins text-xs leading-relaxed text-cpc-heading-soft">
            Your signature is applied to {count > 1 ? "each selected request" : "this request"} and
            shown to the student.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Signature method"
          className="mt-4 flex gap-1 rounded-xl bg-cpc-section-light/60 p-1"
        >
          {methods.map((entry) => {
            const Icon = entry.icon;
            const active = method === entry.id;
            return (
              <button
                key={entry.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setMethod(entry.id);
                  setError(null);
                }}
                className={cn(
                  "flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 py-2 font-poppins text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
                  active
                    ? "bg-white text-cpc-blue-accent shadow-sm"
                    : "text-cpc-heading-soft hover:text-cpc-navy-text",
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {METHOD_LABELS[entry.id]}
              </button>
            );
          })}
        </div>

        <div className="mt-3">
          {method === "draw" && (
            <div>
              <canvas
                ref={canvasRef}
                width={640}
                height={200}
                onPointerDown={startDraw}
                onPointerMove={moveDraw}
                onPointerUp={endDraw}
                onPointerLeave={endDraw}
                onPointerCancel={endDraw}
                aria-label="Signature drawing area"
                className="h-40 w-full cursor-crosshair touch-none rounded-xl border-2 border-dashed border-cpc-tile-border bg-cpc-section-light/20"
              />
              <div className="mt-1.5 flex items-center justify-between">
                <p className="font-poppins text-[10px] text-cpc-heading-soft">
                  Use a mouse, finger or stylus to sign above.
                </p>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 font-poppins text-[11px] font-semibold text-cpc-heading-soft transition-colors hover:bg-cpc-section-light hover:text-cpc-navy-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
                >
                  <Eraser className="h-3 w-3" aria-hidden />
                  Clear
                </button>
              </div>
            </div>
          )}

          {method === "type" && (
            <div className="space-y-2.5">
              <label className="block">
                <span className="font-poppins text-[11px] font-semibold text-cpc-navy-text">
                  Name to sign with
                </span>
                <input
                  type="text"
                  value={typedName}
                  onChange={(event) => setTypedName(event.target.value)}
                  maxLength={48}
                  className="mt-1 w-full rounded-lg border border-cpc-tile-border bg-white px-3 py-2 font-poppins text-sm text-cpc-navy-text outline-none focus:border-cpc-blue-accent focus:ring-2 focus:ring-cpc-blue-accent/20"
                />
              </label>

              <div>
                <span className="font-poppins text-[11px] font-semibold text-cpc-navy-text">
                  Signature style
                </span>
                <div className="mt-1 grid grid-cols-3 gap-1.5">
                  {FONTS.map((font) => (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() => setFontId(font.id)}
                      aria-pressed={fontId === font.id}
                      className={cn(
                        "cursor-pointer rounded-lg border px-2 py-2 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
                        fontId === font.id
                          ? "border-cpc-blue-accent bg-cpc-section-light"
                          : "border-cpc-tile-border bg-white hover:bg-cpc-section-light/50",
                      )}
                    >
                      <span
                        className={cn(
                          "block truncate text-lg leading-tight text-cpc-navy-text",
                          font.className,
                        )}
                      >
                        {typedName.trim() || signerName}
                      </span>
                      <span className="mt-0.5 block font-poppins text-[9px] text-cpc-heading-soft">
                        {font.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-dashed border-cpc-tile-border bg-cpc-section-light/20 px-3 py-4 text-center">
                <p className="font-poppins text-[10px] font-semibold tracking-[0.1em] text-cpc-heading-soft uppercase">
                  Preview
                </p>
                <p
                  className={cn(
                    "mt-1 truncate text-4xl text-cpc-navy",
                    FONTS.find((font) => font.id === fontId)?.className,
                  )}
                >
                  {typedName.trim() || signerName}
                </p>
              </div>
            </div>
          )}

          {method === "upload" && (
            <div className="space-y-2.5">
              <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-cpc-tile-border bg-cpc-section-light/20 px-4 py-6 text-center transition-colors hover:bg-cpc-section-light/40 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-cpc-blue-accent">
                <Upload className="h-5 w-5 text-cpc-blue-accent" aria-hidden />
                <span className="font-poppins text-xs font-semibold text-cpc-navy-text">
                  Upload a signature image
                </span>
                <span className="font-poppins text-[10px] text-cpc-heading-soft">
                  PNG or JPG, up to 2 MB
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleUpload}
                  className="sr-only"
                />
              </label>

              {uploaded && (
                <div className="rounded-xl border border-cpc-tile-border bg-white p-2">
                  <p className="font-poppins text-[10px] font-semibold tracking-[0.1em] text-cpc-heading-soft uppercase">
                    Preview
                  </p>
                  <img
                    src={uploaded}
                    alt="Signature preview"
                    className="mx-auto mt-1 h-24 object-contain"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {saved && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-cpc-tile-border/70 bg-cpc-section-light/40 px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <UserCheck className="h-4 w-4 shrink-0 text-cpc-blue-accent" aria-hidden />
              <div className="min-w-0">
                <p className="font-poppins text-[11px] font-semibold text-cpc-navy-text">
                  Saved signature available
                </p>
                <p className="truncate font-poppins text-[10px] text-cpc-heading-soft">
                  Saved {new Date(saved.savedAt).toLocaleDateString()} · {METHOD_LABELS[saved.method]}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={useSaved}
                className="cursor-pointer rounded-md bg-white px-2 py-1 font-poppins text-[10px] font-semibold text-cpc-blue-accent ring-1 ring-cpc-tile-border transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
              >
                Use saved
              </button>
              <button
                type="button"
                onClick={() => {
                  clearSavedSignature(userId);
                  setSaved(null);
                }}
                className="cursor-pointer rounded-md px-2 py-1 font-poppins text-[10px] font-semibold text-rose-700 transition-colors hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
              >
                Remove
              </button>
            </div>
          </div>
        )}

        <div className="mt-3 space-y-2">
          <label className="flex cursor-pointer items-start gap-2 rounded-lg bg-cpc-section-light/40 px-3 py-2.5">
            <input
              type="checkbox"
              checked={certified}
              onChange={(event) => setCertified(event.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-pointer accent-cpc-blue-accent"
            />
            <span className="font-poppins text-[11px] leading-relaxed text-cpc-navy-text">
              I certify that this is my official signature and that it is legally binding for
              Cordova Public College clearance records.
            </span>
          </label>

          <label className="flex cursor-pointer items-center gap-2 px-1">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-cpc-blue-accent"
            />
            <span className="font-poppins text-[11px] text-cpc-heading-soft">
              Save this signature for next time
            </span>
          </label>
        </div>

        {error && (
          <p role="alert" className="mt-2 font-poppins text-[11px] font-medium text-rose-700">
            {error}
          </p>
        )}

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-cpc-tile-border bg-white px-4 py-2.5 font-poppins text-sm font-semibold text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy || !certified}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-cpc-button px-4 py-2.5 font-poppins text-sm font-semibold text-white transition-colors hover:bg-cpc-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <ShieldCheck className="h-4 w-4" aria-hidden />
            )}
            {busy ? "Signing..." : count > 1 ? `Sign ${count} requests` : "Sign request"}
          </button>
        </div>

        <p className="mt-2 flex items-center justify-center gap-1 font-poppins text-[10px] text-cpc-heading-soft">
          <Check className="h-3 w-3 text-emerald-600" aria-hidden />
          Stored locally in demo mode. A real deployment signs server-side.
        </p>
      </div>
    </Modal>
  );
}

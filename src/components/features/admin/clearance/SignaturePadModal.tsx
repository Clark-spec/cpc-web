import { useState } from "react";
import {
  Check,
  Eraser,
  PenLine,
  Sparkles,
  Type,
  Undo2,
  Upload,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import { useSignaturePad } from "@/components/features/admin/clearance/useSignaturePad";
import type { SignatureDraft } from "@/components/features/admin/clearance/types";

/* ------------------------------------------------------------------ fonts */

type HandwritingFont = {
  id: string;
  label: string;
  /** DOM class from `src/admin/admin.css` used for the live preview. */
  className: string;
  /** Same family string handed to the canvas 2D context. */
  family: string;
};

const FONTS: HandwritingFont[] = [
  {
    id: "dancing",
    label: "Dancing Script",
    className: "signature-font-dancing",
    family: '"Dancing Script", cursive',
  },
  {
    id: "vibes",
    label: "Great Vibes",
    className: "signature-font-vibes",
    family: '"Great Vibes", cursive',
  },
  {
    id: "caveat",
    label: "Caveat",
    className: "signature-font-caveat",
    family: '"Caveat", cursive',
  },
  {
    id: "allura",
    label: "Allura",
    className: "signature-font-allura",
    family: '"Allura", cursive',
  },
];

const INK = "#1b2f9e";
const ACCEPTED_TYPES = ["image/png", "image/jpeg"];
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
/** Breathing room kept around the trimmed mark. */
const TRIM_PADDING = 12;
/** Uploaded files are downscaled to this edge before the pixel scan. */
const TRIM_MAX_EDGE = 1200;

type TabId = SignatureDraft["method"];

const TABS: Array<{ id: TabId; label: string; icon: typeof PenLine }> = [
  { id: "draw", label: "Draw", icon: PenLine },
  { id: "type", label: "Type", icon: Type },
  { id: "upload", label: "Upload", icon: Upload },
];

/* ------------------------------------------------------------- rendering */

/** Draws typed text onto a canvas and returns a transparent PNG data URL. */
async function renderTypedSignature(text: string, fontId: string): Promise<string> {
  const font = FONTS.find((entry) => entry.id === fontId) ?? FONTS[0];

  try {
    await document.fonts.load(`64px ${font.family}`);
  } catch {
    // Best effort — the canvas falls back to the generic cursive family.
  }

  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 200;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  let size = 84;
  ctx.font = `${size}px ${font.family}`;
  while (ctx.measureText(text).width > canvas.width - 40 && size > 28) {
    size -= 4;
    ctx.font = `${size}px ${font.family}`;
  }

  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  return canvas.toDataURL("image/png");
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("decode-failed"));
    image.src = source;
  });
}

/**
 * Auto-trim an uploaded mark.
 *
 * The file is decoded onto a canvas, every pixel is scanned for ink (any pixel
 * that is neither fully transparent nor near-white), and only the bounding box
 * of that ink — plus a small padding — is re-exported as a PNG, so the
 * signature's own transparency is preserved instead of a white page block.
 */
async function trimToBoundingBox(dataUrl: string): Promise<string> {
  const image = await loadImage(dataUrl);
  const naturalWidth = image.naturalWidth || image.width;
  const naturalHeight = image.naturalHeight || image.height;
  if (naturalWidth === 0 || naturalHeight === 0) return dataUrl;

  const scale = Math.min(1, TRIM_MAX_EDGE / Math.max(naturalWidth, naturalHeight));
  const width = Math.max(1, Math.round(naturalWidth * scale));
  const height = Math.max(1, Math.round(naturalHeight * scale));

  const source = document.createElement("canvas");
  source.width = width;
  source.height = height;
  const ctx = source.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(image, 0, 0, width, height);

  const { data } = ctx.getImageData(0, 0, width, height);

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const alpha = data[offset + 3];
      if (alpha < 8) continue; // transparent background
      const red = data[offset];
      const green = data[offset + 1];
      const blue = data[offset + 2];
      const isWhitePaper = alpha > 200 && red > 245 && green > 245 && blue > 245;
      if (isWhitePaper) continue;

      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  // Nothing but background: keep the original frame rather than an empty crop.
  if (maxX < 0 || maxY < 0) return dataUrl;

  const cropX = Math.max(0, minX - TRIM_PADDING);
  const cropY = Math.max(0, minY - TRIM_PADDING);
  const cropRight = Math.min(width, maxX + 1 + TRIM_PADDING);
  const cropBottom = Math.min(height, maxY + 1 + TRIM_PADDING);
  const cropWidth = cropRight - cropX;
  const cropHeight = cropBottom - cropY;
  if (cropWidth <= 0 || cropHeight <= 0) return dataUrl;

  const trimmed = document.createElement("canvas");
  trimmed.width = cropWidth;
  trimmed.height = cropHeight;
  const trimmedCtx = trimmed.getContext("2d");
  if (!trimmedCtx) return dataUrl;
  trimmedCtx.drawImage(source, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
  return trimmed.toDataURL("image/png");
}

/* ------------------------------------------------------------------- panes */

type DrawPaneProps = {
  /** Latest transparent PNG of the pad — "" while the pad is blank. */
  onPng: (png: string) => void;
};

/**
 * Owns the pad so `useSignaturePad` sizes its buffer while the canvas is
 * actually laid out (the pane mounts fresh every time DRAW becomes active).
 */
function DrawPane({ onPng }: DrawPaneProps) {
  const { canvasRef, undoDisabled, start, move, end, undo, clear, exportPng } =
    useSignaturePad();

  /** Publishes the pad's current transparent PNG ("" once every stroke is gone). */
  const publish = () => onPng(exportPng());

  return (
    <div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          onPointerDown={(event) => start(event)}
          onPointerMove={(event) => move(event)}
          onPointerUp={(event) => {
            end(event);
            publish();
          }}
          onPointerCancel={(event) => {
            end(event);
            publish();
          }}
          onPointerLeave={(event) => {
            end(event);
            publish();
          }}
          aria-label="Signature drawing area"
          className="h-40 w-full cursor-crosshair touch-none rounded-xl border-2 border-dashed border-cpc-tile-border bg-cpc-section-light/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
        />
        {/* Baseline guide lives in the DOM only, so it never bakes into the PNG. */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <span className="absolute right-4 left-4 top-[72%] border-t border-dashed border-cpc-tile-border" />
          <span className="absolute top-[62%] left-4 font-poppins text-xs text-cpc-muted-blue">
            &#10005;
          </span>
        </div>
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-2">
        <p className="font-poppins text-[10px] text-cpc-heading-soft">
          Use a mouse, finger or stylus to sign above the line.
        </p>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => {
              undo();
              publish();
            }}
            disabled={undoDisabled}
            className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 font-poppins text-[11px] font-semibold text-cpc-heading-soft transition-colors hover:bg-cpc-section-light hover:text-cpc-navy-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent motion-reduce:animate-none disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Undo2 className="h-3 w-3" aria-hidden />
            Undo
          </button>
          <button
            type="button"
            onClick={() => {
              clear();
              publish();
            }}
            className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 font-poppins text-[11px] font-semibold text-cpc-heading-soft transition-colors hover:bg-cpc-section-light hover:text-cpc-navy-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent motion-reduce:animate-none"
          >
            <Eraser className="h-3 w-3" aria-hidden />
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ modal */

type SignaturePadModalProps = {
  open: boolean;
  onClose: () => void;
  signerName: string;
  onUse: (draft: SignatureDraft) => void;
};

/**
 * Signature capture used by ApproveSignModal and SavedSignaturesPanel.
 *
 * (2) draw / type / upload -> transparent base64 PNG -> `onUse(draft)`; the
 * caller either signs with it or files it in the per-staff signature library.
 * The certify checkbox is deliberately NOT here — it belongs to ApproveSignModal.
 */
export function SignaturePadModal({
  open,
  onClose,
  signerName,
  onUse,
}: SignaturePadModalProps) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="signature-pad-title" className="sm:max-w-xl">
      <SignaturePadBody signerName={signerName} onClose={onClose} onUse={onUse} />
    </Modal>
  );
}

type SignaturePadBodyProps = {
  signerName: string;
  onClose: () => void;
  onUse: (draft: SignatureDraft) => void;
};

/** Mounted only while the dialog is open, so every field starts clean. */
function SignaturePadBody({ signerName, onClose, onUse }: SignaturePadBodyProps) {
  const [tab, setTab] = useState<TabId>("draw");
  const [drawPng, setDrawPng] = useState("");
  const [typedName, setTypedName] = useState(signerName);
  const [fontId, setFontId] = useState(FONTS[0].id);
  const [uploadedPng, setUploadedPng] = useState<string | null>(null);
  const [uploadName, setUploadName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [remember, setRemember] = useState(false);
  const [label, setLabel] = useState(`${signerName} — default`);
  const [asDefault, setAsDefault] = useState(true);

  const activeFont = FONTS.find((font) => font.id === fontId) ?? FONTS[0];
  const previewName = typedName.trim() || signerName;

  const switchTab = (next: TabId) => {
    setTab(next);
    setError(null);
    // Returning to DRAW remounts an empty canvas, so drop the stale capture.
    if (next === "draw") setDrawPng("");
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadedPng(null);
      setUploadName("");
      setError("Please choose a PNG or JPG image.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadedPng(null);
      setUploadName("");
      setError("The signature image must be 2 MB or smaller.");
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => setError("We couldn't read that file. Please try another image.");
    reader.onload = async () => {
      const source = typeof reader.result === "string" ? reader.result : "";
      if (!source) {
        setError("We couldn't read that file. Please try another image.");
        return;
      }
      try {
        const trimmed = await trimToBoundingBox(source);
        setUploadedPng(trimmed);
        setUploadName(file.name);
        setError(null);
      } catch {
        setUploadedPng(null);
        setUploadName("");
        setError("That image couldn't be opened. Please try a PNG or JPG.");
      }
    };
    reader.readAsDataURL(file);
  };

  const resolveImage = async (): Promise<string> => {
    if (tab === "draw") return drawPng;
    if (tab === "type") {
      if (!typedName.trim()) return "";
      return renderTypedSignature(previewName, fontId);
    }
    return uploadedPng ?? "";
  };

  const confirm = async () => {
    setError(null);

    if (tab === "draw" && drawPng === "") {
      setError("Draw your signature in the box first.");
      return;
    }
    if (tab === "type" && !typedName.trim()) {
      setError("Type the name you want to sign with.");
      return;
    }
    if (tab === "upload" && !uploadedPng) {
      setError("Upload a PNG or JPG signature image first.");
      return;
    }

    const imageBase64 = await resolveImage();
    if (!imageBase64) {
      setError("We couldn't create the signature image. Please try again.");
      return;
    }

    const draft: SignatureDraft = {
      imageBase64,
      method: tab,
      label: tab === "type" ? previewName : undefined,
      saveAs: remember
        ? { label: label.trim() || `${signerName}'s signature`, isDefault: asDefault }
        : undefined,
    };

    onUse(draft);
    onClose();
  };

  return (
    <div className="p-5 sm:p-6">
      <div className="pr-8">
        <h2
          id="signature-pad-title"
          className="font-poppins text-lg font-semibold text-cpc-navy-text"
        >
          Create your signature
        </h2>
        <p className="mt-1 font-poppins text-xs leading-relaxed text-cpc-heading-soft">
          Sign as {signerName}. The image is stored as a transparent PNG and shown to the student.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Signature method"
        className="mt-4 flex gap-1 rounded-xl bg-cpc-section-light/60 p-1"
      >
        {TABS.map((entry) => {
          const Icon = entry.icon;
          const selected = tab === entry.id;
          return (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => switchTab(entry.id)}
              className={cn(
                "flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 py-2 font-poppins text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent motion-reduce:animate-none",
                selected
                  ? "bg-white text-cpc-blue-accent shadow-sm"
                  : "text-cpc-heading-soft hover:text-cpc-navy-text",
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {entry.label.toUpperCase()}
            </button>
          );
        })}
      </div>

      <div className="mt-3">
        {tab === "draw" && <DrawPane onPng={setDrawPng} />}

        {tab === "type" && (
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
                className="mt-1 w-full rounded-lg border border-cpc-tile-border bg-white px-3 py-2 font-poppins text-sm text-cpc-navy-text outline-none focus-visible:border-cpc-blue-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
              />
            </label>

            <div>
              <span
                id="signature-style-label"
                className="font-poppins text-[11px] font-semibold text-cpc-navy-text"
              >
                Handwriting style
              </span>
              <div
                role="group"
                aria-labelledby="signature-style-label"
                className="mt-1 grid grid-cols-2 gap-1.5 sm:grid-cols-4"
              >
                {FONTS.map((font) => (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => setFontId(font.id)}
                    aria-pressed={font.id === fontId}
                    className={cn(
                      "cursor-pointer rounded-lg border px-2 py-2 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent motion-reduce:animate-none",
                      font.id === fontId
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
                      {previewName}
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
              <p className={cn("mt-1 truncate text-4xl text-cpc-navy", activeFont.className)}>
                {previewName}
              </p>
            </div>
          </div>
        )}

        {tab === "upload" && (
          <div className="space-y-2.5">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-cpc-tile-border bg-cpc-section-light/20 px-4 py-6 text-center transition-colors hover:bg-cpc-section-light/40 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-cpc-blue-accent motion-reduce:animate-none">
              <Upload className="h-5 w-5 text-cpc-blue-accent" aria-hidden />
              <span className="font-poppins text-xs font-semibold text-cpc-navy-text">
                Upload a signature image
              </span>
              <span className="font-poppins text-[10px] text-cpc-heading-soft">
                PNG or JPG, up to 2 MB — whitespace is trimmed automatically
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg"
                aria-label="Signature image file"
                onChange={(event) => {
                  void handleFile(event.target.files?.[0]);
                  event.target.value = "";
                }}
                className="sr-only"
              />
            </label>

            {uploadedPng && (
              <div className="rounded-xl border border-cpc-tile-border bg-cpc-section-light/30 p-2">
                <p className="font-poppins text-[10px] font-semibold tracking-[0.1em] text-cpc-heading-soft uppercase">
                  Trimmed preview
                </p>
                <img
                  src={uploadedPng}
                  alt={`Trimmed signature from ${uploadName || "your upload"}`}
                  className="mx-auto mt-1 h-24 max-w-full object-contain"
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 space-y-2">
        <label className="flex cursor-pointer items-start gap-2 rounded-lg bg-cpc-section-light/40 px-3 py-2">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-pointer accent-cpc-blue-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
          />
          <span className="font-poppins text-[11px] text-cpc-heading-soft">
            Save this signature for next time
          </span>
        </label>

        {remember && (
          <div className="space-y-2 rounded-lg border border-cpc-tile-border/70 bg-white px-3 py-2.5">
            <label className="block">
              <span className="font-poppins text-[11px] font-semibold text-cpc-navy-text">
                Signature label
              </span>
              <input
                type="text"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                maxLength={40}
                placeholder="Formal signature"
                className="mt-1 w-full rounded-lg border border-cpc-tile-border bg-white px-3 py-1.5 font-poppins text-sm text-cpc-navy-text outline-none focus-visible:border-cpc-blue-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
              />
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={asDefault}
                onChange={(event) => setAsDefault(event.target.checked)}
                className="h-3.5 w-3.5 cursor-pointer accent-cpc-blue-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
              />
              <span className="font-poppins text-[11px] text-cpc-heading-soft">Set as default</span>
            </label>
          </div>
        )}
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
          className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-cpc-tile-border bg-white px-4 py-2.5 font-poppins text-sm font-semibold text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent motion-reduce:animate-none"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void confirm()}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-cpc-button px-4 py-2.5 font-poppins text-sm font-semibold text-white transition-colors hover:bg-cpc-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent motion-reduce:animate-none"
        >
          <Sparkles className="h-4 w-4" aria-hidden />
          Use this signature
        </button>
      </div>

      <p className="mt-2 flex items-center justify-center gap-1 font-poppins text-[10px] text-cpc-heading-soft">
        <Check className="h-3 w-3 text-emerald-600" aria-hidden />
        Stored locally in demo mode. A real deployment signs server-side.
      </p>
    </div>
  );
}

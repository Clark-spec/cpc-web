import { useState } from "react";
import { CheckCircle2, Info, Loader2, PenLine, ShieldCheck } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import { OFFICE_LABELS } from "@/components/features/admin/clearance/officeChecks";
import { useClearanceAdmin } from "@/components/features/admin/clearance/ClearanceAdminContext";
import { SignaturePadModal } from "@/components/features/admin/clearance/SignaturePadModal";
import type { ClearanceRequestRow, SignatureDraft } from "@/components/features/admin/clearance/types";

const METHOD_LABELS: Record<SignatureDraft["method"], string> = {
  draw: "Drawn",
  type: "Typed",
  upload: "Uploaded",
};

type Source = "saved" | "new";

type ApproveSignModalProps = {
  row: ClearanceRequestRow | null;
  open: boolean;
  onClose: () => void;
};

/**
 * Approve &amp; Sign dialog.
 *
 * (2) staff -> signature (saved library or draw/type/upload) -> base64 PNG ->
 * `approve()` -> shared localStorage record -> `storage` event -> the student's
 * Online Clearance card renders the image.
 */
export function ApproveSignModal({ row, open, onClose }: ApproveSignModalProps) {
  if (!row) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy="approve-sign-title"
      className="sm:max-w-xl"
    >
      <ApproveSignBody key={row.id} row={row} onClose={onClose} />
    </Modal>
  );
}

function ApproveSignBody({ row, onClose }: { row: ClearanceRequestRow; onClose: () => void }) {
  const { approve, busy, defaultSignature, records, savedSignatures, staff } =
    useClearanceAdmin();

  const [source, setSource] = useState<Source>(() => (defaultSignature ? "saved" : "new"));
  const [savedId, setSavedId] = useState(() => defaultSignature?.id ?? "");
  const [captured, setCaptured] = useState<SignatureDraft | null>(null);
  const [padOpen, setPadOpen] = useState(false);
  const [internalRemarks, setInternalRemarks] = useState("");
  const [certified, setCertified] = useState(false);

  const chosenSaved = savedSignatures.find((signature) => signature.id === savedId) ?? null;
  const effectiveSaved = chosenSaved ?? defaultSignature;

  const draft: SignatureDraft | null =
    source === "saved"
      ? effectiveSaved
        ? {
            imageBase64: effectiveSaved.imageBase64,
            method: effectiveSaved.method,
            label: effectiveSaved.label,
          }
        : null
      : captured;

  const previewImage = draft?.imageBase64 ?? "";

  /** True when signing this row completes all six offices for the student. */
  const record = records.find((entry) => entry.studentId === row.studentId);
  const remainingUnsigned = record
    ? record.offices.filter((office) => office.status !== "signed")
    : [];
  const isFinalSignature =
    Boolean(record) && remainingUnsigned.length === 1 && remainingUnsigned[0].office === row.office;

  const canConfirm = certified && draft !== null && !busy;

  const confirm = async () => {
    if (!draft) return;
    const signed = await approve(row, {
      draft,
      internalRemarks: internalRemarks.trim() || undefined,
    });
    if (signed) onClose();
  };

  return (
    <div className="p-5 sm:p-6">
      <div className="pr-8">
        <h2 id="approve-sign-title" className="font-poppins text-lg font-semibold text-cpc-navy-text">
          Approve &amp; sign
        </h2>
        <p className="mt-1 font-poppins text-xs leading-relaxed text-cpc-heading-soft">
          You are signing as {staff.name}, {OFFICE_LABELS[row.office]}
        </p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border border-cpc-tile-border/70 bg-cpc-section-light/40 p-3 font-poppins sm:grid-cols-5">
        {[
          { label: "Student", value: row.studentName },
          { label: "ID", value: row.studentId },
          { label: "Section", value: row.section },
          { label: "Office", value: OFFICE_LABELS[row.office] },
          { label: "Term", value: `${row.term} Semester` },
        ].map((entry) => (
          <div key={entry.label} className="min-w-0">
            <dt className="text-[10px] font-semibold tracking-[0.08em] text-cpc-heading-soft uppercase">
              {entry.label}
            </dt>
            <dd className="truncate text-xs font-semibold text-cpc-navy-text" title={entry.value}>
              {entry.value}
            </dd>
          </div>
        ))}
      </dl>

      {isFinalSignature && (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 font-poppins text-[11px] leading-relaxed text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          This is the last signature — the student's clearance will be complete.
        </p>
      )}

      <fieldset className="mt-4">
        <legend className="font-poppins text-[11px] font-semibold text-cpc-navy-text">
          Signature source
        </legend>

        <div className="mt-2 space-y-2">
          <div
            className={cn(
              "rounded-2xl border p-3 transition-colors motion-reduce:animate-none",
              source === "saved"
                ? "border-cpc-blue-accent bg-cpc-section-light/60"
                : "border-cpc-tile-border/70 bg-white hover:bg-cpc-section-light/40",
              !defaultSignature && "opacity-60",
            )}
          >
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="radio"
                name="signature-source"
                value="saved"
                checked={source === "saved"}
                disabled={!defaultSignature}
                onChange={() => setSource("saved")}
                className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-cpc-blue-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
              />
              <span className="min-w-0 flex-1">
                <span className="block font-poppins text-xs font-semibold text-cpc-navy-text">
                  Use my saved signature
                </span>
                <span className="mt-0.5 block font-poppins text-[10px] text-cpc-heading-soft">
                  {defaultSignature
                    ? "Fastest option — signs with the signature you saved before."
                    : "No saved signature yet. Create one below or in My signatures."}
                </span>
                {source === "saved" && effectiveSaved && (
                  <span className="mt-2 flex flex-wrap items-center gap-3">
                    <img
                      src={effectiveSaved.imageBase64}
                      alt={`Saved signature: ${effectiveSaved.label}`}
                      className="h-12 max-w-[10rem] rounded-lg border border-cpc-tile-border/70 bg-cpc-section-light/40 object-contain p-1"
                    />
                    <span className="font-poppins text-[10px] text-cpc-heading-soft">
                      {effectiveSaved.label} · {METHOD_LABELS[effectiveSaved.method]}
                    </span>
                  </span>
                )}
              </span>
            </label>

            {source === "saved" && savedSignatures.length > 1 && (
              <div className="mt-2 pl-7">
                <label
                  htmlFor="saved-signature-choice"
                  className="block font-poppins text-[10px] font-semibold text-cpc-navy-text"
                >
                  Choose a different saved signature
                </label>
                <select
                  id="saved-signature-choice"
                  value={effectiveSaved?.id ?? ""}
                  onChange={(event) => setSavedId(event.target.value)}
                  className="mt-1 w-full max-w-xs cursor-pointer rounded-lg border border-cpc-tile-border bg-white px-2 py-1.5 font-poppins text-xs text-cpc-navy-text outline-none focus-visible:border-cpc-blue-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
                >
                  {savedSignatures.map((signature) => (
                    <option key={signature.id} value={signature.id}>
                      {signature.label}
                      {signature.isDefault ? " (default)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div
            className={cn(
              "rounded-2xl border p-3 transition-colors motion-reduce:animate-none",
              source === "new"
                ? "border-cpc-blue-accent bg-cpc-section-light/60"
                : "border-cpc-tile-border/70 bg-white hover:bg-cpc-section-light/40",
            )}
          >
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="radio"
                name="signature-source"
                value="new"
                checked={source === "new"}
                onChange={() => setSource("new")}
                className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-cpc-blue-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
              />
              <span className="min-w-0 flex-1">
                <span className="block font-poppins text-xs font-semibold text-cpc-navy-text">
                  Create new signature
                </span>
                <span className="mt-0.5 block font-poppins text-[10px] text-cpc-heading-soft">
                  Draw, type or upload a signature for this request.
                </span>
                {source === "new" && captured && (
                  <span className="mt-2 flex flex-wrap items-center gap-3">
                    <img
                      src={captured.imageBase64}
                      alt="Captured signature preview"
                      className="h-12 max-w-[10rem] rounded-lg border border-cpc-tile-border/70 bg-cpc-section-light/40 object-contain p-1"
                    />
                    <span className="font-poppins text-[10px] text-cpc-heading-soft">
                      {METHOD_LABELS[captured.method]}
                      {captured.saveAs ? ` · will save as ${captured.saveAs.label}` : ""}
                    </span>
                  </span>
                )}
              </span>
            </label>

            {source === "new" && (
              <div className="mt-2 pl-7">
                <button
                  type="button"
                  onClick={() => setPadOpen(true)}
                  className="cpc-btn cpc-btn-secondary cpc-btn-sm"
                >
                  <PenLine className="h-3.5 w-3.5" aria-hidden />
                  {captured ? "Change signature" : "Draw, type or upload"}
                </button>
              </div>
            )}
          </div>
        </div>
      </fieldset>

      {source === "saved" && previewImage === "" && (
        <p className="mt-2 flex items-start gap-1.5 font-poppins text-[11px] text-rose-700">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          Pick a saved signature, or switch to “Create new signature”.
        </p>
      )}

      <label className="mt-4 block">
        <span className="font-poppins text-[11px] font-semibold text-cpc-navy-text">
          Internal remarks{" "}
          <span className="font-normal text-cpc-heading-soft">
            (optional — not visible to the student)
          </span>
        </span>
        <textarea
          value={internalRemarks}
          onChange={(event) => setInternalRemarks(event.target.value)}
          rows={2}
          maxLength={300}
          placeholder="e.g. Called the student about the fine before signing."
          className="mt-1 w-full resize-y rounded-lg border border-cpc-tile-border bg-white px-3 py-2 font-poppins text-sm text-cpc-navy-text outline-none focus-visible:border-cpc-blue-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
        />
      </label>

      <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-xl bg-cpc-section-light/40 px-3 py-2.5">
        <input
          type="checkbox"
          checked={certified}
          onChange={(event) => setCertified(event.target.checked)}
          className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-pointer accent-cpc-blue-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
        />
        <span className="font-poppins text-[11px] leading-relaxed text-cpc-navy-text">
          I certify that this is my signature and I agree to sign this clearance digitally.
        </span>
      </label>

      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="cpc-btn cpc-btn-secondary"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void confirm()}
          disabled={!canConfirm}
          className="cpc-btn cpc-btn-primary"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <ShieldCheck className="h-4 w-4" aria-hidden />
          )}
          {busy ? "Signing..." : "Confirm & sign"}
        </button>
      </div>

      {!certified && draft !== null && (
        <p className="mt-2 text-center font-poppins text-[10px] text-cpc-heading-soft">
          Tick the certification box to enable signing.
        </p>
      )}

      <SignaturePadModal
        open={padOpen}
        onClose={() => setPadOpen(false)}
        signerName={staff.name}
        onUse={(next) => {
          setCaptured(next);
          setSource("new");
        }}
      />
    </div>
  );
}

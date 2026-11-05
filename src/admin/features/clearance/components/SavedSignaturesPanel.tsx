import { useState } from "react";
import { Plus, Star, Trash2, Pencil, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/admin/components/Modal";
import { cn } from "@/lib/cn";
import { useClearanceAdmin } from "../context/ClearanceAdminContext";
import { SignaturePadModal } from "./SignaturePadModal";
import type { SavedSignature } from "../types";

const METHOD_LABELS: Record<SavedSignature["method"], string> = {
  draw: "Drawn",
  type: "Typed",
  upload: "Uploaded",
};

function formatDate(iso: string): string {
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime())
    ? "Unknown date"
    : parsed.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

type SavedSignaturesPanelProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * The signed-in staff member's own signature library
 * (`cpc:clearance:signatures:{staffId}`) — never another user's signatures.
 */
export function SavedSignaturesPanel({ open, onClose }: SavedSignaturesPanelProps) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="saved-signatures-title" className="sm:max-w-lg">
      <SavedSignaturesBody onClose={onClose} />
    </Modal>
  );
}

function SavedSignaturesBody({ onClose }: { onClose: () => void }) {
  const {
    addSignature,
    defaultSignature,
    deleteSignature,
    makeDefaultSignature,
    renameSignature,
    savedSignatures,
    staff,
  } = useClearanceAdmin();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftLabel, setDraftLabel] = useState("");
  const [pendingDelete, setPendingDelete] = useState<SavedSignature | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [padOpen, setPadOpen] = useState(false);

  const startRename = (signature: SavedSignature) => {
    setEditingId(signature.id);
    setDraftLabel(signature.label);
  };

  const commitRename = async (signature: SavedSignature) => {
    const next = draftLabel.trim();
    setEditingId(null);
    if (next && next !== signature.label) await renameSignature(signature.id, next);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteSignature(pendingDelete.id);
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  return (
    <div className="p-5 sm:p-6">
      <div className="pr-8">
        <h2
          id="saved-signatures-title"
          className="font-poppins text-lg font-semibold text-cpc-navy-text"
        >
          My signatures
        </h2>
        <p className="mt-1 font-poppins text-xs leading-relaxed text-cpc-heading-soft">
          Saved for {staff.name} only. The default one is offered in bulk approve and in every
          Approve &amp; Sign dialog.
        </p>
      </div>

      <div className="mt-4 max-h-[52vh] space-y-2 overflow-y-auto admin-scrollbar">
        {savedSignatures.length === 0 && (
          <div className="rounded-2xl border border-dashed border-cpc-tile-border bg-cpc-section-light/30 px-4 py-8 text-center">
            <UserCheck className="mx-auto h-6 w-6 text-cpc-blue-accent" aria-hidden />
            <p className="mt-2 font-poppins text-xs leading-relaxed text-cpc-heading-soft">
              No saved signatures yet — add one to sign in a single click next time.
            </p>
          </div>
        )}

        {savedSignatures.map((signature) => {
          const isDefault =
            signature.isDefault || defaultSignature?.id === signature.id;
          const editing = editingId === signature.id;

          return (
            <div
              key={signature.id}
              className={cn(
                "flex flex-wrap items-center gap-3 rounded-2xl border p-3 transition-colors motion-reduce:animate-none",
                isDefault
                  ? "border-cpc-blue-accent/70 bg-cpc-section-light/40"
                  : "border-cpc-tile-border/70 bg-white",
              )}
            >
              <img
                src={signature.imageBase64}
                alt={`Signature preview: ${signature.label}`}
                className="h-12 w-24 shrink-0 rounded-lg border border-cpc-tile-border/70 bg-white object-contain p-1"
              />

              <div className="min-w-0 flex-1">
                {editing ? (
                  <input
                    type="text"
                    value={draftLabel}
                    autoFocus
                    maxLength={40}
                    aria-label="New signature label"
                    onChange={(event) => setDraftLabel(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void commitRename(signature);
                      }
                      if (event.key === "Escape") {
                        event.stopPropagation();
                        setEditingId(null);
                      }
                    }}
                    onBlur={() => void commitRename(signature)}
                    className="w-full rounded-lg border border-cpc-tile-border bg-white px-2 py-1 font-poppins text-sm text-cpc-navy-text outline-none focus-visible:border-cpc-blue-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
                  />
                ) : (
                  <p className="truncate font-poppins text-xs font-semibold text-cpc-navy-text">
                    {signature.label}
                  </p>
                )}

                <p className="mt-0.5 flex flex-wrap items-center gap-1.5 font-poppins text-[10px] text-cpc-heading-soft">
                  <Badge tone="info">{METHOD_LABELS[signature.method]}</Badge>
                  <span>{formatDate(signature.createdAt)}</span>
                  {isDefault && (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                      <Star className="h-3 w-3" aria-hidden />
                      Default
                    </span>
                  )}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => startRename(signature)}
                  aria-label={`Rename signature ${signature.label}`}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 font-poppins text-[10px] font-semibold text-cpc-heading-soft transition-colors hover:bg-cpc-section-light hover:text-cpc-navy-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent motion-reduce:animate-none"
                >
                  <Pencil className="h-3 w-3" aria-hidden />
                  Rename
                </button>
                <button
                  type="button"
                  onClick={() => void makeDefaultSignature(signature.id)}
                  disabled={signature.isDefault}
                  aria-label={`Make ${signature.label} the default signature`}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 font-poppins text-[10px] font-semibold text-cpc-heading-soft transition-colors hover:bg-cpc-section-light hover:text-cpc-navy-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent motion-reduce:animate-none disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Star className="h-3 w-3" aria-hidden />
                  Set default
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(signature)}
                  aria-label={`Delete signature ${signature.label}`}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 font-poppins text-[10px] font-semibold text-rose-700 transition-colors hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 motion-reduce:animate-none"
                >
                  <Trash2 className="h-3 w-3" aria-hidden />
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-cpc-tile-border bg-white px-4 py-2.5 font-poppins text-sm font-semibold text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent motion-reduce:animate-none"
        >
          Close
        </button>
        <button
          type="button"
          onClick={() => setPadOpen(true)}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-cpc-button px-4 py-2.5 font-poppins text-sm font-semibold text-white transition-colors hover:bg-cpc-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent motion-reduce:animate-none"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add new signature
        </button>
      </div>

      <SignaturePadModal
        open={padOpen}
        onClose={() => setPadOpen(false)}
        signerName={staff.name}
        onUse={(draft) => {
          void addSignature({
            imageBase64: draft.imageBase64,
            method: draft.method,
            label: draft.saveAs?.label ?? draft.label ?? `${staff.name}'s signature`,
            isDefault: draft.saveAs?.isDefault ?? savedSignatures.length === 0,
          });
        }}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
        title="Delete this signature?"
        description={
          pendingDelete ? (
            <span>
              “{pendingDelete.label}” will no longer be offered when you sign. Requests you already
              signed keep their signature image.
            </span>
          ) : (
            <span />
          )
        }
        confirmLabel="Delete signature"
        cancelLabel="Keep it"
        danger
        busy={deleting}
        id="delete-signature-title"
      />
    </div>
  );
}

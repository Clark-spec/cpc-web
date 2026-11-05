import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CalendarOff,
  CheckCircle2,
  Clock3,
  Loader2,
  RotateCcw,
  Send,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { RequestSignatureModal } from "./RequestSignatureModal";
import { CLEARANCE_CLOSED_MESSAGE, useClearance } from "../context/ClearanceContext";
import { formatDateTime, formatRelativeTime } from "@/utils/format";
import type { OfficeSignature } from "@/types/clearance";

type OfficeSignatureCardProps = {
  office: OfficeSignature;
};

const HANDWRITING = '"Dancing Script", "Segoe Script", cursive';

/**
 * One office tile. The four states mirror the request lifecycle:
 * not_requested → requested → signed | rejected.
 */
export function OfficeSignatureCard({ office }: OfficeSignatureCardProps) {
  const {
    requestSignature,
    cancelRequest,
    highlightedOffice,
    periodOpen,
  } = useClearance();

  const [modalOpen, setModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const cardRef = useRef<HTMLElement | null>(null);

  const signed = office.status === "signed";
  const requested = office.status === "requested";
  const rejected = office.status === "rejected";
  const highlighted = highlightedOffice === office.office;
  const cardId = `office-${office.office}`;
  const titleId = `${cardId}-title`;

  // Clicking a notification scrolls the related card into view and flashes it.
  useEffect(() => {
    if (!highlighted) return;
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlighted]);

  async function handleCancel() {
    if (cancelling) return;
    setCancelling(true);
    try {
      await cancelRequest(office.office);
    } finally {
      setCancelling(false);
    }
  }

  const badge = signed ? (
    <Badge tone="success">
      <CheckCircle2 className="h-3 w-3" aria-hidden />
      Signed
    </Badge>
  ) : requested ? (
    <Badge tone="warning">
      <Clock3 className="h-3 w-3" aria-hidden />
      Awaiting Signature
    </Badge>
  ) : rejected ? (
    <Badge tone="danger">
      <AlertTriangle className="h-3 w-3" aria-hidden />
      Needs Action
    </Badge>
  ) : (
    <Badge tone="neutral">
      <XCircle className="h-3 w-3" aria-hidden />
      Not Requested
    </Badge>
  );

  return (
    <article
      id={cardId}
      ref={cardRef}
      tabIndex={-1}
      aria-labelledby={titleId}
      className={cn(
        "flex min-h-[200px] scroll-mt-28 flex-col rounded-xl border bg-white p-4 shadow-sm outline-none transition-all duration-200 hover:shadow-[0_10px_28px_rgba(27,47,158,0.10)] focus-visible:ring-2 focus-visible:ring-cpc-blue-accent focus-visible:ring-offset-2",
        signed ? "border-emerald-300" : "border-cpc-input-border",
        highlighted && "ring-2 ring-cpc-blue-accent ring-offset-2",
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <h3
          id={titleId}
          className="font-poppins text-sm leading-snug font-semibold text-cpc-navy-text sm:text-[15px]"
        >
          {office.label}
        </h3>
        {badge}
      </header>

      {signed ? (
        <>
          <p className="mt-2 font-poppins text-xs text-cpc-blue-accent">
            Digitally signed · {formatDateTime(office.respondedAt ?? new Date().toISOString())}
          </p>
          {office.signerName && (
            <p className="mt-1 font-poppins text-xs text-cpc-heading-soft">
              Signed by <span className="font-semibold text-cpc-navy-text">{office.signerName}</span>
            </p>
          )}

          {/* The signature image comes from the staff side and is display-only. */}
          <div className="mt-3 flex flex-1 items-center justify-center rounded-lg bg-cpc-section-light/50 p-2">
            {office.signatureImage ? (
              <img
                src={office.signatureImage}
                alt={`${office.signerName ?? office.label} signature`}
                className="max-h-20 w-auto max-w-full object-contain"
              />
            ) : (
              <span
                aria-hidden
                className="text-2xl leading-none text-cpc-navy-text"
                style={{ fontFamily: HANDWRITING }}
              >
                {office.signerName ?? office.label}
              </span>
            )}
          </div>
        </>
      ) : requested ? (
        <div className="mt-3 flex flex-1 flex-col justify-between gap-3">
          <div>
            <p className="font-poppins text-xs text-cpc-heading-soft">
              Requested on {formatDateTime(office.requestedAt ?? new Date().toISOString())}
            </p>
            {office.studentNote && (
              <p className="mt-1.5 rounded-md bg-cpc-section-light/70 px-2 py-1.5 font-poppins text-[11px] leading-relaxed text-cpc-heading-soft">
                Your note: “{office.studentNote}”
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              disabled
              className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-cpc-tile-border bg-cpc-section-light/50 px-3 py-2 font-poppins text-sm font-semibold text-cpc-heading-soft"
            >
              <Send className="h-3.5 w-3.5" aria-hidden />
              Request Sent
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className="inline-flex cursor-pointer items-center justify-center gap-1.5 self-center rounded px-2 py-1 font-poppins text-[11px] font-medium text-cpc-heading-soft underline decoration-dotted underline-offset-2 transition-colors hover:text-rose-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cancelling && <Loader2 className="h-3 w-3 animate-spin" aria-hidden />}
              Cancel Request
            </button>
          </div>
        </div>
      ) : rejected ? (
        <div className="mt-3 flex flex-1 flex-col justify-between gap-3">
          <div
            role="note"
            className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2"
          >
            <p className="flex items-center gap-1.5 font-poppins text-[11px] font-semibold text-rose-700">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
              What needs action?
            </p>
            <p className="mt-1 font-poppins text-xs leading-relaxed text-rose-800">
              {office.remarks ?? "The office needs more information before signing."}
            </p>
            {office.respondedAt && (
              <p className="mt-1 font-poppins text-[10px] text-rose-700/80">
                {formatRelativeTime(office.respondedAt)}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            {!periodOpen && (
              <p className="flex items-center justify-center gap-1.5 font-poppins text-[11px] font-semibold text-cpc-heading-soft">
                <CalendarOff className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {CLEARANCE_CLOSED_MESSAGE}
              </p>
            )}
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              disabled={!periodOpen}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-cpc-navy-text px-3 py-2 font-poppins text-sm font-semibold text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:border-cpc-tile-border disabled:text-cpc-heading-soft disabled:hover:bg-transparent"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              Request Again
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-1 flex-col justify-between gap-3">
          <div>
            <p className="font-poppins text-xs leading-relaxed text-cpc-heading-soft">
              No request sent yet. Ask this office to review and sign your clearance.
            </p>
            {/* (1) The admin's clearance period switch gates every request action. */}
            {!periodOpen && (
              <p className="mt-1.5 flex items-center gap-1.5 font-poppins text-[11px] font-semibold text-cpc-heading-soft">
                <CalendarOff className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {CLEARANCE_CLOSED_MESSAGE}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            disabled={!periodOpen}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-cpc-button px-3 py-2 font-poppins text-sm font-semibold text-white transition-colors hover:bg-cpc-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-cpc-button"
          >
            <Send className="h-3.5 w-3.5" aria-hidden />
            Request Signature
          </button>
        </div>
      )}

      {modalOpen && (
        <RequestSignatureModal
          open
          office={office}
          onClose={() => setModalOpen(false)}
          onSend={(note) => requestSignature(office.office, note)}
        />
      )}
    </article>
  );
}

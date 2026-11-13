import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Award,
  BookOpen,
  CalendarOff,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  GraduationCap,
  Loader2,
  RotateCcw,
  Send,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { showError } from "@/lib/feedback";
import { Badge } from "@/components/ui/badge";
import { RequestSignatureModal } from "@/components/features/student/clearance/RequestSignatureModal";
import { CLEARANCE_CLOSED_MESSAGE, useClearance } from "@/components/features/student/clearance/ClearanceContext";
import { formatDate, formatRelativeTime } from "@/lib/format";
import type { OfficeId, OfficeSignature } from "@/types/clearance";

type OfficeSignatureCardProps = {
  office: OfficeSignature;
};

const HANDWRITING = '"Dancing Script", "Segoe Script", cursive';

const OFFICE_INFO: Record<
  OfficeId,
  { label: string; description: string; icon: LucideIcon }
> = {
  instructor: {
    label: "Instructor",
    description: "Clears subject grades & course responsibilities",
    icon: GraduationCap,
  },
  dean: {
    label: "Dean",
    description: "Validates curriculum requirements & graduation standing",
    icon: Award,
  },
  library: {
    label: "Library",
    description: "Audits borrowed book returns & library clearance",
    icon: BookOpen,
  },
  registrar: {
    label: "Registrar",
    description: "Audits academic records, credentials & prerequisites",
    icon: FileText,
  },
  accounting: {
    label: "Accounting",
    description: "Validates statement of account & remaining fee balances",
    icon: CreditCard,
  },
  sao: {
    label: "SAO / SSG Adviser",
    description: "Verifies mandatory event attendances & index card",
    icon: Users,
  },
};

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

  const info = OFFICE_INFO[office.office] ?? {
    label: office.label,
    description: "Departmental clearance verification",
    icon: FileText,
  };
  const OfficeIcon = info.icon;

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
    } catch {
      showError(
        "Could not cancel request",
        `${office.label} still has this request. Please try again in a moment.`,
      );
    } finally {
      setCancelling(false);
    }
  }

  const badge = signed ? (
    <Badge tone="success" size="sm" className="shadow-2xs">
      Signed
    </Badge>
  ) : requested ? (
    <Badge tone="warning" size="sm" pulse className="shadow-2xs">
      Awaiting
    </Badge>
  ) : rejected ? (
    <Badge tone="danger" size="sm" className="shadow-2xs">
      Needs Action
    </Badge>
  ) : (
    <Badge tone="neutral" size="sm" className="shadow-2xs">
      Not Sent
    </Badge>
  );

  return (
    <article
      id={cardId}
      ref={cardRef}
      tabIndex={-1}
      aria-labelledby={titleId}
      className={cn(
        "group relative flex h-full min-h-[220px] scroll-mt-28 flex-col justify-between rounded-2xl border p-5 shadow-[0_4px_20px_rgba(15,36,104,0.04)] backdrop-blur-md outline-none transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(43,75,209,0.10)] focus-visible:ring-2 focus-visible:ring-cpc-blue-accent focus-visible:ring-offset-2",
        signed
          ? "border-emerald-200/90 bg-white/95"
          : "border-white/80 bg-white/85 hover:border-cpc-blue-accent/30 hover:bg-white",
        highlighted && "ring-2 ring-cpc-blue-accent ring-offset-2",
      )}
    >
      <div>
        {/* Top Header: Icon + Title on left, Badge on right - ZERO OVERLAP */}
        <header className="flex items-center justify-between gap-2.5">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-2xs transition-transform duration-200 group-hover:scale-105",
                signed
                  ? "bg-emerald-50 text-emerald-600"
                  : requested
                    ? "bg-amber-50 text-amber-600"
                    : rejected
                      ? "bg-rose-50 text-rose-600"
                      : "bg-cpc-section-light text-cpc-blue-accent",
              )}
              aria-hidden
            >
              <OfficeIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <h3
                id={titleId}
                className="truncate font-poppins text-sm font-semibold text-cpc-navy-text"
                title={office.label}
              >
                {office.label}
              </h3>
            </div>
          </div>
          <div className="shrink-0">{badge}</div>
        </header>

        <p className="mt-1.5 font-poppins text-[11px] leading-snug text-cpc-heading-soft">
          {info.description}
        </p>

        {signed ? (
          <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/40 p-2.5 backdrop-blur-xs">
            <div className="flex items-center justify-between text-[10.5px]">
              <span className="text-emerald-800 font-medium">
                Signed by <strong className="font-semibold text-emerald-950">{office.signerName}</strong>
              </span>
              <span className="text-emerald-700/80 font-medium text-[10px]">
                {formatDate(office.respondedAt ?? new Date().toISOString())}
              </span>
            </div>

            <div className="mt-2 flex h-14 items-center justify-center rounded-lg border border-emerald-200/50 bg-white/80 p-1.5">
              {office.signatureImage ? (
                <img
                  src={office.signatureImage}
                  alt={`${office.signerName ?? office.label} signature`}
                  className="max-h-12 w-auto max-w-full object-contain"
                />
              ) : (
                <span
                  aria-hidden
                  className="text-xl leading-none text-cpc-navy-text"
                  style={{ fontFamily: HANDWRITING }}
                >
                  {office.signerName ?? office.label}
                </span>
              )}
            </div>
          </div>
        ) : requested ? (
          <div className="mt-3 space-y-2 rounded-xl border border-amber-200/70 bg-amber-50/60 p-2.5 backdrop-blur-xs">
            <div className="flex items-center justify-between text-[10.5px]">
              <span className="font-semibold text-amber-900">Request in review</span>
              <span className="text-amber-700/80 text-[10px]">
                {formatRelativeTime(office.requestedAt ?? new Date().toISOString())}
              </span>
            </div>
            {office.studentNote ? (
              <p className="rounded-lg border border-amber-200/50 bg-white/80 p-2 font-poppins text-[10.5px] italic text-amber-950">
                “{office.studentNote}”
              </p>
            ) : (
              <p className="font-poppins text-[10.5px] text-amber-800/80">
                Waiting for the office staff to verify requirements and sign.
              </p>
            )}
          </div>
        ) : rejected ? (
          <div
            role="note"
            className="mt-3 rounded-xl border border-rose-200 bg-rose-50/80 p-2.5 backdrop-blur-xs"
          >
            <p className="flex items-center gap-1.5 font-poppins text-[11px] font-semibold text-rose-800">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-600" aria-hidden />
              Action Required
            </p>
            <p className="mt-1 font-poppins text-[11px] leading-relaxed text-rose-800">
              {office.remarks ?? "The office needs more information before signing."}
            </p>
            {office.respondedAt && (
              <p className="mt-1 font-poppins text-[10px] text-rose-700/80">
                {formatRelativeTime(office.respondedAt)}
              </p>
            )}
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-dashed border-cpc-tile-border/60 bg-cpc-section-light/50 p-2.5 backdrop-blur-xs">
            <p className="font-poppins text-[11px] font-semibold text-cpc-navy-text">
              Ready for endorsement
            </p>
            <p className="mt-0.5 font-poppins text-[10.5px] leading-snug text-cpc-heading-soft">
              Verify obligations for this department are fulfilled before submitting.
            </p>
          </div>
        )}
      </div>

      <div className="mt-3.5 pt-1">
        {signed ? (
          <div className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200/80 bg-emerald-50/80 py-2 text-center font-poppins text-xs font-semibold text-emerald-700 shadow-2xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
            Endorsement Verified
          </div>
        ) : requested ? (
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              disabled
              className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50/90 py-2 font-poppins text-xs font-semibold text-amber-800 shadow-2xs"
            >
              <Clock3 className="h-3.5 w-3.5 text-amber-600 animate-pulse" aria-hidden />
              Request Submitted
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className="inline-flex cursor-pointer items-center justify-center gap-1.5 self-center rounded px-2 py-0.5 font-poppins text-[10.5px] font-medium text-cpc-heading-soft underline decoration-dotted underline-offset-2 transition-colors hover:text-rose-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cancelling && <Loader2 className="h-3 w-3 animate-spin" aria-hidden />}
              Cancel Request
            </button>
          </div>
        ) : rejected ? (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            disabled={!periodOpen}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-rose-300 bg-white py-2 font-poppins text-xs font-semibold text-rose-700 shadow-xs transition-colors hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            Resubmit Request
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            disabled={!periodOpen}
            className="cpc-btn cpc-btn-primary cpc-btn-sm cpc-btn-block"
          >
            {periodOpen ? (
              <Send className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <CalendarOff className="h-3.5 w-3.5" aria-hidden />
            )}
            {periodOpen ? "Request Signature" : CLEARANCE_CLOSED_MESSAGE}
          </button>
        )}
      </div>

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

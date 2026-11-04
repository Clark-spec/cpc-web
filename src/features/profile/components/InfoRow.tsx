import type { LucideIcon } from "lucide-react";
import { AlertCircle, Lock } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export const profileInputClass =
  "w-full rounded-lg border border-cpc-input-border bg-white px-3 py-2 font-poppins text-sm text-cpc-navy-text shadow-[0_1px_2px_rgba(15,36,104,0.04)] transition-colors placeholder:text-cpc-heading-soft focus:border-cpc-blue-accent focus:ring-2 focus:ring-cpc-blue-accent/25 focus:outline-none aria-[invalid=true]:border-rose-400 aria-[invalid=true]:focus:ring-rose-200 disabled:cursor-not-allowed disabled:bg-cpc-section-light";

type InfoRowProps = {
  icon: LucideIcon;
  label: string;
  /** View-mode value. */
  value?: ReactNode;
  /** Edit-mode control. Supplying children switches the row to edit mode. */
  children?: ReactNode;
  /**
   * Explicit edit-mode flag. Required for read-only rows (they have no
   * children but still need the lock + "Request correction" treatment).
   */
  editing?: boolean;
  htmlFor?: string;
  error?: string;
  required?: boolean;
  readOnly?: boolean;
  /** Shows a "Request correction" link on read-only rows in edit mode. */
  onRequestCorrection?: () => void;
  /** Briefly flashes the row after a save. */
  highlight?: boolean;
  className?: string;
};

function isEmpty(value: ReactNode): boolean {
  return value === undefined || value === null || value === "";
}

/**
 * One aligned information row: fixed icon column, label column, value column.
 * In view mode it renders `<dt>/<dd>` pairs inside the card's `<dl>`; in edit
 * mode it renders a visible `<label>` + the supplied control.
 */
export function InfoRow({
  icon: Icon,
  label,
  value,
  children,
  editing = children !== undefined,
  htmlFor,
  error,
  required = false,
  readOnly = false,
  onRequestCorrection,
  highlight = false,
  className,
}: InfoRowProps) {
  const errorId = htmlFor ? `${htmlFor}-error` : undefined;

  if (!editing) {
    return (
      <div
        className={cn(
          "grid grid-cols-[1.25rem_minmax(0,1fr)] items-start gap-x-3 gap-y-0.5 py-2.5 sm:grid-cols-[1.25rem_8.5rem_minmax(0,1fr)] sm:items-center",
          highlight && "profile-highlight rounded-lg",
          className,
        )}
      >
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-cpc-blue-accent sm:mt-0" aria-hidden />
        <dt className="font-poppins text-[13px] font-semibold text-cpc-navy-text">{label}</dt>
        <dd className="col-start-2 min-w-0 text-[13px] leading-relaxed break-words text-cpc-heading-soft sm:col-start-3 sm:text-sm">
          {isEmpty(value) ? (
            <span className="text-cpc-heading-soft italic">Not provided</span>
          ) : (
            value
          )}
        </dd>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-3 py-2.5",
        highlight && "profile-highlight rounded-lg",
        className,
      )}
    >
      <Icon className="mt-1 h-4 w-4 shrink-0 text-cpc-blue-accent" aria-hidden />

      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <label
            htmlFor={readOnly ? undefined : htmlFor}
            className="font-poppins text-[13px] font-semibold text-cpc-navy-text"
          >
            {label}
            {required && (
              <span className="ml-0.5 text-rose-600" aria-hidden>
                *
              </span>
            )}
            {required && <span className="sr-only"> (required)</span>}
          </label>

          {readOnly && (
            <span
              className="inline-flex items-center gap-1 font-poppins text-[11px] text-cpc-heading-soft"
              title="This information is managed by the Registrar"
            >
              <Lock className="h-3 w-3" aria-hidden />
              Registrar managed
            </span>
          )}
        </div>

        {readOnly ? (
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="min-w-0 flex-1 text-sm leading-relaxed break-words text-cpc-heading-soft">
              {isEmpty(value) ? (
            <span className="text-cpc-heading-soft italic">Not provided</span>
          ) : (
            value
          )}
            </p>
            {onRequestCorrection && (
              <button
                type="button"
                onClick={onRequestCorrection}
                className="shrink-0 cursor-pointer rounded font-poppins text-[11px] font-semibold text-cpc-blue-accent underline underline-offset-2 transition-colors hover:text-cpc-navy-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
              >
                Request correction
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="mt-1">{children}</div>
            {error && (
              <p
                id={errorId}
                className="mt-1 flex items-start gap-1 font-poppins text-[11px] leading-snug text-rose-600"
              >
                <AlertCircle className="mt-px h-3 w-3 shrink-0" aria-hidden />
                {error}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

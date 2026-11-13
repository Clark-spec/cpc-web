import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import {
  registerSuccessModalDispatcher,
  type SuccessModalOptions,
} from "@/lib/feedback";

const SPARKLES = [
  { left: "18%", top: "18%", delay: "0ms", size: 6 },
  { left: "78%", top: "14%", delay: "90ms", size: 5 },
  { left: "86%", top: "52%", delay: "160ms", size: 4 },
  { left: "12%", top: "58%", delay: "60ms", size: 5 },
  { left: "64%", top: "8%", delay: "220ms", size: 4 },
  { left: "32%", top: "6%", delay: "300ms", size: 3 },
];

/**
 * Centered confirmation for major student actions (submitted requests,
 * complaints, completed enrollment). Mounted once by the app providers and
 * opened through `showSuccessModal`.
 */
export function SuccessModalHost() {
  const [options, setOptions] = useState<SuccessModalOptions | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(
    () =>
      registerSuccessModalDispatcher((next) => {
        setOptions(next);
        setOpen(true);
      }),
    [],
  );

  const close = () => setOpen(false);

  const runPrimary = () => {
    const action = options?.primaryAction;
    close();
    action?.onClick();
  };

  return (
    <Modal open={open} onClose={close} labelledBy="cpc-success-title">
      {options && (
        <div className="px-5 pt-9 pb-6 text-center sm:px-7 sm:pt-10">
          <div className="relative mx-auto mb-4 grid h-20 w-20 place-items-center">
            {options.celebrate !== false && (
              <span aria-hidden className="pointer-events-none absolute inset-0">
                {SPARKLES.map((sparkle, index) => (
                  <span
                    key={index}
                    className="cpc-sparkle absolute rounded-full bg-[#F2B84B] opacity-0"
                    style={{
                      left: sparkle.left,
                      top: sparkle.top,
                      width: sparkle.size,
                      height: sparkle.size,
                      animationDelay: sparkle.delay,
                    }}
                  />
                ))}
              </span>
            )}
            <div className="cpc-check-ring grid h-16 w-16 place-items-center rounded-full bg-[#E3F7EE]">
              <svg viewBox="0 0 52 52" className="h-9 w-9" aria-hidden>
                <path
                  className="cpc-check-draw"
                  fill="none"
                  stroke="#1E8A57"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14 27.5l8 8 16-17"
                />
              </svg>
            </div>
          </div>

          <h2
            id="cpc-success-title"
            className="font-poppins text-lg leading-snug font-semibold text-cpc-navy-text"
          >
            {options.title}
          </h2>

          {options.message && (
            <p className="mx-auto mt-1.5 max-w-sm font-poppins text-sm leading-relaxed text-cpc-muted-blue">
              {options.message}
            </p>
          )}

          {options.reference && (
            <div className="mt-4 rounded-xl border border-cpc-input-border bg-cpc-section-light px-4 py-3">
              <p className="font-poppins text-[11px] font-semibold tracking-[0.12em] text-cpc-heading-soft uppercase">
                Reference number
              </p>
              <p className="mt-1 font-mono text-base font-semibold tracking-wide break-all text-cpc-navy-text">
                {options.reference}
              </p>
              {options.meta && (
                <p className="mt-1 font-poppins text-xs text-cpc-muted-blue">{options.meta}</p>
              )}
            </div>
          )}

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
            {options.primaryAction && (
              <button
                type="button"
                onClick={runPrimary}
                className="cpc-btn cpc-btn-primary cpc-btn-block sm:w-auto"
              >
                {options.primaryAction.label}
              </button>
            )}
            <button
              type="button"
              onClick={close}
              className="cpc-btn cpc-btn-secondary cpc-btn-block sm:w-auto"
            >
              {options.secondaryLabel ?? "Close"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

import { useState } from "react";
import { Check, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import {
  CARD_SHELL,
  FIELD_BASE,
  LABEL_BASE,
} from "@/components/features/admin/student-accounts/shared";
import { cn } from "@/lib/cn";

const SESSION_TIMEOUTS = [15, 30, 60, 120, 240];

type SecuritySettings = {
  requirePasswordChange: boolean;
  allowProfileCorrections: boolean;
  sessionTimeout: number;
};

const DEFAULT_SETTINGS: SecuritySettings = {
  requirePasswordChange: true,
  allowProfileCorrections: true,
  sessionTimeout: 30,
};

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-cpc-tile-border/50 py-3 first:pt-0 last:border-b-0">
      <div className="min-w-0">
        <p className="font-poppins text-xs font-semibold text-cpc-navy-text">{label}</p>
        <p className="mt-0.5 font-poppins text-[11px] leading-relaxed text-cpc-heading-soft">
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
          checked ? "bg-cpc-blue-accent" : "bg-slate-300",
        )}
      >
        <span
          className={cn(
            "inline-block h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-[20px]" : "translate-x-[3px]",
          )}
        />
      </button>
    </div>
  );
}

/** Portal-wide login policy card at the bottom of the Account Settings page. */
export function AccountSecurityCard() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SecuritySettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState<SecuritySettings>(DEFAULT_SETTINGS);

  const dirty =
    settings.requirePasswordChange !== saved.requirePasswordChange ||
    settings.allowProfileCorrections !== saved.allowProfileCorrections ||
    settings.sessionTimeout !== saved.sessionTimeout;

  function save() {
    setSaved(settings);
    toast("Account security settings saved.", "success");
  }

  return (
    <section aria-label="Account security settings" className={CARD_SHELL}>
      <div className="flex flex-col gap-3 border-b border-cpc-tile-border/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cpc-section-light text-cpc-blue-accent"
          >
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="font-poppins text-base leading-tight font-bold text-cpc-navy-text">
              Account security settings
            </h2>
            <p className="mt-0.5 font-poppins text-[11px] text-cpc-heading-soft">
              Defaults applied to every student login account.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={!dirty}
          className="inline-flex cursor-pointer items-center justify-center gap-1.5 self-start rounded-lg bg-cpc-button px-3.5 py-2 font-poppins text-xs font-semibold text-white transition-colors hover:bg-cpc-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
        >
          <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Save settings
        </button>
      </div>

      <div className="px-4 py-4 sm:px-6">
        <ToggleRow
          label="Require password change on first login"
          description="New and reset accounts must choose a new password before reaching the student portal."
          checked={settings.requirePasswordChange}
          onChange={(next) =>
            setSettings((prev) => ({ ...prev, requirePasswordChange: next }))
          }
        />
        <ToggleRow
          label="Allow profile correction requests"
          description="Students can submit changes with supporting documents for registrar review."
          checked={settings.allowProfileCorrections}
          onChange={(next) =>
            setSettings((prev) => ({ ...prev, allowProfileCorrections: next }))
          }
        />

        <div className="mt-3 max-w-xs">
          <label htmlFor="session-timeout" className={LABEL_BASE}>
            Session timeout
          </label>
          <select
            id="session-timeout"
            value={settings.sessionTimeout}
            onChange={(event) =>
              setSettings((prev) => ({
                ...prev,
                sessionTimeout: Number(event.target.value),
              }))
            }
            className={cn(FIELD_BASE, "cursor-pointer")}
          >
            {SESSION_TIMEOUTS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} minutes
              </option>
            ))}
          </select>
          <p className="mt-1 font-poppins text-[10px] text-cpc-heading-soft">
            Idle sessions are signed out after this period.
          </p>
        </div>
      </div>
    </section>
  );
}

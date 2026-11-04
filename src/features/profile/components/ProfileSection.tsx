import { useId, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

type ProfileSectionProps = {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  /** Edit mode renders a <fieldset>/<legend> for form semantics. */
  editing?: boolean;
  className?: string;
  actions?: ReactNode;
};

/** Reusable information card: icon + title header, divider, then content. */
export function ProfileSection({
  icon: Icon,
  title,
  children,
  editing = false,
  className,
  actions,
}: ProfileSectionProps) {
  const headingId = useId();

  const header = (
    <div className="flex items-center gap-3 border-b border-cpc-input-border px-5 py-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cpc-section-light text-cpc-blue-accent">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <h2
        id={editing ? undefined : headingId}
        className="min-w-0 flex-1 font-poppins text-base leading-tight font-bold text-cpc-navy-text"
      >
        {title}
      </h2>
      {actions}
    </div>
  );

  const body = <div className="px-5 py-4">{children}</div>;

  const cardClass = cn(
    "rounded-2xl border border-cpc-input-border bg-white shadow-[0_10px_30px_rgba(27,47,158,0.06)]",
    className,
  );

  if (editing) {
    return (
      <fieldset className={cardClass}>
        <legend className="sr-only">{title}</legend>
        {header}
        {body}
      </fieldset>
    );
  }

  return (
    <section aria-labelledby={headingId} className={cardClass}>
      {header}
      {body}
    </section>
  );
}

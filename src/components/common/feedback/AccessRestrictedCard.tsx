import { Link } from "react-router";
import { ArrowLeft, ShieldAlert } from "lucide-react";

type AccessRestrictedCardProps = {
  moduleTitle: string;
  description: string;
};

/**
 * Clean access restriction card presented when an authenticated staff account
 * navigates directly to a route outside their authorized role scope.
 */
export function AccessRestrictedCard({
  moduleTitle,
  description,
}: AccessRestrictedCardProps) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center rounded-2xl border border-cpc-tile-border/70 bg-white px-6 py-14 text-center shadow-[0_18px_50px_rgba(15,36,104,0.12)]">
      <span
        aria-hidden
        className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600"
      >
        <ShieldAlert className="h-6 w-6" />
      </span>
      <h1 className="mt-4 font-poppins text-lg font-bold text-cpc-navy-text">
        You don&apos;t have access to {moduleTitle}
      </h1>
      <p className="mt-2 max-w-sm font-poppins text-xs leading-relaxed text-cpc-heading-soft">
        {description}
      </p>
      <Link to="/admin/dashboard" className="cpc-btn cpc-btn-primary cpc-btn-sm mt-6">
        <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Back to dashboard
      </Link>
    </div>
  );
}

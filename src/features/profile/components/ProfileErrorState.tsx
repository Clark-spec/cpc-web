import { CircleAlert, RefreshCw } from "lucide-react";

type ProfileErrorStateProps = {
  error: string | null;
  onRetry: () => void;
};

/** Shown when the profile request fails, with a retry action. */
export function ProfileErrorState({ error, onRetry }: ProfileErrorStateProps) {
  return (
    <section
      role="alert"
      className="rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-[0_10px_30px_rgba(27,47,158,0.06)] sm:p-10"
    >
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
        <CircleAlert className="h-6 w-6" aria-hidden />
      </span>
      <h1 className="mt-4 font-poppins text-xl font-bold text-cpc-navy-text">
        We couldn't load your profile
      </h1>
      <p className="mx-auto mt-2 max-w-md font-poppins text-sm leading-relaxed text-cpc-heading-soft">
        {error ?? "Please check your connection and try again."}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-cpc-navy px-5 py-2.5 font-poppins text-sm font-semibold text-white transition-colors hover:bg-cpc-navy-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
      >
        <RefreshCw className="h-4 w-4" aria-hidden />
        Retry
      </button>
    </section>
  );
}

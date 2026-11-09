import { AlertCircle, RefreshCw } from "lucide-react";

type ErrorCardProps = {
  message?: string;
  onRetry: () => void;
  className?: string;
};

export function ErrorCard({ message, onRetry, className }: ErrorCardProps) {
  return (
    <div
      role="alert"
      className={
        className ??
        "rounded-2xl border border-rose-200 bg-rose-50/70 p-5"
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" aria-hidden />
          <div>
            <p className="font-poppins text-sm font-semibold text-rose-800">
              Something went wrong
            </p>
            <p className="mt-0.5 font-poppins text-xs leading-relaxed text-rose-700">
              {message ?? "We couldn't load this section. Please try again."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-rose-300 bg-white px-3.5 py-2 font-poppins text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          Retry
        </button>
      </div>
    </div>
  );
}

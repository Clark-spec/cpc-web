type NoticeBannerProps = {
  kind: "success" | "error";
  message: string;
  onDismiss: () => void;
};

export function NoticeBanner({ kind, message, onDismiss }: NoticeBannerProps) {
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={
        kind === "success"
          ? "mb-5 flex items-start justify-between gap-3 rounded-lg border border-[#C4EBD9] bg-[#E9F9F1] px-4 py-3"
          : "mb-5 flex items-start justify-between gap-3 rounded-lg border border-[#F8CBCB] bg-[#FDECEC] px-4 py-3"
      }
    >
      <p
        className={
          kind === "success"
            ? "font-poppins text-[12px] leading-[18px] text-[#1E8A57]"
            : "font-poppins text-[12px] leading-[18px] text-[#C53030]"
        }
      >
        {message}
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss message"
        className={
          kind === "success"
            ? "shrink-0 rounded-md px-1.5 py-0.5 font-poppins text-[11px] font-semibold text-[#1E8A57] hover:bg-[#D6F3E5]"
            : "shrink-0 rounded-md px-1.5 py-0.5 font-poppins text-[11px] font-semibold text-[#C53030] hover:bg-[#FADADA]"
        }
      >
        Dismiss
      </button>
    </div>
  );
}

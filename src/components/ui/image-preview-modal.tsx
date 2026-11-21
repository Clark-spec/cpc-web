import { useId, type ReactNode } from "react";
import { Modal } from "@/components/ui/modal";

type ImagePreviewModalProps = {
  open: boolean;
  onClose: () => void;
  src: string;
  alt: string;
  title?: string;
  meta?: ReactNode;
};

/** Full-size view for a photo chosen with an upload or camera capture button. */
export function ImagePreviewModal({
  open,
  onClose,
  src,
  alt,
  title = "View photo",
  meta,
}: ImagePreviewModalProps) {
  const titleId = useId();

  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId} className="sm:max-w-3xl">
      <div className="p-4 sm:p-5">
        <div className="pr-8">
          <h2
            id={titleId}
            className="font-poppins text-base font-bold text-cpc-navy-text"
          >
            {title}
          </h2>
          {meta && (
            <div className="mt-0.5 font-poppins text-[11px] text-cpc-heading-soft">{meta}</div>
          )}
        </div>
        <div className="mt-3 flex items-center justify-center overflow-hidden rounded-xl bg-cpc-section-light/70">
          <img src={src} alt={alt} className="max-h-[70vh] w-full object-contain" />
        </div>
      </div>
    </Modal>
  );
}

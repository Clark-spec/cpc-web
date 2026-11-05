import { useEffect, useRef } from "react";
import { NoticeBanner } from "./NoticeBanner";
import type { ServiceRequestsPage } from "../hooks/useServiceRequests";

type ServiceRequestNoticeProps = {
  notice: ServiceRequestsPage["notice"];
  onDismiss: () => void;
};

/** Submission feedback above the cards, scrolled into view when it appears. */
export function ServiceRequestNotice({ notice, onDismiss }: ServiceRequestNoticeProps) {
  const noticeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (notice) {
      noticeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [notice]);

  if (!notice) return null;

  return (
    <div ref={noticeRef}>
      <NoticeBanner kind={notice.kind} message={notice.message} onDismiss={onDismiss} />
    </div>
  );
}

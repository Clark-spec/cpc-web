import type { ReactNode } from "react";

/** Centered enrollment column used by the status and confirmation pages. */
export function EnrollContent({ children }: { children: ReactNode }) {
  return (
    <div className="enroll-layout">
      <div className="enroll-content max-w-4xl mx-auto px-4 py-8 space-y-8">{children}</div>
    </div>
  );
}

import type { ReactNode } from "react";

/** Centered enrollment column used by the status and confirmation pages. */
export function EnrollContent({ children }: { children: ReactNode }) {
  return (
    <div className="enroll-layout">
      <div className="enroll-content py-8 space-y-8">{children}</div>
    </div>
  );
}

import type { ReactNode } from "react";
import { PortalFooter } from "@/components/common/portal-footer";
import { PortalHeader } from "@/components/common/portal-header";

type LayoutProps = {
  children: ReactNode;
  /** Render the shared portal footer. Defaults to true. */
  showFooter?: boolean;
  /** Optional page-specific notification control for the top bar. */
  bell?: ReactNode;
};

/**
 * Shared student-portal page shell: top location bar + navbar, a flexible
 * main area, then the footer. `min-h-screen flex flex-col` keeps the footer at
 * the bottom even when a page has very little content.
 */
export function Layout({ children, showFooter = true, bell }: LayoutProps) {
  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-white font-poppins">
      <PortalHeader bell={bell} />
      <main className="flex-1">{children}</main>
      {showFooter && <PortalFooter />}
    </div>
  );
}

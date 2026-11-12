import { useState } from "react";
import { PortalFooter } from "@/components/common/layout/PortalFooter";
import { PortalHeader } from "@/components/common/layout/PortalHeader";
import { ServiceRequestDialog } from "@/components/features/student/service-requests/ServiceRequestDialog";
import { ServiceRequestsHero } from "@/components/features/student/service-requests/ServiceRequestsHero";
import { ServiceRequestsMain } from "@/components/features/student/service-requests/ServiceRequestsMain";
import { useServiceRequestsPage } from "@/components/features/student/service-requests/useServiceRequests";
import type { RequestId } from "@/services/serviceRequests/types";

/** Route: /student/service-requests */
export default function ServiceRequestsPage() {
  const page = useServiceRequestsPage();
  const [viewRequestId, setViewRequestId] = useState<RequestId | null>(null);

  return (
    <div className="w-full overflow-x-clip bg-white font-poppins">
      <PortalHeader />

      <ServiceRequestsHero />

      <ServiceRequestsMain page={page} onViewRequest={setViewRequestId} />

      <PortalFooter />

      <ServiceRequestDialog
        requestId={viewRequestId}
        onClose={() => setViewRequestId(null)}
      />
    </div>
  );
}

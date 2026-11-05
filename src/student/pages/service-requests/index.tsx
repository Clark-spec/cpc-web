import { useState } from "react";
import { PortalFooter } from "@/components/ui/student/PortalFooter";
import { PortalHeader } from "@/components/ui/student/PortalHeader";
import { ServiceRequestDialog } from "@/components/features/student/service-requests/components/ServiceRequestDialog";
import { ServiceRequestsHero } from "@/components/features/student/service-requests/components/ServiceRequestsHero";
import { ServiceRequestsMain } from "@/components/features/student/service-requests/components/ServiceRequestsMain";
import { useServiceRequestsPage } from "@/components/features/student/service-requests/hooks/useServiceRequests";

/** Route: /student/service-requests */
export default function ServiceRequestsPage() {
  const page = useServiceRequestsPage();
  const [viewRequestId, setViewRequestId] = useState<number | null>(null);

  return (
    <div className="w-full overflow-x-hidden bg-white font-poppins">
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

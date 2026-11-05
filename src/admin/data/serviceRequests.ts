/**
 * Frontend-only sample data for the admin Service Request dashboard.
 *
 * The records are illustrative, never presented as saved institutional data,
 * and live entirely in component state. Keeping them here lets the UI be wired
 * to the real service-request API later without touching the components.
 */

export type AdminServiceRequestStatus =
  | "pending"
  | "processing"
  | "ready-for-pickup"
  | "completed"
  | "rejected";

export type ServicePaymentStatus = "verified" | "pending" | "not-applicable";

export type ServiceCategory =
  | "Transcript of Records"
  | "Certificates"
  | "ID Replacement"
  | "Good Moral Certificate"
  | "Certificate of Enrollment";

export type ServiceChannel = "online" | "kiosk" | "walk-in";

export type ServiceRequestRequirement = {
  label: string;
  submitted: boolean;
};

export type AdminServiceRequest = {
  id: string;
  studentName: string;
  studentNumber: string;
  service: string;
  category: ServiceCategory;
  pickupMethod: string;
  submittedAt: string;
  paymentStatus: ServicePaymentStatus;
  status: AdminServiceRequestStatus;
  channel: ServiceChannel;
  kioskTicket?: string;
  completedAt?: string;
  /** Flags a stalled queue item for the registrar's attention. */
  overdue?: boolean;
  notes: string;
  requirements: ServiceRequestRequirement[];
};

export const SERVICE_STATUS_LABELS: Record<AdminServiceRequestStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  "ready-for-pickup": "Ready for Pickup",
  completed: "Completed",
  rejected: "Rejected",
};

export const SERVICE_PAYMENT_LABELS: Record<ServicePaymentStatus, string> = {
  verified: "Payment Verified",
  pending: "Pending Payment",
  "not-applicable": "Not Applicable",
};

export const SERVICE_STATUS_ORDER: AdminServiceRequestStatus[] = [
  "pending",
  "processing",
  "ready-for-pickup",
  "completed",
  "rejected",
];

export const SERVICE_CATEGORY_OPTIONS: ServiceCategory[] = [
  "Certificates",
  "Transcript of Records",
  "ID Replacement",
  "Good Moral Certificate",
  "Certificate of Enrollment",
];

/** All catalog options shown by the category filter. */
export const SERVICE_CATEGORY_FILTERS: ServiceCategory[] = [
  ...SERVICE_CATEGORY_OPTIONS,
];

type ServiceRequestSeed = Omit<AdminServiceRequest, "requirements">;

function todayAt(hours: number, minutes: number): string {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

function daysAgo(days: number, hours = 9, minutes = 0): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

/** Requirements follow the payment state: unpaid requests still owe a receipt. */
function buildRequirements(payment: ServicePaymentStatus): ServiceRequestRequirement[] {
  const requirements: ServiceRequestRequirement[] = [
    { label: "Student ID (front and back)", submitted: true },
    { label: "Signed request form", submitted: true },
  ];

  if (payment === "verified") {
    requirements.push({ label: "Proof of payment", submitted: true });
  } else if (payment === "pending") {
    requirements.push({ label: "Proof of payment", submitted: false });
  }

  return requirements;
}

const SEED_REQUESTS: ServiceRequestSeed[] = [
  {
    id: "REQ-2026-0310",
    studentName: "Maria Santos",
    studentNumber: "STU-2026-0231",
    service: "Transcript of Records (TOR)",
    category: "Transcript of Records",
    pickupMethod: "Basic Pickup - Window 2",
    submittedAt: "2026-10-09T08:30:00",
    paymentStatus: "verified",
    status: "processing",
    channel: "online",
    notes: "For employment abroad. Please include the second-semester grades.",
    overdue: false,
  },
  {
    id: "REQ-2026-0311",
    studentName: "Juan Dela Cruz",
    studentNumber: "STU-2026-0148",
    service: "ID Replacement & Smart Card",
    category: "ID Replacement",
    pickupMethod: "Basic Pickup - Window 1",
    submittedAt: "2026-10-09T09:10:00",
    paymentStatus: "verified",
    status: "processing",
    channel: "walk-in",
    notes: "Reported a damaged ID card. Replacement fee already paid.",
  },
  {
    id: "REQ-2026-0312",
    studentName: "Angelica Nicole Reyes",
    studentNumber: "STU-2026-0207",
    service: "Good Moral Certificate",
    category: "Good Moral Certificate",
    pickupMethod: "Basic Pickup - Window 3",
    submittedAt: "2026-10-09T09:45:00",
    paymentStatus: "not-applicable",
    status: "ready-for-pickup",
    channel: "online",
    notes: "Requested for a scholarship application. No fee required.",
  },
  {
    id: "REQ-2026-0313",
    studentName: "Christian Sumalinog",
    studentNumber: "STU-2026-0119",
    service: "Certificate of Registration (COR)",
    category: "Certificates",
    pickupMethod: "Courier / Lalamove Delivery",
    submittedAt: "2026-10-09T10:05:00",
    paymentStatus: "pending",
    status: "processing",
    channel: "online",
    notes: "Deliver to the address on file. Awaiting courier payment confirmation.",
  },
  {
    id: "REQ-2026-0314",
    studentName: "Kyla Nicole Ybañez",
    studentNumber: "STU-2026-0244",
    service: "Transcript of Records (TOR)",
    category: "Transcript of Records",
    pickupMethod: "Basic Pickup - Window 2",
    submittedAt: "2026-10-09T13:20:00",
    paymentStatus: "verified",
    status: "completed",
    channel: "online",
    completedAt: "2026-10-09T15:40:00",
    notes: "One copy released to the student's authorized representative.",
  },
  {
    id: "REQ-2026-0315",
    studentName: "Mark Lester Pacana",
    studentNumber: "STU-2026-0163",
    service: "Certified True Copy of Grades",
    category: "Certificates",
    pickupMethod: "Basic Pickup - Window 2",
    submittedAt: "2026-10-09T11:30:00",
    paymentStatus: "verified",
    status: "processing",
    channel: "walk-in",
    notes: "Covering the first semester of AY 2026–2027.",
  },
  {
    id: "REQ-2026-0316",
    studentName: "Jessa Mae Bentulan",
    studentNumber: "STU-2026-0195",
    service: "ID Replacement & Smart Card",
    category: "ID Replacement",
    pickupMethod: "Basic Pickup - Window 1",
    submittedAt: "2026-10-09T07:45:00",
    paymentStatus: "pending",
    status: "rejected",
    channel: "online",
    notes: "Returned: the uploaded ID photo is blurry and the payment receipt is missing.",
  },
  {
    id: "REQ-2026-0317",
    studentName: "Dave Anthony Dico",
    studentNumber: "STU-2026-0228",
    service: "Certificate of Enrollment",
    category: "Certificate of Enrollment",
    pickupMethod: "Courier / Lalamove Delivery",
    submittedAt: "2026-10-09T13:10:00",
    paymentStatus: "verified",
    status: "processing",
    channel: "online",
    notes: "For a bank education loan. Delivery address confirmed.",
  },
  {
    id: "REQ-2026-0318",
    studentName: "Lea Mae Villanueva",
    studentNumber: "STU-2026-0124",
    service: "Certificate of Enrollment",
    category: "Certificate of Enrollment",
    pickupMethod: "Basic Pickup - Window 2",
    submittedAt: todayAt(8, 10),
    paymentStatus: "verified",
    status: "pending",
    channel: "online",
    notes: "Requested for a dependent's scholarship requirement.",
  },
  {
    id: "REQ-2026-0319",
    studentName: "Aaron Paul Mercado",
    studentNumber: "STU-2026-0256",
    service: "Transcript of Records (TOR)",
    category: "Transcript of Records",
    pickupMethod: "Basic Pickup - Window 2",
    submittedAt: todayAt(8, 35),
    paymentStatus: "verified",
    status: "processing",
    channel: "online",
    notes: "Three copies requested for board examination requirements.",
  },
  {
    id: "REQ-2026-0320",
    studentName: "Trisha Anne Lim",
    studentNumber: "STU-2026-0182",
    service: "Good Moral Certificate",
    category: "Good Moral Certificate",
    pickupMethod: "Basic Pickup - Window 3",
    submittedAt: todayAt(8, 55),
    paymentStatus: "not-applicable",
    status: "ready-for-pickup",
    channel: "walk-in",
    notes: "Certificate is signed and waiting at Window 3.",
  },
  {
    id: "REQ-2026-0321",
    studentName: "Ryan Christopher Go",
    studentNumber: "STU-2026-0271",
    service: "ID Replacement & Smart Card",
    category: "ID Replacement",
    pickupMethod: "Kiosk - Window 1",
    submittedAt: todayAt(9, 5),
    paymentStatus: "pending",
    status: "pending",
    channel: "kiosk",
    kioskTicket: "K-021",
    notes: "Kiosk walk-up. Waiting for the cashier to confirm the replacement fee.",
  },
  {
    id: "REQ-2026-0322",
    studentName: "Nicole Andrea Tan",
    studentNumber: "STU-2026-0137",
    service: "Transcript of Records (TOR)",
    category: "Transcript of Records",
    pickupMethod: "Kiosk - Window 2",
    submittedAt: todayAt(9, 30),
    paymentStatus: "verified",
    status: "processing",
    channel: "kiosk",
    kioskTicket: "K-022",
    notes: "Kiosk request. Payment verified at the cashier window.",
  },
  {
    id: "REQ-2026-0323",
    studentName: "John Paul Rivera",
    studentNumber: "STU-2026-0293",
    service: "Certificate of Grades",
    category: "Certificates",
    pickupMethod: "Basic Pickup - Window 3",
    submittedAt: todayAt(9, 50),
    paymentStatus: "verified",
    status: "completed",
    channel: "online",
    completedAt: todayAt(12, 15),
    notes: "Released to the student at Window 3.",
  },
  {
    id: "REQ-2026-0324",
    studentName: "Hannah Grace Flores",
    studentNumber: "STU-2026-0149",
    service: "Honorable Dismissal",
    category: "Certificates",
    pickupMethod: "Courier / Lalamove Delivery",
    submittedAt: todayAt(10, 10),
    paymentStatus: "verified",
    status: "pending",
    channel: "kiosk",
    kioskTicket: "K-023",
    notes: "Transferring to another institution. Courier details pending.",
  },
  {
    id: "REQ-2026-0325",
    studentName: "Kevin James Ramos",
    studentNumber: "STU-2026-0268",
    service: "Certificate of Graduation",
    category: "Certificates",
    pickupMethod: "Basic Pickup - Window 3",
    submittedAt: todayAt(10, 25),
    paymentStatus: "verified",
    status: "completed",
    channel: "online",
    completedAt: todayAt(13, 5),
    notes: "Claimed by the student after the graduation clearance check.",
  },
  {
    id: "REQ-2026-0326",
    studentName: "Angelica Marie Cruz",
    studentNumber: "STU-2026-0171",
    service: "Certificate of Enrollment",
    category: "Certificate of Enrollment",
    pickupMethod: "Kiosk - Window 2",
    submittedAt: todayAt(10, 45),
    paymentStatus: "not-applicable",
    status: "processing",
    channel: "kiosk",
    kioskTicket: "K-024",
    notes: "Kiosk request. No fee required for the enrollment certificate.",
  },
  {
    id: "REQ-2026-0327",
    studentName: "Jerome Patrick Uy",
    studentNumber: "STU-2026-0284",
    service: "Transcript of Records (TOR)",
    category: "Transcript of Records",
    pickupMethod: "Courier / Lalamove Delivery",
    submittedAt: todayAt(11, 5),
    paymentStatus: "pending",
    status: "pending",
    channel: "online",
    notes: "Waiting for the courier fee before the request can be processed.",
  },
  {
    id: "REQ-2026-0328",
    studentName: "Shaira Mae Delos Santos",
    studentNumber: "STU-2026-0156",
    service: "Good Moral Certificate",
    category: "Good Moral Certificate",
    pickupMethod: "Basic Pickup - Window 3",
    submittedAt: todayAt(11, 25),
    paymentStatus: "verified",
    status: "ready-for-pickup",
    channel: "walk-in",
    notes: "Reserved for pickup until the end of the week.",
  },
  {
    id: "REQ-2026-0329",
    studentName: "Mark Anthony Lopez",
    studentNumber: "STU-2026-0219",
    service: "ID Replacement & Smart Card",
    category: "ID Replacement",
    pickupMethod: "Basic Pickup - Window 1",
    submittedAt: todayAt(11, 40),
    paymentStatus: "verified",
    status: "completed",
    channel: "online",
    completedAt: todayAt(14, 20),
    notes: "Replacement smart card released at Window 1.",
  },
  {
    id: "REQ-2026-0330",
    studentName: "Danica Rose Bautista",
    studentNumber: "STU-2026-0188",
    service: "Certified True Copy of Grades",
    category: "Certificates",
    pickupMethod: "Basic Pickup - Window 2",
    submittedAt: todayAt(12, 10),
    paymentStatus: "verified",
    status: "pending",
    channel: "online",
    notes: "For a graduate school application. Needs the registrar's signature.",
  },
  {
    id: "REQ-2026-0331",
    studentName: "Carlo Miguel Fernandez",
    studentNumber: "STU-2026-0236",
    service: "Transcript of Records (TOR)",
    category: "Transcript of Records",
    pickupMethod: "Basic Pickup - Window 2",
    submittedAt: daysAgo(1, 9, 15),
    paymentStatus: "verified",
    status: "processing",
    channel: "online",
    overdue: true,
    notes: "Escalated: the record review has exceeded the three-day target.",
  },
  {
    id: "REQ-2026-0332",
    studentName: "Jasmine Kaye Aquino",
    studentNumber: "STU-2026-0112",
    service: "Certificate of Registration (COR)",
    category: "Certificates",
    pickupMethod: "Courier / Lalamove Delivery",
    submittedAt: daysAgo(1, 14, 0),
    paymentStatus: "pending",
    status: "rejected",
    channel: "online",
    notes: "Returned: no proof of payment was attached to the delivery request.",
  },
  {
    id: "REQ-2026-0333",
    studentName: "Paul Vincent Castillo",
    studentNumber: "STU-2026-0275",
    service: "Certificate of Enrollment",
    category: "Certificate of Enrollment",
    pickupMethod: "Basic Pickup - Window 2",
    submittedAt: daysAgo(2, 10, 30),
    paymentStatus: "verified",
    status: "processing",
    channel: "walk-in",
    overdue: true,
    notes: "Waiting for the program chair's confirmation of enrollment status.",
  },
  {
    id: "REQ-2026-0334",
    studentName: "Rowena Mae Salazar",
    studentNumber: "STU-2026-0164",
    service: "Good Moral Certificate",
    category: "Good Moral Certificate",
    pickupMethod: "Kiosk - Window 3",
    submittedAt: daysAgo(2, 13, 45),
    paymentStatus: "not-applicable",
    status: "processing",
    channel: "kiosk",
    kioskTicket: "K-019",
    notes: "Kiosk request. Awaiting the adviser's signature.",
  },
  {
    id: "REQ-2026-0335",
    studentName: "Adrian James Mendoza",
    studentNumber: "STU-2026-0257",
    service: "ID Replacement & Smart Card",
    category: "ID Replacement",
    pickupMethod: "Basic Pickup - Window 1",
    submittedAt: daysAgo(3, 8, 20),
    paymentStatus: "verified",
    status: "pending",
    channel: "online",
    notes: "Photo verification still pending from the student.",
  },
];

/** Fresh copy for local state; safe to mutate through `setState`. */
export function buildSampleServiceRequests(): AdminServiceRequest[] {
  return SEED_REQUESTS.map((request) => ({
    ...request,
    requirements: buildRequirements(request.paymentStatus),
  }));
}

export function isSameDay(value: string, reference = new Date()): boolean {
  const date = new Date(value);
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
}

export function getServiceRequestCounts(requests: AdminServiceRequest[]) {
  const today = new Date();
  const pending = requests.filter((request) => request.status === "pending");
  const processing = requests.filter((request) => request.status === "processing");
  const readyForPickup = requests.filter((request) => request.status === "ready-for-pickup");
  const completed = requests.filter((request) => request.status === "completed");
  const rejected = requests.filter((request) => request.status === "rejected");

  return {
    pending: pending.length,
    processing: processing.length,
    readyForPickup: readyForPickup.length,
    completed: completed.length,
    rejected: rejected.length,
    pendingToday: pending.filter((request) => isSameDay(request.submittedAt, today)).length,
    completedToday: completed.filter(
      (request) => request.completedAt && isSameDay(request.completedAt, today),
    ).length,
    activeKiosk: requests.filter(
      (request) =>
        request.channel === "kiosk" &&
        request.status !== "completed" &&
        request.status !== "rejected",
    ).length,
    kioskToday: requests.filter(
      (request) => request.channel === "kiosk" && isSameDay(request.submittedAt, today),
    ).length,
  };
}

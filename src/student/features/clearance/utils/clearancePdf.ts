import { jsPDF } from "jspdf";
import type { OfficeSignature, StudentProfile } from "@/shared/clearance/types";
import { formatDate, formatDateTime } from "@/shared/clearance/utils/format";

type SlipOptions = {
  student: StudentProfile;
  offices: OfficeSignature[];
  referenceNumber: string;
  dateCleared: string;
  academicYear?: string;
  semester?: string;
  /** Adds a "history copy" note to the footer. */
  historical?: boolean;
};

const NAVY: [number, number, number] = [11, 42, 123];
const INK: [number, number, number] = [27, 47, 158];
const MUTED: [number, number, number] = [91, 105, 160];
const LIGHT: [number, number, number] = [238, 243, 255];
const GREEN: [number, number, number] = [22, 128, 88];

/**
 * Builds the confirmation slip. Office signature images arrive from the staff
 * side as data URLs, so jsPDF embeds them directly with `addImage`.
 */
export function downloadClearanceSlip({
  student,
  offices,
  referenceNumber,
  dateCleared,
  academicYear = student.academicYear,
  semester = student.semester,
  historical = false,
}: SlipOptions): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // --- Header band ---------------------------------------------------------
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Republic of the Philippines", margin, 12);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("CORDOVA PUBLIC COLLEGE", margin, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Gabi, Cordova, Cebu", margin, 26);

  doc.setFontSize(7.5);
  doc.text("OFFICIAL CLEARANCE CONFIRMATION", margin, 34);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(referenceNumber, pageWidth - margin, 20, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Reference No.", pageWidth - margin, 26, { align: "right" });

  // --- Student details -----------------------------------------------------
  let y = 52;
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("STUDENT'S CLEARANCE", margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`${semester}, A.Y. ${academicYear}`, pageWidth - margin, y, { align: "right" });

  y += 6;
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageWidth - margin, y);

  y += 9;
  const details: Array<[string, string]> = [
    ["Student name", student.name],
    ["Student I.D.", student.studentId],
    ["Course", student.course],
    ["Year level", student.yearLevel],
    ["Term", `${semester}, A.Y. ${academicYear}`],
    ["Date cleared", formatDate(dateCleared)],
    ["Status", "CLEARED"],
  ];

  doc.setFontSize(9);
  details.forEach(([label, value], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = margin + column * (contentWidth / 2);
    const rowY = y + row * 9;

    doc.setTextColor(...MUTED);
    doc.setFont("helvetica", "normal");
    doc.text(label, x, rowY);

    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.text(value, x + 30, rowY);
  });

  y += Math.ceil(details.length / 2) * 9 + 6;

  // --- Office signatures table --------------------------------------------
  const columns = {
    office: margin + 3,
    status: margin + 40,
    date: margin + 66,
    signer: margin + 97,
    signature: pageWidth - margin - 38,
  };

  doc.setFillColor(...LIGHT);
  doc.rect(margin, y, contentWidth, 9, "F");
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("OFFICE", columns.office, y + 6);
  doc.text("STATUS", columns.status, y + 6);
  doc.text("DATE SIGNED", columns.date, y + 6);
  doc.text("SIGNER", columns.signer, y + 6);
  doc.text("SIGNATURE", columns.signature, y + 6);

  y += 9;
  const rowHeight = 15;

  offices.forEach((office, index) => {
    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 255);
      doc.rect(margin, y, contentWidth, rowHeight, "F");
    }

    doc.setDrawColor(222, 228, 245);
    doc.setLineWidth(0.2);
    doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);

    const isSigned = office.status === "signed";

    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(office.label, columns.office, y + 9);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...(isSigned ? GREEN : MUTED));
    doc.text(isSigned ? "SIGNED" : "NOT SIGNED", columns.status, y + 9);

    doc.setTextColor(...MUTED);
    doc.text(office.respondedAt ? formatDate(office.respondedAt) : "—", columns.date, y + 9);

    doc.setTextColor(...INK);
    doc.text(office.signerName ?? "—", columns.signer, y + 9);

    if (office.signatureImage) {
      try {
        // "FAST" lets jsPDF deflate the PNG instead of storing raw pixels.
        doc.addImage(
          office.signatureImage,
          "PNG",
          columns.signature,
          y + 3,
          34,
          9,
          undefined,
          "FAST",
        );
      } catch {
        // A corrupt image must never block the download.
      }
    }

    y += rowHeight;
  });

  // --- Footer --------------------------------------------------------------
  y += 10;
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  const note = historical
    ? "This is a re-generated copy of a previously cleared term."
    : "This confirmation is valid only with the digital signatures recorded by Cordova Public College.";
  doc.text(doc.splitTextToSize(note, contentWidth), margin, y);

  y += 12;
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Generated", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(formatDateTime(new Date().toISOString()), margin + 22, y);

  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text(
    "Cordova Public College · Gabi, Cordova, Cebu · Online Clearance System",
    pageWidth / 2,
    287,
    { align: "center" },
  );

  doc.save(`CPC-Clearance-${referenceNumber}.pdf`);
}

const importantNotes = [
  "Keep your reference number for future reference.",
  "Check your email regularly for updates.",
  "Complete any additional requirements if requested.",
  "Contact the registrar's office for inquiries.",
];

const contactDetails = [
  { label: "Registrar's Office", value: "+63 32 123-4567" },
  { label: "Email", value: "registrar@cpc.edu.ph" },
  { label: "Office Hours", value: "Monday - Friday, 8:00 AM - 5:00 PM" },
];

/** Paired follow-up cards below the receipt: reminders and registrar contacts. */
export function EnrollmentFollowUpCards() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="enroll-card p-6">
        <h3 className="font-semibold text-enroll-heading mb-3">Important Notes</h3>
        <ul className="space-y-2 text-sm text-enroll-text">
          {importantNotes.map((note) => (
            <li key={note} className="flex items-start gap-2">
              <span className="text-enroll-primary">•</span>
              {note}
            </li>
          ))}
        </ul>
      </div>

      <div className="enroll-card p-6">
        <h3 className="font-semibold text-enroll-heading mb-3">Contact Information</h3>
        <div className="space-y-3 text-sm">
          {contactDetails.map((detail) => (
            <div key={detail.label}>
              <p className="font-medium text-enroll-heading">{detail.label}</p>
              <p className="text-enroll-text">{detail.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

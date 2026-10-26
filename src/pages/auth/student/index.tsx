import { LoginForm } from "@/components/features/auth/login-form";

export default function StudentLoginPage() {
  return (
    <LoginForm
      role="student"
      title="Student Login"
      idLabel="School Id"
      idPlaceholder="Enter your school id"
      footerLinks={[{ label: "Staff", to: "/login/staff" }]}
    />
  );
}

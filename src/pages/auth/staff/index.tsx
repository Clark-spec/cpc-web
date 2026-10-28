import { LoginForm } from "@/components/features/auth/login-form";

export default function StaffLoginPage() {
  return (
    <LoginForm
      role="staff"
      title="Staff Login"
      idLabel="Staff Id"
      idPlaceholder="Enter your staff id"
      footerLinks={[
        { label: "Student", to: "/login/student" },
        { label: "Admin", to: "/login/admin" },
      ]}
    />
  );
}

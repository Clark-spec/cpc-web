import { Navigate } from "react-router";
import { LoginForm } from "@/components/features/auth/LoginForm";
import { useAuth } from "@/components/context/useAuth";

export default function StaffLoginPage() {
  const { isAuthenticated, role } = useAuth();

  if (isAuthenticated && role === "staff") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <LoginForm
      role="staff"
      title="Staff Login"
      idLabel="Staff Id"
      idPlaceholder="Enter your staff id"
      redirectTo="/admin/dashboard"
      footerLinks={[
        { label: "Student", to: "/login/student" },
        { label: "Admin", to: "/login/admin" },
      ]}
    />
  );
}

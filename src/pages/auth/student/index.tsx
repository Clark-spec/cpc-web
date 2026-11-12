import { Navigate } from "react-router";
import { LoginForm } from "@/components/features/auth/LoginForm";
import { useAuth } from "@/components/context/useAuth";

export default function StudentLoginPage() {
  const { isAuthenticated, role } = useAuth();

  if (isAuthenticated && role === "student") {
    return <Navigate to="/student/home" replace />;
  }

  return (
    <LoginForm
      role="student"
      title="Student Login"
      idLabel="School Id"
      idPlaceholder="Enter your school id"
      redirectTo="/student/home"
      footerLinks={[
        { label: "Admin", to: "/login/admin" },
        { label: "Staff", to: "/login/staff" },
      ]}
    />
  );
}

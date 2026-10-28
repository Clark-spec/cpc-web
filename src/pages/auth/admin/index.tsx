import { Link } from "react-router";

export default function AdminLoginPage() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 px-8 text-center font-poppins">
      <h1 className="text-[28px] leading-tight font-semibold text-cpc-title">Admin Login</h1>
      <p className="text-[17px] text-cpc-label">Coming soon.</p>
      <Link
        to="/login/student"
        className="font-bold text-cpc-cordova underline underline-offset-2"
      >
        Back to Student login
      </Link>
    </div>
  );
}

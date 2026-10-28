import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { navigate } from "@/lib/router";

type UserRole = "student" | "staff" | "admin" | null;

type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  studentId?: string;
  course?: string;
  yearLevel?: number;
};

type AuthContextType = {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (credentials: { id: string; password: string; role: UserRole }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = sessionStorage.getItem("cpc_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        sessionStorage.removeItem("cpc_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: { id: string; password: string; role: UserRole }) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const mockUser: User = {
      id: credentials.id,
      name: credentials.role === "student" ? "Juan Dela Cruz" : "Maria Santos",
      email: `${credentials.id}@cpc.edu.ph`,
      role: credentials.role,
      studentId: credentials.role === "student" ? credentials.id : undefined,
      course: "BS Computer Science",
      yearLevel: 2,
    };

    setUser(mockUser);
    sessionStorage.setItem("cpc_user", JSON.stringify(mockUser));
    setIsLoading(false);

    if (credentials.role === "student") {
      navigate("/online-enrollment");
    } else if (credentials.role === "staff") {
      navigate("/dashboard");
    } else {
      navigate("/dashboard");
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem("cpc_user");
    navigate("/login/student");
  };
  

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
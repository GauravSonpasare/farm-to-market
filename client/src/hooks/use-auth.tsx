import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import type { User, InsertUser } from "@shared/schema";
import { apiRequest } from "../lib/api";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (data: Pick<InsertUser, "email" | "password">) => Promise<void>;
  register: (data: InsertUser) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await apiRequest("GET", "/auth/me");
        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        // Not logged in or token expired
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, []);

  const login = async (data: Pick<InsertUser, "email" | "password">) => {
    setError(null);
    try {
      const res = await apiRequest("POST", "/auth/login", data);
      const resData = await res.json();
      setUser(resData.user);
    } catch (err: any) {
      setError(err);
      throw err;
    }
  };

  const register = async (data: InsertUser) => {
    setError(null);
    try {
      const res = await apiRequest("POST", "/auth/register", data);
      const resData = await res.json();
      if (resData.user.status === "approved") {
        setUser(resData.user);
      } else {
        // Pending logic — maybe we don't set user if pending so they are redirected to a pending page
      }
    } catch (err: any) {
      setError(err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await apiRequest("POST", "/auth/logout");
      setUser(null);
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, error, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

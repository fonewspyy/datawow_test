"use client";

import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
} from "react";
import { clearSession, getStoredToken, getStoredUser, saveSession } from "@/lib/auth";
import type { AuthResponse, SessionUser } from "@/lib/types";

interface AuthContextValue {
  isReady: boolean;
  token: string | null;
  user: SessionUser | null;
  login: (response: AuthResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const storedToken = getStoredToken();
    const storedUser = getStoredUser();

    startTransition(() => {
      setToken(storedToken);
      setUser(storedUser);
      setIsReady(true);
    });
  }, []);

  const value: AuthContextValue = {
    isReady,
    token,
    user,
    login: (response) => {
      saveSession(response);
      startTransition(() => {
        setToken(response.accessToken);
        setUser(response.user);
        setIsReady(true);
      });
    },
    logout: () => {
      clearSession();
      startTransition(() => {
        setToken(null);
        setUser(null);
        setIsReady(true);
      });
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
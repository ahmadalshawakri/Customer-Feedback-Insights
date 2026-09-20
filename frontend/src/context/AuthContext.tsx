"use client";

import React, { createContext, useContext, useMemo } from "react";
import type { UserRole, UserSession } from "@/types";

export interface AuthContextType {
  session: UserSession;
  role: UserRole;
  userId: string;
  isManager: boolean;
}

export interface AuthProviderProps {
  session: UserSession;
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ session, children }: AuthProviderProps) => {
  const value = useMemo<AuthContextType>(() => {
    return {
      session,
      role: session.role,
      userId: session.userId,
      isManager: session.role === "support_manager",
    };
  }, [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const useManager = (): boolean => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useManager must be used within an AuthProvider");
  }
  return context.isManager;
};

export const ManagerContext = AuthContext;
export const ManagerProvider = AuthProvider;

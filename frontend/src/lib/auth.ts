import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole, UserSession } from "@/types";

export interface DecodedToken {
  sub: string;
  role: UserRole;
  exp?: number;
  [key: string]: unknown;
}

export const decodeJwtPayload = (token: string): DecodedToken | null => {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload) as DecodedToken;
  } catch {
    return null;
  }
};

export const getAuthToken = async (): Promise<string | null> => {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get("auth_token");
  return tokenCookie?.value || null;
};

export const getSession = async (): Promise<UserSession | null> => {
  const token = await getAuthToken();
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  if (!payload || !payload.sub || !payload.role) {
    return null;
  }

  if (payload.exp && payload.exp * 1000 < Date.now()) {
    return null;
  }

  return {
    userId: payload.sub,
    role: payload.role,
    exp: payload.exp,
  };
};

export const requireAuth = async (): Promise<{ session: UserSession; token: string }> => {
  const token = await getAuthToken();
  const session = await getSession();

  if (!token || !session) {
    redirect("/login");
  }

  return { session, token };
};

export const requireSupportManager = async (): Promise<{
  session: UserSession;
  token: string;
}> => {
  const { session, token } = await requireAuth();

  if (session.role !== "support_manager") {
    redirect("/tickets");
  }

  return { session, token };
};

import type {
  AnalysisAccept,
  AnalysisResult,
  LoginResponse,
  PaginatedTickets,
  TicketCreate,
  TicketRead,
  TicketStatus,
  TicketUpdate,
  UserCreatePayload,
} from "@/types";

interface FetchOptions extends RequestInit {
  token?: string | null;
}

/*
- Ensures Next.js application knows exactly how to communicate with the backend
- Regardless of whether the code is executing in the user's browser or on the Next.js server
- Handles potential environment differences between development and production environments
*/
export const getApiBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  }
  return (
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:8000"
  );
};

const apiFetch = async <T>(path: string, options: FetchOptions = {}): Promise<T> => {
  const { token, headers: customHeaders, ...restOptions } = options;
  const baseUrl = getApiBaseUrl();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(customHeaders as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...restOptions,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const errorMessage = response.statusText || "An unexpected API error occurred";
    throw new Error(`Request failed with status: ${response.status} and message: ${errorMessage}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  auth: {
    login: async (username: string, password: string): Promise<LoginResponse> => {
      return apiFetch<LoginResponse>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
    },

    signup: async (
      payload: UserCreatePayload,
      token?: string | null
    ): Promise<{ message: string }> => {
      return apiFetch<{ message: string }>("/api/v1/auth/signup", {
        method: "POST",
        body: JSON.stringify(payload),
        token,
      });
    },
  },

  tickets: {
    list: async (
      params?: {
        page?: number;
        page_size?: number;
        status?: TicketStatus;
        is_complex?: boolean;
      },
      token?: string | null
    ): Promise<PaginatedTickets> => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set("page", String(params.page));
      if (params?.page_size) searchParams.set("page_size", String(params.page_size));
      if (params?.status) searchParams.set("status", params.status);
      if (params?.is_complex !== undefined) {
        searchParams.set("is_complex", String(params.is_complex));
      }
      const query = searchParams.toString();

      if (typeof window !== "undefined") {
        const response = await fetch(`/api/tickets${query ? `?${query}` : ""}`);
        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({
            detail: response.statusText,
          }));
          throw new Error(errorBody.detail || "Failed to fetch tickets");
        }
        return response.json();
      }

      return apiFetch<PaginatedTickets>(
        `/api/v1/tickets${query ? `?${query}` : ""}`,
        { token }
      );
    },

    get: async (id: string, token?: string | null): Promise<TicketRead> => {
      return apiFetch<TicketRead>(`/api/v1/tickets/${id}`, { token });
    },

    create: async (
      payload: TicketCreate,
      token?: string | null
    ): Promise<TicketRead> => {
      return apiFetch<TicketRead>("/api/v1/tickets", {
        method: "POST",
        body: JSON.stringify(payload),
        token,
      });
    },

    update: async (
      id: string,
      payload: TicketUpdate,
      token?: string | null
    ): Promise<TicketRead> => {
      return apiFetch<TicketRead>(`/api/v1/tickets/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
        token,
      });
    },

    analyze: async (
      id: string,
      token?: string | null
    ): Promise<AnalysisResult> => {
      return apiFetch<AnalysisResult>(`/api/v1/tickets/${id}/analyze`, {
        method: "POST",
        token,
      });
    },

    accept: async (
      id: string,
      payload: {
        analysis_result: AnalysisResult;
        accept_payload: AnalysisAccept;
      },
      token?: string | null
    ): Promise<TicketRead> => {
      return apiFetch<TicketRead>(`/api/v1/tickets/${id}/accept`, {
        method: "POST",
        body: JSON.stringify(payload),
        token,
      });
    },
  },
};

export type UserRole = "support_manager" | "support_agent";

export interface UserSession {
  userId: string;
  role: UserRole;
  exp?: number;
}

export type TicketStatus =
  | "open"
  | "pending_analysis"
  | "analyzed"
  | "resolved"
  | "closed";

export type TicketSentiment = "positive" | "neutral" | "negative" | "mixed";

export type TicketCategory =
  | "billing"
  | "technical"
  | "shipping"
  | "account"
  | "general"
  | "other";

export interface AnalysisRead {
  id: string;
  ticket_id: string;
  suggested_category: TicketCategory;
  suggested_sentiment: TicketSentiment;
  summary: string;
  confidence_score: number;
  raw_llm_response: string | null;
  reviewed_by: string | null;
  is_accepted: boolean;
  created_at: string;
}

export interface TicketRead {
  id: string;
  title: string;
  body: string;
  customer_email: string;
  status: TicketStatus;
  is_complex: boolean;
  created_at: string;
  updated_at: string;
  analysis: AnalysisRead | null;
}

export interface PaginatedTickets {
  items: TicketRead[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface AnalysisResult {
  suggested_category: TicketCategory;
  suggested_sentiment: TicketSentiment;
  summary: string;
  confidence_score: number;
  raw_llm_response: string | null;
}

export interface AnalysisAccept {
  suggested_category?: TicketCategory;
  suggested_sentiment?: TicketSentiment;
  summary?: string;
}

export interface TicketCreate {
  title: string;
  body: string;
  customer_email: string;
  status?: TicketStatus;
  is_complex?: boolean;
}

export interface TicketUpdate {
  title?: string;
  body?: string;
  status?: TicketStatus;
  is_complex?: boolean;
}

export interface UserCreatePayload {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

import { NextResponse } from "next/server";
import { api } from "@/lib/apiClient";
import { getAuthToken, getSession } from "@/lib/auth";

/**
 * /api/tickets/[id]/accept POST
 * Accepts the AI analysis for a specific ticket.
 * @param request - HTTP request with analysis result and accept payload.
 * @param params - Ticket ID.
 * @returns JSON response with the updated ticket or an error message.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const token = await getAuthToken();

    if (!session || !token) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "support_manager") {
      return NextResponse.json(
        { detail: "Support Manager access required to accept analysis" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { analysis_result, accept_payload } = body;

    const result = await api.tickets.accept(
      id,
      { analysis_result, accept_payload },
      token
    );
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { detail: "Failed to save analysis" },
      { status: 500 }
    );
  }
}

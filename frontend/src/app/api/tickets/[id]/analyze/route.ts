import { NextResponse } from "next/server";
import { api } from "@/lib/apiClient";
import { getAuthToken, getSession } from "@/lib/auth";

/**
 * /api/tickets/[id]/analyze POST
 * Runs AI analysis on a specific ticket.
 * @param request - HTTP request.
 * @param params - Ticket ID.
 * @returns JSON response with the AI analysis result or an error message.
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
        { detail: "Support Manager access required to run AI analysis" },
        { status: 403 }
      );
    }

    const result = await api.tickets.analyze(id, token);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { detail: "Failed to run AI analysis" },
      { status: 500 }
    );
  }
}

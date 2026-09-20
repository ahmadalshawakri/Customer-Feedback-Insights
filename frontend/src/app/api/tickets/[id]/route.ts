import { NextResponse } from "next/server";
import { api } from "@/lib/apiClient";
import { getAuthToken, getSession } from "@/lib/auth";

/**
 * /api/tickets/[id] PATCH
 * Updates an existing ticket.
 * @param request - HTTP request with ticket data.
 * @param params - Ticket ID.
 * @returns JSON response with the updated ticket or an error message.
 */
export async function PATCH(
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
        { detail: "Support Manager access required to modify tickets" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updated = await api.tickets.update(id, body, token);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { detail: "Failed to update ticket" },
      { status: 500 }
    );
  }
}

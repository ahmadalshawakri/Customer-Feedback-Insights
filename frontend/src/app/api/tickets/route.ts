import { NextResponse } from "next/server";
import { api } from "@/lib/apiClient";
import { getAuthToken, getSession } from "@/lib/auth";
import type { TicketStatus } from "@/types";

/**
 * /api/tickets GET
 * List tickets (paginated with filters).
 * @param request - HTTP request with query parameters.
 * @returns JSON response with paginated tickets or an error message.
 */
export async function GET(request: Request) {
  try {
    const session = await getSession();
    const token = await getAuthToken();

    if (!session || !token) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page")
      ? parseInt(searchParams.get("page")!, 10)
      : undefined;
    const page_size = searchParams.get("page_size")
      ? parseInt(searchParams.get("page_size")!, 10)
      : undefined;
    const status = (searchParams.get("status") as TicketStatus) || undefined;
    const is_complex =
      searchParams.get("is_complex") === "true"
        ? true
        : searchParams.get("is_complex") === "false"
          ? false
          : undefined;

    const data = await api.tickets.list(
      { page, page_size, status, is_complex },
      token
    );
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { detail: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}

/**
 * /api/tickets POST
 * Creates a new ticket.
 * @param request - HTTP request with ticket data.
 * @returns JSON response with the created ticket or an error message.
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    const token = await getAuthToken();

    if (!session || !token) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "support_manager") {
      return NextResponse.json(
        { detail: "Support Manager access required to create tickets" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const created = await api.tickets.create(body, token);
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json(
      { detail: "Failed to create ticket" },
      { status: 500 }
    );
  }
}

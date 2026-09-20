import { NextResponse } from "next/server";
import { api } from "@/lib/apiClient";
import { getAuthToken, getSession } from "@/lib/auth";

/**
 * /api/team/signup POST
 * Registers a new user.
 * @param request - HTTP request with user data.
 * @returns JSON response with the registered user or an error message.
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
        { detail: "Support Manager access required to register new users" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = await api.auth.signup(body, token);
    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json(
      { detail: "Failed to register user" },
      { status: 500 }
    );
  }
}

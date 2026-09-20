import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { api } from "@/lib/apiClient";
import { decodeJwtPayload } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { detail: "Username and password are required" },
        { status: 400 }
      );
    }

    const { access_token } = await api.auth.login(username, password);
    const payload = decodeJwtPayload(access_token);

    const cookieStore = await cookies();
    cookieStore.set("auth_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: (Number(process.env.AUTH_COOKIE_EXPIRE_MINUTES) || 60) * 60,
    });

    return NextResponse.json({
      success: true,
      role: payload?.role,
      userId: payload?.sub,
    });
  } catch {
    return NextResponse.json(
      { detail: "Authentication failed" },
      { status: 500 }
    );
  }
}

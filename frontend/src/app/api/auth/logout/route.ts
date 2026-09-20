import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * /api/auth/logout POST
 * Logs out the current user.
 * @returns JSON response with success status.
 */
export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  return NextResponse.json({ success: true });
}

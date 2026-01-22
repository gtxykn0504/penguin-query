import { type NextRequest, NextResponse } from "next/server"
import { clearSessionCookie } from "@/lib/auth"

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin))

  await clearSessionCookie(response)

  return response
}

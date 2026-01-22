import { type NextRequest, NextResponse } from "next/server"

// Simple in-memory rate limit (replace with Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function getClientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "unknown"
}

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Rate limit for query endpoint
  if (path.startsWith("/api/query/")) {
    const ip = getClientIp(request)
    const now = Date.now()
    const limit = rateLimitMap.get(ip)

    if (limit && limit.resetTime > now) {
      if (limit.count >= 100) {
        // 100 requests per minute
        return NextResponse.json({ error: "Too many requests" }, { status: 429 })
      }
      limit.count++
    } else {
      rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/api/query/:path*", "/api/admin/:path*"],
}

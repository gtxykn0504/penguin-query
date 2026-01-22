import { type NextRequest, NextResponse } from "next/server"
import { setSessionCookie, createSession } from "@/lib/auth"
import { query } from "@/lib/db"
import { generateId } from "@/lib/utils"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

  if (error || !code) {
    return NextResponse.redirect(new URL(`/login?error=${error || "no_code"}`, baseUrl))
  }

  try {
    const { NEXT_PUBLIC_ENTRA_CLIENT_ID, ENTRA_CLIENT_SECRET, NEXT_PUBLIC_ENTRA_REDIRECT_URI, ENTRA_TENANT_ID } =
      process.env

    if (!NEXT_PUBLIC_ENTRA_CLIENT_ID || !ENTRA_CLIENT_SECRET || !NEXT_PUBLIC_ENTRA_REDIRECT_URI || !ENTRA_TENANT_ID) {
      return NextResponse.redirect(new URL("/login?error=config_error", baseUrl))
    }

    const tokenResponse = await fetch(`https://login.microsoftonline.com/${ENTRA_TENANT_ID}/oauth2/v2.0/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: NEXT_PUBLIC_ENTRA_CLIENT_ID,
        client_secret: ENTRA_CLIENT_SECRET,
        code,
        redirect_uri: NEXT_PUBLIC_ENTRA_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    })

    if (!tokenResponse.ok) {
      return NextResponse.redirect(new URL("/login?error=token_exchange_failed", baseUrl))
    }

    const tokenData = await tokenResponse.json()

    if (!tokenData.id_token) {
      return NextResponse.redirect(new URL("/login?error=no_id_token", baseUrl))
    }

    const parts = tokenData.id_token.split(".")
    if (parts.length !== 3) {
      return NextResponse.redirect(new URL("/login?error=invalid_token", baseUrl))
    }

    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString())
    const userId = payload.oid || payload.sub
    const email = payload.email || payload.preferred_username || payload.upn
    const name = payload.name || email

    if (!userId || !email) {
      return NextResponse.redirect(new URL("/login?error=missing_user_info", baseUrl))
    }

    const existingUser = await query("SELECT id FROM users WHERE entra_id = ?", [userId])
    let dbUserId: string

    if (!Array.isArray(existingUser) || existingUser.length === 0) {
      dbUserId = generateId()
      await query("INSERT INTO users (id, entra_id, email, name) VALUES (?, ?, ?, ?)", [dbUserId, userId, email, name])
    } else {
      dbUserId = existingUser[0].id
    }

    const session = { userId: dbUserId, entraId: userId, email, name }
    const token = await createSession(session)
    const response = NextResponse.redirect(new URL("/admin", baseUrl))
    await setSessionCookie(token, response)

    return response
  } catch (error) {
    return NextResponse.redirect(new URL("/login?error=auth_failed", baseUrl))
  }
}

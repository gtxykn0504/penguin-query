import { jwtVerify, SignJWT } from "jose"
import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"

const secret = new TextEncoder().encode(process.env.SESSION_SECRET || "dev-secret-key")

export interface Session {
  userId: string
  entraId: string
  email: string
  name: string
  [key: string]: string | number | boolean | undefined
}

export async function createSession(session: Session): Promise<string> {
  const token = await new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret)
  return token
}

export async function verifySession(request: NextRequest): Promise<Session | null>
export async function verifySession(token: string): Promise<Session | null>
export async function verifySession(input: string | NextRequest): Promise<Session | null> {
  try {
    let token: string | undefined

    if (typeof input === "string") {
      token = input
    } else {
      // Extract token from NextRequest
      token = input.cookies.get("session")?.value
    }

    if (!token) return null

    const verified = await jwtVerify(token, secret)
    const payload = verified.payload as unknown as Session
    
    // Verify required properties exist
    if (!payload.userId || !payload.entraId || !payload.email || !payload.name) {
      return null
    }
    
    return payload
  } catch {
    return null
  }
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("session")?.value
  if (!token) return null
  return verifySession(token)
}

export async function setSessionCookie(token: string, response?: NextResponse) {
  if (response && response instanceof NextResponse) {
    // Set cookie on the response object for redirects
    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })
  } else {
    // Set cookie using Next.js cookies API
    const cookieStore = await cookies()
    cookieStore.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })
  }
}

export async function clearSessionCookie(response?: NextResponse) {
  if (response && response instanceof NextResponse) {
    // Clear cookie on the response object for redirects
    response.cookies.set("session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })
  } else {
    // Clear cookie using Next.js cookies API
    const cookieStore = await cookies()
    cookieStore.delete("session")
  }
}

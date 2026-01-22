import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const clientId = process.env.NEXT_PUBLIC_ENTRA_CLIENT_ID
  const redirectUri = process.env.NEXT_PUBLIC_ENTRA_REDIRECT_URI
  const tenantId = process.env.ENTRA_TENANT_ID

  const authUrl =
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri || "")}&` +
    `response_type=code&` +
    `scope=openid profile email&` +
    `response_mode=query`

  return NextResponse.redirect(authUrl)
}

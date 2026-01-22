import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifySession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession(request)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const links = await query(
      `SELECT 
        ql.id, 
        ql.slug, 
        ql.title,
        ql.created_at,
        d.name as dataset_name
      FROM query_links ql
      LEFT JOIN datasets d ON ql.dataset_id = d.id
      WHERE ql.created_by = ?
      ORDER BY ql.created_at DESC`,
      [session.userId],
    )

    return NextResponse.json({ success: true, links })
  } catch (error) {
    console.error("Query links fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch links" }, { status: 500 })
  }
}

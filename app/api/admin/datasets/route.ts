import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const datasets = await query(
      "SELECT id, name, total_rows, created_at FROM datasets WHERE created_by = ? ORDER BY created_at DESC LIMIT 20",
      [session.userId],
    )

    return NextResponse.json({
      success: true,
      datasets: Array.isArray(datasets) ? datasets : [],
    })
  } catch (error) {
    console.error("Datasets fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch datasets" }, { status: 500 })
  }
}

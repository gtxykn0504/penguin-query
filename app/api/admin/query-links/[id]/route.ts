import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifySession } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySession(request)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const linkResult = await query(
      `SELECT ql.*, d.name as dataset_name 
       FROM query_links ql 
       JOIN datasets d ON ql.dataset_id = d.id 
       WHERE ql.id = ? AND ql.created_by = ?`,
      [id, session.userId]
    )

    if (!Array.isArray(linkResult) || linkResult.length === 0) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, link: linkResult[0] })
  } catch (error) {
    console.error("Get link error:", error)
    return NextResponse.json({ error: "Failed to get link" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySession(request)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { slug, title } = body

    if (!slug || typeof slug !== "string" || slug.trim().length === 0) {
      return NextResponse.json({ error: "链接标识符不能为空" }, { status: 400 })
    }

    // Check if link exists and belongs to user
    const linkResult = await query("SELECT * FROM query_links WHERE id = ? AND created_by = ?", [id, session.userId])

    if (!Array.isArray(linkResult) || linkResult.length === 0) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 })
    }

    // Check if new slug is already used by another link
    const existingSlug = await query("SELECT id FROM query_links WHERE slug = ? AND id != ?", [slug.trim(), id])
    if (Array.isArray(existingSlug) && existingSlug.length > 0) {
      return NextResponse.json({ error: "该链接标识符已被使用" }, { status: 400 })
    }

    // Update link
    await query("UPDATE query_links SET slug = ?, title = ? WHERE id = ?", [
      slug.trim(),
      title?.trim() || null,
      id,
    ])

    return NextResponse.json({
      success: true,
      message: "链接已更新",
    })
  } catch (error) {
    console.error("Update link error:", error)
    return NextResponse.json({ error: "Failed to update link" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySession(request)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    await query("DELETE FROM query_links WHERE id = ? AND created_by = ?", [id, session.userId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete link error:", error)
    return NextResponse.json({ error: "Failed to delete link" }, { status: 500 })
  }
}

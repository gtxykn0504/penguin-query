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

    const datasetResult = await query("SELECT * FROM datasets WHERE id = ? AND created_by = ?", [id, session.userId])

    if (!Array.isArray(datasetResult) || datasetResult.length === 0) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 })
    }

    const dataset = datasetResult[0]
    const tableName = dataset.table_name

    // Get column information
    const columnsResult = await query(`SHOW COLUMNS FROM \`${tableName}\``)
    const columns = Array.isArray(columnsResult)
      ? columnsResult
          .filter((col: any) => col.Field !== "id" && col.Field !== "created_at")
          .map((col: any) => ({
            name: col.Field,
            type: col.Type,
          }))
      : []

    return NextResponse.json({
      success: true,
      dataset,
      columns,
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch dataset", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
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
    const { name } = body

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "数据集名称不能为空" }, { status: 400 })
    }

    // Check if dataset exists and belongs to user
    const datasetResult = await query("SELECT * FROM datasets WHERE id = ? AND created_by = ?", [id, session.userId])

    if (!Array.isArray(datasetResult) || datasetResult.length === 0) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 })
    }

    // Update dataset name
    await query("UPDATE datasets SET name = ? WHERE id = ?", [name.trim(), id])

    return NextResponse.json({
      success: true,
      message: "数据集名称已更新",
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update dataset", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySession(request)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const datasetResult = await query("SELECT table_name FROM datasets WHERE id = ? AND created_by = ?", [
      id,
      session.userId,
    ])

    if (!Array.isArray(datasetResult) || datasetResult.length === 0) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 })
    }

    const tableName = datasetResult[0].table_name

    if (!tableName.startsWith("dataset_")) {
      return NextResponse.json({ error: "Invalid table name" }, { status: 400 })
    }

    await query("DELETE FROM query_links WHERE dataset_id = ?", [id])

    await query(`DROP TABLE IF EXISTS \`${tableName}\``)

    await query("DELETE FROM datasets WHERE id = ?", [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete dataset", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

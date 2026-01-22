import { type NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth"
import { query, withTransaction } from "@/lib/db"
import { escapeIdentifier, sanitizeInput } from "@/lib/utils"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySession(request)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Get dataset info
    const datasetResult = await query(
      "SELECT id, name, table_name, total_rows FROM datasets WHERE id = ? AND created_by = ?",
      [id, session.userId],
    )

    if (!Array.isArray(datasetResult) || datasetResult.length === 0) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 })
    }

    const dataset = datasetResult[0] as { id: string; name: string; table_name: string; total_rows: number }

    // Get table columns (excluding id and created_at)
    const columnsResult = await query(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = ?
       AND COLUMN_NAME NOT IN ('id', 'created_at')
       ORDER BY ORDINAL_POSITION`,
      [dataset.table_name],
    )

    const columns = Array.isArray(columnsResult) ? columnsResult.map((row: any) => row.COLUMN_NAME) : []

    // Get all data from the dataset table
    const dataResult = await query(`SELECT * FROM ${escapeIdentifier(dataset.table_name)} ORDER BY id`)

    return NextResponse.json({
      success: true,
      dataset: {
        id: dataset.id,
        name: dataset.name,
        table_name: dataset.table_name,
        total_rows: dataset.total_rows,
      },
      columns,
      data: Array.isArray(dataResult) ? dataResult : [],
    })
  } catch (error) {
    console.error("Get dataset data error:", error)
    return NextResponse.json(
      { error: "Failed to get dataset data", details: error instanceof Error ? error.message : String(error) },
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
    const { rowId, columnName, value } = body

    if (!rowId || !columnName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get dataset info
    const datasetResult = await query(
      "SELECT id, name, table_name FROM datasets WHERE id = ? AND created_by = ?",
      [id, session.userId],
    )

    if (!Array.isArray(datasetResult) || datasetResult.length === 0) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 })
    }

    const dataset = datasetResult[0] as { id: string; name: string; table_name: string }

    // Verify column exists (excluding id and created_at)
    const columnsResult = await query(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?
       AND COLUMN_NAME NOT IN ('id', 'created_at')`,
      [dataset.table_name, columnName],
    )

    if (!Array.isArray(columnsResult) || columnsResult.length === 0) {
      return NextResponse.json({ error: "Invalid column name" }, { status: 400 })
    }

    // Update the cell value
    await query(
      `UPDATE ${escapeIdentifier(dataset.table_name)} 
       SET ${escapeIdentifier(sanitizeInput(columnName))} = ? 
       WHERE id = ?`,
      [value, rowId],
    )

    return NextResponse.json({
      success: true,
      message: "数据已更新",
    })
  } catch (error) {
    console.error("Update dataset data error:", error)
    return NextResponse.json(
      { error: "Failed to update dataset data", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

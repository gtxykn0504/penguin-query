import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { escapeIdentifier } from "@/lib/utils"

interface LinkResult {
  condition_columns: string | string[]
  title: string
  condition_requirements: Record<string, { required: boolean; displayName: string }> | string
  table_name: string
}

interface ColumnResult {
  Field: string
  Type: string
  Null: string
  Key: string
  Default: string | null
  Extra: string
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params

    const linkResult = await query(
      `SELECT ql.condition_columns, ql.title, ql.condition_requirements, d.table_name
       FROM query_links ql
       JOIN datasets d ON ql.dataset_id = d.id
       WHERE ql.slug = ?`,
      [slug],
    ) as LinkResult[]

    if (!Array.isArray(linkResult) || linkResult.length === 0) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 })
    }

    const link = linkResult[0]

    let columnNames: string[]
    if (typeof link.condition_columns === "string") {
      try {
        columnNames = JSON.parse(link.condition_columns)
      } catch (e) {
        columnNames = []
      }
    } else if (Array.isArray(link.condition_columns)) {
      columnNames = link.condition_columns
    } else {
      columnNames = []
    }

    if (!Array.isArray(columnNames) || columnNames.length === 0) {
      return NextResponse.json({ success: true, conditions: [], title: link.title })
    }

    const columnsResult = await query(`SHOW COLUMNS FROM ${escapeIdentifier(link.table_name)}`) as ColumnResult[]
    const availableColumns = Array.isArray(columnsResult)
      ? columnsResult
          .filter((col: any) => col.Field !== "id" && col.Field !== "created_at")
          .map((col: any) => col.Field)
      : []

    let requirements: Record<string, { required: boolean; displayName: string }> = {}
    if (link.condition_requirements) {
      try {
        requirements =
          typeof link.condition_requirements === "string"
            ? JSON.parse(link.condition_requirements)
            : link.condition_requirements
      } catch (e) {
        requirements = {}
      }
    }

    const conditions = columnNames
      .filter((col) => availableColumns.includes(col))
      .map((col, _index) => ({
        id: col,
        name: requirements[col]?.displayName || col,
        column_name: col,
        type: "text",
        multiple: false,
        required: requirements[col]?.required || false,
      }))

    return NextResponse.json({
      success: true,
      conditions,
      title: link.title,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to load conditions",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

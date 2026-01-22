import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { escapeIdentifier } from "@/lib/utils"

interface LinkResult {
  condition_columns: string | string[]
  condition_requirements: Record<string, { required: boolean; displayName: string }> | string
  table_name: string
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const searchParams = await request.json()

    const linkResult = await query(
      `SELECT ql.condition_columns, ql.condition_requirements, d.table_name 
       FROM query_links ql 
       JOIN datasets d ON ql.dataset_id = d.id 
       WHERE ql.slug = ?`,
      [slug],
    ) as LinkResult[]

    if (!Array.isArray(linkResult) || linkResult.length === 0) {
      return NextResponse.json({ error: "Query link not found" }, { status: 404 })
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
      return NextResponse.json({ error: "No conditions configured" }, { status: 400 })
    }

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

    const whereConditions: string[] = []
    const values: any[] = []

    for (const columnName of columnNames) {
      const value = searchParams[columnName]
      const isRequired = requirements[columnName]?.required || false

      if (isRequired && !value) {
        const displayName = requirements[columnName]?.displayName || columnName
        return NextResponse.json({ error: `Required field missing: ${displayName}` }, { status: 400 })
      }

      if (value) {
        whereConditions.push(`${escapeIdentifier(columnName)} LIKE ?`)
        values.push(`%${value}%`)
      }
    }

    const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(" AND ")}` : ""
    const queryString = `SELECT * FROM ${escapeIdentifier(link.table_name)} ${whereClause}`

    const results = await query(queryString, values)

    return NextResponse.json({
      success: true,
      results: Array.isArray(results) ? results : [],
      count: Array.isArray(results) ? results.length : 0,
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Query failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

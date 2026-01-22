import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"
import { generateId } from "@/lib/utils"

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { datasetId, slug, title, conditions } = body

    if (!conditions || !Array.isArray(conditions)) {
      return NextResponse.json({ error: "Invalid conditions format" }, { status: 400 })
    }

    const linkId = generateId()

    const columnNames = conditions.map((c: { columnName: string }) => c.columnName)
    const conditionRequirements = conditions.reduce(
      (
        acc: Record<string, { required: boolean; displayName: string }>,
        c: { columnName: string; displayName: string; isRequired: boolean },
      ) => {
        acc[c.columnName] = {
          required: c.isRequired,
          displayName: c.displayName,
        }
        return acc
      },
      {},
    )

    await query(
      `INSERT INTO query_links (id, dataset_id, slug, title, condition_columns, condition_requirements, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        linkId,
        datasetId,
        slug,
        title || null,
        JSON.stringify(columnNames),
        JSON.stringify(conditionRequirements),
        session.userId,
      ],
    )

    return NextResponse.json({
      success: true,
      link: `${process.env.NEXT_PUBLIC_ENTRA_REDIRECT_URI?.split("/api")[0]}/q/${slug}`,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate link" }, { status: 500 })
  }
}

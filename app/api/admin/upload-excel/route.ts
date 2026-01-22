import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { withTransaction } from "@/lib/db"
import { generateId, sanitizeInput, isValidColumnName, escapeIdentifier } from "@/lib/utils"

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const datasetName = sanitizeInput(formData.get("name") as string)

    if (!file || !file.name.endsWith(".xlsx")) {
      return NextResponse.json({ error: "Only XLSX files are supported" }, { status: 400 })
    }

    if (!datasetName) {
      return NextResponse.json({ error: "Dataset name is required" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const XLSX = await import("xlsx")
    const workbook = XLSX.read(buffer, { type: "buffer" })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet)

    if (jsonData.length === 0) {
      return NextResponse.json({ error: "Excel file is empty" }, { status: 400 })
    }

    const datasetId = generateId()
    const tableName = `dataset_${datasetId.replace(/-/g, "_").substring(0, 16)}`
    const columns = Object.keys(jsonData[0] as Record<string, any>)

    for (const col of columns) {
      if (!isValidColumnName(col)) {
        return NextResponse.json({ error: `Invalid column name: ${col}` }, { status: 400 })
      }
    }

    await withTransaction(async (connection) => {
      const columnDefs = columns.map((col) => `${escapeIdentifier(sanitizeInput(col))} TEXT`).join(", ")

      await connection.execute(
        `CREATE TABLE ${escapeIdentifier(tableName)} (
          id INT AUTO_INCREMENT PRIMARY KEY,
          ${columnDefs},
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
      )

      const columnNames = columns.map((col) => escapeIdentifier(sanitizeInput(col))).join(", ")
      const placeholders = columns.map(() => "?").join(", ")

      for (const row of jsonData) {
        const values = columns.map((col) => (row as any)[col]?.toString() || null)
        await connection.execute(
          `INSERT INTO ${escapeIdentifier(tableName)} (${columnNames}) VALUES (${placeholders})`,
          values,
        )
      }

      await connection.execute(
        "INSERT INTO datasets (id, name, table_name, total_rows, created_by) VALUES (?, ?, ?, ?, ?)",
        [datasetId, datasetName, tableName, jsonData.length, session.userId],
      )
    })

    return NextResponse.json({
      success: true,
      datasetId,
      columns,
      rowCount: jsonData.length,
      message: "Dataset uploaded successfully",
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Upload failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

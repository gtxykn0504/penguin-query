import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"
import fs from "fs"
import path from "path"

export async function POST() {
  let connection
  try {
    console.log("Starting database initialization...")

    connection = await getConnection()

    // Read SQL script
    const sqlPath = path.join(process.cwd(), "scripts", "init-database.sql")
    const sqlContent = fs.readFileSync(sqlPath, "utf-8")

    const statements = sqlContent
      .split(";")
      .map((s) => s.trim())
      .filter((s) => {
        if (!s) return false
        // Remove single-line comments and trim
        const cleaned = s.replace(/--.*$/gm, "").trim()
        return cleaned.length > 0
      })

    console.log("Executing", statements.length, "SQL statements...")

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      try {
        await connection.query(statement)
        console.log(`Statement ${i + 1}/${statements.length} executed successfully`)
      } catch (error: any) {
        if (
          error.code === "ER_TABLE_EXISTS_ERROR" ||
          error.code === "ER_DB_CREATE_EXISTS" ||
          error.code === "ER_DUP_KEYNAME" ||
          error.code === "ER_CANT_DROP_FIELD_OR_KEY" ||
          error.message?.includes("Duplicate key name") ||
          error.message?.includes("already exists")
        ) {
          console.log(`Statement ${i + 1} skipped (already exists)`)
          continue
        }
        console.error(`Error on statement ${i + 1}:`, statement.substring(0, 100))
        console.error(`Error details:`, error.message)
        throw error
      }
    }

    connection.release()

    console.log("Database initialization completed successfully")

    return NextResponse.json({
      success: true,
      message: "数据库初始化成功",
    })
  } catch (error: any) {
    console.error("Database initialization error:", error)
    if (connection) connection.release()

    return NextResponse.json(
      {
        success: false,
        error: error.message || "数据库初始化失败",
      },
      { status: 500 },
    )
  }
}

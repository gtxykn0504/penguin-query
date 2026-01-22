import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

export async function GET() {
  try {
    console.log("Checking database connection...")

    const connection = await getConnection()

    // Get connection info
    const [rows]: any = await connection.query("SELECT DATABASE() as db, USER() as user")
    const dbInfo = rows[0]

    // Test query
    await connection.query("SELECT 1")

    connection.release()

    console.log("Database connection successful:", dbInfo)

    return NextResponse.json({
      success: true,
      info: {
        database: dbInfo.db,
        user: dbInfo.user?.split("@")[0],
        host: process.env.DATABASE_URL?.split("@")[1]?.split(":")[0] || "localhost",
      },
    })
  } catch (error: any) {
    console.error("Database connection error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "数据库连接失败",
      },
      { status: 500 },
    )
  }
}

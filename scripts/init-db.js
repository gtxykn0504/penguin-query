import mysql from "mysql2/promise"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import dotenv from "dotenv"
import { URL } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, "../.env.local") })

async function initializeDatabase() {
  try {
    // 解析 DATABASE_URL
    const dbUrl = new URL(process.env.DATABASE_URL)
    const dbHost = dbUrl.hostname
    const dbUser = dbUrl.username
    const dbPassword = dbUrl.password
    const dbName = dbUrl.pathname.slice(1)

    console.log(`连接到数据库: ${dbHost}...`)

    const connection = await mysql.createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPassword,
    })

    // 创建数据库
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``)
    console.log(`✓ 数据库 ${dbName} 已创建或已存在`)

    // 切换到目标数据库
    await connection.changeUser({ database: dbName })

    // 读取SQL脚本并执行
    const sqlPath = path.join(__dirname, "init-database.sql")
    const sql = fs.readFileSync(sqlPath, "utf8")

    // 按语句分割执行
    const statements = sql.split(";").filter((stmt) => stmt.trim())
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement)
      }
    }

    console.log("✓ 数据库初始化完成！")
    console.log("✓ 所有表和数据已成功创建")
    process.exit(0)
  } catch (error) {
    console.error("✗ 数据库初始化失败:", error.message)
    process.exit(1)
  }
}

initializeDatabase()

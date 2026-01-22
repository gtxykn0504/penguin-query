import { Suspense } from "react"
import { DatabaseSetup } from "@/components/database-setup"

export default function SetupDatabasePage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 rounded-lg border border-destructive bg-destructive/10 p-4">
          <h2 className="mb-2 text-lg font-semibold text-destructive">安全警告</h2>
          <p className="text-sm text-destructive">
            此页面用于初始化数据库，完成后请立即删除 app/setup-database 文件夹和相关API路由以防止安全风险。
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h1 className="mb-6 text-2xl font-bold">数据库设置</h1>
          <Suspense fallback={<div>加载中...</div>}>
            <DatabaseSetup />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

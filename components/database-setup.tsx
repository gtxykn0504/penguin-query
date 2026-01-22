"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle2, XCircle, Loader2, Database, Play } from "lucide-react"

export function DatabaseSetup() {
  const [status, setStatus] = useState<"idle" | "checking" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [dbInfo, setDbInfo] = useState<any>(null)
  const [initStatus, setInitStatus] = useState<"idle" | "running" | "success" | "error">("idle")
  const [initMessage, setInitMessage] = useState("")

  const checkConnection = async () => {
    setStatus("checking")
    setMessage("正在检查数据库连接...")

    try {
      const response = await fetch("/api/setup/check-db")
      const data = await response.json()

      if (data.success) {
        setStatus("success")
        setMessage("数据库连接成功!")
        setDbInfo(data.info)
      } else {
        setStatus("error")
        setMessage(data.error || "数据库连接失败")
      }
    } catch (error) {
      setStatus("error")
      setMessage("无法连接到服务器")
    }
  }

  const initializeDatabase = async () => {
    setInitStatus("running")
    setInitMessage("正在初始化数据库...")

    try {
      const response = await fetch("/api/setup/init-db", {
        method: "POST",
      })
      const data = await response.json()

      if (data.success) {
        setInitStatus("success")
        setInitMessage("数据库初始化成功!")
      } else {
        setInitStatus("error")
        setInitMessage(data.error || "数据库初始化失败")
      }
    } catch (error) {
      setInitStatus("error")
      setInitMessage("无法连接到服务器")
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Database className="h-5 w-5" />
          <h2 className="text-lg font-semibold">1. 检查数据库连接</h2>
        </div>

        <Button onClick={checkConnection} disabled={status === "checking"} className="mb-4">
          {status === "checking" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              检查中...
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              检查连接
            </>
          )}
        </Button>

        {message && (
          <div
            className={`flex items-start gap-2 rounded-lg border p-4 ${
              status === "success"
                ? "border-green-500 bg-green-50 text-green-700"
                : status === "error"
                  ? "border-red-500 bg-red-50 text-red-700"
                  : "border-blue-500 bg-blue-50 text-blue-700"
            }`}
          >
            {status === "success" ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            ) : status === "error" ? (
              <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
              <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin" />
            )}
            <div className="flex-1">
              <p className="font-medium">{message}</p>
              {dbInfo && (
                <div className="mt-2 space-y-1 text-sm">
                  <p>主机: {dbInfo.host}</p>
                  <p>数据库: {dbInfo.database}</p>
                  <p>用户: {dbInfo.user}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Play className="h-5 w-5" />
          <h2 className="text-lg font-semibold">2. 初始化数据库</h2>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">这将创建所有必要的数据表和索引。如果表已存在，将会跳过。</p>

        <Button
          onClick={initializeDatabase}
          disabled={initStatus === "running" || status !== "success"}
          className="mb-4"
        >
          {initStatus === "running" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              初始化中...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              执行初始化
            </>
          )}
        </Button>

        {initMessage && (
          <div
            className={`flex items-start gap-2 rounded-lg border p-4 ${
              initStatus === "success"
                ? "border-green-500 bg-green-50 text-green-700"
                : initStatus === "error"
                  ? "border-red-500 bg-red-50 text-red-700"
                  : "border-blue-500 bg-blue-50 text-blue-700"
            }`}
          >
            {initStatus === "success" ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            ) : initStatus === "error" ? (
              <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
              <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin" />
            )}
            <div className="flex-1">
              <p className="font-medium">{initMessage}</p>
            </div>
          </div>
        )}
      </Card>

      {initStatus === "success" && (
        <Card className="border-green-500 bg-green-50 p-6">
          <h3 className="mb-2 font-semibold text-green-700">设置完成!</h3>
          <p className="mb-4 text-sm text-green-600">数据库已成功初始化。现在请删除此设置页面以确保安全：</p>
          <ol className="list-inside list-decimal space-y-1 text-sm text-green-600">
            <li>删除 app/setup-database 文件夹</li>
            <li>删除 app/api/setup 文件夹</li>
            <li>重新构建并部署应用</li>
          </ol>
        </Card>
      )}
    </div>
  )
}

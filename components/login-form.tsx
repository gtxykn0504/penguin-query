"use client"

import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Suspense } from "react"

function LoginFormContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const handleLogin = () => {
    window.location.href = "/api/auth/login"
  }

  const errorMessages: Record<string, string> = {
    auth_failed: "认证失败，请重试",
    invalid_token: "无效的令牌",
    no_code: "缺少授权码",
    token_exchange_failed: "令牌交换失败，请检查配置",
    no_id_token: "未收到身份令牌",
    token_decode_failed: "令牌解析失败",
    missing_user_info: "缺少用户信息",
    database_error: "数据库错误，请联系管理员",
    session_failed: "会话创建失败",
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
      <div className="w-full max-w-md bg-card rounded-xl border border-border p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 text-foreground">Penguin Query</h1>
          <p className="text-muted-foreground">管理员登录平台</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm flex items-start gap-2 animate-in slide-in-from-top-5 duration-300">
            <span className="text-xl mt-[-0.2rem]">⚠️</span>
            <span>{errorMessages[error] || `未知错误: ${error}`}</span>
          </div>
        )}

        <Button onClick={handleLogin} className="w-full" size="lg">
          使用 Microsoft 登录
        </Button>
        
        
      </div>
    </div>
  )
}

export default function LoginForm() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <div className="w-12 h-12 rounded-full bg-primary"></div>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground">加载中...</h2>
            <p className="text-sm text-muted-foreground">正在准备登录界面</p>
          </div>
        </div>
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  )
}

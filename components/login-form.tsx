"use client"

import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Suspense } from "react"
import Image from "next/image"

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
    <div className="min-h-screen flex">
      {/* 左侧图片区域 - 占满整个左侧 */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div className="absolute inset-0">
          <Image
            src="https://zh.yuazhi.cn/app/penguin-query-login.jpg"
            alt="Penguin Query 登录界面"
            fill
            className="object-cover"
            priority
            sizes="50vw"
          />
        </div>
        {/* 添加半透明渐变覆盖层，提升文字可读性（如果需要） */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-transparent"></div>
      </div>

      {/* 右侧登录区域 */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 text-foreground">Penguin Query</h1>
            <p className="text-muted-foreground">管理员登录</p>
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm flex items-start gap-2 animate-in slide-in-from-top-5 duration-300">
              <span className="text-xl mt-[-0.2rem]">⚠️</span>
              <span>{errorMessages[error] || `未知错误: ${error}`}</span>
            </div>
          )}

          <div className="space-y-4">      
            <Button 
              onClick={handleLogin} 
              className="w-full h-12 text-base font-medium"
              size="lg"
            >
              使用 Microsoft 登录
            </Button>
          </div>
        </div>
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
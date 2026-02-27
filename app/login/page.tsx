"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"

function LoginPage() {
  const handleLogin = () => {
    window.location.href = "/api/auth/login"
  }

  const error = typeof window !== 'undefined' 
    ? new URLSearchParams(window.location.search).get("error")
    : null;

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div className="absolute inset-0">
          <Image
            src="https://zh.yuazhi.cn/app/penguin-query-login.jpg"
            alt="Penguin 登录界面"
            fill
            className="object-cover"
            priority
            sizes="50vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-transparent"></div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 text-foreground">Penguin</h1>
            <p className="text-muted-foreground">管理员登录</p>
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm flex items-start gap-2 animate-in slide-in-from-top-5 duration-300">
              <span className="text-xl mt-[-0.2rem]">⚠️</span>
              <span>认证失败，请重试</span>
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

export default LoginPage

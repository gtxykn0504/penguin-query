import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import type { ReactNode } from "react"
import { LogOut } from "lucide-react"

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Penguin Query</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-sm">
              <div>
                <p className="font-medium text-foreground">{session.name} ({session.email})</p>
              </div>
            </div>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition"
              >
                <LogOut className="w-4 h-4" />
                退出
              </button>
            </form>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}

"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

interface QueryCondition {
  id: string
  name: string
  column_name: string
  type: "text" | "number" | "date"
  multiple: boolean
  required: boolean
}

interface QueryResult {
  [key: string]: any
}

export default function QueryPage() {
  const params = useParams()
  const slug = params.slug as string
  const [conditions, setConditions] = useState<QueryCondition[]>([])
  const [title, setTitle] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [results, setResults] = useState<QueryResult[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    // 检查是否有缓存
    const cacheKey = `query_conditions_${slug}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try {
        const data = JSON.parse(cached)
        if (data.success && data.conditions) {
          setConditions(data.conditions)
          setTitle(data.title || null)
          return
        }
      } catch (e) {
        // 缓存解析失败，继续请求
      }
    }

    // 添加请求超时处理
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时

    fetch(`/api/query/${slug}/conditions`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.conditions) {
          setConditions(data.conditions)
          setTitle(data.title || null)
          // 缓存结果
          localStorage.setItem(cacheKey, JSON.stringify(data))
        } else {
          setError(data.error || "无法加载查询条件")
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          setError("加载查询条件超时")
        } else {
          setError("加载查询条件失败")
        }
      })
      .finally(() => {
        clearTimeout(timeoutId)
      })
  }, [slug])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setResults([])
    setHasSearched(true)

    const missingRequired = conditions.filter((c) => c.required && !values[c.id]?.trim())
    if (missingRequired.length > 0) {
      setError(`请填写必填项: ${missingRequired.map((c) => c.name).join(", ")}`)
      setLoading(false)
      return
    }

    try {
      const queryParams: Record<string, string> = {}
      conditions.forEach((condition) => {
        const value = values[condition.id]
        if (value) {
          queryParams[condition.column_name] = value
        }
      })

      const response = await fetch(`/api/query/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(queryParams),
      })

      const data = await response.json()

      if (data.success) {
        setResults(data.results)
      } else {
        setError(data.error || "查询失败")
      }
    } catch (err) {
      setError("查询错误")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold mt-12 mb-8 text-center text-foreground">{title || "数据查询"}</h1>

        <div className="px-6 py-8 mb-10">
          {error && !conditions.length && (
            <div className="p-4 bg-destructive/10 border border-destructive rounded text-destructive text-base mb-4">
              {error}
            </div>
          )}

          {conditions.length === 0 && !error && (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
          )}

          {conditions.length > 0 && (
            <form onSubmit={handleSearch} className="space-y-6">
              {conditions.map((condition) => (
                <div key={condition.id}>
                  <label className="block text-base font-medium text-foreground mb-2">
                    {condition.name}
                    {condition.required ? (
                      <span className="text-destructive ml-1">*</span>
                    ) : (
                      <span className="text-muted-foreground ml-1 text-xs">(选填)</span>
                    )}
                  </label>
                  <input
                    type={condition.type === "number" ? "number" : condition.type === "date" ? "date" : "text"}
                    value={values[condition.id] || ""}
                    onChange={(e) =>
                      setValues({
                        ...values,
                        [condition.id]: e.target.value,
                      })
                    }
                    required={condition.required}
                    className="w-full px-4 py-3 text-base border border-input rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder={`请输入${condition.name}`}
                  />
                </div>
              ))}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg text-base font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? "查询中..." : "查询"}
              </button>
            </form>
          )}
        </div>

        {error && results.length === 0 && conditions.length > 0 && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded text-destructive text-base">
            {error}
          </div>
        )}



        {results.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">查询结果 ({results.length} 条)</h3>
            {results.map((result, resultIdx) => (
              <div key={resultIdx} className="rounded-lg border border-border p-6 bg-card space-y-5">
                {Object.entries(result)
                  .filter(([key]) => key !== "id" && key !== "created_at")
                  .map(([key, value], fieldIdx) => (
                    <div key={key} className="space-y-1.5">
                      <div className="text-base font-medium text-foreground">
                        {fieldIdx + 1} {key}
                      </div>
                      <div className="px-4 py-3 bg-background rounded-lg text-base text-foreground break-all">
                        {String(value)}
                      </div>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        )}

        {results.length === 0 && !loading && !error && hasSearched && (
          <p className="text-center text-base text-destructive">未查询到结果</p>
        )}
      </div>
    </div>
  )
}

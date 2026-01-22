"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast, ToastContainer } from "@/components/toast"
import { ArrowLeft, Save } from "lucide-react"

interface Dataset {
  id: string
  name: string
  table_name: string
  total_rows: number
}

interface CellEdit {
  rowId: number
  columnName: string
  value: string
}

export default function DatasetEditPage() {
  const params = useParams()
  const router = useRouter()
  const { toasts, showToast, closeToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dataset, setDataset] = useState<Dataset | null>(null)
  const [columns, setColumns] = useState<string[]>([])
  const [data, setData] = useState<any[]>([])
  const [editedCells, setEditedCells] = useState<Map<string, CellEdit>>(new Map())

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/datasets/${params.id}/data`)
      const result = await res.json()

      if (res.ok) {
        setDataset(result.dataset)
        setColumns(result.columns)
        setData(result.data)
      } else {
        showToast(result.error || "加载失败", "error")
        setTimeout(() => router.push("/admin"), 2000)
      }
    } catch (error) {
      showToast("加载失败: 网络错误", "error")
      setTimeout(() => router.push("/admin"), 2000)
    } finally {
      setLoading(false)
    }
  }

  const handleCellChange = (rowId: number, columnName: string, value: string) => {
    const key = `${rowId}-${columnName}`
    setEditedCells((prev) => {
      const newMap = new Map(prev)
      newMap.set(key, { rowId, columnName, value })
      return newMap
    })

    // Update local data immediately for UI feedback
    setData((prevData) =>
      prevData.map((row) => (row.id === rowId ? { ...row, [columnName]: value } : row))
    )
  }

  const handleSaveAll = async () => {
    if (editedCells.size === 0) {
      showToast("没有修改需要保存", "warning")
      return
    }

    setSaving(true)
    let successCount = 0
    let errorCount = 0

    for (const [key, edit] of editedCells.entries()) {
      try {
        const res = await fetch(`/api/admin/datasets/${params.id}/data`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(edit),
        })

        if (res.ok) {
          successCount++
        } else {
          errorCount++
        }
      } catch (error) {
        errorCount++
      }
    }

    setSaving(false)
    setEditedCells(new Map())

    if (errorCount === 0) {
      showToast(`成功保存 ${successCount} 处修改`, "success")
    } else {
      showToast(`保存完成: ${successCount} 成功, ${errorCount} 失败`, "warning")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    )
  }

  if (!dataset) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">数据集未找到</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => router.push("/admin")}>
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                返回
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-foreground">{dataset.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {dataset.total_rows} 行数据 · {columns.length} 列
                </p>
              </div>
            </div>
            <Button onClick={handleSaveAll} disabled={saving || editedCells.size === 0}>
              <Save className="w-4 h-4 mr-1.5" />
              {saving ? "保存中..." : `保存 ${editedCells.size > 0 ? `(${editedCells.size})` : ""}`}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-r border-border">
                    #
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-r border-border last:border-r-0"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((row, rowIndex) => (
                  <tr key={row.id} className="hover:bg-muted/50">
                    <td className="px-4 py-2 text-sm text-muted-foreground border-r border-border font-mono">
                      {rowIndex + 1}
                    </td>
                    {columns.map((col) => (
                      <td key={col} className="px-2 py-2 border-r border-border last:border-r-0">
                        <input
                          type="text"
                          value={row[col] || ""}
                          onChange={(e) => handleCellChange(row.id, col, e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-transparent rounded bg-transparent text-foreground focus:border-primary focus:outline-none focus:bg-background"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} onClose={closeToast} />
    </div>
  )
}

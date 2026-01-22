"use client"

import React from "react"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast, ToastContainer } from "@/components/toast"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Pencil, Upload, Link2, X } from "lucide-react"

interface Dataset {
  id: string
  name: string
  total_rows: number
  created_at: string
}

interface QueryLink {
  id: string
  slug: string
  title: string | null
  dataset_name: string
  created_at: string
}

interface Column {
  name: string
  type: string
}

interface ConditionConfig {
  columnName: string
  displayName: string
  isRequired: boolean
}

export default function AdminDashboard() {
  const { showToast, toasts, onClose: closeToast } = useToast()
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [links, setLinks] = useState<QueryLink[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  
  // Dialog states
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  })
  const [uploadDialog, setUploadDialog] = useState(false)
  const [linkDialog, setLinkDialog] = useState(false)
  const [editLinkDialog, setEditLinkDialog] = useState<{
    isOpen: boolean
    id: string
    slug: string
    title: string
  }>({
    isOpen: false,
    id: "",
    slug: "",
    title: ""
  })
  
  // Upload dataset states
  const [uploading, setUploading] = useState(false)
  const [datasetName, setDatasetName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Generate link states
  const [generating, setGenerating] = useState(false)
  const [selectedDatasetId, setSelectedDatasetId] = useState("")
  const [linkSlug, setLinkSlug] = useState("")
  const [linkTitle, setLinkTitle] = useState("")
  const [availableColumns, setAvailableColumns] = useState<Column[]>([])
  const [selectedConditions, setSelectedConditions] = useState<ConditionConfig[]>([])
  const [loadingColumns, setLoadingColumns] = useState(false)
  const [generatedLink, setGeneratedLink] = useState("")
  
  const [saving, setSaving] = useState(false)

  const loadData = () => {
    setLoading(true)
    Promise.all([fetch("/api/admin/datasets"), fetch("/api/admin/query-links")])
      .then(([datasetsRes, linksRes]) => Promise.all([datasetsRes.json(), linksRes.json()]))
      .then(([datasetsData, linksData]) => {
        setDatasets(datasetsData.datasets || [])
        setLinks(linksData.links || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  // Upload dataset handler
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fileInputRef.current?.files?.[0] || !datasetName) {
      showToast("请填写所有字段", "warning")
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append("file", fileInputRef.current.files[0])
    formData.append("name", datasetName)

    try {
      const response = await fetch("/api/admin/upload-excel", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        showToast(`上传成功！已导入 ${data.rowCount} 行数据`, "success")
        setDatasetName("")
        if (fileInputRef.current) fileInputRef.current.value = ""
        setUploadDialog(false)
        loadData()
      } else {
        showToast(data.details || data.error || "上传失败", "error")
      }
    } catch (error) {
      showToast("网络错误，请重试", "error")
    } finally {
      setUploading(false)
    }
  }

  // Fetch columns when dataset is selected
  useEffect(() => {
    if (!selectedDatasetId) {
      setAvailableColumns([])
      setSelectedConditions([])
      return
    }

    const fetchColumns = async () => {
      setLoadingColumns(true)
      try {
        const response = await fetch(`/api/admin/datasets/${selectedDatasetId}`)
        const data = await response.json()
        if (data.success) {
          setAvailableColumns(data.columns)
        }
      } catch (error) {
        console.error("Failed to load columns:", error)
      } finally {
        setLoadingColumns(false)
      }
    }
    fetchColumns()
  }, [selectedDatasetId])

  // Generate link handler
  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedDatasetId || !linkSlug || selectedConditions.length === 0) {
      showToast("请填写所有字段并选择至少一个查询条件", "warning")
      return
    }

    setGenerating(true)
    try {
      const response = await fetch("/api/admin/generate-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datasetId: selectedDatasetId,
          slug: linkSlug,
          title: linkTitle || null,
          conditions: selectedConditions,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setGeneratedLink(data.link)
        showToast("链接生成成功", "success")
        loadData()
        setTimeout(() => {
          setLinkDialog(false)
          setLinkSlug("")
          setLinkTitle("")
          setSelectedConditions([])
          setSelectedDatasetId("")
          setGeneratedLink("")
        }, 2000)
      } else {
        showToast("生成失败: " + data.error, "error")
      }
    } catch (error) {
      showToast("生成错误", "error")
    } finally {
      setGenerating(false)
    }
  }

  const toggleColumn = (column: Column) => {
    setSelectedConditions((prev) => {
      const exists = prev.find((c) => c.columnName === column.name)
      if (exists) {
        return prev.filter((c) => c.columnName !== column.name)
      } else {
        return [
          ...prev,
          {
            columnName: column.name,
            displayName: column.name,
            isRequired: true,
          },
        ]
      }
    })
  }

  const toggleRequired = (columnName: string) => {
    setSelectedConditions((prev) =>
      prev.map((c) => (c.columnName === columnName ? { ...c, isRequired: !c.isRequired } : c)),
    )
  }

  const handleDeleteDataset = (id: string, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "确认删除",
      message: `确定要删除数据集"${name}"吗？这将删除所有相关数据和查询链接。`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/datasets/${id}`, { method: "DELETE" })
          const data = await res.json()

          if (res.ok) {
            showToast("删除成功", "success")
            loadData()
          } else {
            showToast(`删除失败: ${data.error || "未知错误"}`, "error")
          }
        } catch (error) {
          showToast("删除失败: 网络错误", "error")
        } finally {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }))
        }
      }
    })
  }

  const handleEditDataset = (dataset: Dataset) => {
    router.push(`/admin/datasets/${dataset.id}`)
  }

  const handleEditLink = (link: QueryLink) => {
    setEditLinkDialog({
      isOpen: true,
      id: link.id,
      slug: link.slug,
      title: link.title || ""
    })
  }

  const handleSaveLink = async () => {
    if (!editLinkDialog.slug.trim()) {
      showToast("链接标识符不能为空", "warning")
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/query-links/${editLinkDialog.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: editLinkDialog.slug.trim(),
          title: editLinkDialog.title.trim() || null
        })
      })
      const data = await res.json()

      if (res.ok) {
        showToast("链接已更新", "success")
        loadData()
        setEditLinkDialog(prev => ({ ...prev, isOpen: false }))
      } else {
        showToast(`更新失败: ${data.error || "未知错误"}`, "error")
      }
    } catch (error) {
      showToast("更新失败: 网络错误", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteLink = (id: string, slug: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "确认删除",
      message: `确定要删除查询链接"${slug}"吗？`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/query-links/${id}`, { method: "DELETE" })
          const data = await res.json()

          if (res.ok) {
            showToast("删除成功", "success")
            loadData()
          } else {
            showToast(`删除失败: ${data.error || "未知错误"}`, "error")
          }
        } catch (error) {
          showToast("删除失败: 网络错误", "error")
        } finally {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }))
        }
      }
    })
  }

  

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Statistics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-5 rounded-lg border border-border bg-card">
          <h3 className="text-xs text-muted-foreground mb-1.5">数据集总数</h3>
          <p className="text-2xl font-bold text-foreground">{datasets.length}</p>
        </div>
        <div className="p-5 rounded-lg border border-border bg-card">
          <h3 className="text-xs text-muted-foreground mb-1.5">总行数</h3>
          <p className="text-2xl font-bold text-foreground">{datasets.reduce((sum, d) => sum + d.total_rows, 0)}</p>
        </div>
        <div className="p-5 rounded-lg border border-border bg-card">
          <h3 className="text-xs text-muted-foreground mb-1.5">查询链接数</h3>
          <p className="text-2xl font-bold text-foreground">{links.length}</p>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="flex gap-3 mb-6">
        <Button onClick={() => setUploadDialog(true)} className="gap-2">
          <Upload className="w-4 h-4" />
          上传数据集
        </Button>
        <Button onClick={() => setLinkDialog(true)} className="gap-2" variant="outline">
          <Link2 className="w-4 h-4" />
          生成查询链接
        </Button>
      </div>

      {/* Data Lists Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-foreground">数据集</h3>
          {loading ? (
            <p className="text-sm text-muted-foreground">加载中...</p>
          ) : datasets.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无数据集</p>
          ) : (
            <div className="space-y-2">
              {datasets.map((d) => (
                <div
                  key={d.id}
                  className="flex justify-between items-center p-3.5 rounded-lg border border-border bg-card hover:bg-accent/50 transition"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.total_rows} 行</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditDataset(d)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteDataset(d.id, d.name)}>
                      删除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-base font-semibold text-foreground">查询链接</h3>
          {loading ? (
            <p className="text-sm text-muted-foreground">加载中...</p>
          ) : links.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无查询链接</p>
          ) : (
            <div className="space-y-2">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="flex justify-between items-center p-3.5 rounded-lg border border-border bg-card hover:bg-accent/50 transition"
                >
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="text-sm font-medium text-foreground truncate">
                      <a
                        href={`/q/${link.slug}`}
                        target="_blank"
                        className="text-primary hover:underline"
                        rel="noreferrer"
                      >
                        /q/{link.slug}
                      </a>
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{link.dataset_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditLink(link)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteLink(link.id, link.slug)}>
                      删除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
<ConfirmDialog
      isOpen={confirmDialog.isOpen}
      title={confirmDialog.title}
      message={confirmDialog.message}
      onConfirm={confirmDialog.onConfirm}
      onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      confirmVariant="destructive"
    />

    {/* Upload Dataset Dialog */}
    {uploadDialog && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-card border border-border rounded-lg p-6 w-full max-w-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">上传数据集</h3>
            <button onClick={() => setUploadDialog(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">数据集名称</label>
              <input
                type="text"
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-input rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="例如：成绩数据"
                disabled={uploading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">选择 Excel 文件</label>
              <input ref={fileInputRef} type="file" accept=".xlsx" className="w-full text-sm" disabled={uploading} />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setUploadDialog(false)} disabled={uploading}>
                取消
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? "上传中..." : "上传"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* Generate Link Dialog */}
    {linkDialog && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl my-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">生成查询链接</h3>
            <button onClick={() => setLinkDialog(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleGenerateLink} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">选择数据集</label>
              <select
                value={selectedDatasetId}
                onChange={(e) => setSelectedDatasetId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-input rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">请选择数据集</option>
                {datasets.map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name} ({dataset.total_rows} 行)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">页面标题（选填）</label>
              <input
                type="text"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="例如：成绩查询系统"
                className="w-full px-3 py-2 text-sm border border-input rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">链接标识符 (slug)</label>
              <input
                type="text"
                value={linkSlug}
                onChange={(e) => setLinkSlug(e.target.value)}
                placeholder="例如：chengji-6class"
                className="w-full px-3 py-2 text-sm border border-input rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <p className="text-xs text-muted-foreground mt-1">用户将通过 /q/[slug] 访问查询页面</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                选择查询条件 {selectedConditions.length > 0 && `(已选 ${selectedConditions.length} 项)`}
              </label>
              {loadingColumns ? (
                <div className="text-sm text-muted-foreground">加载列中...</div>
              ) : availableColumns.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  {selectedDatasetId ? "该数据集暂无可用列" : "请先选择数据集"}
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto border border-input rounded p-2.5 bg-background">
                  {availableColumns.map((column) => (
                    <label
                      key={column.name}
                      className="flex items-center gap-2.5 cursor-pointer hover:bg-accent p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedConditions.some((c) => c.columnName === column.name)}
                        onChange={() => toggleColumn(column)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-foreground font-medium">{column.name}</span>
                      <span className="text-xs text-muted-foreground">({column.type})</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {selectedConditions.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">设置条件类型</label>
                <div className="space-y-2 border border-input rounded p-3 bg-background">
                  {selectedConditions.map((condition) => (
                    <div
                      key={condition.columnName}
                      className="flex items-center justify-between p-2 rounded hover:bg-accent"
                    >
                      <span className="text-sm text-foreground">{condition.displayName}</span>
                      <button
                        type="button"
                        onClick={() => toggleRequired(condition.columnName)}
                        className={`px-3 py-1 text-xs font-medium rounded transition ${
                          condition.isRequired
                            ? "bg-red-500/10 text-red-600 border border-red-500/30"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {condition.isRequired ? "必填" : "选填"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {generatedLink && (
              <div className="p-4 bg-accent/50 border border-border rounded">
                <p className="text-xs text-muted-foreground mb-2">生成的链接：</p>
                <div className="flex gap-2">
                  <a href={generatedLink} target="_blank" className="text-sm text-primary hover:underline flex-1 truncate" rel="noreferrer">
                    {generatedLink}
                  </a>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedLink)
                      showToast("已复制到剪贴板", "success")
                    }}
                  >
                    复制
                  </Button>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setLinkDialog(false)} disabled={generating}>
                取消
              </Button>
              <Button type="submit" disabled={generating || !selectedDatasetId || !linkSlug || selectedConditions.length === 0}>
                {generating ? "生成中..." : "生成链接"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* Edit Link Dialog */}
      {editLinkDialog.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">编辑查询链接</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">链接标识符 (slug)</label>
                <input
                  type="text"
                  value={editLinkDialog.slug}
                  onChange={(e) => setEditLinkDialog(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-input rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="例如：chengji-6class"
                />
                <p className="text-xs text-muted-foreground mt-1">用户将通过 /q/[slug] 访问查询页面</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">页面标题（选填）</label>
                <input
                  type="text"
                  value={editLinkDialog.title}
                  onChange={(e) => setEditLinkDialog(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-input rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="例如：成绩查询系统"
                />
                <p className="text-xs text-muted-foreground mt-1">留空则显示"数据查询"</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setEditLinkDialog(prev => ({ ...prev, isOpen: false }))}
                disabled={saving}
              >
                取消
              </Button>
              <Button onClick={handleSaveLink} disabled={saving}>
                {saving ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onClose={closeToast} />
    </div>
  )
}

"use client"

import React, { useState, useEffect } from "react"

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmVariant?: "default" | "destructive"
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmVariant = "default"
}) => {
  useEffect(() => {
    if (isOpen) {
      // 防止背景滚动
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
    
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isOpen])

  if (!isOpen) return null

  const confirmBtnClass = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90"
  }[confirmVariant]

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-md w-full">
        <div className="p-5 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        </div>
        <div className="p-5">
          <p className="text-sm text-foreground">{message}</p>
        </div>
        <div className="p-4 border-t border-border flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-background text-foreground hover:bg-accent transition"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${confirmBtnClass} text-white transition`}
          >
            确认
          </button>
        </div>
      </div>
    </div>
  )
}

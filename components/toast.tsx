"use client"

import React, { useState, useEffect } from "react"

interface ToastProps {
  message: string
  type?: "success" | "error" | "warning" | "info"
  duration?: number
  onClose: () => void
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = "info", 
  duration = 3000, 
  onClose 
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const bgColor = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500"
  }[type]

  const textColor = {
    success: "text-green-50",
    error: "text-red-50",
    warning: "text-yellow-50",
    info: "text-blue-50"
  }[type]

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center ${bgColor} ${textColor}`}>
      <span className="text-sm font-medium">{message}</span>
      <button 
        onClick={onClose}
        className="ml-3 text-white opacity-80 hover:opacity-100 transition-opacity"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: {
    id: string
    message: string
    type: "success" | "error" | "warning" | "info"
    duration: number
  }[]
  onClose: (id: string) => void
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-3">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => onClose(toast.id)}
        />
      ))}
    </div>
  )
}

export interface ToastHookReturn {
  showToast: (message: string, type?: "success" | "error" | "warning" | "info", duration?: number) => void
  toasts: {
    id: string
    message: string
    type: "success" | "error" | "warning" | "info"
    duration: number
  }[]
  onClose: (id: string) => void
}

export const useToast = (): ToastHookReturn => {
  const [toasts, setToasts] = useState<{
    id: string
    message: string
    type: "success" | "error" | "warning" | "info"
    duration: number
  }[]>([])

  const showToast = (message: string, type: "success" | "error" | "warning" | "info" = "info", duration: number = 3000) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5)
    setToasts((prev) => [...prev, { id, message, type, duration }])
  }

  const onClose = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return { showToast, toasts, onClose }
}

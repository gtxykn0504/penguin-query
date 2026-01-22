import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { randomUUID } from "crypto"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return randomUUID()
}

export function sanitizeInput(input: string): string {
  if (!input) return ""
  return input
    .trim()
    .replace(/[<>'"`;\\]/g, "") // Remove dangerous characters
    .substring(0, 255)
}

export function isValidTableName(tableName: string): boolean {
  // Only allow dataset_ prefix and alphanumeric + underscore
  return /^dataset_[a-zA-Z0-9_]{1,50}$/.test(tableName)
}

export function isValidColumnName(columnName: string): boolean {
  // Only allow alphanumeric, underscore, and Chinese characters
  return /^[\u4e00-\u9fa5a-zA-Z0-9_\s]{1,100}$/.test(columnName)
}

export function escapeIdentifier(identifier: string): string {
  return `\`${identifier.replace(/`/g, "``")}\``
}

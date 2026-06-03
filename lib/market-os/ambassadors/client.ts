"use client"

import type {
  AmbassadorEntityRecord,
  AmbassadorWorkspaceSnapshot,
  ApiResponse,
} from "./types"
import { buildCsv, datedFilename } from "./validation"

async function parseApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null
  if (!payload) return { ok: false, error: "Ambassador API returned an invalid response" }
  if (!response.ok && payload.ok) return { ...payload, ok: false, error: payload.error || `Request failed with ${response.status}` }
  return payload
}

export async function ambassadorApi<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`/api/market-os/ambassadors${path}`, {
      cache: "no-store",
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    })
    return parseApiResponse<T>(response)
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Ambassador request failed" }
  }
}

export function loadAmbassadorSnapshot() {
  return ambassadorApi<AmbassadorWorkspaceSnapshot>("")
}

export function createAmbassadorRecord<T extends AmbassadorEntityRecord>(path: string, payload: Record<string, unknown>) {
  return ambassadorApi<T>(path, { method: "POST", body: JSON.stringify(payload) })
}

export function updateAmbassadorRecord<T extends AmbassadorEntityRecord>(path: string, payload: Record<string, unknown>) {
  return ambassadorApi<T>(path, { method: "PATCH", body: JSON.stringify(payload) })
}

export function archiveAmbassadorRecord<T extends AmbassadorEntityRecord>(path: string) {
  return ambassadorApi<T>(path, { method: "DELETE" })
}

export function downloadCsv(filename: string, headers: string[], rows: unknown[][]): void {
  const csv = buildCsv(headers, rows)
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function downloadAmbassadorCsv(reportType: string, headers: string[], rows: unknown[][]): void {
  downloadCsv(datedFilename("market-os-ambassadors", reportType), headers, rows)
}

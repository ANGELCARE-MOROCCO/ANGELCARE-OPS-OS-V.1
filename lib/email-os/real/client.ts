"use client"

export async function realEmailOSRequest<T>(
  path: string,
  options?: RequestInit
): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const res = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {})
      }
    })
    const json = await res.json().catch(() => null)
    if (!res.ok) return { ok: false, error: json?.error || `HTTP ${res.status}` }
    return { ok: true, data: json?.data ?? json }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Request failed" }
  }
}

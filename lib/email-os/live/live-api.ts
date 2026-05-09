export type LiveApiResult<T = unknown> = {
  ok: boolean
  data?: T
  error?: string
  status?: number
}

export async function liveEmailOSFetch<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<LiveApiResult<T>> {
  try {
    const response = await fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {})
      }
    })

    const text = await response.text()
    let parsed: unknown = null

    try {
      parsed = text ? JSON.parse(text) : null
    } catch {
      parsed = text
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error:
          typeof parsed === "object" && parsed && "error" in parsed
            ? String((parsed as { error?: unknown }).error)
            : `Email-OS request failed: ${response.status}`
      }
    }

    return { ok: true, status: response.status, data: parsed as T }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown Email-OS live request error"
    }
  }
}

export function unwrapEmailOSData<T>(result: LiveApiResult<any>, fallback: T): T {
  if (!result.ok) return fallback
  if (result.data && typeof result.data === "object" && "data" in result.data) {
    return (result.data as { data?: T }).data ?? fallback
  }
  return (result.data as T) ?? fallback
}

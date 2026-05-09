
export type EmailOSApiResult<T = unknown> = {
  ok: boolean
  data?: T
  error?: string
  status?: number
}

export async function emailOSFetch<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<EmailOSApiResult<T>> {
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
            : `Request failed with status ${response.status}`
      }
    }

    return { ok: true, status: response.status, data: parsed as T }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown Email-OS request error"
    }
  }
}

export function buildEmailOSQuery(params: Record<string, string | number | boolean | undefined>) {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) query.set(key, String(value))
  })

  const value = query.toString()
  return value ? `?${value}` : ""
}

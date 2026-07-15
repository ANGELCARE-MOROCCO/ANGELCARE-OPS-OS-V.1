export type EmailOSResult<T = any> = {
  ok: boolean
  data?: T
  error?: string | null
}

export async function emailOSApi<T = any>(path: string, options?: RequestInit): Promise<EmailOSResult<T>> {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {})
    }
  })

  const json = await res.json().catch(() => null)

  return {
    ok: res.ok && json?.ok !== false,
    data: json?.data ?? json,
    error: json?.error || (!res.ok ? `HTTP ${res.status}` : null)
  }
}

export function asArray(payload: any) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

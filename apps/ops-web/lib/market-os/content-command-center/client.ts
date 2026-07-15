
export async function contentCommandFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.error || `Content Command request failed: ${url}`)
  }
  return payload as T
}

export const contentCommandProductionApi = {
  listAssets: (family?: string) =>
    contentCommandFetch<any>(`/api/market-os/content-command-center/assets${family ? `?family=${encodeURIComponent(family)}` : ""}`),

  saveAsset: (payload: any) =>
    contentCommandFetch<any>("/api/market-os/content-command-center/assets", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  deleteAsset: (id: string) =>
    contentCommandFetch<any>(`/api/market-os/content-command-center/assets/${id}`, {
      method: "DELETE",
    }),

  listDocuments: () =>
    contentCommandFetch<any>("/api/market-os/content-command-center/documents"),

  saveDocument: (payload: any) =>
    contentCommandFetch<any>("/api/market-os/content-command-center/documents", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  deleteDocument: (id: string) =>
    contentCommandFetch<any>(`/api/market-os/content-command-center/documents/${id}`, {
      method: "DELETE",
    }),

  listTasks: (entityId?: string) =>
    contentCommandFetch<any>(`/api/market-os/content-command-center/tasks${entityId ? `?entity_id=${encodeURIComponent(entityId)}` : ""}`),

  saveTask: (payload: any) =>
    contentCommandFetch<any>("/api/market-os/content-command-center/tasks", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  listComments: (entityId?: string) =>
    contentCommandFetch<any>(`/api/market-os/content-command-center/comments${entityId ? `?entity_id=${encodeURIComponent(entityId)}` : ""}`),

  saveComment: (payload: any) =>
    contentCommandFetch<any>("/api/market-os/content-command-center/comments", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  logActivity: (payload: any) =>
    contentCommandFetch<any>("/api/market-os/content-command-center/activity", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
}

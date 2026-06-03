"use client"

type ProspectLike = {
  id: string
  name?: string
  company?: string
  city?: string
  stage?: string
  priority?: string
  valueMad?: number
  score?: number
  updatedAt?: string
  createdAt?: string
}

async function revenueProspectsApi<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok || payload?.ok === false) {
    throw new Error(String(payload?.error || `Revenue prospects request failed: ${response.status}`))
  }
  return payload as T
}

export async function loadProductionProspects<T = ProspectLike>(): Promise<T[]> {
  const payload = await revenueProspectsApi<{ prospects?: T[]; data?: T[]; items?: T[] }>(
    "/api/revenue-command-center/prospects?includeArchived=false&limit=5000",
  )
  return payload.prospects || payload.data || payload.items || []
}

export async function saveProductionProspect<T extends ProspectLike>(prospect: T) {
  const payload = await revenueProspectsApi<{ prospect?: T; data?: T; item?: T }>("/api/revenue-command-center/prospects", {
    method: prospect.id ? "PATCH" : "POST",
    body: JSON.stringify(prospect),
  })
  return payload.prospect || payload.data || payload.item
}

export async function saveProductionProspectsBulk<T extends ProspectLike>(prospects: T[]) {
  if (!prospects.length) return []
  const saved = await Promise.all(prospects.map((prospect) => saveProductionProspect(prospect)))
  return saved.filter(Boolean)
}

export async function deleteProductionProspect(id: string) {
  await revenueProspectsApi(`/api/revenue-command-center/prospects?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  })
}

export async function migrateBrowserProspectsToProduction<T extends ProspectLike>(prospects: T[]) {
  const result = await saveProductionProspectsBulk(prospects)
  return { count: result.length }
}

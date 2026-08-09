import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/getUser"

export type SocialCommandActor = {
  id: string
  name: string
  email: string
  role: string
  raw: Record<string, unknown>
}

export async function getSocialCommandActor(): Promise<SocialCommandActor | null> {
  const user = await getCurrentUser()
  if (!user) return null
  const raw = user as unknown as Record<string, unknown>
  const id = String(raw.id || "").trim()
  if (!id) return null
  return {
    id,
    name: String(raw.full_name || raw.fullName || raw.username || raw.email || "Utilisateur AngelCare"),
    email: String(raw.email || ""),
    role: String(raw.role || raw.role_key || "user"),
    raw,
  }
}

export async function requireSocialCommandActor() {
  const actor = await getSocialCommandActor()
  if (!actor) {
    return { ok: false as const, response: NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 }) }
  }
  return { ok: true as const, actor }
}

export function socialOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, { ...init, headers: { "cache-control": "no-store", ...(init?.headers || {}) } })
}

export function socialError(error: unknown, status = 400, details?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error || "Unknown error")
  return NextResponse.json({ ok: false, error: message, ...(details || {}) }, { status, headers: { "cache-control": "no-store" } })
}

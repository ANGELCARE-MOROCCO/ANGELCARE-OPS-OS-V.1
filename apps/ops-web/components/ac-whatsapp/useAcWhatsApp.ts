"use client"

import { useCallback, useEffect, useState } from "react"
import type { AcWhatsAppBootstrap } from "@/lib/ac-whatsapp/types"
import { normalizeConversationSnapshot } from "@/lib/ac-whatsapp/stability"

type Notice = { title: string; description: string; reference?: string }

export function friendlyAcError(error: unknown): Notice {
  const raw = error instanceof Error ? error.message : String(error || "Erreur inconnue")
  const key = raw.toUpperCase()
  if (key.includes("OPENWA_NOT_CONFIGURED")) return { title: "Runtime OpenWA non configuré", description: "Les variables serveur OpenWA doivent être présentes dans l’environnement actif.", reference: raw }
  if (key.includes("OPENWA_UNAVAILABLE") || key.includes("FETCH_FAILED")) return { title: "Passerelle WhatsApp indisponible", description: "Le poste Windows, Caddy ou OpenWA ne répond pas. Vérifiez la santé du runtime avant de réessayer.", reference: raw }
  if (key.includes("ACCOUNT_ADMIN_ACCESS_DENIED") || key.includes("FORBIDDEN")) return { title: "Action non autorisée", description: "Votre rôle ne dispose pas de l’autorisation requise pour cette opération.", reference: raw }
  if (key.includes("UNAUTHORIZED")) return { title: "Session expirée", description: "Reconnectez-vous à AngelCare puis relancez l’opération.", reference: raw }
  if (key.includes("ACCOUNT_NAME_REQUIRED")) return { title: "Nom du compte requis", description: "Renseignez une identité interne claire avant de créer la session.", reference: raw }
  if (key.includes("PAIRING_PHONE_REQUIRED")) return { title: "Numéro requis", description: "Ajoutez un numéro E.164 avant de demander un code d’appairage.", reference: raw }
  if (key.includes("STATUS_CHECK") || key.includes("VIOLATES CHECK")) return { title: "État de session incompatible", description: "Le statut reçu n’est pas accepté par le modèle AngelCare. Synchronisez la version applicative et la migration.", reference: raw }
  if (key.includes("DISPLAY_NAME") || key.includes("COLUMN")) return { title: "Compatibilité de schéma à vérifier", description: "La version applicative attend une structure utilisateur différente de la base active.", reference: raw }
  return { title: "Opération non terminée", description: raw, reference: raw.slice(0, 180) }
}

export async function acApi<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: "no-store", headers: { "Content-Type": "application/json", ...(init?.headers || {}) } })
  const payload = await response.json().catch(() => null)
  if (!response.ok || payload?.ok === false) throw new Error(payload?.error || payload?.message || `HTTP_${response.status}`)
  return (payload?.data ?? payload) as T
}

export function useAcWhatsApp(refreshMs = 20000) {
  const [data, setData] = useState<AcWhatsAppBootstrap | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const next = normalizeConversationSnapshot(await acApi<AcWhatsAppBootstrap>("/api/ac-whatsapp/bootstrap"))
      setData(next)
      setError(null)
      return next
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "BOOTSTRAP_FAILED")
      throw cause
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    refresh().catch(() => undefined)
    const timer = window.setInterval(() => { if (active && document.visibilityState === "visible") refresh().catch(() => undefined) }, refreshMs)
    return () => { active = false; window.clearInterval(timer) }
  }, [refresh, refreshMs])

  return { data, loading, error, refresh, setData }
}

export function formatRelative(value?: string | null) {
  if (!value) return "Jamais"
  const ms = Date.now() - new Date(value).getTime()
  if (!Number.isFinite(ms)) return "Date inconnue"
  const minutes = Math.max(0, Math.floor(ms / 60000))
  if (minutes < 1) return "À l’instant"
  if (minutes < 60) return `Il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Il y a ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `Il y a ${days} j`
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value))
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date)
}

export function initials(value?: string | null) {
  return String(value || "AC").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "AC"
}

export function percentage(numerator: number, denominator: number) {
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0
}

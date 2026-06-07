"use client"

import { useEffect, useMemo, useRef, useState } from "react"

const MANAGED_PREFIXES = [
  "revenue_",
  "market_",
  "ambassador_",
  "seo_",
  "content_",
  "csv_",
  "task_",
  "tasks_",
  "staff_",
  "angelcare_",
]

const BLOCKED_FRAGMENTS = [
  "supabase.auth",
  "sb-",
  "auth-token",
  "access_token",
  "refresh_token",
  "password",
  "secret",
]

function isManagedKey(key: string) {
  const lower = key.toLowerCase()
  if (BLOCKED_FRAGMENTS.some((fragment) => lower.includes(fragment))) return false
  return MANAGED_PREFIXES.some((prefix) => lower.startsWith(prefix) || lower.includes(prefix))
}

function collectManagedLocalStorage() {
  if (typeof window === "undefined") return []
  const snapshots: { key: string; value: string; source: string; origin: string }[] = []
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index)
    if (!key || !isManagedKey(key)) continue
    const value = localStorage.getItem(key)
    if (value == null) continue
    snapshots.push({ key, value, source: "browser-boot", origin: window.location.origin })
  }
  return snapshots
}

async function syncSnapshots(snapshots: { key: string; value: string; source: string; origin: string }[]) {
  try {
    const response = await fetch("/api/persistence/local-storage", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ snapshots }),
    })

    if (!response.ok) {
      console.warn(`Persistence sync skipped: ${response.status}`)
      return { ok: false, snapshots: [] } as { ok: boolean; snapshots?: { key: string; value: string; updatedAt?: string }[] }
    }

    return response.json() as Promise<{ ok: boolean; snapshots?: { key: string; value: string; updatedAt?: string }[] }>
  } catch (error) {
    console.warn("Persistence sync unavailable", error)
    return { ok: false, snapshots: [] } as { ok: boolean; snapshots?: { key: string; value: string; updatedAt?: string }[] }
  }
}

export default function GlobalLocalStoragePersistenceBridge() {
  const [status, setStatus] = useState<"idle" | "syncing" | "live" | "error">("idle")
  const [count, setCount] = useState(0)
  const queueRef = useRef<Map<string, string>>(new Map())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const patchedRef = useRef(false)

  const label = useMemo(() => {
    if (status === "live") return `Global persistence live · ${count} stores`
    if (status === "syncing") return "Global persistence syncing…"
    if (status === "error") return "Persistence sync needs attention"
    return "Global persistence ready"
  }, [count, status])

  useEffect(() => {
    if (typeof window === "undefined" || patchedRef.current) return
    patchedRef.current = true

    const flush = async () => {
      if (queueRef.current.size === 0) return
      const snapshots = Array.from(queueRef.current.entries()).map(([key, value]) => ({
        key,
        value,
        source: "browser-live-write",
        origin: window.location.origin,
      }))
      queueRef.current.clear()
      try {
        setStatus("syncing")
        const result = await syncSnapshots(snapshots)
        setCount(result.snapshots?.length || snapshots.length)
        setStatus("live")
      } catch (error) {
        console.error("[AngelCare Persistence] live sync failed", error)
        snapshots.forEach((item) => queueRef.current.set(item.key, item.value))
        setStatus("error")
      }
    }

    const schedule = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(flush, 900)
    }

    const originalSetItem = localStorage.setItem.bind(localStorage)
    const originalRemoveItem = localStorage.removeItem.bind(localStorage)
    const originalClear = localStorage.clear.bind(localStorage)

    localStorage.setItem = (key: string, value: string) => {
      originalSetItem(key, value)
      if (isManagedKey(key)) {
        queueRef.current.set(key, value)
        schedule()
      }
    }

    localStorage.removeItem = (key: string) => {
      originalRemoveItem(key)
      // Important: deletes are intentionally NOT synced automatically.
      // This prevents one browser accident from erasing production data for everyone.
    }

    localStorage.clear = () => {
      originalClear()
      // Important: clear() is not propagated to the database.
    }

    const boot = async () => {
      try {
        setStatus("syncing")
        const localSnapshots = collectManagedLocalStorage()
        const result = await syncSnapshots(localSnapshots)
        let restored = 0
        for (const item of result.snapshots || []) {
          if (!isManagedKey(item.key)) continue
          const existing = localStorage.getItem(item.key)
          if (existing == null && item.value != null) {
            originalSetItem(item.key, item.value)
            restored += 1
          }
        }
        setCount(result.snapshots?.length || localSnapshots.length || restored)
        setStatus("live")
      } catch (error) {
        console.error("[AngelCare Persistence] boot sync failed", error)
        setStatus("error")
      }
    }

    boot()
    window.addEventListener("beforeunload", () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      void flush()
    })

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      localStorage.setItem = originalSetItem
      localStorage.removeItem = originalRemoveItem
      localStorage.clear = originalClear
    }
  }, [])

  return (
    <div
      suppressHydrationWarning
      style={{
        position: "fixed",
        right: 16,
        bottom: 14,
        zIndex: 2147483647,
        borderRadius: 999,
        border: status === "error" ? "1px solid rgba(248,113,113,.55)" : "1px solid rgba(45,212,191,.4)",
        background: status === "error" ? "rgba(69,10,10,.92)" : "rgba(2,6,23,.82)",
        color: "#f8fafc",
        padding: "8px 12px",
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: ".02em",
        boxShadow: "0 16px 40px rgba(0,0,0,.32)",
        backdropFilter: "blur(14px)",
        pointerEvents: "none",
      }}
    >
      {label}
    </div>
  )
}

'use client'

import { useEffect } from 'react'

const AUTH_STORAGE_PATTERNS = [
  /^sb-/i,
  /supabase/i,
  /auth-token/i,
  /traininghub-auth/i,
  /angelcare-traininghub-auth/i,
]

function shouldRemoveStorageKey(key: string) {
  return AUTH_STORAGE_PATTERNS.some((pattern) => pattern.test(key))
}

function clearStorage(storage: Storage | null | undefined) {
  if (!storage) return

  try {
    const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter(Boolean) as string[]
    keys.forEach((key) => {
      if (shouldRemoveStorageKey(key)) {
        storage.removeItem(key)
      }
    })
  } catch {
    // Browser privacy mode can block storage. Do not break the login page.
  }
}

function clearAuthCookies() {
  try {
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0]?.trim()
      if (!name || !shouldRemoveStorageKey(name)) return

      document.cookie = `${name}=; Max-Age=0; path=/`
      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`
    })
  } catch {
    // Do not break login rendering if cookies are locked.
  }
}

export default function TrainingHubLoginSessionCleaner() {
  useEffect(() => {
    clearStorage(window.localStorage)
    clearStorage(window.sessionStorage)
    clearAuthCookies()

    window.dispatchEvent(new CustomEvent('traininghub:auth-session-cleaned'))
  }, [])

  return null
}

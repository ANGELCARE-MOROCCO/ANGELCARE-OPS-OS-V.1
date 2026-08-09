'use client'

import { useEffect } from 'react'

const OPSOS_STORAGE_PATTERNS = [
  /^sb-/i,
  /supabase/i,
  /auth-token/i,
  /angelcare/i,
  /opsos/i,
  /gops/i,
  /carelink/i,
  /traininghub/i,
  /persistence/i,
  /session/i,
]

const OPSOS_COOKIE_PATTERNS = [
  /^sb-/i,
  /supabase/i,
  /auth/i,
  /session/i,
  /angelcare/i,
  /opsos/i,
  /gops/i,
  /carelink/i,
  /traininghub/i,
]

function shouldRemoveStorageKey(key: string) {
  return OPSOS_STORAGE_PATTERNS.some((pattern) => pattern.test(key))
}

function shouldRemoveCookieKey(key: string) {
  return OPSOS_COOKIE_PATTERNS.some((pattern) => pattern.test(key))
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
    // Browser privacy settings can block storage access. Do not break login.
  }
}

function clearCookies() {
  try {
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0]?.trim()
      if (!name || !shouldRemoveCookieKey(name)) return

      document.cookie = `${name}=; Max-Age=0; path=/`
      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`
    })
  } catch {
    // Do not break login if cookies are locked.
  }
}

export default function OpsosLoginSessionCleaner() {
  useEffect(() => {
    clearStorage(window.localStorage)
    clearStorage(window.sessionStorage)
    clearCookies()

    window.dispatchEvent(new CustomEvent('opsos:login-session-cleaned'))
  }, [])

  return null
}

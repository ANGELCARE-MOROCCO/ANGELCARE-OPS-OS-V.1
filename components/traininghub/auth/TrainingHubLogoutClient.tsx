'use client'

import { useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

function browserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } })
}

function removeAuthStorage(storage: Storage | null | undefined) {
  if (!storage) return

  try {
    const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter(Boolean) as string[]
    keys.forEach((key) => {
      if (/^sb-/i.test(key) || /supabase/i.test(key) || /auth-token/i.test(key) || /traininghub-auth/i.test(key)) {
        storage.removeItem(key)
      }
    })
  } catch {
    // ignore
  }
}

function removeAuthCookies() {
  try {
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0]?.trim()
      if (!name) return
      if (!/^sb-/i.test(name) && !/supabase/i.test(name) && !/auth-token/i.test(name)) return

      document.cookie = `${name}=; Max-Age=0; path=/`
      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`
    })
  } catch {
    // ignore
  }
}

export default function TrainingHubLogoutClient({ next = '/traininghub/login' }: { next?: string }) {
  useEffect(() => {
    let cancelled = false

    async function run() {
      const supabase = browserSupabase()

      try {
        await fetch('/api/traininghub/auth/logout', { method: 'POST', cache: 'no-store' })
      } catch {
        // ignore
      }

      try {
        await supabase?.auth.signOut()
      } catch {
        // ignore
      }

      removeAuthStorage(window.localStorage)
      removeAuthStorage(window.sessionStorage)
      removeAuthCookies()

      if (!cancelled) {
        window.location.replace(next)
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [next])

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f6f9ff', color: '#0f172a', fontFamily: 'Inter, ui-sans-serif, system-ui' }}>
      <section style={{ width: 'min(520px, calc(100vw - 32px))', borderRadius: 28, padding: 28, background: '#fff', border: '1px solid #dbeafe', boxShadow: '0 24px 70px rgba(15,23,42,.10)' }}>
        <p style={{ margin: 0, color: '#2563eb', letterSpacing: '.14em', fontSize: 12, fontWeight: 900 }}>TRAININGHUB SESSION</p>
        <h1 style={{ margin: '10px 0', fontSize: 32, lineHeight: 1, letterSpacing: '-.05em' }}>Nettoyage de session…</h1>
        <p style={{ margin: 0, color: '#64748b', fontWeight: 700, lineHeight: 1.5 }}>Déconnexion TrainingHub, suppression des anciens jetons navigateur et retour vers la page de connexion.</p>
      </section>
    </main>
  )
}

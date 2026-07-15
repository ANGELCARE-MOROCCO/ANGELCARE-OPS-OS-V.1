'use client'

import { useEffect } from 'react'

function removeStorage(storage: Storage | null | undefined) {
  if (!storage) return

  try {
    const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter(Boolean) as string[]
    keys.forEach((key) => {
      if (/^sb-/i.test(key) || /supabase/i.test(key) || /auth-token/i.test(key) || /angelcare/i.test(key) || /opsos/i.test(key) || /gops/i.test(key) || /carelink/i.test(key) || /traininghub/i.test(key) || /persistence/i.test(key) || /session/i.test(key)) {
        storage.removeItem(key)
      }
    })
  } catch {
    // ignore
  }
}

function removeCookies() {
  try {
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0]?.trim()
      if (!name) return
      if (!/^sb-/i.test(name) && !/supabase/i.test(name) && !/auth/i.test(name) && !/session/i.test(name) && !/angelcare/i.test(name) && !/opsos/i.test(name) && !/gops/i.test(name) && !/carelink/i.test(name) && !/traininghub/i.test(name)) return

      document.cookie = `${name}=; Max-Age=0; path=/`
      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`
    })
  } catch {
    // ignore
  }
}

export default function OpsosLogoutClient({ next = '/login' }: { next?: string }) {
  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        await fetch('/api/opsos/auth/logout', { method: 'POST', cache: 'no-store' })
      } catch {
        // ignore
      }

      removeStorage(window.localStorage)
      removeStorage(window.sessionStorage)
      removeCookies()

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
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#07152e,#12327a)', color: '#0f172a', fontFamily: 'Inter, ui-sans-serif, system-ui' }}>
      <section style={{ width: 'min(560px, calc(100vw - 32px))', borderRadius: 30, padding: 30, background: '#fff', border: '1px solid rgba(255,255,255,.65)', boxShadow: '0 28px 90px rgba(0,0,0,.24)' }}>
        <p style={{ margin: 0, color: '#2563eb', letterSpacing: '.16em', fontSize: 12, fontWeight: 950 }}>ANGECARE OPSOS SESSION</p>
        <h1 style={{ margin: '10px 0', fontSize: 34, lineHeight: 1, letterSpacing: '-.06em' }}>Nettoyage de session…</h1>
        <p style={{ margin: 0, color: '#64748b', fontWeight: 800, lineHeight: 1.5 }}>Suppression des anciens jetons navigateur et retour vers la connexion interne.</p>
      </section>
    </main>
  )
}

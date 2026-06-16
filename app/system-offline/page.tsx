import Link from 'next/link'
import { getSupabaseEnv } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'
import { loadRuntimeState } from '@/lib/system-control/runtime'

export const dynamic = 'force-dynamic'

async function loadResumeAt() {
  const env = getSupabaseEnv()
  if (!env.url || !env.serviceRoleKey) return null

  try {
    const supabase = await createClient()
    const state = await loadRuntimeState(supabase)
    return state.resumeAt
  } catch {
    return null
  }
}

function formatResumeAt(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export default async function SystemOfflinePage() {
  const resumeAt = await loadResumeAt()
  const resumeLabel = formatResumeAt(resumeAt)

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,.18),_transparent_36%),linear-gradient(180deg,_#06101d_0%,_#02040a_100%)] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center">
        <section className="w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/6 p-8 shadow-2xl backdrop-blur">
          <div className="inline-flex items-center rounded-full border border-sky-300/20 bg-sky-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.26em] text-sky-100">
            ANGELCARE System Standby Mode
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
            Protected standby is active
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            The ANGELCARE system is temporarily paused for protected maintenance. It will resume at the configured time{resumeLabel ? `, around ${resumeLabel}` : '.'}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-5">
              <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Access</div>
              <div className="mt-2 text-lg font-black text-white">Authorized users may continue to System Control Tower.</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-5">
              <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Status</div>
              <div className="mt-2 text-lg font-black text-white">Normal users remain blocked until standby ends.</div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login" className="inline-flex items-center rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-100">
              Sign in
            </Link>
            <Link href="/ceo/system-control" className="inline-flex items-center rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm font-bold text-amber-50 transition hover:bg-amber-300/15">
              Open CEO System Control
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}

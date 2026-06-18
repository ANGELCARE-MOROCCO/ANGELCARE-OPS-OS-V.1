'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Props = {
  resumeAt: string | null
  isAuthorized?: boolean
}

function formatCountdown(target: string | null) {
  if (!target) return '00:00:00'

  const targetTime = new Date(target).getTime()
  if (!Number.isFinite(targetTime)) return '00:00:00'

  const diff = targetTime - Date.now()
  if (diff <= 0) return '00:00:00'

  const totalSeconds = Math.floor(diff / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0'),
  ].join(':')
}

function formatResumeTime(target: string | null) {
  if (!target) return '08:00'

  const date = new Date(target)
  if (Number.isNaN(date.getTime())) return '08:00'

  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function SystemOfflineMinimalNotice({ resumeAt, isAuthorized = false }: Props) {
  const [mounted, setMounted] = useState(false)
  const [countdown, setCountdown] = useState('00:00:00')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    setCountdown(formatCountdown(resumeAt))

    const timer = window.setInterval(() => {
      setCountdown(formatCountdown(resumeAt))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [mounted, resumeAt])

  const resumeTime = useMemo(() => formatResumeTime(resumeAt), [resumeAt])
  const visibleCountdown = mounted ? countdown : '00:00:00'

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#10284a_0%,#07111f_48%,#030712_100%)]">
<div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(0,0,0,0.12))]" />

      <section className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-3xl rounded-[28px] border border-white/10 bg-[#06101f]/55 px-8 py-10 text-center shadow-[0_40px_140px_rgba(0,0,0,0.55)] backdrop-blur-xl md:px-14 md:py-12">
          <div className="mx-auto mb-6 h-px w-24 bg-white/20" />

          <p className="text-[12px] font-semibold uppercase tracking-[0.32em] text-white/90">
            ANGELCARE OPS SANILA
          </p>

          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.34em] text-blue-200/80">
            Access Notice
          </p>

          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-white md:text-5xl">
            Platform access is temporarily unavailable
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
            The platform will resume automatically at the scheduled time.
          </p>

          <div className="mt-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-slate-400">
              Time remaining
            </p>

            <div className="mt-5 font-mono text-6xl font-light tracking-[0.08em] text-blue-100 drop-shadow-[0_0_30px_rgba(96,165,250,0.35)] md:text-8xl">
              {visibleCountdown}
            </div>

            <p className="mt-5 text-sm text-slate-300">
              Scheduled resumption: <span className="font-semibold text-white">{resumeTime}</span>
            </p>
          </div>

          <div className="mx-auto my-10 h-px max-w-lg bg-white/10" />

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex min-w-44 items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(255,255,255,0.12)] transition hover:bg-slate-100"
            >
              Sign in
            </Link>

            <Link
              href="/ceo/system-control"
              className="inline-flex min-w-56 items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Authorized access
            </Link>
          </div>

          {isAuthorized ? (
            <p className="mt-6 text-xs text-blue-200/80">
              Authorized session detected.
            </p>
          ) : null}
        </div>
      </section>
    </main>
  )
}

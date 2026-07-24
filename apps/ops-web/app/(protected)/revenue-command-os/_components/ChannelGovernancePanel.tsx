'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowUpRight, CalendarX2, CheckCircle2, Loader2, MailCheck, MessageCircle, ShieldAlert, XCircle } from 'lucide-react'
import type { RevenueOsChannelPolicy } from '@/lib/revenue-command-os/types'

const icons = { email_os: MailCheck, gmail: XCircle, whatsapp: MessageCircle, calendar: CalendarX2 } as const

async function updateWhatsapp(enabled: boolean) {
  const response = await fetch('/api/revenue-command-os/channels', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel: 'whatsapp', enabled }),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok || payload?.ok === false) {
    const error = payload?.error
    throw new Error(typeof error === 'string' ? error : error?.message || `Erreur HTTP ${response.status}`)
  }
  return payload.data as RevenueOsChannelPolicy[]
}

export default function ChannelGovernancePanel({ initialPolicies }: { initialPolicies: RevenueOsChannelPolicy[] }) {
  const [policies, setPolicies] = useState(initialPolicies)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const whatsapp = policies.find((item) => item.code === 'whatsapp')
  const toggleWhatsapp = async () => {
    if (!whatsapp) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      setPolicies(await updateWhatsapp(!whatsapp.enabled))
      setNotice(!whatsapp.enabled ? 'WhatsApp activé en mode gouverné. Les permissions, credentials et approbations restent obligatoires.' : 'WhatsApp désactivé pour Revenue OS.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Mise à jour impossible.')
    } finally {
      setBusy(false)
    }
  }

  return <section className="mt-8 rounded-[38px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,.07)] sm:p-8">
    <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-blue-700">Canaux d’exécution Revenue</p><h2 className="mt-2 text-2xl font-black text-slate-950">Doctrine opérationnelle des communications</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">Email OS est l’autorité d’envoi. WhatsApp est activable manuellement. Gmail direct et Calendar restent désactivés par politique AngelCare.</p></div><Link href="/revenue-command-os/email-studio" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-xs font-black text-white hover:bg-blue-700">Ouvrir Revenue Email Studio <ArrowUpRight size={15} /></Link></div>
    {error ? <div role="alert" className="mt-5 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-900"><ShieldAlert size={17} />{error}</div> : null}
    {notice ? <div role="status" className="mt-5 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-900"><CheckCircle2 size={17} />{notice}</div> : null}
    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{policies.map((policy) => {
      const Icon = icons[policy.code]
      const active = policy.policyState === 'active'
      const available = policy.policyState === 'available'
      return <article key={policy.code} className={`rounded-[28px] border p-5 ${active ? 'border-emerald-200 bg-emerald-50/60' : available ? 'border-blue-200 bg-blue-50/60' : 'border-slate-200 bg-slate-50'}`}><div className="flex items-start justify-between"><span className={`grid h-11 w-11 place-items-center rounded-2xl ${active ? 'bg-emerald-700 text-white' : 'bg-slate-950 text-white'}`}><Icon size={19} /></span><span className={`rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-[.1em] ${active ? 'border-emerald-200 bg-white text-emerald-800' : available ? 'border-blue-200 bg-white text-blue-800' : 'border-slate-200 bg-white text-slate-600'}`}>{policy.policyState}</span></div><h3 className="mt-4 text-base font-black text-slate-950">{policy.label}</h3><p className="mt-2 min-h-20 text-[11px] leading-5 text-slate-600">{policy.reason}</p><div className="mt-4 border-t border-slate-200/70 pt-4"><p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-500">{policy.approvalRequired ? 'Approbation requise' : 'Aucune exécution autorisée'}</p>{policy.code === 'whatsapp' ? <button onClick={() => void toggleWhatsapp()} disabled={busy} className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-black text-white disabled:opacity-50 ${policy.enabled ? 'bg-rose-700 hover:bg-rose-800' : 'bg-blue-700 hover:bg-blue-800'}`}>{busy ? <Loader2 size={15} className="animate-spin" /> : <MessageCircle size={15} />}{policy.enabled ? 'Désactiver WhatsApp' : 'Activer WhatsApp'}</button> : null}</div></article>
    })}</div>
  </section>
}

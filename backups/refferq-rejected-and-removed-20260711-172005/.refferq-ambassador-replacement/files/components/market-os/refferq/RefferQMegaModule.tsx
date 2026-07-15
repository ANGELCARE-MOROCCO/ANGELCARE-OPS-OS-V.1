"use client"

import { useMemo, useState } from "react"
import type { ReactNode } from "react"
import Link from "next/link"
import {
  Activity,
  ArrowLeft,
  BadgeDollarSign,
  BarChart3,
  CheckCircle2,
  Copy,
  FileText,
  Gift,
  Globe2,
  KeyRound,
  Mail,
  MousePointerClick,
  Network,
  RefreshCw,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  UserPlus,
  Users2,
  WalletCards,
  Webhook,
} from "lucide-react"
import {
  formatMad,
  refferQSnapshot,
  type RefferQPartner,
  type RefferQReferral,
  type RefferQPayout,
  type RefferQProgramRule,
} from "@/lib/market-os/refferq/refferq-data"

type TabId =
  | "cockpit"
  | "partners"
  | "referrals"
  | "transactions"
  | "payouts"
  | "programs"
  | "resources"
  | "api"
  | "risk"
  | "settings"

type QuickReferralDraft = {
  partner: string
  leadName: string
  leadEmail: string
  phone: string
  estimatedValueMad: number
}

const tabs: Array<{ id: TabId; label: string; icon: typeof Activity }> = [
  { id: "cockpit", label: "Cockpit", icon: BarChart3 },
  { id: "partners", label: "Partners", icon: Users2 },
  { id: "referrals", label: "Referrals", icon: MousePointerClick },
  { id: "transactions", label: "Transactions", icon: BadgeDollarSign },
  { id: "payouts", label: "Payouts", icon: WalletCards },
  { id: "programs", label: "Programs", icon: SlidersHorizontal },
  { id: "resources", label: "Resources", icon: FileText },
  { id: "api", label: "API & Webhooks", icon: Webhook },
  { id: "risk", label: "Risk", icon: ShieldAlert },
  { id: "settings", label: "Settings", icon: KeyRound },
]

const statusStyles: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Approved: "bg-blue-50 text-blue-700 border-blue-200",
  Converted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Scheduled: "bg-sky-50 text-sky-700 border-sky-200",
  Blocked: "bg-red-50 text-red-700 border-red-200",
  Risk: "bg-red-50 text-red-700 border-red-200",
  Paused: "bg-slate-100 text-slate-600 border-slate-200",
  Live: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Draft: "bg-slate-100 text-slate-600 border-slate-200",
  Review: "bg-amber-50 text-amber-700 border-amber-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
  Disputed: "bg-red-50 text-red-700 border-red-200",
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className={cx("inline-flex rounded-full border px-3 py-1 text-xs font-black", statusStyles[status] || "border-slate-200 bg-slate-50 text-slate-600")}>
      {status}
    </span>
  )
}

function MetricCard({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: typeof Activity }) {
  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{value}</p>
          <p className="mt-2 text-sm font-semibold text-slate-500">{detail}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
          <Icon size={22} />
        </div>
      </div>
    </article>
  )
}

function Panel({ title, eyebrow, children, action }: { title: string; eyebrow?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-[30px] border border-slate-200 bg-white shadow-[0_22px_64px_rgba(15,23,42,0.07)]">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          {eyebrow ? <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-600">{eyebrow}</p> : null}
          <h2 className="mt-1 text-2xl font-black text-slate-950">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </section>
  )
}

function PartnerRow({ partner }: { partner: RefferQPartner }) {
  return (
    <tr className="border-b border-slate-100 align-top last:border-0">
      <td className="py-4 pr-4">
        <p className="font-black text-slate-950">{partner.name}</p>
        <p className="mt-1 text-xs font-bold text-slate-400">{partner.email}</p>
      </td>
      <td className="py-4 pr-4 text-sm font-bold text-slate-600">{partner.city}</td>
      <td className="py-4 pr-4 text-sm font-black text-slate-800">{partner.referralCode}</td>
      <td className="py-4 pr-4"><StatusPill status={partner.status} /></td>
      <td className="py-4 pr-4 text-sm font-black text-slate-800">{partner.commissionRate}%</td>
      <td className="py-4 pr-4 text-sm font-black text-slate-800">{partner.conversions}</td>
      <td className="py-4 text-right text-sm font-black text-slate-950">{formatMad(partner.pendingPayoutMad)}</td>
    </tr>
  )
}

function ReferralRow({ referral }: { referral: RefferQReferral }) {
  return (
    <tr className="border-b border-slate-100 align-top last:border-0">
      <td className="py-4 pr-4">
        <p className="font-black text-slate-950">{referral.leadName}</p>
        <p className="mt-1 text-xs font-bold text-slate-400">{referral.leadEmail} · {referral.phone}</p>
      </td>
      <td className="py-4 pr-4 text-sm font-bold text-slate-600">{referral.partner}</td>
      <td className="py-4 pr-4 text-sm font-bold text-slate-600">{referral.source}</td>
      <td className="py-4 pr-4"><StatusPill status={referral.status} /></td>
      <td className="py-4 pr-4 text-sm font-black text-slate-800">{formatMad(referral.estimatedValueMad)}</td>
      <td className="py-4 text-right text-sm font-black text-slate-950">{formatMad(referral.commissionMad)}</td>
    </tr>
  )
}

function PayoutCard({ payout }: { payout: RefferQPayout }) {
  return (
    <article className="rounded-[26px] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-black text-slate-950">{payout.partner}</p>
          <p className="mt-1 text-sm font-bold text-slate-500">{payout.commissionCount} commissions · {payout.method}</p>
        </div>
        <StatusPill status={payout.status} />
      </div>
      <p className="mt-6 text-3xl font-black text-slate-950">{formatMad(payout.amountMad)}</p>
      <p className="mt-2 text-sm font-semibold text-slate-500">Scheduled for {payout.scheduledFor}</p>
    </article>
  )
}

function ProgramRuleCard({ rule }: { rule: RefferQProgramRule }) {
  return (
    <article className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-black text-slate-950">{rule.name}</p>
          <p className="mt-2 text-sm font-bold text-slate-500">{rule.type} · {rule.value}</p>
        </div>
        <StatusPill status={rule.status} />
      </div>
    </article>
  )
}

export default function RefferQMegaModule() {
  const [activeTab, setActiveTab] = useState<TabId>("cockpit")
  const [referrals, setReferrals] = useState<RefferQReferral[]>(refferQSnapshot.referrals)
  const [copied, setCopied] = useState<string | null>(null)
  const [draft, setDraft] = useState<QuickReferralDraft>({
    partner: refferQSnapshot.partners[0]?.name || "",
    leadName: "",
    leadEmail: "",
    phone: "",
    estimatedValueMad: 5900,
  })

  const totals = useMemo(() => {
    const partners = refferQSnapshot.partners
    const transactions = refferQSnapshot.transactions
    const payouts = refferQSnapshot.payouts
    const totalRevenue = transactions.reduce((sum, item) => sum + item.amountMad, 0)
    const totalCommission = transactions.reduce((sum, item) => sum + item.commissionMad, 0)
    const pendingPayouts = payouts.reduce((sum, item) => sum + item.amountMad, 0)
    const conversions = partners.reduce((sum, item) => sum + item.conversions, 0)
    const qualifiedLeads = partners.reduce((sum, item) => sum + item.qualifiedLeads, 0)
    const conversionRate = qualifiedLeads ? Math.round((conversions / qualifiedLeads) * 100) : 0
    return { totalRevenue, totalCommission, pendingPayouts, conversions, qualifiedLeads, conversionRate }
  }, [])

  const addReferral = () => {
    if (!draft.leadName.trim()) return
    const commissionMad = Math.round(draft.estimatedValueMad * 0.1)
    const nextReferral: RefferQReferral = {
      id: `rq-ref-local-${Date.now()}`,
      partner: draft.partner,
      leadName: draft.leadName,
      leadEmail: draft.leadEmail || "lead@example.com",
      phone: draft.phone || "+212 6 00 00 00 00",
      source: "Quick operator entry",
      status: "Pending",
      estimatedValueMad: draft.estimatedValueMad,
      commissionMad,
      createdAt: new Date().toISOString().slice(0, 10),
      reviewNote: "Created from RefferQ cockpit quick entry.",
    }
    setReferrals((current) => [nextReferral, ...current])
    setDraft((current) => ({ ...current, leadName: "", leadEmail: "", phone: "" }))
  }

  const copyReferralCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(code)
      window.setTimeout(() => setCopied(null), 1600)
    } catch {
      setCopied("Clipboard blocked")
      window.setTimeout(() => setCopied(null), 1600)
    }
  }

  return (
    <main className="min-h-screen bg-white px-5 py-7 text-slate-950 md:px-8">
      <section className="mx-auto flex max-w-[1500px] flex-col gap-6">
        <div className="rounded-[34px] border border-sky-100 bg-gradient-to-br from-white via-sky-50 to-indigo-50 p-6 shadow-[0_28px_90px_rgba(15,23,42,0.10)] md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-4">
              <Link href="/market-os/ambassadors" className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-slate-500 hover:text-sky-700">
                <ArrowLeft size={16} /> RefferQ gate
              </Link>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-700">Market OS · RefferQ mega module</p>
                <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 md:text-6xl">Referral Growth Control Plane</h1>
                <p className="mt-4 max-w-4xl text-base font-semibold leading-8 text-slate-600 md:text-lg">
                  A single operating cockpit for affiliate partners, referral submissions, conversion tracking, commission rules, payout governance, resources, API keys, fraud controls and growth reporting.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 xl:w-[560px]">
              <div className="rounded-3xl border border-white bg-white/75 p-4 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Mode</p>
                <p className="mt-1 text-lg font-black text-emerald-700">Replacement live</p>
              </div>
              <div className="rounded-3xl border border-white bg-white/75 p-4 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Source</p>
                <p className="mt-1 text-lg font-black text-slate-950">RefferQ</p>
              </div>
              <div className="rounded-3xl border border-white bg-white/75 p-4 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Legacy</p>
                <p className="mt-1 text-lg font-black text-red-600">Retired</p>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex gap-2 overflow-x-auto rounded-[26px] border border-slate-200 bg-white p-2 shadow-sm">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cx(
                  "inline-flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition",
                  active ? "bg-slate-950 text-white shadow-lg shadow-slate-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-950",
                )}
              >
                <Icon size={16} /> {tab.label}
              </button>
            )
          })}
        </nav>

        {activeTab === "cockpit" ? (
          <div className="grid gap-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Tracked revenue" value={formatMad(totals.totalRevenue)} detail="Paid or pending referral revenue" icon={BadgeDollarSign} />
              <MetricCard label="Partner commissions" value={formatMad(totals.totalCommission)} detail="Calculated from conversion rules" icon={Gift} />
              <MetricCard label="Qualified leads" value={`${totals.qualifiedLeads}`} detail={`${totals.conversionRate}% conversion rate`} icon={MousePointerClick} />
              <MetricCard label="Payout exposure" value={formatMad(totals.pendingPayouts)} detail="Pending, approved and blocked payouts" icon={WalletCards} />
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
              <Panel title="Live partner leaderboard" eyebrow="Revenue engine" action={<button className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-600"><RefreshCw size={15} className="mr-2 inline" /> Refresh</button>}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] text-left">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                        <th className="pb-3 pr-4">Partner</th>
                        <th className="pb-3 pr-4">City</th>
                        <th className="pb-3 pr-4">Code</th>
                        <th className="pb-3 pr-4">Status</th>
                        <th className="pb-3 pr-4">Rate</th>
                        <th className="pb-3 pr-4">Conv.</th>
                        <th className="pb-3 text-right">Payout</th>
                      </tr>
                    </thead>
                    <tbody>{refferQSnapshot.partners.map((partner) => <PartnerRow key={partner.id} partner={partner} />)}</tbody>
                  </table>
                </div>
              </Panel>

              <Panel title="Quick referral intake" eyebrow="Manual lead submission">
                <div className="grid gap-4">
                  <label className="grid gap-2 text-sm font-black text-slate-700">
                    Partner
                    <select
                      value={draft.partner}
                      onChange={(event) => setDraft((current) => ({ ...current, partner: event.target.value }))}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-300"
                    >
                      {refferQSnapshot.partners.map((partner) => <option key={partner.id}>{partner.name}</option>)}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-black text-slate-700">
                    Lead name
                    <input
                      value={draft.leadName}
                      onChange={(event) => setDraft((current) => ({ ...current, leadName: event.target.value }))}
                      placeholder="Mme. / Mr. lead name"
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-300"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-black text-slate-700">
                    Lead email
                    <input
                      value={draft.leadEmail}
                      onChange={(event) => setDraft((current) => ({ ...current, leadEmail: event.target.value }))}
                      placeholder="lead@email.com"
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-300"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="grid gap-2 text-sm font-black text-slate-700">
                      Phone
                      <input
                        value={draft.phone}
                        onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))}
                        placeholder="+212..."
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-300"
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-black text-slate-700">
                      Value MAD
                      <input
                        type="number"
                        value={draft.estimatedValueMad}
                        onChange={(event) => setDraft((current) => ({ ...current, estimatedValueMad: Number(event.target.value || 0) }))}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-300"
                      />
                    </label>
                  </div>
                  <button type="button" onClick={addReferral} className="rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-white hover:bg-sky-700">
                    <UserPlus size={16} className="mr-2 inline" /> Add referral
                  </button>
                </div>
              </Panel>
            </div>
          </div>
        ) : null}

        {activeTab === "partners" ? (
          <Panel title="Affiliate partner directory" eyebrow="Approval, segmentation and partner codes">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {refferQSnapshot.partners.map((partner) => (
                <article key={partner.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-black text-slate-950">{partner.name}</p>
                      <p className="mt-1 text-sm font-bold text-slate-500">{partner.group} · {partner.city}</p>
                    </div>
                    <StatusPill status={partner.status} />
                  </div>
                  <button type="button" onClick={() => copyReferralCode(partner.referralCode)} className="mt-5 flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left font-black text-slate-700">
                    {partner.referralCode}<Copy size={16} />
                  </button>
                  <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-2xl bg-sky-50 p-3"><p className="text-lg font-black text-slate-950">{partner.qualifiedLeads}</p><p className="text-[11px] font-black uppercase text-slate-400">Leads</p></div>
                    <div className="rounded-2xl bg-emerald-50 p-3"><p className="text-lg font-black text-slate-950">{partner.conversions}</p><p className="text-[11px] font-black uppercase text-slate-400">Conv.</p></div>
                    <div className="rounded-2xl bg-amber-50 p-3"><p className="text-lg font-black text-slate-950">{partner.riskScore}</p><p className="text-[11px] font-black uppercase text-slate-400">Risk</p></div>
                  </div>
                </article>
              ))}
            </div>
            {copied ? <p className="mt-5 text-sm font-black text-emerald-700">Copied: {copied}</p> : null}
          </Panel>
        ) : null}

        {activeTab === "referrals" ? (
          <Panel title="Referral review queue" eyebrow="Lead tracking and manual validation">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                    <th className="pb-3 pr-4">Lead</th>
                    <th className="pb-3 pr-4">Partner</th>
                    <th className="pb-3 pr-4">Source</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Value</th>
                    <th className="pb-3 text-right">Commission</th>
                  </tr>
                </thead>
                <tbody>{referrals.map((referral) => <ReferralRow key={referral.id} referral={referral} />)}</tbody>
              </table>
            </div>
          </Panel>
        ) : null}

        {activeTab === "transactions" ? (
          <Panel title="Transactions and commission ledger" eyebrow="Revenue attribution">
            <div className="grid gap-4">
              {refferQSnapshot.transactions.map((transaction) => (
                <article key={transaction.id} className="flex flex-col gap-4 rounded-[26px] border border-slate-200 bg-white p-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-lg font-black text-slate-950">{transaction.customer}</p>
                    <p className="mt-1 text-sm font-bold text-slate-500">{transaction.product} · {transaction.referralId}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">Invoice {formatMad(transaction.amountMad)}</div>
                    <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">Commission {formatMad(transaction.commissionMad)}</div>
                    <StatusPill status={transaction.status} />
                  </div>
                </article>
              ))}
            </div>
          </Panel>
        ) : null}

        {activeTab === "payouts" ? (
          <Panel title="Payout command center" eyebrow="Approve, block and schedule commissions">
            <div className="grid gap-4 md:grid-cols-3">{refferQSnapshot.payouts.map((payout) => <PayoutCard key={payout.id} payout={payout} />)}</div>
          </Panel>
        ) : null}

        {activeTab === "programs" ? (
          <Panel title="Program rules and commission policy" eyebrow="RefferQ program settings">
            <div className="grid gap-4 md:grid-cols-3">{refferQSnapshot.programRules.map((rule) => <ProgramRuleCard key={rule.id} rule={rule} />)}</div>
          </Panel>
        ) : null}

        {activeTab === "resources" ? (
          <Panel title="Partner resource library" eyebrow="Scripts, creatives and terms">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {refferQSnapshot.resources.map((resource) => (
                <article key={resource.id} className="rounded-[26px] border border-slate-200 bg-white p-5">
                  <p className="text-lg font-black text-slate-950">{resource.title}</p>
                  <p className="mt-2 text-sm font-bold text-slate-500">{resource.type} · {resource.owner}</p>
                  <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-sky-500" style={{ width: `${resource.readiness}%` }} />
                  </div>
                  <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">{resource.readiness}% ready</p>
                </article>
              ))}
            </div>
          </Panel>
        ) : null}

        {activeTab === "api" ? (
          <Panel title="API keys, postbacks and webhook readiness" eyebrow="Integration layer">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["Referral tracking endpoint", "/r/[code]", "Live route ready", Globe2],
                ["Partner API key", "rq_live_partner_xxxx", "Rotate before production", KeyRound],
                ["Conversion webhook", "/api/market-os/refferq", "Prepared for backend wiring", Webhook],
              ].map(([title, value, note, Icon]) => {
                const TypedIcon = Icon as typeof Activity
                return (
                  <article key={String(title)} className="rounded-[26px] border border-slate-200 bg-white p-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700"><TypedIcon size={22} /></div>
                    <p className="mt-5 text-lg font-black text-slate-950">{title}</p>
                    <p className="mt-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">{value}</p>
                    <p className="mt-3 text-sm font-bold text-slate-500">{note}</p>
                  </article>
                )
              })}
            </div>
          </Panel>
        ) : null}

        {activeTab === "risk" ? (
          <Panel title="Fraud, compliance and payout risk" eyebrow="Control before payment">
            <div className="grid gap-4 lg:grid-cols-2">
              {refferQSnapshot.partners
                .slice()
                .sort((a, b) => b.riskScore - a.riskScore)
                .map((partner) => (
                  <article key={partner.id} className="rounded-[26px] border border-slate-200 bg-white p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-black text-slate-950">{partner.name}</p>
                        <p className="mt-1 text-sm font-bold text-slate-500">Last activity: {partner.lastActivity}</p>
                      </div>
                      <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-700">Risk {partner.riskScore}</div>
                    </div>
                    <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div className={cx("h-full rounded-full", partner.riskScore > 20 ? "bg-red-500" : partner.riskScore > 10 ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${Math.min(partner.riskScore, 100)}%` }} />
                    </div>
                  </article>
                ))}
            </div>
          </Panel>
        ) : null}

        {activeTab === "settings" ? (
          <Panel title="RefferQ operating settings" eyebrow="Program configuration">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                ["Currency", "MAD", Mail],
                ["Payout term", "NET-15", WalletCards],
                ["Cookie duration", "30 days", MousePointerClick],
                ["Manual leads", "Enabled", CheckCircle2],
                ["Country focus", "Morocco", Globe2],
                ["Fraud review", "Before payout", ShieldAlert],
                ["Partner portal", "Prepared", Network],
                ["Email automation", "Templates ready", Mail],
              ].map(([label, value, Icon]) => {
                const TypedIcon = Icon as typeof Activity
                return (
                  <article key={String(label)} className="rounded-[24px] border border-slate-200 bg-white p-5">
                    <TypedIcon size={20} className="text-sky-700" />
                    <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
                    <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
                  </article>
                )
              })}
            </div>
          </Panel>
        ) : null}
      </section>
    </main>
  )
}

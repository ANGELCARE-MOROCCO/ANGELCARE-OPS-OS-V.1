"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

type CommandAction = {
  id: string
  title: string
  description: string
  value: string
  urgency: "normal" | "high" | "critical"
  href: string
  actions: string[]
}

const gatewayCards = [
  {
    title: "Campaign Lifecycle",
    href: "/market-os/campaign-lifecycle",
    status: "12 active launches",
    pressure: "High execution pressure",
    color: "from-violet-600 to-indigo-700",
    actions: ["Launch", "Assign", "Escalate"],
  },
  {
    title: "SEO Command",
    href: "/market-os/seo-blog-workspace",
    status: "43 queued contents",
    pressure: "Publishing backlog",
    color: "from-cyan-600 to-blue-700",
    actions: ["Create", "Publish", "Optimize"],
  },
  {
    title: "Partnerships Growth",
    href: "/market-os/partnerships",
    status: "18 proposals pending",
    pressure: "Partner follow-up risk",
    color: "from-emerald-600 to-teal-700",
    actions: ["Activate", "Follow-up", "Review"],
  },
  {
    title: "Ambassadors Engine",
    href: "/market-os/ambassadors",
    status: "32 ambassadors active",
    pressure: "Need mission refresh",
    color: "from-orange-600 to-amber-700",
    actions: ["Mission", "Reward", "Track"],
  },
  {
    title: "Attribution & ROI",
    href: "/market-os/attribution",
    status: "4 anomalies detected",
    pressure: "Tracking inconsistencies",
    color: "from-rose-600 to-pink-700",
    actions: ["Audit", "Repair", "Validate"],
  },
  {
    title: "Content Command",
    href: "/market-os/content-command-center",
    status: "9 approvals waiting",
    pressure: "Editorial bottleneck",
    color: "from-slate-700 to-slate-950",
    actions: ["Approve", "Schedule", "Deploy"],
  },
]

const megaCards: CommandAction[] = [
  {
    id: "war-room",
    title: "Campaign War Room",
    description: "Launches, approvals, escalations, campaign control and conversion pressure.",
    value: "12 live campaigns",
    urgency: "critical",
    href: "/market-os/campaign-lifecycle",
    actions: ["Launch Campaign", "Escalate", "Open Risks"],
  },
  {
    id: "content-engine",
    title: "Content Production Engine",
    description: "Editorial pipeline, SEO scoring, AI generation and publishing queues.",
    value: "43 production assets",
    urgency: "high",
    href: "/market-os/content-command-center",
    actions: ["Create Content", "Generate SEO", "Publish"],
  },
  {
    id: "lead-acquisition",
    title: "Lead Acquisition Control",
    description: "CPL anomalies, attribution, funnel leakage and acquisition pressure.",
    value: "2.4M MAD tracked",
    urgency: "high",
    href: "/market-os/attribution",
    actions: ["Audit Funnel", "Review Sources", "Fix Tracking"],
  },
  {
    id: "partnership-growth",
    title: "Partnership Growth Command",
    description: "Activation queues, referral partnerships and co-marketing execution.",
    value: "18 pending proposals",
    urgency: "normal",
    href: "/market-os/partnerships",
    actions: ["Activate Partner", "Review Queue", "Schedule Meeting"],
  },
  {
    id: "ambassador-engine",
    title: "Ambassador Activation Engine",
    description: "Missions, referrals, incentive tracking and community performance.",
    value: "32 ambassadors active",
    urgency: "normal",
    href: "/market-os/ambassadors",
    actions: ["Create Mission", "Track Rewards", "Boost Activity"],
  },
  {
    id: "execution-health",
    title: "Execution Health & Risks",
    description: "Blocked workflows, SLA pressure and operational escalation control.",
    value: "7 operational alerts",
    urgency: "critical",
    href: "/revenue-command-center/daily-tasks/blocked",
    actions: ["Open Alerts", "Escalate Risks", "Resolve"],
  },
]

function tone(urgency: string) {
  if (urgency === "critical") return "border-rose-500/40 bg-rose-500/10"
  if (urgency === "high") return "border-amber-500/40 bg-amber-500/10"
  return "border-emerald-500/40 bg-emerald-500/10"
}

export default function MarketOSV15MasterCommand() {
  const [query, setQuery] = useState("")
  const [focusMode, setFocusMode] = useState(false)

  const filtered = useMemo(() => {
    return megaCards.filter((c) =>
      `${c.title} ${c.description}`.toLowerCase().includes(query.toLowerCase())
    )
  }, [query])

  return (
    <main className="min-h-screen bg-[#060816] text-white">
      <div className="mx-auto max-w-[1900px] space-y-6 p-5 lg:p-8">

        <section className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-[#0F172A] via-[#111827] to-black p-8 shadow-2xl">
          <div className="grid gap-8 xl:grid-cols-[1.2fr_.8fr]">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-black text-cyan-200">
                  MARKET-OS V15
                </span>
                <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-black text-violet-200">
                  MASTER COMMAND
                </span>
              </div>

              <h1 className="mt-6 max-w-5xl text-5xl font-black leading-tight tracking-tight">
                AngelCare Marketing Execution Headquarters
              </h1>

              <p className="mt-5 max-w-4xl text-lg font-semibold leading-8 text-slate-300">
                Premium operational command layer for campaigns, SEO, content production,
                partnerships, ambassadors, attribution, acquisition and revenue execution.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/market-os/campaign-lifecycle" className="rounded-2xl bg-cyan-600 px-6 py-4 text-sm font-black text-white hover:bg-cyan-500">
                  Launch Campaign
                </Link>

                <Link href="/revenue-command-center/daily-tasks/new" className="rounded-2xl bg-violet-700 px-6 py-4 text-sm font-black text-white hover:bg-violet-600">
                  Create Task
                </Link>

                <button
                  onClick={() => setFocusMode(!focusMode)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-black hover:bg-white/10"
                >
                  {focusMode ? "Disable Focus Mode" : "Enable Focus Mode"}
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["Active Campaigns", "12"],
                ["Blocked Operations", "7"],
                ["Publishing Queue", "43"],
                ["Partner Activations", "18"],
                ["SLA Risk", "81%"],
                ["Revenue Influence", "2.4M MAD"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
                >
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                    {label}
                  </p>
                  <p className="mt-4 text-4xl font-black">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-6">
          {gatewayCards.map((card) => (
            <div
              key={card.title}
              className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0F172A]"
            >
              <div className={`bg-gradient-to-r ${card.color} p-5`}>
                <h3 className="text-xl font-black">{card.title}</h3>
                <p className="mt-2 text-sm font-semibold text-white/80">
                  {card.status}
                </p>
              </div>

              <div className="space-y-4 p-5">
                <p className="text-sm font-bold text-slate-400">
                  {card.pressure}
                </p>

                <div className="grid gap-2">
                  {card.actions.map((action) => (
                    <button
                      key={action}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black hover:bg-white/10"
                    >
                      {action}
                    </button>
                  ))}
                </div>

                <Link
                  href={card.href}
                  className="block rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-slate-950"
                >
                  Open Workspace
                </Link>
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-[2.5rem] border border-violet-500/20 bg-gradient-to-br from-[#111827] to-[#0B1120] p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-300">
                Master Task Command
              </p>

              <h2 className="mt-2 text-4xl font-black">
                Unified Execution Control Surface
              </h2>
            </div>

            <div className="flex gap-3">
              <Link href="/revenue-command-center/daily-tasks/new" className="rounded-2xl bg-violet-700 px-5 py-3 text-sm font-black">
                Create Task
              </Link>

              <Link href="/revenue-command-center/daily-tasks/board" className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black">
                Open Board
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 xl:grid-cols-4">
            {[
              ["Critical Tasks", "14"],
              ["Approvals Waiting", "9"],
              ["Blocked Tasks", "7"],
              ["Agent Load", "83%"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-3xl border border-white/10 bg-black/30 p-5">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  {k}
                </p>
                <p className="mt-3 text-4xl font-black">{v}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-4 xl:grid-cols-[1fr_.7fr]">
            <div className="rounded-3xl border border-white/10 bg-black/30 p-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-2xl font-black">
                  Smart Execution Queue
                </h3>

                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search execution cards..."
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white outline-none"
                />
              </div>

              <div className="mt-6 space-y-4">
                {filtered.map((card) => (
                  <div
                    key={card.id}
                    className={`rounded-3xl border p-5 ${tone(card.urgency)}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h4 className="text-2xl font-black">
                          {card.title}
                        </h4>

                        <p className="mt-2 max-w-3xl text-sm font-semibold leading-7 text-slate-300">
                          {card.description}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-black/30 px-5 py-4 text-right">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                          Operational Value
                        </p>
                        <p className="mt-2 text-2xl font-black">
                          {card.value}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      {card.actions.map((action) => (
                        <button
                          key={action}
                          className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black hover:bg-white/10"
                        >
                          {action}
                        </button>
                      ))}

                      <Link
                        href={card.href}
                        className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950"
                      >
                        Open Command
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-300">
                  Executive Attention
                </p>

                <div className="mt-5 space-y-3">
                  {[
                    "4 attribution inconsistencies detected",
                    "SEO publishing backlog exceeded threshold",
                    "2 campaigns require executive validation",
                    "7 operational blockers need escalation",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm font-black"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-6">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
                  AI Operational Assistants
                </p>

                <div className="mt-5 grid gap-3">
                  {[
                    "Campaign Strategist",
                    "SEO Optimizer",
                    "Growth Analyst",
                    "Partnership AI",
                    "Acquisition Optimizer",
                  ].map((item) => (
                    <button
                      key={item}
                      className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-left text-sm font-black hover:bg-black/30"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#0F172A] p-6">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  Smart Navigation
                </p>

                <div className="mt-5 grid gap-3">
                  {[
                    ["/market-os/editorial-calendar", "Editorial Calendar"],
                    ["/market-os/seo-blog-workspace/create", "Create SEO Asset"],
                    ["/revenue-command-center/daily-tasks/focus", "Focus Mode"],
                    ["/market-os/content-command-center", "Content Ops"],
                  ].map(([href, label]) => (
                    <Link
                      key={label}
                      href={href}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-black hover:bg-white/10"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

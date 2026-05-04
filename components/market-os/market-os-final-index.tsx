import Link from "next/link"

const engines = [
  ["/market-os/master-control-hub", "Master Control Hub"],
  ["/market-os/investor-command-center", "CEO / Investor Command Center"],
  ["/market-os/ai-command-center", "AI Command Center"],
  ["/market-os/ai-synthesis-engine", "AI Synthesis Engine"],
  ["/market-os/ai-task-chain-orchestrator", "AI Task Chain Orchestrator"],
  ["/market-os/outcome-performance-closure", "Outcome Performance Closure"],
  ["/market-os/operating-doctrine", "Operating Doctrine"],
  ["/market-os/strategy-growth-control-room", "Strategy Growth Control Room"],
  ["/market-os/strategy-execution-engine", "Strategy Execution Engine"],
  ["/market-os/approval-sla-escalation", "Approval SLA Escalation"],
  ["/market-os/kpi-roi-impact", "KPI ROI Impact"],
  ["/market-os/risk-signals-ai", "Risk Signals AI"],
  ["/market-os/campaign-lifecycle", "Campaign Lifecycle"],
  ["/market-os/content-brand-governance", "Content Brand Governance"],
  ["/market-os/research-competitive-intelligence", "Research Competitive Intelligence"],
  ["/market-os/offer-pricing-control", "Offer Pricing Control"],
  ["/market-os/sales-enablement-scripts", "Sales Enablement Scripts"],
  ["/market-os/partnership-referral-growth", "Partnership Referral Growth"],
  ["/market-os/seo-authority-growth", "SEO Authority Growth"],
  ["/market-os/pr-reputation-authority", "PR Reputation Authority"],
  ["/market-os/workforce-capacity-command", "Workforce Capacity Command"],
  ["/market-os/lead-intake-control", "Lead Intake Control"],
  ["/market-os/growth-experiment-lab", "Growth Experiment Lab"],
  ["/market-os/market-expansion-city-opportunity", "Market Expansion City Opportunity"],
  ["/market-os/marketing-calendar-execution", "Marketing Calendar Execution"],
  ["/market-os/marketing-board-reporting", "Marketing Board Reporting"],
  ["/market-os/automation-trigger-rules", "Automation Trigger Rules"],
  ["/market-os/config-admin-control", "Config Admin Control"],
  ["/market-os/role-workspace-permissions", "Role Workspace Permissions"],
  ["/market-os/data-pipeline-attribution", "Data Pipeline Attribution"],
  ["/market-os/audit-playbook-memory", "Audit Playbook Memory"],
]

export default function MarketOsFinalIndex() {
  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            Market-OS · Final Index
          </p>
          <h1 className="mt-3 text-4xl font-black">Market-OS Command Index</h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            Central access point for the full Market-OS strategic marketing operating system.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {engines.map(([href, title], index) => (
            <Link
              key={href}
              href={href}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-950"
            >
              <p className="text-xs font-bold uppercase text-slate-400">
                Engine {String(index + 1).padStart(2, "0")}
              </p>
              <h2 className="mt-2 text-lg font-black">{title}</h2>
              <p className="mt-3 text-sm text-slate-500">{href}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}

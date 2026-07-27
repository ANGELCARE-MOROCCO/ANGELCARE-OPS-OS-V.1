const previousWorkspaceSignals = [
  "AC CAPITAL OS",
  "Capital Executive Cockpit",
  "Capital Radar",
  "Qualification Engine",
  "Funder Intelligence Room",
  "Capital Doctrine Vault",
  "Fundraising Case Builder",
  "Due Diligence Data Room",
  "Capital Pipeline CRM",
  "Human Coordinator Cockpit",
  "AI Command Center",
  "Source Confidence",
  "Fit Score",
  "Investor Psychology",
  "Best AngelCare Narrative",
  "Monthly Doctrine Injection",
  "Coordinator Handover",
  "Follow-Up Engine",
  "Submission Log",
  "Manual Email Desk",
  "Safety Warnings",
  "No Exposed API Keys",
  "No Automatic Submission",
];

const heroMetrics = [
  { label: "Active Scenarios", value: "5", hint: "Bank, grant, VC, partner and blended routes" },
  { label: "Recommended Strategy", value: "Blended", hint: "Balanced risk and founder-control protection" },
  { label: "Production Readiness", value: "46%", hint: "Database foundation activated; wiring pending" },
  { label: "Risk-Adjusted Pipeline", value: "1 286 000 Dh", hint: "Directional, not a financing guarantee" },
  { label: "Tables Created", value: "106+", hint: "AC Capital foundation confirmed before MZ12" },
  { label: "Next Blockers", value: "9", hint: "Live persistence, AI wiring, storage, QA" },
];

const truthDashboard = [
  { label: "Database Foundation Activated", status: "Tables Created", detail: "MZ1-MZ11 ac_capital_* schema foundation has been executed and confirmed." },
  { label: "UI Contracts", status: "Ready", detail: "Protected workspaces and premium command pages exist." },
  { label: "API Contracts", status: "Ready", detail: "Structured seeded API contracts exist for MZ1-MZ12." },
  { label: "Seeded API Data", status: "Seeded Only", detail: "Most endpoints still return seeded contract data." },
  { label: "Real Persistence", status: "Needs Wiring", detail: "Supabase read/write calls must replace seeded endpoints in a dedicated phase." },
  { label: "AI Provider Bridge", status: "Provider-Control Ready", detail: "/ai-provider-control bridge is recognized; no live model calls yet." },
  { label: "Live AI Execution", status: "Future Phase", detail: "Gemini/OpenAI calls remain disabled until governed production wiring." },
  { label: "File Storage", status: "Needs Wiring", detail: "Data Room file upload/storage is not connected yet." },
  { label: "Automation", status: "Disabled for Safety", detail: "No automatic outreach, no automatic submission, no doctrine auto-activation." },
];

const strategyScenarios = [
  {
    title: "Bank-first Strategy",
    badge: "Bank-first Strategy",
    focus: "ILAYKI / TAMWILCOM / Attijariwafa-style funding, conservative projections, BFR, treasury discipline and low dilution.",
    speed: "Medium",
    credibility: "Very Strong",
    proof: "High documentation burden",
    founder: "Founder approval required",
    risk: "Repayment sensitivity and bank relationship discipline",
    recommendation: "Priority route for controlled non-dilutive financing with strict Dh documentation.",
  },
  {
    title: "Grant / Impact-first Strategy",
    badge: "Grant Impact Strategy",
    focus: "Women cofounder, child quality, education impact, caregiver professionalization, job creation and measurable outcomes.",
    speed: "Slow",
    credibility: "Strong",
    proof: "Impact evidence required",
    founder: "Founder review on impact claims",
    risk: "Competition risk and wording overclaim risk",
    recommendation: "Strong supporting route, especially for social/economic impact and Academy proof.",
  },
  {
    title: "VC / Angel Strategy",
    badge: "VC Angel Strategy",
    focus: "Partner OS SaaS, marketplace scalability, recurring revenue, Territory OS, defensibility and founder ambition.",
    speed: "Variable",
    credibility: "Depends on proof",
    proof: "SaaS traction and product evidence required",
    founder: "Founder-level approach mandatory",
    risk: "Dilution sensitivity and narrative risk",
    recommendation: "Do selectively after proof pack and narrow SaaS wedge are strong.",
  },
  {
    title: "Strategic Partner Strategy",
    badge: "Strategic partner",
    focus: "Schools, crèches, hotels, pediatric/orthophonist partners, corporates, public/luxury establishments and B2B distribution.",
    speed: "Medium-slow",
    credibility: "High if relationship proof exists",
    proof: "Offer clarity and partner evidence required",
    founder: "Founder involvement for major partnerships",
    risk: "Negotiation and operational alignment risk",
    recommendation: "Use to create revenue leverage and strengthen investor/bank credibility.",
  },
  {
    title: "Blended Finance Strategy",
    badge: "Blended Finance Strategy",
    focus: "Bank financing, grants, strategic partner revenues, selective investor interest, controlled treasury and staged execution.",
    speed: "Balanced",
    credibility: "Very Strong",
    proof: "Complex but resilient",
    founder: "Founder-control preserved",
    risk: "Reporting and coordination complexity",
    recommendation: "Recommended strategic path for balanced risk, diversification and credibility.",
  },
];

const comparisonRows = [
  ["Funding speed", "Medium", "Slow", "Variable", "Medium-slow", "Balanced"],
  ["Amount potential", "High", "Low-medium", "High", "Medium", "High"],
  ["Proof readiness", "Strong with bank pack", "Needs impact metrics", "Needs SaaS proof", "Needs partner proof", "Strong if coordinated"],
  ["Founder time required", "High at approval", "Medium", "Very high", "High", "Structured high"],
  ["Coordinator workload", "High documentation", "High forms", "High narrative", "Medium relationship", "High but controlled"],
  ["Dilution risk", "None", "None", "High", "Low-variable", "Protected"],
  ["Repayment risk", "Medium", "None", "None", "Low", "Managed"],
  ["Morocco relevance", "Very high", "High", "Medium", "Very high", "Very high"],
  ["SaaS scalability match", "Supportive", "Low-medium", "Very high", "Medium", "High"],
  ["Recommended priority", "Priority 1", "Priority 2", "Selective", "Priority 2", "Executive recommended"],
];

const financialSensitivity = [
  { label: "Requested Amount", value: "1 500 000 Dh", note: "Bank-facing Moroccan funding context uses Dh." },
  { label: "BFR Allocation", value: "30%", note: "Working-capital protection visible in financing strategy." },
  { label: "Treasury Reserve", value: "Controlled", note: "Founder-controlled reserve, accessed only through governed conditions." },
  { label: "Repayment Sensitivity", value: "Medium", note: "Interest and repayment logic require founder/finance review." },
  { label: "Dilution Sensitivity", value: "High", note: "VC path requires founder approval before outreach." },
  { label: "Recommended Strategy", value: "Blended", note: "Bank + grant + strategic partner + selective investor logic." },
];

const stressTests = [
  {
    risk: "Delayed bank approval",
    likelihood: "Medium",
    impact: "High",
    warning: "No bank response after follow-up window",
    planB: "Activate grant and strategic partner route",
    planC: "Reduce burn and prioritize revenue-generating B2B contracts",
    planD: "Use governed treasury reserve only with founder/bank/accounting approval",
    owner: "Capital Strategy + Founder",
  },
  {
    risk: "Grant rejection",
    likelihood: "Medium",
    impact: "Medium",
    warning: "Program requests stronger impact proof",
    planB: "Recycle impact file into another program",
    planC: "Use grant learning to update doctrine and proof pack",
    planD: "Pause grant route and protect coordinator workload",
    owner: "Coordinator + Doctrine Agent",
  },
  {
    risk: "VC asks for too much control",
    likelihood: "Medium",
    impact: "High",
    warning: "Equity/dilution terms exceed founder threshold",
    planB: "Counter with strategic partnership or revenue-share discussion",
    planC: "Delay VC path until SaaS proof increases leverage",
    planD: "Reject and inject learning into investor doctrine",
    owner: "Founder / Managing Director",
  },
  {
    risk: "Missing SaaS traction proof",
    likelihood: "High",
    impact: "High for VC",
    warning: "Data Room VC Pack readiness below threshold",
    planB: "Lead with bank/grant route",
    planC: "Create SaaS proof sprint and screenshot/data annex",
    planD: "Position SaaS as phased proof, not overclaimed traction",
    owner: "AI Command + Data Room Owner",
  },
  {
    risk: "AI generates weak or risky output",
    likelihood: "Medium",
    impact: "High",
    warning: "AI Confidence below 60 or Safety Warnings triggered",
    planB: "Block output and request regeneration",
    planC: "Update prompt, skill or doctrine binding",
    planD: "Pause agent and escalate to founder/AI system admin",
    owner: "AI System Admin",
  },
];

const reports = [
  {
    title: "Founder Capital Brief",
    audience: "Founders / Managing Directors",
    sections: "Strategy, blockers, approvals, pipeline, AI warnings",
    readiness: "Ready structure",
  },
  {
    title: "Bank Readiness Report",
    audience: "Bank / internal bank file review",
    sections: "Bank Pack, BFR, treasury, repayment, risk plan, proof gaps",
    readiness: "Needs live data wiring",
  },
  {
    title: "Investor Readiness Report",
    audience: "VC / angel / strategic investors",
    sections: "SaaS proof, Partner OS, market, roadmap, founder narrative",
    readiness: "Seeded Only",
  },
  {
    title: "Grant Readiness Report",
    audience: "Impact programs / grants",
    sections: "Women cofounder, child quality, job creation, Academy, outcomes",
    readiness: "Partially Ready",
  },
  {
    title: "AI Governance Report",
    audience: "Founder / AI System Admin",
    sections: "Agents, safety locks, provider bridge, issues, audit log",
    readiness: "Ready structure",
  },
  {
    title: "Production Readiness Report",
    audience: "Technical / founder launch review",
    sections: "Routes, APIs, tables, RLS, wiring, blockers, launch checklist",
    readiness: "Ready structure",
  },
];

const sopManuals = [
  "Radar review SOP",
  "Qualification review SOP",
  "Funder profile review SOP",
  "Doctrine injection SOP",
  "Case builder SOP",
  "Data room evidence SOP",
  "Pipeline follow-up SOP",
  "Coordinator daily execution SOP",
  "AI issue reporting SOP",
  "Founder approval SOP",
  "Bank submission SOP",
  "Grant submission SOP",
  "VC outreach SOP",
  "Lost opportunity learning SOP",
  "Monthly capital committee SOP",
];

const readinessChecks = [
  ["Protected routes", "Ready", "MZ1-MZ12 protected route structure exists."],
  ["APIs present", "Ready", "MZ1-MZ12 API contract routes exist."],
  ["Migrations present", "Ready", "MZ1-MZ12 migration file sequence expected."],
  ["Database tables created", "Database Created", "MZ1-MZ11 tables confirmed; MZ12 migration pending after this ZIP."],
  ["RLS enabled", "Partially Ready", "Tables enable RLS, policies require deeper review."],
  ["Seeded vs real data", "Seeded Only", "Most APIs return contract data."],
  ["Supabase read/write", "Needs Wiring", "Next phase must connect APIs to real tables."],
  ["AI provider bridge", "Provider-Control Ready", "/ai-provider-control recognized, no live calls."],
  ["File upload/storage", "Future Phase", "Data Room upload/storage not wired."],
  ["Email/send", "Manual Only", "No automatic sending for safety."],
  ["Audit logging", "Needs Wiring", "Tables exist; writes not wired."],
  ["Deployment readiness", "Needs QA", "TypeScript acceptance required; no build requested."],
];

const wiringMap = [
  ["Executive Cockpit", "Yes", "Yes", "Yes", "Pending", "Pending", "N/A", "Pending", "Pending", "Not yet"],
  ["Capital Radar", "Yes", "Yes", "Yes", "Pending", "Pending", "Pending", "N/A", "Pending", "Not yet"],
  ["Qualification Engine", "Yes", "Yes", "Yes", "Pending", "Pending", "Pending", "N/A", "Pending", "Not yet"],
  ["Funder Intelligence", "Yes", "Yes", "Yes", "Pending", "Pending", "Pending", "N/A", "Pending", "Not yet"],
  ["Doctrine Vault", "Yes", "Yes", "Yes", "Pending", "Pending", "Pending", "N/A", "Pending", "Not yet"],
  ["Case Builder", "Yes", "Yes", "Yes", "Pending", "Pending", "Pending", "N/A", "Pending", "Not yet"],
  ["Data Room", "Yes", "Yes", "Yes", "Pending", "Pending", "Pending", "Pending", "Pending", "Not yet"],
  ["Pipeline CRM", "Yes", "Yes", "Yes", "Pending", "Pending", "Pending", "N/A", "Pending", "Not yet"],
  ["Coordinator Cockpit", "Yes", "Yes", "Yes", "Pending", "Pending", "Pending", "Pending", "Pending", "Not yet"],
  ["AI Command Center", "Yes", "Yes", "Yes", "Pending", "Pending", "Provider-Control Ready", "N/A", "Pending", "Not yet"],
  ["Strategy Simulator", "Yes", "Yes", "After MZ12 SQL", "Pending", "Pending", "Pending", "N/A", "Pending", "Not yet"],
];

const launchChecklist = [
  "All routes verified",
  "All APIs verified",
  "All migrations present",
  "All tables confirmed",
  "MZ12 SQL applied after installer",
  "RLS reviewed",
  "Seeded data reviewed",
  "Database read/write wiring planned",
  "AI provider routing defined",
  "No exposed API keys",
  "No automatic submission",
  "Founder approvals enforced",
  "Coordinator manual workflow tested",
  "Reports reviewed",
  "SOP approved",
  "TypeScript passed",
];

function toneClasses(tone: string) {
  if (tone === "green") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (tone === "amber") return "border-amber-200 bg-amber-50 text-amber-800";
  if (tone === "red") return "border-rose-200 bg-rose-50 text-rose-800";
  if (tone === "purple") return "border-indigo-200 bg-indigo-50 text-indigo-800";
  if (tone === "blue") return "border-blue-200 bg-blue-50 text-blue-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function badgeTone(value: string) {
  if (value.includes("Blocked") || value.includes("Not yet") || value.includes("No ") || value.includes("Disabled")) return "red";
  if (value.includes("Needs") || value.includes("Pending") || value.includes("Seeded") || value.includes("Partially")) return "amber";
  if (value.includes("Ready") || value.includes("Created") || value.includes("Activated") || value.includes("Yes")) return "green";
  if (value.includes("Provider") || value.includes("AI") || value.includes("Future")) return "purple";
  return "blue";
}

function Badge({ children, tone = "blue" }: { children: string; tone?: string }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${toneClasses(tone)}`}>
      {children}
    </span>
  );
}

function SectionTitle({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return (
    <div className="mb-5">
      <p className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-700">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{title}</h2>
      <p className="mt-2 max-w-5xl text-sm leading-6 text-slate-600">{copy}</p>
    </div>
  );
}

export default function ACCapitalOSPage() {
  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <section className="relative overflow-hidden border-b border-blue-100 bg-white">
        <div className="absolute inset-0 opacity-80">
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-100 blur-3xl" />
          <div className="absolute left-1/3 top-12 h-72 w-72 rounded-full bg-emerald-100 blur-3xl" />
          <div className="absolute bottom-0 left-10 h-56 w-56 rounded-full bg-indigo-100 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 py-9">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <Badge tone="blue">MZ12_AC_CAPITAL_OS_STRATEGY_PRODUCTION_COMMAND</Badge>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
                Strategy Simulator & Production Command
              </h1>
              <p className="mt-3 max-w-4xl text-base leading-7 text-slate-600">
                Capital Scenarios, Executive Reports, SOP Manual, Production Readiness, Seeded-to-Live Wiring Map,
                Launch Control Checklist, Financial Sensitivity and Risk Stress Test. Database Foundation Activated,
                but live persistence, live AI and file storage remain the next governed wiring phase.
              </p>
            </div>
            <div className="rounded-[2rem] border border-blue-100 bg-blue-950 p-5 text-white shadow-2xl shadow-blue-900/20">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-200">Production truth</p>
              <p className="mt-2 text-4xl font-black">46%</p>
              <p className="mt-1 text-xs text-blue-100">UI/API/SQL foundation installed. Needs Wiring before production operations.</p>
            </div>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            {heroMetrics.map((item) => (
              <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{item.value}</p>
                <p className="mt-1 text-xs text-slate-500">{item.hint}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Badge tone="green">Create Strategy Scenario</Badge>
            <Badge tone="blue">Compare Bank vs Grant vs VC</Badge>
            <Badge tone="purple">Simulate Blended Finance</Badge>
            <Badge tone="amber">Generate Founder Report</Badge>
            <Badge tone="red">Open Production Readiness Audit</Badge>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">AC CAPITAL OS progression preserved</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {previousWorkspaceSignals.map((signal) => (
              <span key={signal} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700">
                {signal}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <SectionTitle
          eyebrow="Truth dashboard"
          title="Database Foundation Activated, Seeded Only, Needs Wiring"
          copy="This dashboard prevents false production claims. It separates tables created, UI installed, API contracts installed, live persistence pending, provider-control bridge ready and automation disabled for safety."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {truthDashboard.map((item) => (
            <article key={item.label} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <Badge tone={badgeTone(item.status)}>{item.status}</Badge>
              <h3 className="mt-3 text-lg font-black text-slate-950">{item.label}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <SectionTitle
          eyebrow="Capital Scenarios"
          title="Capital Strategy Scenario Simulator"
          copy="The simulator compares Bank-first Strategy, Grant Impact Strategy, VC Angel Strategy, Strategic Partner Strategy and Blended Finance Strategy before founder time or sensitive documents are committed."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {strategyScenarios.map((scenario) => (
            <article key={scenario.title} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Badge tone={badgeTone(scenario.badge)}>{scenario.badge}</Badge>
                  <h3 className="mt-3 text-xl font-black text-slate-950">{scenario.title}</h3>
                </div>
                <Badge tone="blue">{scenario.speed}</Badge>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{scenario.focus}</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-3 text-sm"><b>Credibility:</b> {scenario.credibility}</div>
                <div className="rounded-2xl bg-slate-50 p-3 text-sm"><b>Proof:</b> {scenario.proof}</div>
                <div className="rounded-2xl bg-slate-50 p-3 text-sm"><b>Founder:</b> {scenario.founder}</div>
                <div className="rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-800"><b>Risk:</b> {scenario.risk}</div>
              </div>
              <p className="mt-4 rounded-2xl bg-blue-50 p-3 text-sm font-bold text-blue-900">{scenario.recommendation}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <SectionTitle
          eyebrow="Comparison matrix"
          title="Scenario Comparison Matrix"
          copy="Readable strategy comparison across speed, amount, proof readiness, founder time, coordinator workload, dilution, repayment, Morocco relevance and SaaS scalability."
        />
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-6 border-b border-slate-100 bg-slate-50 px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            <div>Criteria</div><div>Bank</div><div>Grant</div><div>VC</div><div>Partner</div><div>Blended</div>
          </div>
          {comparisonRows.map((row) => (
            <div key={row[0]} className="grid grid-cols-6 gap-2 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0">
              {row.map((cell, index) => (
                <div key={`${row[0]}-${index}`} className={index === 0 ? "font-black text-slate-950" : "text-slate-650"}>{cell}</div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <SectionTitle
          eyebrow="Financial Sensitivity"
          title="Financial Sensitivity Simulator"
          copy="This is decision logic, not a full financial model. It helps reason about requested amount, BFR, treasury reserve, repayment sensitivity, dilution sensitivity and recommended strategy using Dh."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {financialSensitivity.map((item) => (
            <article key={item.label} className="rounded-[2rem] border border-emerald-200 bg-white p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">{item.label}</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{item.value}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <SectionTitle
          eyebrow="Risk Stress Test"
          title="Stress-Test Board with Plans B / C / D"
          copy="Each stress test identifies likelihood, impact, early warning, owner and backup routes before capital execution is exposed to unnecessary risk."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {stressTests.map((test) => (
            <article key={test.risk} className="rounded-[2rem] border border-amber-200 bg-white p-5 shadow-sm">
              <Badge tone={badgeTone(test.impact)}>{test.impact} impact</Badge>
              <h3 className="mt-3 text-xl font-black text-slate-950">{test.risk}</h3>
              <p className="mt-2 text-sm"><b>Likelihood:</b> {test.likelihood}</p>
              <p className="mt-2 text-sm"><b>Early warning:</b> {test.warning}</p>
              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl bg-emerald-50 p-3 text-sm"><b>Plan B:</b> {test.planB}</div>
                <div className="rounded-2xl bg-blue-50 p-3 text-sm"><b>Plan C:</b> {test.planC}</div>
                <div className="rounded-2xl bg-rose-50 p-3 text-sm"><b>Plan D:</b> {test.planD}</div>
              </div>
              <p className="mt-3 text-sm font-bold text-slate-700">Owner: {test.owner}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <SectionTitle
          eyebrow="Executive Reports"
          title="Executive Report Studio"
          copy="Report structures are prepared for founders, banks, investors, grants, AI governance and production readiness. Export is a future wiring step unless scoped separately."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {reports.map((report) => (
            <article key={report.title} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <Badge tone={badgeTone(report.readiness)}>{report.readiness}</Badge>
              <h3 className="mt-3 text-lg font-black text-slate-950">{report.title}</h3>
              <p className="mt-2 text-sm"><b>Audience:</b> {report.audience}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600"><b>Included:</b> {report.sections}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <SectionTitle
          eyebrow="SOP Manual"
          title="SOP Manual and Coordinator Workbook"
          copy="The SOP Manual converts AC CAPITAL OS into a repeatable operating process for a non-expert coordinator: purpose, performer, prerequisites, steps, warnings, proof, approval, completion and escalation."
        />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sopManuals.map((sop) => (
            <div key={sop} className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm font-bold text-indigo-900">
              {sop}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <SectionTitle
          eyebrow="Production Readiness"
          title="Production Readiness Audit"
          copy="The audit identifies what is ready, partially ready, seeded only, database-created, needs wiring, needs QA, future phase, manual-only or disabled for safety."
        />
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-12 border-b border-slate-100 bg-slate-50 px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            <div className="col-span-3">Area</div><div className="col-span-2">Status</div><div className="col-span-7">Evidence / next action</div>
          </div>
          {readinessChecks.map((row) => (
            <div key={row[0]} className="grid grid-cols-12 gap-2 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0">
              <div className="col-span-3 font-black">{row[0]}</div>
              <div className="col-span-2"><Badge tone={badgeTone(row[1])}>{row[1]}</Badge></div>
              <div className="col-span-7 text-slate-600">{row[2]}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <SectionTitle
          eyebrow="Seeded-to-Live Wiring Map"
          title="Seeded-to-Live Wiring Map"
          copy="This matrix is intentionally honest: UI, API and SQL exist, while real database reads/writes, AI provider wiring, file upload, audit writes and production readiness remain the next serious wiring phase."
        />
        <div className="overflow-auto rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="min-w-[980px]">
            <div className="grid grid-cols-10 border-b border-slate-100 bg-slate-50 px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
              <div>Workspace</div><div>UI</div><div>API</div><div>SQL</div><div>DB read</div><div>DB write</div><div>AI</div><div>Storage</div><div>Audit</div><div>Production</div>
            </div>
            {wiringMap.map((row) => (
              <div key={row[0]} className="grid grid-cols-10 gap-2 border-b border-slate-100 px-4 py-3 text-xs last:border-b-0">
                {row.map((cell, index) => (
                  <div key={`${row[0]}-${index}`} className={index === 0 ? "font-black text-slate-950" : ""}>
                    {index === 0 ? cell : <Badge tone={badgeTone(cell)}>{cell}</Badge>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <SectionTitle
          eyebrow="Launch Control Checklist"
          title="Launch Control Checklist"
          copy="The launch checklist keeps MZ12 disciplined: no fake production readiness, no hidden SQL execution, no automatic provider calls and no deployment until the user chooses."
        />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {launchChecklist.map((item) => (
            <div key={item} className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-bold text-blue-900">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-12">
        <div className="rounded-[2rem] border border-blue-200 bg-blue-950 p-6 text-white shadow-2xl shadow-blue-900/20">
          <h2 className="text-2xl font-black">MZ12 truth boundary</h2>
          <p className="mt-3 max-w-5xl text-sm leading-6 text-blue-100">
            Database foundation: activated. UI/API contracts: installed. Live persistence: next phase.
            AI execution: next phase. File storage: next phase. Automation: disabled for safety.
            MZ12 does not claim full production readiness, live AI calls, automatic reports export, automatic outreach,
            automatic submission or completed Supabase migration-history reconciliation.
          </p>
        </div>
      </section>
    </main>
  );
}

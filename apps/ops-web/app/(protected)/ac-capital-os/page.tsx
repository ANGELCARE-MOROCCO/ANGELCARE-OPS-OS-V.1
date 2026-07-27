const statusCards = [
  { label: "Supabase Live Status", value: "Live / Fallback", status: "Needs live data", note: "APIs can now attempt Supabase reads and fall back safely when tables are empty." },
  { label: "API Data Mode", value: "supabase-live | seeded-fallback", status: "Installed", note: "Each upgraded API exposes ok, dataMode, source, warning and data." },
  { label: "AI Execution Mode", value: "dry-run default", status: "Safe", note: "Live runs require provider-control assignment, flags, safety checks and approval gates." },
  { label: "Provider-Control Status", value: "/ai-provider-control bridge", status: "Bridge Ready", note: "No provider secrets are stored inside AC CAPITAL OS." },
  { label: "Storage Status", value: "contract wired", status: "Bucket required", note: "Data Room upload API expects private ac-capital-data-room bucket." },
  { label: "Report Engine Status", value: "HTML / Markdown / JSON", status: "Foundation", note: "Reports are generated as structured content; PDF remains a future phase unless scoped." },
  { label: "Automation Gate Status", value: "manual-safe", status: "Locked", note: "Prepare, mark sent, proof and task completion only. No automatic outreach." },
  { label: "Approval Guard Status", value: "enforced", status: "Active", note: "Sensitive bank, VC, financial, legal and founder claims are blocked without approval." },
  { label: "QA Status", value: "script suite", status: "Ready", note: "DB, API, storage, provider bridge, no-secret and production readiness checks included." },
];

const workspaceModes = [
  ["Executive Cockpit", "Supabase read/fallback", "Needs data", "Audit pending"],
  ["Capital Radar", "Supabase read/fallback", "Research dry-run", "Needs provider for live research"],
  ["Qualification Engine", "Supabase read/fallback", "Safe notes", "Needs real scoring writes"],
  ["Funder Intelligence Room", "Supabase read/fallback", "Notes ready", "Needs live data"],
  ["Capital Doctrine Vault", "Supabase read/fallback", "Draft only", "Activation approval required"],
  ["Fundraising Case Builder", "Supabase read/fallback", "Draft only", "Founder approval for final release"],
  ["Due Diligence Data Room", "Supabase read/fallback", "Storage contract", "Private bucket required"],
  ["Capital Pipeline CRM", "Supabase read/fallback", "Communication logs", "No fake submission"],
  ["Human Coordinator Cockpit", "Supabase read/fallback", "Manual gates", "No automatic email sending"],
  ["AI Command Center", "Supabase read/fallback", "Provider-control bridge", "Live runs disabled by default"],
  ["Strategy Simulator & Production Command", "Supabase read/fallback", "Reports foundation", "Production QA pending"],
];

const productionGates = [
  "No Automatic Submission",
  "No Exposed API Keys",
  "No browser service-role key",
  "No live AI by default",
  "No provider secrets in AC Capital source",
  "No sensitive email without approval",
  "No doctrine activation without approval",
  "No final package release without founder check",
  "No public Data Room bucket by default",
  "No fake production readiness claim",
];

const productionFiles = [
  "server/supabase.ts",
  "server/repository.ts",
  "server/ai-provider-bridge.ts",
  "server/ai-runner.ts",
  "server/research-adapter.ts",
  "server/storage.ts",
  "server/reports.ts",
  "server/automation-gates.ts",
  "server/approval-guard.ts",
  "server/permissions.ts",
  "server/audit.ts",
  "server/route-handlers.ts",
];

const qaSuite = [
  "verify_ac_capital_os_db_tables",
  "verify_ac_capital_os_api_contracts",
  "verify_ac_capital_os_live_api_smoke",
  "verify_ac_capital_os_storage_contract",
  "verify_ac_capital_os_ai_provider_bridge",
  "verify_ac_capital_os_no_secret_leak",
  "verify_ac_capital_os_production_readiness",
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
  if (value.includes("No ") || value.includes("Locked") || value.includes("required") || value.includes("disabled")) return "red";
  if (value.includes("Needs") || value.includes("pending") || value.includes("Bucket")) return "amber";
  if (value.includes("Ready") || value.includes("Installed") || value.includes("Active") || value.includes("Safe")) return "green";
  if (value.includes("AI") || value.includes("Provider") || value.includes("Bridge")) return "purple";
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
              <Badge tone="blue">MZ13_AC_CAPITAL_OS_FULL_PRODUCTION_WIRING</Badge>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
                AC CAPITAL OS Production Activation
              </h1>
              <p className="mt-3 max-w-4xl text-base leading-7 text-slate-600">
                Live Supabase Wiring, AI Provider Execution, Storage, Reports, Automation Gates & Production QA.
                AC CAPITAL OS now moves from seeded contract layer to real controlled live/fallback architecture,
                with safeguards for approvals, audit, provider-control, Data Room storage and production verification.
              </p>
            </div>
            <div className="rounded-[2rem] border border-blue-100 bg-blue-950 p-5 text-white shadow-2xl shadow-blue-900/20">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-200">Production Activation</p>
              <p className="mt-2 text-4xl font-black">MZ13</p>
              <p className="mt-1 text-xs text-blue-100">Supabase live/fallback · dry-run AI default · approval guard locked.</p>
            </div>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {statusCards.map((item) => (
              <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                  <Badge tone={badgeTone(item.status)}>{item.status}</Badge>
                </div>
                <p className="mt-2 text-xl font-black text-slate-950">{item.value}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Preserved AC CAPITAL OS progression</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
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
              "Strategy Simulator & Production Command",
              "Seeded-to-Live Wiring Map",
              "Launch Control Checklist",
              "No Automatic Submission",
              "No Exposed API Keys",
              "Safety Warnings",
              "Manual Email Desk",
              "Submission Log",
            ].map((signal) => (
              <span key={signal} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700">
                {signal}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <SectionTitle
          eyebrow="Workspace live/fallback status"
          title="Supabase Live Status by Workspace"
          copy="Each workspace now has a server-side route pattern capable of returning supabase-live when records exist, seeded-fallback when tables are empty, or disabled if safety flags demand it."
        />
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-12 border-b border-slate-100 bg-slate-50 px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            <div className="col-span-3">Workspace</div><div className="col-span-3">Data Mode</div><div className="col-span-3">Execution</div><div className="col-span-3">Remaining Guard</div>
          </div>
          {workspaceModes.map((row) => (
            <div key={row[0]} className="grid grid-cols-12 gap-2 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0">
              <div className="col-span-3 font-black">{row[0]}</div>
              <div className="col-span-3"><Badge tone={badgeTone(row[1])}>{row[1]}</Badge></div>
              <div className="col-span-3"><Badge tone={badgeTone(row[2])}>{row[2]}</Badge></div>
              <div className="col-span-3 text-slate-600">{row[3]}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <SectionTitle
          eyebrow="Production backend"
          title="Repository Layer and Production Wiring Files"
          copy="MZ13 introduces a controlled server-side architecture: route handler → repository → Supabase REST → ac_capital_* tables, with feature flags, approval guard, audit helper and safe errors."
        />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {productionFiles.map((file) => (
            <div key={file} className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-bold text-blue-900">
              {file}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <SectionTitle
          eyebrow="Governed automation"
          title="Automation Gates, Approval Guard and Safety Locks"
          copy="MZ13 allows safe operational actions such as preparing drafts, logging communication, completing tasks and creating blockers, while blocking sensitive final actions unless approval rules are satisfied."
        />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {productionGates.map((gate) => (
            <div key={gate} className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-900">
              {gate}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <SectionTitle
          eyebrow="QA suite"
          title="Production QA Verification Suite"
          copy="The package includes strict scripts for routes, APIs, migrations, table expectations, storage contract, provider bridge, secret leakage and production readiness."
        />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {qaSuite.map((script) => (
            <div key={script} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">
              {script}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-12">
        <div className="rounded-[2rem] border border-blue-200 bg-blue-950 p-6 text-white shadow-2xl shadow-blue-900/20">
          <h2 className="text-2xl font-black">MZ13 truth boundary</h2>
          <p className="mt-3 max-w-5xl text-sm leading-6 text-blue-100">
            MZ13 installs the Supabase live/fallback layer, safe write endpoints, dry-run AI runner, provider-control bridge,
            storage contract, report foundation, manual workflow gates, approval guard, audit helper, permission helper and QA scripts.
            It does not enable automatic investor submission, automatic sensitive email sending, uncontrolled live AI,
            browser secrets, public Data Room storage or final production deployment without your explicit operational decision.
          </p>
        </div>
      </section>
    </main>
  );
}

const aiHeroMetrics = [
  { label: "Active AI Agents", value: "10", hint: "Capital executive agents governed by AC CAPITAL OS" },
  { label: "AI Outputs Awaiting Approval", value: "14", hint: "Sensitive outputs remain human-controlled" },
  { label: "Troubleshooting Tickets", value: "7", hint: "Issues open for prompt/doctrine/skill review" },
  { label: "Safety Locks", value: "18", hint: "No Automatic Submission / No Exposed API Keys" },
  { label: "Provider Bridge", value: "Ready", hint: "/ai-provider-control integration contract" },
  { label: "Human Approval Queue", value: "9", hint: "Founder-sensitive and coordinator-sensitive outputs" },
];

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
  "Source Confidence",
  "Fit Score",
  "Investor Psychology",
  "Best AngelCare Narrative",
  "Monthly Doctrine Injection",
  "AI Agent Doctrine Binding",
  "Coordinator Handover",
  "Data Room Readiness",
  "Follow-Up Engine",
  "Submission Log",
  "Learning Injected",
  "Manual Email Desk",
  "Safety Warnings",
];

const providerBridgeModes = [
  {
    title: "Use same AI supplier",
    mode: "Shared /ai-provider-control dossier",
    detail: "AC CAPITAL OS may consume the governed provider assignment already operated by AI Provider Control, respecting quotas, model policies, credentials and audit.",
  },
  {
    title: "Use dedicated Gemini API dossier",
    mode: "Separate ac_capital_os Gemini dossier",
    detail: "AC CAPITAL OS may be assigned its own Gemini-ready dossier, capacity pool, credentials, quotas and module routing without exposing provider secrets.",
  },
  {
    title: "Hybrid failover",
    mode: "Primary + fallback + manual mode",
    detail: "Capital agents can use primary, secondary, failover, emergency reserve, sandbox, manual or disabled assignment modes from AI Provider Control logic.",
  },
];

const aiAgents = [
  {
    name: "Capital Executive Brain",
    status: "Active",
    purpose: "Orchestrates Radar, Qualification, Funder Intelligence, Doctrine, Case Builder, Data Room, Pipeline and Coordinator flow.",
    workspace: "Full AC CAPITAL OS",
    confidence: 88,
    doctrine: "Founder Doctrine + Capital Strategy Doctrine",
    prompts: "Executive orchestration prompt",
    skills: "Capital strategy + governance",
    forbidden: "No automatic submission; no founder approval bypass.",
  },
  {
    name: "Radar Agent",
    status: "Gemini-Ready",
    purpose: "Detects funding opportunities, captures sources, extracts deadlines and computes source confidence.",
    workspace: "Capital Radar",
    confidence: 82,
    doctrine: "Radar research doctrine",
    prompts: "Capital Radar research prompt",
    skills: "Research Validation Skill",
    forbidden: "No unsourced opportunity claims; no fake deadline; no exposed API keys.",
  },
  {
    name: "Qualification Agent",
    status: "Active",
    purpose: "Scores opportunity fit, eligibility, women cofounder fit, SaaS fit, impact fit and documentation readiness.",
    workspace: "Qualification Engine",
    confidence: 84,
    doctrine: "Qualification scoring doctrine",
    prompts: "Opportunity qualification prompt",
    skills: "Eligibility + scoring skill",
    forbidden: "No absolute success prediction; no unsupported eligibility certainty.",
  },
  {
    name: "Funder Psychology Agent",
    status: "Needs Review",
    purpose: "Builds investor psychology, likely objections, proof expectations and Best AngelCare Narrative.",
    workspace: "Funder Intelligence Room",
    confidence: 76,
    doctrine: "Investor psychology doctrine",
    prompts: "Funder psychology prompt",
    skills: "Investor Objection Handling Skill",
    forbidden: "No fake contact data; no pretending private information is known.",
  },
  {
    name: "Doctrine Agent",
    status: "Human Approval Only",
    purpose: "Manages doctrine suggestions, conflict warnings, manual commands and monthly doctrine injection review.",
    workspace: "Capital Doctrine Vault",
    confidence: 80,
    doctrine: "Founder Doctrine",
    prompts: "Learning injection prompt",
    skills: "Doctrine governance skill",
    forbidden: "No auto-activation of monthly doctrine without approval.",
  },
  {
    name: "Case Builder Agent",
    status: "Active",
    purpose: "Prepares package narrative, required documents, financial section, risk plan, impact section and scripts.",
    workspace: "Fundraising Case Builder",
    confidence: 81,
    doctrine: "Bank / VC / Grant doctrine",
    prompts: "Case package prompt",
    skills: "Bank Funding Skill + VC Pitch Skill + Grant Writing Skill",
    forbidden: "No final legal/financial guarantee; no automatic submission.",
  },
  {
    name: "Data Room Agent",
    status: "Limited Mode",
    purpose: "Maps proof, missing evidence, package readiness, expiry/version alerts and credibility score.",
    workspace: "Due Diligence Data Room",
    confidence: 79,
    doctrine: "Proof and compliance doctrine",
    prompts: "Due diligence prompt",
    skills: "Due Diligence Skill",
    forbidden: "No fake file existence; no treating expired proof as ready.",
  },
  {
    name: "Pipeline Agent",
    status: "Active",
    purpose: "Tracks stages, follow-ups, submissions, due diligence, negotiation and Outcome and Learning.",
    workspace: "Capital Pipeline CRM",
    confidence: 86,
    doctrine: "Pipeline lifecycle doctrine",
    prompts: "Pipeline follow-up prompt",
    skills: "Capital CRM skill",
    forbidden: "No fake submission status; no automatic email sending.",
  },
  {
    name: "Coordinator Agent",
    status: "Active",
    purpose: "Converts intelligence into Today’s Capital Actions, Manual Email Desk, Call Execution Desk and Safety Warnings.",
    workspace: "Human Coordinator Cockpit",
    confidence: 87,
    doctrine: "Coordinator execution doctrine",
    prompts: "Coordinator task prompt",
    skills: "Coordinator Execution Skill",
    forbidden: "No bypassing human execution; no risky instruction without warning.",
  },
  {
    name: "Learning Agent",
    status: "Testing",
    purpose: "Converts won/lost outcomes into doctrine, scoring, prompt and data room improvement suggestions.",
    workspace: "Learning Injected",
    confidence: 73,
    doctrine: "Learning and feedback doctrine",
    prompts: "Learning injection prompt",
    skills: "Learning Injection Skill",
    forbidden: "No automatic doctrine activation from one weak signal.",
  },
];

const runHistory = [
  {
    id: "AIRUN-001",
    agent: "Radar Agent",
    workspace: "Capital Radar",
    output: "opportunity scan",
    status: "Completed — Needs Review",
    confidence: 82,
    risk: "Medium",
    doctrine: "Radar research doctrine",
    approval: "Human review required",
  },
  {
    id: "AIRUN-002",
    agent: "Qualification Agent",
    workspace: "Qualification Engine",
    output: "qualification score",
    status: "Completed",
    confidence: 86,
    risk: "Low",
    doctrine: "Qualification scoring doctrine",
    approval: "Coordinator review",
  },
  {
    id: "AIRUN-003",
    agent: "Case Builder Agent",
    workspace: "Fundraising Case Builder",
    output: "bank cover email",
    status: "Completed — Founder Approval Required",
    confidence: 88,
    risk: "Financial Sensitive",
    doctrine: "Bank Funding Doctrine",
    approval: "Founder approval required",
  },
  {
    id: "AIRUN-004",
    agent: "Funder Psychology Agent",
    workspace: "Funder Intelligence Room",
    output: "investor objections",
    status: "Blocked by Safety Rule",
    confidence: 51,
    risk: "Source Verification Needed",
    doctrine: "Investor psychology doctrine",
    approval: "Regeneration requested",
  },
];

const prompts = [
  {
    name: "Capital Radar research prompt",
    agent: "Radar Agent",
    workspace: "Capital Radar",
    version: "v1.3",
    status: "Active",
    risk: "Medium",
    requirement: "Must include source confidence, source freshness and no invented funder.",
  },
  {
    name: "Qualification scoring prompt",
    agent: "Qualification Agent",
    workspace: "Qualification Engine",
    version: "v1.2",
    status: "Active — Founder Approved",
    risk: "Medium",
    requirement: "Must explain Fit Score, missing evidence and no absolute success probability.",
  },
  {
    name: "Bank file prompt",
    agent: "Case Builder Agent",
    workspace: "Fundraising Case Builder",
    version: "v1.4",
    status: "Active — Founder Approved",
    risk: "Financial Sensitive",
    requirement: "Must use Dh, conservative projections, BFR logic and no guarantee language.",
  },
  {
    name: "AI troubleshooting prompt",
    agent: "Learning Agent",
    workspace: "AI Command Center",
    version: "v1.0",
    status: "Testing",
    risk: "High",
    requirement: "Must classify issue, recommend fix and preserve audit trail.",
  },
];

const skills = [
  "Bank Funding Skill",
  "VC Pitch Skill",
  "Grant Writing Skill",
  "Impact Narrative Skill",
  "Investor Objection Handling Skill",
  "Due Diligence Skill",
  "Legal-Safe Wording Skill",
  "Moroccan Funding Skill",
  "SaaS Monetization Skill",
  "Financial Projection Review Skill",
  "Coordinator Execution Skill",
  "Risk Escalation Skill",
  "Learning Injection Skill",
  "Research Validation Skill",
];

const safetyRules = [
  {
    title: "No Automatic Submission",
    severity: "Critical",
    action: "Block output and require coordinator/founder approval.",
    affected: "All agents",
  },
  {
    title: "No Exposed API Keys",
    severity: "Critical",
    action: "Provider secrets stay inside /ai-provider-control governed credentials.",
    affected: "Research Adapter + Provider Configuration",
  },
  {
    title: "No fake source, contact or deadline",
    severity: "Critical",
    action: "Block or mark Source Verification Needed.",
    affected: "Radar Agent + Funder Psychology Agent",
  },
  {
    title: "No financial guarantee language",
    severity: "High",
    action: "Require founder approval and finance/admin review.",
    affected: "Case Builder Agent",
  },
  {
    title: "No child-safety overclaim",
    severity: "High",
    action: "Require human verification and legal-safe wording.",
    affected: "Grant / impact / case outputs",
  },
  {
    title: "No autonomous doctrine activation",
    severity: "Critical",
    action: "Send to Monthly Doctrine Injection review queue.",
    affected: "Doctrine Agent + Learning Agent",
  },
];

const troubleshootingIssues = [
  {
    title: "AI found irrelevant opportunity",
    category: "Radar quality",
    severity: "Medium",
    agent: "Radar Agent",
    status: "Prompt Fix Needed",
    fix: "Tighten AngelCare relevance filter and Morocco/international split.",
  },
  {
    title: "AI hallucinated source confidence",
    category: "Source Verification Needed",
    severity: "Critical",
    agent: "Radar Agent",
    status: "Agent Paused",
    fix: "Require source URL and freshness before opportunity activation.",
  },
  {
    title: "AI generated weak bank wording",
    category: "Document quality",
    severity: "High",
    agent: "Case Builder Agent",
    status: "Doctrine Update Needed",
    fix: "Rebind Bank Funding Doctrine and regenerate with conservative tone.",
  },
  {
    title: "AI missed founder approval requirement",
    category: "Safety failure",
    severity: "Critical",
    agent: "Coordinator Agent",
    status: "Escalated to Founder",
    fix: "Update safety rule: bank commitment and VC outreach always blocked until approval.",
  },
];

const confidencePolicies = [
  "90–100: high confidence, normal review.",
  "75–89: good confidence, human review normal.",
  "60–74: caution, review required.",
  "40–59: low confidence, do not use without verification.",
  "0–39: block or regenerate.",
  "Financial Sensitive outputs always require founder approval.",
  "Legal / Compliance Risk outputs require human review.",
  "Public source outputs require source confidence and freshness.",
];

const auditEvents = [
  "agent run started",
  "agent run completed",
  "agent run failed",
  "prompt changed",
  "skill changed",
  "doctrine binding changed",
  "safety rule triggered",
  "output blocked",
  "output approved",
  "output rejected",
  "regeneration requested",
  "issue created",
  "issue resolved",
  "agent paused",
  "agent resumed",
  "provider setting changed",
  "human override applied",
];

const permissions = [
  {
    role: "Founder / Managing Director",
    permissions: "approve sensitive output, override safety warning, configure provider placeholder, export audit log, pause agents",
  },
  {
    role: "Capital Strategy Admin",
    permissions: "view agents, edit prompts, edit skills, report issues, request doctrine rebinding",
  },
  {
    role: "AI System Admin",
    permissions: "provider configuration, agent status, audit export, troubleshooting resolution",
  },
  {
    role: "Capital Coordinator",
    permissions: "view tasks, report issue, request regeneration, complete human approval queue items assigned to them",
  },
];

const humanApprovalQueue = [
  "Bank cover email — Founder Approval Required",
  "VC intro narrative — Equity / Dilution Sensitive",
  "International expansion claim — Human Verification Required",
  "Financial section draft — Finance/Admin Review Required",
  "Monthly doctrine suggestion — Do not auto-activate",
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
  if (value.includes("Critical") || value.includes("Blocked") || value.includes("No ") || value.includes("Paused") || value.includes("Exposed")) return "red";
  if (value.includes("High") || value.includes("Review") || value.includes("Warning") || value.includes("Sensitive")) return "amber";
  if (value.includes("Active") || value.includes("Completed") || value.includes("Ready")) return "green";
  if (value.includes("AI") || value.includes("Gemini") || value.includes("Founder")) return "purple";
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

function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="mt-3 h-2 rounded-full bg-slate-100">
      <div className="h-2 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500" style={{ width: `${value}%` }} />
    </div>
  );
}

export default function ACCapitalOSPage() {
  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-950">
      <section className="relative overflow-hidden border-b border-blue-100 bg-white">
        <div className="absolute inset-0 opacity-80">
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-indigo-100 blur-3xl" />
          <div className="absolute left-1/3 top-12 h-72 w-72 rounded-full bg-blue-100 blur-3xl" />
          <div className="absolute bottom-0 left-10 h-56 w-56 rounded-full bg-emerald-100 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 py-9">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <Badge tone="blue">MZ11_AC_CAPITAL_OS_AI_COMMAND_CENTER</Badge>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
                AI Command Center
              </h1>
              <p className="mt-3 max-w-4xl text-base leading-7 text-slate-600">
                Agents, Skills, Prompts, Research Adapter, Provider Configuration, Safety Rules, Troubleshooting Center,
                AI Confidence Policy, AI Audit Log, Cost Usage Monitor, Permission Matrix and Human Approval Queue.
                AngelCare controls the AI. The AI does not control AngelCare.
              </p>
            </div>
            <div className="rounded-[2rem] border border-indigo-100 bg-indigo-950 p-5 text-white shadow-2xl shadow-indigo-900/20">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-200">Safety Lock Status</p>
              <p className="mt-2 text-4xl font-black">Locked</p>
              <p className="mt-1 text-xs text-indigo-100">No Automatic Submission · No Exposed API Keys · Human approval remains mandatory.</p>
            </div>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            {aiHeroMetrics.map((item) => (
              <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{item.value}</p>
                <p className="mt-1 text-xs text-slate-500">{item.hint}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Badge tone="green">Open Agent Registry</Badge>
            <Badge tone="blue">Review AI Run History</Badge>
            <Badge tone="amber">Review AI Issues</Badge>
            <Badge tone="purple">Configure Research Adapter</Badge>
            <Badge tone="red">Pause Agent</Badge>
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
          eyebrow="AI supplier bridge"
          title="/ai-provider-control Integration Contract"
          copy="MZ11 recognizes the existing AI Provider Control module as the governed supplier authority. AC CAPITAL OS can use the same provider assignment or a dedicated Gemini API dossier, while credentials stay governed and never exposed in the browser."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {providerBridgeModes.map((mode) => (
            <article key={mode.title} className="rounded-[2rem] border border-indigo-200 bg-white p-5 shadow-sm">
              <Badge tone="purple">{mode.mode}</Badge>
              <h3 className="mt-3 text-lg font-black text-slate-950">{mode.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{mode.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <SectionTitle
          eyebrow="Agent Registry"
          title="AI Agent Registry"
          copy="Each agent has purpose, status, active workspace, doctrine, prompts, skills, allowed actions, forbidden actions, confidence and approval boundaries."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {aiAgents.map((agent) => (
            <article key={agent.name} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Badge tone={badgeTone(agent.status)}>{agent.status}</Badge>
                  <h3 className="mt-3 text-xl font-black text-slate-950">{agent.name}</h3>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">{agent.workspace}</p>
                </div>
                <span className="text-2xl font-black text-slate-950">{agent.confidence}%</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{agent.purpose}</p>
              <ConfidenceBar value={agent.confidence} />
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-3 text-sm"><b>Doctrine:</b> {agent.doctrine}</div>
                <div className="rounded-2xl bg-slate-50 p-3 text-sm"><b>Prompt:</b> {agent.prompts}</div>
                <div className="rounded-2xl bg-slate-50 p-3 text-sm"><b>Skills:</b> {agent.skills}</div>
                <div className="rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-800"><b>Forbidden:</b> {agent.forbidden}</div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone="blue">Open Agent</Badge>
                <Badge tone="amber">Review Last Output</Badge>
                <Badge tone="red">Report Issue</Badge>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <SectionTitle
          eyebrow="Run governance"
          title="AI Run History"
          copy="Every AI run is traceable by agent, workspace, doctrine, prompt, skill, confidence, risk, human approval status and linked case/funder/opportunity/task."
        />
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-12 border-b border-slate-100 bg-slate-50 px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            <div className="col-span-2">Run</div>
            <div className="col-span-2">Agent</div>
            <div className="col-span-2">Workspace</div>
            <div className="col-span-2">Output</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1">Risk</div>
            <div className="col-span-1">Conf.</div>
          </div>
          {runHistory.map((run) => (
            <div key={run.id} className="grid grid-cols-12 gap-2 border-b border-slate-100 px-4 py-4 text-sm last:border-b-0">
              <div className="col-span-2 font-black">{run.id}</div>
              <div className="col-span-2">{run.agent}</div>
              <div className="col-span-2">{run.workspace}</div>
              <div className="col-span-2">{run.output}</div>
              <div className="col-span-2"><Badge tone={badgeTone(run.status)}>{run.status}</Badge></div>
              <div className="col-span-1 text-xs font-bold">{run.risk}</div>
              <div className="col-span-1 font-black">{run.confidence}%</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <SectionTitle
          eyebrow="Prompt and skill governance"
          title="Prompt Control Library + Skills Control Library"
          copy="Prompts and skills are managed assets: versioned, governed, linked to agents and workspaces, controlled by risk level and review status."
        />
        <div className="grid gap-5 lg:grid-cols-2">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-xl font-black">Prompt Control Library</h3>
            <div className="mt-4 space-y-3">
              {prompts.map((prompt) => (
                <div key={prompt.name} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex flex-wrap justify-between gap-2">
                    <p className="font-black">{prompt.name}</p>
                    <Badge tone={badgeTone(prompt.status)}>{prompt.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{prompt.agent} · {prompt.workspace} · {prompt.version}</p>
                  <p className="mt-2 text-sm font-bold text-slate-700">{prompt.requirement}</p>
                </div>
              ))}
            </div>
          </article>
          <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-xl font-black">Skills Control Library</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge key={skill} tone={skill.includes("Legal") || skill.includes("Risk") ? "red" : skill.includes("VC") || skill.includes("SaaS") ? "purple" : "blue"}>
                  {skill}
                </Badge>
              ))}
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-600">
              Each skill pack carries applicable agents, applicable workspaces, active version, confidence policy, input expectations, output standards, caution rules, examples, last used, active/inactive and review status.
            </p>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <SectionTitle
          eyebrow="Provider and adapter governance"
          title="Research Adapter + Provider Configuration"
          copy="The provider control panel is structured for Gemini-ready, web-ready, simulated, manual, limited or disabled mode. Real keys remain governed by AI Provider Control and are never exposed here."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            ["Research Adapter", "Gemini-Ready / Web-Ready / Manual / Simulated / Disabled / Human Review Only. Source freshness and source confidence are mandatory."],
            ["Provider Configuration", "Provider name placeholder, model tier, usage purpose, fallback model, allowed agents, blocked agents and sensitive-output approval rule."],
            ["Cost Usage Monitor", "Usage values are placeholders until live provider billing integration is connected. Monthly budget and high-cost workflow warnings are visible."],
          ].map(([title, copy]) => (
            <article key={title} className="rounded-[2rem] border border-blue-200 bg-white p-5 shadow-sm">
              <Badge tone="blue">{title}</Badge>
              <p className="mt-3 text-sm leading-6 text-slate-600">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <SectionTitle
          eyebrow="Safety"
          title="Safety Rules Wall"
          copy="Safety rules block risky AI behavior, force verification, require founder approval and preserve audit events before sensitive outputs are used."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {safetyRules.map((rule) => (
            <article key={rule.title} className="rounded-[2rem] border border-rose-200 bg-white p-5 shadow-sm">
              <Badge tone={badgeTone(rule.severity)}>{rule.severity}</Badge>
              <h3 className="mt-3 text-lg font-black text-slate-950">{rule.title}</h3>
              <p className="mt-2 text-sm text-slate-600"><b>Affected:</b> {rule.affected}</p>
              <p className="mt-2 text-sm font-bold text-rose-700">{rule.action}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <SectionTitle
          eyebrow="Troubleshooting"
          title="Troubleshooting Center"
          copy="Issues can pause agents, request regeneration, update prompt, update doctrine, update skill, attach examples, escalate to founder and preserve resolution notes."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {troubleshootingIssues.map((issue) => (
            <article key={issue.title} className="rounded-[2rem] border border-amber-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap justify-between gap-3">
                <Badge tone={badgeTone(issue.severity)}>{issue.severity}</Badge>
                <Badge tone={badgeTone(issue.status)}>{issue.status}</Badge>
              </div>
              <h3 className="mt-3 text-xl font-black text-slate-950">{issue.title}</h3>
              <p className="mt-2 text-sm text-slate-600"><b>Category:</b> {issue.category}</p>
              <p className="mt-2 text-sm text-slate-600"><b>Affected agent:</b> {issue.agent}</p>
              <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-900">{issue.fix}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <SectionTitle
          eyebrow="Policy"
          title="AI Confidence Policy + Permission Matrix + Human Approval Queue"
          copy="MZ11 makes AI confidence, risk sensitivity, permissions and human approval visible instead of hidden behind automation."
        />
        <div className="grid gap-5 lg:grid-cols-3">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-xl font-black">AI Confidence Policy</h3>
            <ul className="mt-4 space-y-2">
              {confidencePolicies.map((policy) => (
                <li key={policy} className="rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-700">{policy}</li>
              ))}
            </ul>
          </article>
          <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-xl font-black">Permission Matrix</h3>
            <div className="mt-4 space-y-3">
              {permissions.map((row) => (
                <div key={row.role} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-sm font-black">{row.role}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{row.permissions}</p>
                </div>
              ))}
            </div>
          </article>
          <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-xl font-black">Human Approval Queue</h3>
            <div className="mt-4 space-y-3">
              {humanApprovalQueue.map((item) => (
                <div key={item} className="rounded-2xl border border-indigo-100 bg-indigo-50 p-3 text-sm font-bold text-indigo-900">
                  {item}
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <SectionTitle
          eyebrow="Audit"
          title="AI Audit Log"
          copy="Every sensitive event must be traceable: run, prompt change, skill change, doctrine binding, safety trigger, output block, approval, rejection, regeneration and provider setting change."
        />
        <div className="flex flex-wrap gap-2 rounded-[2rem] border border-blue-200 bg-blue-50 p-5">
          {auditEvents.map((event) => (
            <Badge key={event} tone={event.includes("failed") || event.includes("blocked") || event.includes("rejected") ? "red" : "blue"}>{event}</Badge>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-12">
        <div className="rounded-[2rem] border border-indigo-200 bg-indigo-950 p-6 text-white shadow-2xl shadow-indigo-900/20">
          <h2 className="text-2xl font-black">MZ11 truth boundary</h2>
          <p className="mt-3 max-w-5xl text-sm leading-6 text-indigo-100">
            This ZIP builds the AI governance control plane, seeded API contract, provider-control bridge model,
            safety/troubleshooting model, prompt/skill/agent management interface and future integration structure.
            It does not expose API keys, perform live Gemini/OpenAI calls, send emails, submit applications,
            activate doctrine automatically or run autonomous AI production actions.
          </p>
        </div>
      </section>
    </main>
  );
}

const mz9PipelineRecords = [
  {
    title: "ILAYKI / TAMWILCOM Bank Funding Route",
    funder: "Attijariwafa Bank - Dar Al Moukawil Rabat",
    opportunity: "Women co-led guarantee-backed financing",
    stage: "Founder Approval",
    packageType: "Bank Package",
    amount: "1 500 000 Dh",
    probability: "78%",
    deadline: "2027-01-15",
    nextAction: "Validate bank pack and log founder approval",
    owner: "Capital Coordinator",
    risk: "Medium",
    readiness: 86,
    relationshipTemperature: "Active",
    dataRoom: "Bank Pack 84%",
    approval: "Founder Approval Required",
    source: "Qualification Engine + Due Diligence Data Room",
  },
  {
    title: "Women Founder Impact Grant Watch",
    funder: "International Impact Funding Desk",
    opportunity: "Women cofounder + child quality + Academy professionalization",
    stage: "Follow-Up Due",
    packageType: "Grant Package",
    amount: "50 000 - 150 000 Dh",
    probability: "62%",
    deadline: "2026-10-20",
    nextAction: "Send manual follow-up after impact narrative review",
    owner: "Coordinator Team",
    risk: "Low",
    readiness: 72,
    relationshipTemperature: "Warm",
    dataRoom: "Grant Pack 68%",
    approval: "Founder review on impact wording",
    source: "Capital Radar + Funder Intelligence Room",
  },
  {
    title: "Partner OS SaaS Strategic Investor Route",
    funder: "MENA SaaS / Marketplace Angel Network",
    opportunity: "Partner OS SaaS monetization and marketplace scale",
    stage: "Case Preparing",
    packageType: "VC Package",
    amount: "250 000 - 750 000 Dh",
    probability: "54%",
    deadline: "Rolling",
    nextAction: "Strengthen SaaS proof and attach Partner OS evidence",
    owner: "Capital Strategy",
    risk: "High",
    readiness: 61,
    relationshipTemperature: "Researching",
    dataRoom: "VC Pack 57%",
    approval: "Founder-level approach required",
    source: "Funder Intelligence Room + Doctrine Vault",
  },
];

const pipelineStages = [
  "Detected",
  "Qualified",
  "Case Preparing",
  "Waiting Documents",
  "Founder Approval",
  "Ready to Submit",
  "Submitted",
  "Follow-Up Due",
  "Additional Documents Requested",
  "Due Diligence",
  "Meeting Planned",
  "Negotiation",
  "Won",
  "Lost",
  "Nurture Later",
  "Learning Injected",
  "Archived",
];

const boardCards = [
  { stage: "Detected", title: "Africa education innovation fund", detail: "Source Confidence 72% / Deadline Heat medium", tone: "blue" },
  { stage: "Qualified", title: "Women-led growth support route", detail: "Fit Score 81 / Documentation Readiness 66%", tone: "green" },
  { stage: "Case Preparing", title: "Partner OS SaaS angel intro", detail: "Best AngelCare Narrative: SaaS + marketplace", tone: "purple" },
  { stage: "Waiting Documents", title: "Grant impact proof package", detail: "Missing Evidence: Academy proof + impact metrics", tone: "amber" },
  { stage: "Founder Approval", title: "ILAYKI bank-ready package", detail: "Founder Approval Required before submission", tone: "red" },
  { stage: "Ready to Submit", title: "Cyber / SaaS infrastructure support note", detail: "Bank Pack attached / Coordinator Handover ready", tone: "green" },
  { stage: "Submitted", title: "Supplier-backed budget proof file", detail: "Submission Log recorded / Follow-Up Due in 5 days", tone: "blue" },
  { stage: "Follow-Up Due", title: "Impact grant first contact", detail: "Overdue Follow-Up risk if not completed today", tone: "amber" },
  { stage: "Due Diligence", title: "Bank request for annex validation", detail: "Due Diligence Requests: 3 open items", tone: "purple" },
  { stage: "Negotiation", title: "Strategic partner funding discussion", detail: "Negotiation Tracker requires founder decision", tone: "red" },
  { stage: "Learning Injected", title: "Rejected accelerator route", detail: "Outcome and Learning captured for doctrine update", tone: "slate" },
];

const followUps = [
  {
    title: "Manual bank follow-up call",
    funder: "Attijariwafa / Dar Al Moukawil",
    channel: "Phone call",
    due: "Today 16:00",
    priority: "Critical",
    script: "AI-prepared script available",
    risk: "Missed follow-up delays bank file cycle",
  },
  {
    title: "Send additional annex list manually",
    funder: "Impact funding desk",
    channel: "Email",
    due: "Tomorrow 10:00",
    priority: "High",
    script: "Grant follow-up email prepared in MZ7",
    risk: "Missing proof may weaken application",
  },
  {
    title: "Founder review before VC intro",
    funder: "MENA SaaS angel network",
    channel: "Internal founder review",
    due: "Next 7 days",
    priority: "High",
    script: "Founder-Level Approach required",
    risk: "SaaS traction proof must not be overclaimed",
  },
];

const communicationLogs = [
  { channel: "Email", subject: "Bank pack readiness confirmation", outcome: "Waiting reply", next: "Follow-Up Due", proof: "Proof of submission pending" },
  { channel: "Phone", subject: "Grant eligibility clarification", outcome: "Additional documents requested", next: "Attach Data Room evidence", proof: "Call note logged" },
  { channel: "Meeting", subject: "VC narrative review", outcome: "Need stronger SaaS proof", next: "Update Case Builder", proof: "Meeting note attached" },
];

const submissions = [
  { method: "Email", package: "Bank Package", status: "Prepared", version: "Founder-approved version pending", follow: "Follow-up after submission" },
  { method: "Online portal", package: "Grant Package", status: "Draft", version: "Impact section under review", follow: "Portal check reminder" },
  { method: "Investor intro", package: "VC Package", status: "Not sent", version: "SaaS proof incomplete", follow: "Founder approval first" },
];

const dueDiligenceRequests = [
  "Updated financial projection annex with Dh currency label",
  "Founder responsibilities and women cofounder proof",
  "SaaS screenshots and Partner OS monetization evidence",
  "Supplier/devis proof pack from Data Room",
];

const negotiationItems = [
  "Amount discussed / ticket range",
  "Instrument type: debt, grant, equity, convertible or strategic partnership",
  "Repayment, guarantee, dilution or control impact",
  "Founder Decision Required for sensitive terms",
  "Risk note and counter-position preparation",
];

const analytics = [
  { label: "Total Pipeline Value", value: "2 450 000 Dh", hint: "Directional, not guarantee" },
  { label: "Weighted Pipeline Value", value: "1 286 000 Dh", hint: "Probability-adjusted placeholder" },
  { label: "Follow-Up Completion", value: "74%", hint: "Seeded MZ9 metric" },
  { label: "Overdue Follow-Up", value: "2", hint: "Coordinator action needed" },
  { label: "Won / Lost", value: "0 / 1", hint: "Learning Injected enabled" },
  { label: "Document Blockers", value: "7", hint: "From Data Room Readiness" },
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
  "Source Confidence",
  "Deadline Heat",
  "Fit Score",
  "Investor Psychology",
  "Best AngelCare Narrative",
  "Monthly Doctrine Injection",
  "Coordinator Handover",
  "Data Room Readiness",
  "Bank Pack",
  "VC Pack",
  "Grant Pack",
];

function toneClasses(tone: string) {
  if (tone === "green") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (tone === "amber") return "border-amber-200 bg-amber-50 text-amber-800";
  if (tone === "red") return "border-rose-200 bg-rose-50 text-rose-800";
  if (tone === "purple") return "border-indigo-200 bg-indigo-50 text-indigo-800";
  if (tone === "blue") return "border-blue-200 bg-blue-50 text-blue-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
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

function ReadinessBar({ value }: { value: number }) {
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
        <div className="absolute inset-0 opacity-70">
          <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full bg-blue-100 blur-3xl" />
          <div className="absolute left-1/3 top-16 h-56 w-56 rounded-full bg-emerald-100 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <Badge tone="blue">MZ9_AC_CAPITAL_OS_CAPITAL_PIPELINE</Badge>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
                Capital Pipeline CRM
              </h1>
              <p className="mt-3 max-w-4xl text-base leading-7 text-slate-650">
                Deal Flow, Follow-Up Engine, Submission Log, Communication Log, Due Diligence Requests,
                Negotiation Tracker, Outcome and Learning. Every capital route is tracked from first signal
                to final decision, follow-up and Learning Injected.
              </p>
            </div>
            <div className="rounded-[2rem] border border-blue-100 bg-blue-950 p-5 text-white shadow-2xl shadow-blue-900/20">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-200">Weighted Pipeline Value</p>
              <p className="mt-2 text-4xl font-black">1 286 000 Dh</p>
              <p className="mt-1 text-xs text-blue-100">Directional MZ9 seeded value — not a financing guarantee.</p>
            </div>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            {analytics.map((item) => (
              <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{item.value}</p>
                <p className="mt-1 text-xs text-slate-500">{item.hint}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Badge tone="green">Add Pipeline Record</Badge>
            <Badge tone="amber">Review Follow-Ups Due</Badge>
            <Badge tone="blue">Open Ready-to-Submit Cases</Badge>
            <Badge tone="purple">Review Negotiations</Badge>
            <Badge tone="red">Inject Learning</Badge>
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
          eyebrow="Deal Flow"
          title="Pipeline Board"
          copy="A fundraising-specific board, not a generic CRM. Each record links Radar, Qualification Engine, Funder Intelligence Room, Capital Doctrine Vault, Fundraising Case Builder and Due Diligence Data Room."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {boardCards.map((card) => (
            <article key={`${card.stage}-${card.title}`} className={`rounded-[1.6rem] border p-4 shadow-sm ${toneClasses(card.tone)}`}>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-80">{card.stage}</p>
              <h3 className="mt-2 text-base font-black">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 opacity-90">{card.detail}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-bold">Move Stage</span>
                <span className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-bold">Log Contact</span>
                <span className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-bold">Add Follow-Up</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <SectionTitle
          eyebrow="Pipeline Records"
          title="Table View + Relationship Temperature + Readiness"
          copy="The table view makes every opportunity accountable: stage, owner, package readiness, next action, deadline, follow-up and risk are visible in one institutional pipeline floor."
        />
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-12 border-b border-slate-100 bg-slate-50 px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            <div className="col-span-3">Pipeline record</div>
            <div className="col-span-2">Funder</div>
            <div className="col-span-1">Stage</div>
            <div className="col-span-1">Amount</div>
            <div className="col-span-1">Ready</div>
            <div className="col-span-2">Next action</div>
            <div className="col-span-1">Risk</div>
            <div className="col-span-1">Heat</div>
          </div>
          {mz9PipelineRecords.map((record) => (
            <div key={record.title} className="grid grid-cols-12 items-start gap-2 border-b border-slate-100 px-4 py-4 text-sm last:border-b-0">
              <div className="col-span-3">
                <p className="font-black text-slate-950">{record.title}</p>
                <p className="mt-1 text-xs text-slate-500">{record.packageType} · {record.source}</p>
              </div>
              <div className="col-span-2 text-slate-700">{record.funder}</div>
              <div className="col-span-1"><Badge tone={record.stage === "Founder Approval" ? "red" : "blue"}>{record.stage}</Badge></div>
              <div className="col-span-1 font-black">{record.amount}</div>
              <div className="col-span-1">
                <span className="font-black">{record.readiness}%</span>
                <ReadinessBar value={record.readiness} />
              </div>
              <div className="col-span-2 text-slate-700">{record.nextAction}</div>
              <div className="col-span-1"><Badge tone={record.risk === "High" ? "red" : record.risk === "Medium" ? "amber" : "green"}>{record.risk}</Badge></div>
              <div className="col-span-1 text-xs font-bold text-slate-600">{record.relationshipTemperature}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <SectionTitle
          eyebrow="Execution Views"
          title="Timeline, Calendar, Value Forecast and Relationship View"
          copy="MZ9 introduces the capital execution lenses required for submission timing, follow-up discipline, relationship heat, stage velocity and directional pipeline forecasting."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Timeline View", "Detected → Qualified → Case Created → Package Ready → Founder Approval → Submitted → Follow-Up → Decision → Learning Injected."],
            ["Calendar View", "Submission deadlines, follow-up dates, meeting dates, document due dates, due diligence response dates and negotiation checkpoints."],
            ["Value Forecast View", "Total potential capital, Weighted Pipeline Value, stage probability, expected decision month and Morocco / international split."],
            ["Relationship View", "Grouped by funder with Relationship Status, Relationship Temperature, contact history, objections and documents requested."],
          ].map(([title, copy]) => (
            <article key={title} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-black text-slate-950">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <SectionTitle
          eyebrow="Follow-Up Engine"
          title="Follow-Up Due, Overdue Follow-Up and Coordinator Action Control"
          copy="The Follow-Up Engine does not send messages automatically. It tells the coordinator exactly what to do, when, why it matters, what proof to link and when to escalate."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {followUps.map((followUp) => (
            <article key={followUp.title} className="rounded-[2rem] border border-amber-200 bg-white p-5 shadow-sm">
              <Badge tone={followUp.priority === "Critical" ? "red" : "amber"}>{followUp.priority}</Badge>
              <h3 className="mt-3 text-lg font-black text-slate-950">{followUp.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{followUp.funder}</p>
              <div className="mt-4 space-y-2 text-sm">
                <p><span className="font-black">Channel:</span> {followUp.channel}</p>
                <p><span className="font-black">Due:</span> {followUp.due}</p>
                <p><span className="font-black">Script:</span> {followUp.script}</p>
                <p><span className="font-black">Risk if missed:</span> {followUp.risk}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone="green">Mark Completed</Badge>
                <Badge tone="blue">Reschedule</Badge>
                <Badge tone="red">Escalate</Badge>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <SectionTitle
          eyebrow="Pipeline Dossier"
          title="Submission Log, Communication Log, Due Diligence Requests, Negotiation Tracker, Outcome and Learning"
          copy="Each pipeline record opens into a full dossier that tracks the capital lifecycle and creates learning items for future doctrine updates."
        />
        <div className="grid gap-5 lg:grid-cols-2">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-xl font-black">Communication Log</h3>
            <div className="mt-4 space-y-3">
              {communicationLogs.map((log) => (
                <div key={`${log.channel}-${log.subject}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="font-black">{log.channel} · {log.subject}</p>
                  <p className="mt-1 text-sm text-slate-600">Outcome: {log.outcome}</p>
                  <p className="mt-1 text-sm text-slate-600">Next action: {log.next}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">{log.proof}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-xl font-black">Submission Log</h3>
            <div className="mt-4 space-y-3">
              {submissions.map((submission) => (
                <div key={`${submission.method}-${submission.package}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="font-black">{submission.package} · {submission.method}</p>
                  <p className="mt-1 text-sm text-slate-600">Status: {submission.status}</p>
                  <p className="mt-1 text-sm text-slate-600">Version submitted: {submission.version}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">{submission.follow}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-xl font-black">Due Diligence Requests</h3>
            <ul className="mt-4 space-y-3">
              {dueDiligenceRequests.map((request) => (
                <li key={request} className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm font-bold text-indigo-900">
                  {request}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-xl font-black">Negotiation Tracker</h3>
            <ul className="mt-4 space-y-3">
              {negotiationItems.map((item) => (
                <li key={item} className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-bold text-rose-900">
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6">
          <SectionTitle
            eyebrow="Outcome and Learning"
            title="Won, Lost, No Response, Waitlisted, Future Cycle, Relationship Nurture and Learning Injected"
            copy="Every outcome becomes usable learning: objection learned, missing proof, doctrine update needed, data room update needed, qualification update needed and next recommendation."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {["Outcome recorded", "Learning Injected", "Doctrine update needed", "Data Room update needed", "Qualification score adjustment", "Future relationship action"].map((item) => (
              <div key={item} className="rounded-2xl border border-emerald-200 bg-white p-4 text-sm font-black text-emerald-900">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-12">
        <div className="rounded-[2rem] border border-blue-200 bg-blue-950 p-6 text-white shadow-2xl shadow-blue-900/20">
          <h2 className="text-2xl font-black">MZ9 truth boundary</h2>
          <p className="mt-3 max-w-5xl text-sm leading-6 text-blue-100">
            This ZIP builds the Capital Pipeline CRM UI, data contract, migration foundation, seeded workflow states,
            Follow-Up Engine, lifecycle tracking, analytics and dossier logic. It does not perform real Gmail sending,
            real calendar sync, real investor portal submission, real notification automation or legal/financial guarantees.
          </p>
        </div>
      </section>
    </main>
  );
}

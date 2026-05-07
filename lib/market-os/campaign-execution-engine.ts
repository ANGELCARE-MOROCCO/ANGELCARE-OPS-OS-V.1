export type CampaignStatus = "draft" | "planning" | "ready" | "active" | "scaling" | "paused" | "completed" | "archived"
export type CampaignRisk = "low" | "medium" | "high" | "critical"
export type CampaignTaskStatus = "todo" | "doing" | "blocked" | "done"
export type CampaignTask = {
  id: string
  title: string
  owner: string
  status: CampaignTaskStatus
  dueDate: string
  priority: "low" | "normal" | "high" | "critical"
  lane: "strategy" | "creative" | "tracking" | "media" | "sales" | "review"
}
export type CampaignLog = { id: string; at: string; actor: string; action: string; detail: string; severity: "info" | "success" | "warning" | "danger" }
export type CampaignGate = { id: string; label: string; owner: string; passed: boolean; required: boolean; note: string }
export type CampaignKpis = { leads: number; qualifiedLeads: number; conversions: number; revenueMad: number; spendMad: number; targetCacMad: number; targetLeads: number; targetRevenueMad: number }
export type CampaignChannelBudget = { channel: string; allocatedMad: number; spentMad: number; owner: string; purpose: string }
export type CampaignExperiment = { id: string; hypothesis: string; variantA: string; variantB: string; status: "planned" | "running" | "won" | "lost"; metric: string }
export type Campaign = {
  id: string
  title: string
  objective: string
  status: CampaignStatus
  risk: CampaignRisk
  owner: string
  city: string
  audience: string
  persona: string
  serviceLine: string
  offer: string
  channel: string
  startDate: string
  endDate: string
  landingPath: string
  hook: string
  cta: string
  nextAction: string
  kpis: CampaignKpis
  budgets: CampaignChannelBudget[]
  tasks: CampaignTask[]
  gates: CampaignGate[]
  experiments: CampaignExperiment[]
  logs: CampaignLog[]
}
export type CampaignCommand =
  | "VALIDATE_READINESS" | "LAUNCH" | "PAUSE" | "RESUME" | "SCALE" | "COMPLETE" | "ARCHIVE" | "DUPLICATE"
  | "ADD_TASK" | "COMPLETE_TASK" | "BLOCK_TASK" | "UPDATE_BUDGET" | "APPROVE_GATE" | "REOPEN_GATE"
  | "TRIGGER_CONTENT" | "TRIGGER_SEO" | "TRIGGER_AMBASSADORS" | "ADD_LOG"
export type CampaignCommandPayload = Record<string, any>
export const CAMPAIGN_STORAGE_KEY = "angelcare.marketos.campaignExecution.v1"
export const statusFlow: Record<CampaignStatus, CampaignStatus[]> = {
  draft: ["planning", "archived"],
  planning: ["ready", "draft", "archived"],
  ready: ["active", "planning", "archived"],
  active: ["paused", "scaling", "completed"],
  scaling: ["paused", "completed"],
  paused: ["active", "archived"],
  completed: ["archived"],
  archived: [],
}
function uid(prefix: string) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }
export function formatMad(value: number) { return new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(Number(value || 0)) }
export function calculateCac(c: Campaign) { return c.kpis.qualifiedLeads > 0 ? Math.round(c.kpis.spendMad / c.kpis.qualifiedLeads) : 0 }
export function calculateRoi(c: Campaign) { return c.kpis.spendMad > 0 ? Math.round(((c.kpis.revenueMad - c.kpis.spendMad) / c.kpis.spendMad) * 100) : 0 }
export function readinessScore(c: Campaign) {
  const checks = [c.title, c.objective, c.owner, c.audience, c.persona, c.serviceLine, c.offer, c.channel, c.landingPath, c.hook, c.cta, c.startDate, c.endDate, c.budgets.some(b=>b.allocatedMad>0), c.tasks.length >= 3, c.gates.filter(g=>g.required).every(g=>g.passed)]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}
export function launchBlockers(c: Campaign) {
  const blockers: string[] = []
  if (!c.owner) blockers.push("Campaign owner missing")
  if (!c.landingPath) blockers.push("Landing path or WhatsApp route missing")
  if (!c.hook) blockers.push("Main campaign hook missing")
  if (!c.cta) blockers.push("CTA missing")
  if (c.budgets.reduce((a,b)=>a+b.allocatedMad,0) <= 0) blockers.push("Budget allocation missing")
  if (c.tasks.filter(t=>t.status !== "done").length > 0) blockers.push("Open tasks still exist")
  for (const gate of c.gates.filter(g=>g.required && !g.passed)) blockers.push(`Gate not approved: ${gate.label}`)
  if (readinessScore(c) < 85) blockers.push("Readiness score below 85%")
  return blockers
}
export function decisionAlerts(c: Campaign) {
  const alerts: { title: string; detail: string; severity: CampaignLog["severity"] }[] = []
  const cac = calculateCac(c)
  const roi = calculateRoi(c)
  const burn = c.budgets.reduce((a,b)=>a+b.spentMad,0)
  const allocated = c.budgets.reduce((a,b)=>a+b.allocatedMad,0)
  if (cac > c.kpis.targetCacMad && c.kpis.qualifiedLeads > 0) alerts.push({ title: "CAC pressure", detail: `CAC is ${formatMad(cac)}, above target ${formatMad(c.kpis.targetCacMad)}.`, severity: "warning" })
  if (burn > allocated) alerts.push({ title: "Budget exceeded", detail: "Spend exceeded allocated budget. Pause scaling until reviewed.", severity: "danger" })
  if ((c.status === "active" || c.status === "scaling") && c.kpis.leads < Math.max(5, c.kpis.targetLeads * 0.1)) alerts.push({ title: "Low lead volume", detail: "Lead volume is weak compared with the target. Check creative, audience, and landing path.", severity: "warning" })
  if (roi > 80 && c.status === "active") alerts.push({ title: "Scaling candidate", detail: "ROI is strong. Consider controlled channel scaling after validation.", severity: "success" })
  if (launchBlockers(c).length > 0 && ["draft","planning","ready"].includes(c.status)) alerts.push({ title: "Launch blockers", detail: `${launchBlockers(c).length} blockers must be closed before launch.`, severity: "danger" })
  return alerts
}
export const initialCampaigns: Campaign[] = [
  {
    id: "camp-postpartum-rabat",
    title: "Premium Postpartum Reassurance Campaign",
    objective: "Convert new mothers into booked postpartum consultations",
    status: "planning",
    risk: "high",
    owner: "Marketing Director",
    city: "Rabat / Témara / Salé",
    audience: "New mothers and families seeking trusted postnatal support",
    persona: "Mother recovering after birth who wants calm, supervised home support",
    serviceLine: "Post-partum support",
    offer: "Premium 7-day postpartum homecare starter package",
    channel: "Meta + WhatsApp + Landing Page",
    startDate: "2026-05-08",
    endDate: "2026-05-31",
    landingPath: "/services/postpartum-support",
    hook: "Recover with calm, supervised support at home when peace matters most.",
    cta: "Request callback",
    nextAction: "Approve promise, finish objection script, and validate tracking before launch.",
    kpis: { leads: 36, qualifiedLeads: 14, conversions: 3, revenueMad: 28000, spendMad: 4200, targetCacMad: 180, targetLeads: 260, targetRevenueMad: 140000 },
    budgets: [
      { channel: "Meta prospecting", allocatedMad: 22000, spentMad: 3200, owner: "Paid Media", purpose: "Lead capture and audience testing" },
      { channel: "Retargeting", allocatedMad: 7000, spentMad: 600, owner: "Paid Media", purpose: "Warm lead conversion" },
      { channel: "Creative production", allocatedMad: 5000, spentMad: 400, owner: "Creative Lead", purpose: "Static ads and testimonial visuals" },
      { channel: "WhatsApp sales support", allocatedMad: 8000, spentMad: 0, owner: "Sales Ops", purpose: "Follow-up and qualification capacity" },
    ],
    tasks: [
      { id: "task-p1", title: "Finalize postpartum offer approval", owner: "CEO", status: "doing", dueDate: "2026-05-07", priority: "critical", lane: "review" },
      { id: "task-p2", title: "Create WhatsApp objection script", owner: "Sales Ops", status: "todo", dueDate: "2026-05-07", priority: "high", lane: "sales" },
      { id: "task-p3", title: "Validate landing page proof and tracking", owner: "Growth Analyst", status: "blocked", dueDate: "2026-05-07", priority: "critical", lane: "tracking" },
      { id: "task-p4", title: "Prepare first creative testing set", owner: "Creative Lead", status: "doing", dueDate: "2026-05-06", priority: "high", lane: "creative" },
    ],
    gates: [
      { id: "gate-p1", label: "Offer approved", owner: "CEO", passed: false, required: true, note: "Needs final price promise confirmation." },
      { id: "gate-p2", label: "Tracking tested", owner: "Growth Analyst", passed: false, required: true, note: "Pixel and WhatsApp handoff must be tested." },
      { id: "gate-p3", label: "Sales handoff ready", owner: "Sales Ops", passed: false, required: true, note: "Qualification script not closed." },
      { id: "gate-p4", label: "Creative QA", owner: "Creative Lead", passed: true, required: true, note: "First creative batch accepted." },
    ],
    experiments: [
      { id: "exp-p1", hypothesis: "Calm recovery message will convert better than urgency message", variantA: "Calm recovery", variantB: "Urgent help", status: "planned", metric: "Qualified lead rate" },
      { id: "exp-p2", hypothesis: "WhatsApp CTA beats assessment booking CTA", variantA: "WhatsApp", variantB: "Booking form", status: "planned", metric: "Lead-to-call rate" },
    ],
    logs: [{ id: "log-p1", at: "2026-05-05T10:00:00.000Z", actor: "System", action: "Campaign imported", detail: "Original AngelCare postpartum campaign preserved and upgraded with execution controls.", severity: "info" }],
  },
  {
    id: "camp-clinic-partnership",
    title: "Clinic Partnership Authority Sprint",
    objective: "Secure maternity clinic referral meetings and signed partner agreements",
    status: "draft",
    risk: "medium",
    owner: "Partnership Lead",
    city: "Rabat / Salé",
    audience: "Maternity clinics, gynecologists, clinic administrators",
    persona: "Clinic decision maker who needs reliable referral partner for homecare support",
    serviceLine: "Clinic partnership referral",
    offer: "Referral partnership and priority homecare access program",
    channel: "Direct outreach + partner prospectus",
    startDate: "2026-05-13",
    endDate: "2026-06-02",
    landingPath: "/partners/clinics",
    hook: "Give your patients a reliable supported homecare path after clinic discharge.",
    cta: "Schedule partnership call",
    nextAction: "Finalize prospectus and clinic segmentation grid.",
    kpis: { leads: 7, qualifiedLeads: 3, conversions: 0, revenueMad: 0, spendMad: 3000, targetCacMad: 600, targetLeads: 40, targetRevenueMad: 90000 },
    budgets: [
      { channel: "Prospectus design", allocatedMad: 4000, spentMad: 2200, owner: "Design", purpose: "Partner presentation assets" },
      { channel: "Direct outreach", allocatedMad: 9000, spentMad: 800, owner: "Partnership Lead", purpose: "Clinic meetings and follow-up" },
      { channel: "Local authority content", allocatedMad: 5000, spentMad: 0, owner: "Content", purpose: "Trust articles and proof material" },
    ],
    tasks: [
      { id: "task-c1", title: "Finalize partner prospectus", owner: "Design", status: "doing", dueDate: "2026-05-10", priority: "high", lane: "creative" },
      { id: "task-c2", title: "Build clinic segmentation grid", owner: "Partnership Lead", status: "todo", dueDate: "2026-05-09", priority: "high", lane: "strategy" },
      { id: "task-c3", title: "Write follow-up email sequence", owner: "Content Lead", status: "todo", dueDate: "2026-05-11", priority: "normal", lane: "sales" },
    ],
    gates: [
      { id: "gate-c1", label: "Prospectus approved", owner: "CEO", passed: false, required: true, note: "Need final version." },
      { id: "gate-c2", label: "Clinic target list ready", owner: "Partnership Lead", passed: false, required: true, note: "Segmentation incomplete." },
      { id: "gate-c3", label: "Follow-up cadence approved", owner: "Sales Ops", passed: false, required: true, note: "Needs operating rhythm." },
    ],
    experiments: [{ id: "exp-c1", hypothesis: "Medical trust proof gets more meetings than commercial offer", variantA: "Trust proof", variantB: "Commercial offer", status: "planned", metric: "Meeting rate" }],
    logs: [{ id: "log-c1", at: "2026-05-05T12:00:00.000Z", actor: "System", action: "Campaign imported", detail: "Original clinic partnership sprint preserved.", severity: "info" }],
  },
  {
    id: "camp-academy-career",
    title: "Academy Career Path Recruitment Push",
    objective: "Recruit qualified training candidates for AngelCare Academy",
    status: "draft",
    risk: "medium",
    owner: "Academy Marketing",
    city: "Rabat / Témara / Salé",
    audience: "Young candidates seeking professional training and care career access",
    persona: "Motivated candidate wanting a structured path to certified care work",
    serviceLine: "Academy recruitment",
    offer: "Training-to-career pathway with certification and job access",
    channel: "Meta + local groups + ambassador referrals",
    startDate: "2026-05-18",
    endDate: "2026-06-10",
    landingPath: "/academy/apply",
    hook: "Turn your care motivation into a certified professional career path.",
    cta: "Apply for Academy intake",
    nextAction: "Build campaign brief and candidate qualification criteria.",
    kpis: { leads: 18, qualifiedLeads: 5, conversions: 0, revenueMad: 0, spendMad: 0, targetCacMad: 120, targetLeads: 180, targetRevenueMad: 0 },
    budgets: [
      { channel: "Meta candidate ads", allocatedMad: 9000, spentMad: 0, owner: "Paid Media", purpose: "Candidate acquisition" },
      { channel: "Ambassador referrals", allocatedMad: 3500, spentMad: 0, owner: "Ambassador Manager", purpose: "Referral activation" },
      { channel: "Local groups", allocatedMad: 2500, spentMad: 0, owner: "Community Manager", purpose: "Community posting and follow-up" },
    ],
    tasks: [
      { id: "task-a1", title: "Write candidate campaign brief", owner: "Academy Marketing", status: "todo", dueDate: "2026-05-12", priority: "critical", lane: "strategy" },
      { id: "task-a2", title: "Prepare candidate FAQ", owner: "Academy Ops", status: "todo", dueDate: "2026-05-13", priority: "high", lane: "sales" },
      { id: "task-a3", title: "Define quality scoring form", owner: "Recruitment", status: "todo", dueDate: "2026-05-13", priority: "high", lane: "tracking" },
    ],
    gates: [
      { id: "gate-a1", label: "Candidate quality criteria approved", owner: "Academy Director", passed: false, required: true, note: "Must prevent weak applications." },
      { id: "gate-a2", label: "Application form tested", owner: "Growth Analyst", passed: false, required: true, note: "Lead flow must be validated." },
      { id: "gate-a3", label: "Referral rules confirmed", owner: "Ambassador Manager", passed: false, required: true, note: "Rewards and validation unclear." },
    ],
    experiments: [{ id: "exp-a1", hypothesis: "Career pathway message beats training certificate message", variantA: "Career pathway", variantB: "Certificate", status: "planned", metric: "Qualified application rate" }],
    logs: [{ id: "log-a1", at: "2026-05-05T13:00:00.000Z", actor: "System", action: "Campaign imported", detail: "Original Academy recruitment campaign preserved.", severity: "info" }],
  },
]
export function getCampaigns(): Campaign[] {
  if (typeof window === "undefined") return initialCampaigns
  try { const raw = window.localStorage.getItem(CAMPAIGN_STORAGE_KEY); return raw ? JSON.parse(raw) : initialCampaigns } catch { return initialCampaigns }
}
export function saveCampaigns(campaigns: Campaign[]) { if (typeof window !== "undefined") window.localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(campaigns)) }
function log(c: Campaign, action: string, detail: string, severity: CampaignLog["severity"] = "info", actor = "Market-OS Operator") {
  c.logs = [{ id: uid("log"), at: new Date().toISOString(), actor, action, detail, severity }, ...(c.logs || [])]
}
export function executeCampaignAction(campaigns: Campaign[], campaignId: string, command: CampaignCommand, payload: CampaignCommandPayload = {}) {
  let created: Campaign | null = null
  const next = campaigns.map(original => {
    if (original.id !== campaignId) return original
    const c: Campaign = JSON.parse(JSON.stringify(original))
    if (command === "VALIDATE_READINESS") { const score = readinessScore(c); log(c, "Readiness validated", `Readiness score recalculated at ${score}%.`, score >= 85 ? "success" : "warning") }
    if (command === "LAUNCH") { const blockers = launchBlockers(c); if (blockers.length) { log(c, "Launch blocked", blockers.join(" · "), "danger") } else if (statusFlow[c.status].includes("active")) { c.status = "active"; log(c, "Campaign launched", "Campaign moved to active execution.", "success") } else { log(c, "Launch rejected", `Cannot launch from ${c.status}.`, "danger") } }
    if (command === "PAUSE") { if (["active","scaling"].includes(c.status)) { c.status = "paused"; log(c, "Campaign paused", payload.reason || "Paused for operator review.", "warning") } }
    if (command === "RESUME") { if (c.status === "paused") { c.status = "active"; log(c, "Campaign resumed", "Campaign returned to active state.", "success") } }
    if (command === "SCALE") { if (c.status === "active" && calculateRoi(c) > 30 && c.kpis.qualifiedLeads >= 5) { c.status = "scaling"; log(c, "Campaign scaled", payload.detail || "Scaling approved based on ROI and lead quality.", "success") } else { log(c, "Scale rejected", "ROI or qualified lead evidence is not strong enough.", "danger") } }
    if (command === "COMPLETE") { if (["active","scaling","paused"].includes(c.status)) { c.status = "completed"; log(c, "Campaign completed", "Campaign closed for post-mortem.", "success") } }
    if (command === "ARCHIVE") { c.status = "archived"; log(c, "Campaign archived", payload.reason || "Archived by operator.", "info") }
    if (command === "ADD_TASK") { const task: CampaignTask = { id: uid("task"), title: payload.title || "New execution task", owner: payload.owner || c.owner, status: "todo", dueDate: payload.dueDate || "", priority: payload.priority || "normal", lane: payload.lane || "strategy" }; c.tasks = [task, ...c.tasks]; log(c, "Task added", `${task.title} assigned to ${task.owner}.`, "info") }
    if (command === "COMPLETE_TASK") { c.tasks = c.tasks.map(t => t.id === payload.taskId ? { ...t, status: "done" } : t); log(c, "Task completed", payload.title || "Task marked done.", "success") }
    if (command === "BLOCK_TASK") { c.tasks = c.tasks.map(t => t.id === payload.taskId ? { ...t, status: "blocked" } : t); log(c, "Task blocked", payload.title || "Task blocked.", "warning") }
    if (command === "APPROVE_GATE") { c.gates = c.gates.map(g => g.id === payload.gateId ? { ...g, passed: true, note: payload.note || g.note } : g); log(c, "Gate approved", payload.label || "Launch gate approved.", "success") }
    if (command === "REOPEN_GATE") { c.gates = c.gates.map(g => g.id === payload.gateId ? { ...g, passed: false, note: payload.note || g.note } : g); log(c, "Gate reopened", payload.label || "Launch gate reopened.", "warning") }
    if (command === "UPDATE_BUDGET") { c.budgets = c.budgets.map(b => b.channel === payload.channel ? { ...b, allocatedMad: Number(payload.allocatedMad ?? b.allocatedMad), spentMad: Number(payload.spentMad ?? b.spentMad) } : b); c.kpis.spendMad = c.budgets.reduce((a,b)=>a+b.spentMad,0); log(c, "Budget updated", `${payload.channel || "Channel"} budget/spend updated.`, "info") }
    if (command === "TRIGGER_CONTENT") { log(c, "Content command triggered", "Created brief request for content workspace: angles, creative, landing proof, and objection handling.", "success") }
    if (command === "TRIGGER_SEO") { log(c, "SEO action triggered", "Created SEO blog/topic support request connected to campaign objective.", "success") }
    if (command === "TRIGGER_AMBASSADORS") { log(c, "Ambassador mission triggered", "Created ambassador mission draft for regional/community distribution.", "success") }
    if (command === "DUPLICATE") { created = { ...c, id: uid("camp"), title: `${c.title} Copy`, status: "draft", logs: [] }; log(created, "Campaign duplicated", `Duplicated from ${c.title}.`, "info") }
    if (command === "ADD_LOG") { log(c, payload.action || "Operator note", payload.detail || "Manual note added.", payload.severity || "info") }
    return c
  })
  const result = created ? [created, ...next] : next
  saveCampaigns(result)
  return result
}

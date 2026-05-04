export const partnersNetworkConfig = {
  basePath: "/market-os/partners-network",
  moduleName: "Partners Network",
  badge: "AngelCare partnership operating system",
  headline: "Partners Network command center",
  description: "A production-grade Partner OS to define partnership models, assign them to partners, execute leads and deals, control validation, territories, commissions, enablement, compliance and automation.",
  primaryNoun: "Partner",
  pluralNoun: "Partners",
  accent: "from-slate-950 via-cyan-950 to-emerald-950",
  panels: ["Model → partner → execution", "Commission logic", "Validation workflow", "Territory intelligence"],
  programs: [
    { id: "PP-01", name: "Hospital Discharge Referral", type: "Hospital", status: "Active", target: "Post-hospital care", commission: "10% first month", kpi: "18 conversions", risk: "Medium" },
    { id: "PP-02", name: "Pharmacy Referral Program", type: "Pharmacy", status: "Running", target: "Elderly families", commission: "Fixed per validated lead", kpi: "50 leads", risk: "Low" },
    { id: "PP-03", name: "Corporate Employee Care", type: "Corporate HR", status: "Draft", target: "Companies", commission: "SLA contract", kpi: "5 corporate accounts", risk: "Low" },
    { id: "PP-04", name: "Insurance Integration Program", type: "Insurance", status: "Active", target: "Covered care", commission: "Revenue share", kpi: "Pilot agreement", risk: "High" },
  ],
  entities: [
    { id: "PAR-201", name: "Rabat Senior Clinic", type: "Clinic", city: "Rabat", status: "Active", manager: "BD Manager", score: 88, revenue: 266000, leads: 67 },
    { id: "PAR-202", name: "Temara Pharmacy Network", type: "Pharmacy", city: "Temara", status: "Prospect", manager: "Partner Lead", score: 69, revenue: 92000, leads: 37 },
    { id: "PAR-203", name: "Casablanca Corporate HR", type: "Corporate HR", city: "Casablanca", status: "Paused", manager: "Strategic Accounts", score: 78, revenue: 182000, leads: 29 },
  ],
  missions: [
    { id: "PT-01", title: "Request signed SLA addendum", owner: "PAR-201", priority: "High", status: "Running", deadline: "48h", proof: "Signed PDF" },
    { id: "PT-02", title: "Validate pharmacy referral funnel", owner: "PAR-202", priority: "Medium", status: "Pending", deadline: "This week", proof: "Test leads" },
    { id: "PT-03", title: "Corporate pipeline review", owner: "PAR-203", priority: "High", status: "Completed", deadline: "Today", proof: "Meeting notes" },
  ],
  leads: [
    { id: "PL-001", source: "Partner code CLINIC-RBT", owner: "PAR-201", status: "Converted", value: 31000, duplicateRisk: "Low" },
    { id: "PL-002", source: "Pharmacy desk form", owner: "PAR-202", status: "Validated", value: 11200, duplicateRisk: "Medium" },
    { id: "PL-003", source: "Corporate HR request", owner: "PAR-203", status: "UnderReview", value: 46000, duplicateRisk: "Low" },
  ],
  payouts: [
    { id: "PPO-01", owner: "PAR-201", program: "Hospital Discharge Referral", amount: 12800, status: "Pending", proof: "Invoice validation" },
    { id: "PPO-02", owner: "PAR-202", program: "Pharmacy Referral Program", amount: 3700, status: "Approved", proof: "Batch #24" },
    { id: "PPO-03", owner: "PAR-203", program: "Corporate Employee Care", amount: 9800, status: "Approved", proof: "SLA milestone" },
  ],
  territories: [
    { id: "PTER-01", city: "Rabat", zone: "Medical corridor", density: "Balanced", saturation: 64, leads: 55, revenue: 188000 },
    { id: "PTER-02", city: "Temara", zone: "Pharmacy cluster", density: "Opportunity", saturation: 42, leads: 28, revenue: 72000 },
    { id: "PTER-03", city: "Casablanca", zone: "Corporate zone", density: "Crowded", saturation: 83, leads: 61, revenue: 249000 },
  ],
  library: [
    { id: "EN-01", title: "Partner pitch deck", type: "Pitch deck", access: "Managers", status: "Approved" },
    { id: "EN-02", title: "Pharmacy referral workflow", type: "Guide", access: "Pharmacy partners", status: "Approved" },
    { id: "EN-03", title: "Hospital discharge script", type: "Script", access: "Hospital program", status: "Draft" },
  ],
  training: [
    { id: "PTR-01", title: "Partner onboarding", level: "Foundation", required: "Yes", completion: 76, status: "Active" },
    { id: "PTR-02", title: "Lead validation standards", level: "Compliance", required: "Yes", completion: 61, status: "Active" },
    { id: "PTR-03", title: "Program-specific certification", level: "Advanced", required: "Yes", completion: 49, status: "Draft" },
  ],
  approvals: [
    { id: "PAPR-01", title: "Contract document approval", owner: "PAR-202", status: "Pending", risk: "Medium", sla: "24h" },
    { id: "PAPR-02", title: "Lead source validation", owner: "PAR-201", status: "Open", risk: "Low", sla: "12h" },
    { id: "PAPR-03", title: "Commission dispute review", owner: "PAR-203", status: "Flagged", risk: "High", sla: "48h" },
  ],
  automations: [
    { id: "PAUT-01", title: "Auto-lock duplicate partner leads", trigger: "Same phone/source", action: "Flag + prevent payout", status: "Active" },
    { id: "PAUT-02", title: "SLA reminder", trigger: "Validation overdue", action: "Notify BD manager", status: "Active" },
    { id: "PAUT-03", title: "Partner inactivity risk", trigger: "No leads in 14 days", action: "Open recovery task", status: "Active" },
  ],
  communications: [
    { id: "PCOM-01", title: "Monthly partner performance summary", audience: "Active partners", channel: "Email later", status: "Draft" },
    { id: "PCOM-02", title: "Program rule update", audience: "Pharmacy Referral Program", channel: "Internal", status: "Approved" },
  ],
  documents: [
    { id: "PDOC-01", title: "Signed partner agreement", owner: "PAR-201", status: "Approved", type: "Contract" },
    { id: "PDOC-02", title: "Tax/billing info", owner: "PAR-202", status: "Pending", type: "Finance" },
  ],
  analytics: [
    { id: "PAN-01", title: "Best partner ROI", status: "Active", value: "PAR-201", insight: "Highest revenue and stable validation" },
    { id: "PAN-02", title: "Risk pattern alert", status: "Flagged", value: "PAR-203", insight: "High value leads need contract/SLA confirmation" },
  ],
  templates: ["Hospital discharge referral program", "Pharmacy referral program", "Corporate employee care program", "Insurance integration program", "Caregiver supply partnership", "City launch strategic partner program", "NGO support referral program", "Government entity coordination", "Influencer partner referral model", "B2B partner referral program", "Clinic onboarding sprint", "Corporate HR benefit program", "Pharmacy desk QR referral", "Insurance pilot workflow", "City strategic network launch", "Partner risk recovery workflow"],
}

export const ambassadorProgramConfig = {
  basePath: "/market-os/ambassador-program",
  moduleName: "Ambassador Program",
  badge: "AngelCare ambassador operating system",
  headline: "Ambassador Program command center",
  description: "A complete execution layer for ambassador profiles, configurable programs, missions, territories, leads, rewards, compliance, training, approvals, communications and automation.",
  primaryNoun: "Ambassador",
  pluralNoun: "Ambassadors",
  accent: "from-fuchsia-950 via-indigo-950 to-slate-950",
  panels: ["Profile + KYC control", "Program templates", "Mission execution", "Approval + payout SLA"],
  programs: [
    { id: "AP-01", name: "Family Referral Program", type: "Referral", status: "Active", target: "Families", commission: "Fixed + tier bonus", kpi: "40 qualified leads", risk: "Low" },
    { id: "AP-02", name: "Pharmacy Referral Program", type: "Healthcare", status: "Running", target: "Pharmacies", commission: "8% converted revenue", kpi: "25 pharmacy contacts", risk: "Medium" },
    { id: "AP-03", name: "City Launch Ambassadors", type: "Market launch", status: "Draft", target: "New zones", commission: "Tiered", kpi: "3 zones activated", risk: "Low" },
    { id: "AP-04", name: "Social Media Awareness", type: "Influence", status: "Active", target: "Meta audiences", commission: "Bonus after target", kpi: "60 approved posts", risk: "Low" },
  ],
  entities: [
    { id: "AMB-101", name: "Rabat Family Referrer Cell", type: "Caregiver referrer", city: "Rabat", status: "Active", manager: "Market Manager", score: 92, revenue: 148000, leads: 41 },
    { id: "AMB-102", name: "Temara Community Agent", type: "Community agent", city: "Temara", status: "Candidate", manager: "Field Lead", score: 74, revenue: 38000, leads: 16 },
    { id: "AMB-103", name: "Casablanca Micro Influencer", type: "Micro-influencer", city: "Casablanca", status: "Paused", manager: "Content Lead", score: 61, revenue: 86000, leads: 22 },
  ],
  missions: [
    { id: "MIS-01", title: "Contact 20 families", owner: "AMB-101", priority: "High", status: "Running", deadline: "This week", proof: "Call log + lead forms" },
    { id: "MIS-02", title: "Visit 5 pharmacies", owner: "AMB-102", priority: "Medium", status: "Pending", deadline: "72h", proof: "Photo + manager validation" },
    { id: "MIS-03", title: "Share approved Meta post", owner: "AMB-103", priority: "Low", status: "Completed", deadline: "Today", proof: "Screenshot" },
  ],
  leads: [
    { id: "AL-001", source: "QR-FAMILY-RBT", owner: "AMB-101", status: "Validated", value: 12000, duplicateRisk: "Low" },
    { id: "AL-002", source: "Manual WhatsApp", owner: "AMB-102", status: "UnderReview", value: 7800, duplicateRisk: "Medium" },
    { id: "AL-003", source: "Meta referral link", owner: "AMB-103", status: "Converted", value: 22000, duplicateRisk: "Low" },
  ],
  payouts: [
    { id: "PAY-01", owner: "AMB-101", program: "Family Referral Program", amount: 6200, status: "Approved", proof: "Bank transfer" },
    { id: "PAY-02", owner: "AMB-102", program: "Pharmacy Referral Program", amount: 1800, status: "Pending", proof: "Awaiting validation" },
    { id: "PAY-03", owner: "AMB-103", program: "Social Media Awareness", amount: 2400, status: "Rejected", proof: "Missing content proof" },
  ],
  territories: [
    { id: "TER-01", city: "Rabat", zone: "Agdal", density: "Balanced", saturation: 72, leads: 31, revenue: 98000 },
    { id: "TER-02", city: "Temara", zone: "Hay Nahda", density: "Opportunity", saturation: 39, leads: 14, revenue: 31000 },
    { id: "TER-03", city: "Casablanca", zone: "Maarif", density: "Crowded", saturation: 89, leads: 44, revenue: 168000 },
  ],
  library: [
    { id: "MAT-01", title: "WhatsApp family referral script", type: "Script", access: "Active ambassadors", status: "Approved" },
    { id: "MAT-02", title: "AngelCare service brochure", type: "PDF", access: "All programs", status: "Approved" },
    { id: "MAT-03", title: "Objection handling cards", type: "Training", access: "Certified only", status: "Draft" },
  ],
  training: [
    { id: "TR-01", title: "AngelCare basics", level: "Foundation", required: "Yes", completion: 82, status: "Active" },
    { id: "TR-02", title: "Lead quality and ethics", level: "Compliance", required: "Yes", completion: 67, status: "Active" },
    { id: "TR-03", title: "Local outreach execution", level: "Advanced", required: "No", completion: 54, status: "Draft" },
  ],
  approvals: [
    { id: "APR-01", title: "KYC document approval", owner: "AMB-102", status: "Pending", risk: "Medium", sla: "24h" },
    { id: "APR-02", title: "Mission proof validation", owner: "AMB-101", status: "Open", risk: "Low", sla: "12h" },
    { id: "APR-03", title: "Commission approval", owner: "AMB-103", status: "Flagged", risk: "High", sla: "48h" },
  ],
  automations: [
    { id: "AUT-01", title: "Auto-pause after 3 missed deadlines", trigger: "Missed deadline count", action: "Pause + notify manager", status: "Active" },
    { id: "AUT-02", title: "Duplicate lead warning", trigger: "Same phone/source", action: "Flag lead", status: "Active" },
    { id: "AUT-03", title: "Mission deadline reminder", trigger: "24h before deadline", action: "Send reminder", status: "Active" },
  ],
  communications: [
    { id: "COM-01", title: "Weekly ambassador broadcast", audience: "All active ambassadors", channel: "Internal", status: "Draft" },
    { id: "COM-02", title: "Program update reminder", audience: "Family Referral Program", channel: "WhatsApp later", status: "Approved" },
  ],
  documents: [
    { id: "DOC-01", title: "Ambassador agreement", owner: "AMB-101", status: "Approved", type: "Contract" },
    { id: "DOC-02", title: "KYC ID copy", owner: "AMB-102", status: "Pending", type: "KYC" },
  ],
  analytics: [
    { id: "AN-01", title: "Best ambassador ROI", status: "Active", value: "AMB-101", insight: "Highest conversion and low risk" },
    { id: "AN-02", title: "Weak area alert", status: "Flagged", value: "Temara", insight: "Low territory saturation but low mission completion" },
  ],
  templates: ["Family referral program", "Pharmacy referral program", "Caregiver recruitment program", "City launch ambassador program", "Social media awareness program", "Event activation program", "B2B partner referral program", "Post-hospital care referral program", "Elderly care education campaign", "Ramadan support campaign", "Summer family support campaign", "New city opening program", "Clinic outreach ambassador sprint", "Corporate family care referral", "Caregiver ambassador certification", "High-risk compliance recovery"],
}

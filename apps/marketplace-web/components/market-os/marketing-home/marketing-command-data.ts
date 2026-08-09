export type MarketingPriority = "critical" | "high" | "medium" | "low"
export type CampaignStatus = "scaling" | "stable" | "risk" | "testing"
export const marketingKpis = [
  { label: "Revenue influenced", value: "842K MAD", delta: "+18%", target: "1M MAD", status: "high" },
  { label: "Active campaigns", value: "27", delta: "+5", target: "32", status: "medium" },
  { label: "B2B pipeline", value: "136", delta: "+22", target: "200", status: "high" },
  { label: "Leads today", value: "318", delta: "+41", target: "400", status: "critical" },
  { label: "ROAS blended", value: "4.8x", delta: "+0.6", target: "5.5x", status: "high" },
  { label: "Execution score", value: "91%", delta: "+7%", target: "95%", status: "medium" },
]
export const marketingNavigation = [
  { section: "Market Intelligence", items: ["Market radar", "Competitor watch", "City heatmap", "Parent sentiment", "Demand forecast"] },
  { section: "Campaign Command", items: ["Campaigns", "Funnels", "Paid ads", "B2B activation", "Retargeting"] },
  { section: "Content Command", items: ["Editorial calendar", "Content studio", "Social control", "Approvals", "Assets"] },
  { section: "Partnerships", items: ["Schools", "Preschools", "Corporate", "Influencers", "Ambassadors"] },
  { section: "Team Execution", items: ["Daily board", "Tasks", "Approvals", "Escalations", "Connect room"] },
]
export const campaigns = [
  { name: "Rabat Preschool B2B Activation", owner: "Direction Rabat", status: "scaling", roas: "6.2x", budget: "72%", leads: 86, risk: "low", action: "Boost meetings" },
  { name: "Casablanca Parent Trust Funnel", owner: "Growth Team", status: "stable", roas: "4.9x", budget: "58%", leads: 114, risk: "medium", action: "Refresh creative" },
  { name: "AngelCare Academy Authority", owner: "Content Team", status: "testing", roas: "3.4x", budget: "31%", leads: 42, risk: "medium", action: "Validate offer" },
  { name: "Kindergarten WinWin Partnerships", owner: "B2B Team", status: "risk", roas: "2.1x", budget: "83%", leads: 23, risk: "high", action: "Escalate proposal" },
]
export const citySignals = [
  { city: "Rabat", demand: 94, opportunity: "premium nurseries", signal: "hot" },
  { city: "Casablanca", demand: 88, opportunity: "volume acquisition", signal: "growth" },
  { city: "Temara", demand: 81, opportunity: "family services", signal: "growth" },
  { city: "Marrakech", demand: 73, opportunity: "academy + events", signal: "watch" },
  { city: "Tangier", demand: 66, opportunity: "B2B expansion", signal: "watch" },
]
export const aiRecommendations = [
  "Prioritize Rabat preschool decision-makers before Thursday follow-up window closes.",
  "Reallocate 12% paid budget from weak generic ads to B2B partnership funnel.",
  "Create 3 proof-based parent trust reels from latest testimonials.",
  "Escalate 5 unanswered partnership proposals to Direction Rabat.",
]
export const partnershipPipeline = [
  { stage: "Prospected", count: 42, value: "210K" },
  { stage: "Contacted", count: 31, value: "186K" },
  { stage: "Meeting planned", count: 18, value: "144K" },
  { stage: "Proposal sent", count: 12, value: "118K" },
  { stage: "Negotiation", count: 7, value: "96K" },
  { stage: "Signed", count: 4, value: "62K" },
]

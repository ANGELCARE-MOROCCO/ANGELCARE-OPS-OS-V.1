export type CalendarItemType = "campaign" | "content" | "approval" | "launch" | "review" | "research" | "partnership"
export type CalendarStatus = "planned" | "today" | "doing" | "blocked" | "done"
export type CalendarRisk = "low" | "medium" | "high" | "critical"

export type MarketingCalendarItem = {
  id: string
  title: string
  type: CalendarItemType
  status: CalendarStatus
  risk: CalendarRisk
  owner: string
  date: string
  timeBlock: string
  linkedEngine: string
  priority: "P0" | "P1" | "P2" | "P3"
  expectedOutput: string
  blocker: string
  nextAction: string
}

export const calendarItems: MarketingCalendarItem[] = [
  {
    id: "cal-001",
    title: "Validate premium postpartum campaign launch checklist",
    type: "approval",
    status: "today",
    risk: "high",
    owner: "CEO / Marketing Director",
    date: "2026-05-01",
    timeBlock: "10:00 - 11:30",
    linkedEngine: "Campaign Lifecycle + Brand Governance",
    priority: "P0",
    expectedOutput: "Approved launch checklist with final blockers removed.",
    blocker: "Medical-sensitive claims and trust-proof block still need validation.",
    nextAction: "Review final copy and approve launch conditions.",
  },
  {
    id: "cal-002",
    title: "Produce clinic partner prospectus final version",
    type: "content",
    status: "doing",
    risk: "medium",
    owner: "Content & Branding",
    date: "2026-05-01",
    timeBlock: "11:30 - 14:00",
    linkedEngine: "Partnership Growth + PR Authority",
    priority: "P1",
    expectedOutput: "Final partner prospectus ready for outreach sprint.",
    blocker: "Partner benefits matrix not yet finalized.",
    nextAction: "Add benefits matrix and disclaimer, then submit for approval.",
  },
  {
    id: "cal-003",
    title: "Launch Academy career promise A/B test",
    type: "launch",
    status: "planned",
    risk: "medium",
    owner: "Academy Marketing",
    date: "2026-05-02",
    timeBlock: "15:00 - 16:30",
    linkedEngine: "Growth Experiment Lab",
    priority: "P1",
    expectedOutput: "Experiment live with two controlled candidate-message variants.",
    blocker: "Creative approval pending.",
    nextAction: "Confirm final creative and launch test.",
  }
]

export function typeLabel(type: CalendarItemType) {
  const map: Record<CalendarItemType, string> = {
    campaign: "Campaign",
    content: "Content",
    approval: "Approval",
    launch: "Launch",
    review: "Review",
    research: "Research",
    partnership: "Partnership",
  }
  return map[type]
}

export function statusLabel(status: CalendarStatus) {
  const map: Record<CalendarStatus, string> = {
    planned: "Planned",
    today: "Today",
    doing: "Doing",
    blocked: "Blocked",
    done: "Done",
  }
  return map[status]
}

import { Activity, BarChart3, BriefcaseBusiness, Building2, CalendarDays, CheckSquare2, FileText, Gauge, Handshake, Users } from "lucide-react"

export type RevenueCommandRoute = {
  href: string
  label: string
  description: string
  icon: string
  group: "Core" | "Execution" | "Growth" | "Intelligence"
  requiredPermission?: string
}

export const REVENUE_COMMAND_CENTER_ROUTES: RevenueCommandRoute[] = [
  { href: "/revenue-command-center", label: "Command Center", description: "Executive revenue cockpit from canonical live tables.", icon: "Gauge", group: "Core", requiredPermission: "revenue.read" },
  { href: "/revenue-command-center/prospects", label: "Prospects", description: "Live prospect pipeline, qualification, decision map and stage movement.", icon: "Users", group: "Execution", requiredPermission: "revenue.prospects.read" },
  { href: "/revenue-command-center/appointments", label: "Appointments", description: "Real scheduled meetings, outcomes, no-shows and follow-up controls.", icon: "CalendarDays", group: "Execution", requiredPermission: "revenue.appointments.read" },
  { href: "/revenue-command-center/daily-tasks", label: "Daily Tasks", description: "Revenue execution board synced with prospects and appointments.", icon: "CheckSquare2", group: "Execution", requiredPermission: "revenue.tasks.read" },
  { href: "/revenue-command-center/partnerships", label: "Partnerships", description: "B2B kindergarten, preschool and institutional partnership pipeline.", icon: "Handshake", group: "Growth", requiredPermission: "revenue.partnerships.read" },
  { href: "/revenue-command-center/b2c-workflow", label: "B2C Workflow", description: "Parent inquiries, service interest and conversion workflow.", icon: "BriefcaseBusiness", group: "Growth", requiredPermission: "revenue.b2c.read" },
  { href: "/revenue-command-center/revenue-analytics", label: "Revenue Analytics", description: "Executive analytics generated from real revenue tables only.", icon: "BarChart3", group: "Intelligence", requiredPermission: "revenue.analytics.read" },
  { href: "/revenue-command-center/activity-timeline", label: "Activity Timeline", description: "Every user action, stage movement and commercial event.", icon: "Activity", group: "Intelligence", requiredPermission: "revenue.activities.read" },
  { href: "/revenue-command-center/documents", label: "Documents", description: "Proposal, contract and source-of-truth document workspace.", icon: "FileText", group: "Execution", requiredPermission: "revenue.documents.read" },
  { href: "/revenue-command-center/executive-briefing", label: "Executive Briefing", description: "Leadership readout for pipeline, risks and execution velocity.", icon: "Building2", group: "Intelligence", requiredPermission: "revenue.executive.read" },
]

export const REVENUE_ICON_MAP = { Activity, BarChart3, BriefcaseBusiness, Building2, CalendarDays, CheckSquare2, FileText, Gauge, Handshake, Users }

export function getRevenueRoutesForPermissions(permissions: string[] = []) {
  if (!permissions.length) return REVENUE_COMMAND_CENTER_ROUTES
  return REVENUE_COMMAND_CENTER_ROUTES.filter((route) => !route.requiredPermission || permissions.includes(route.requiredPermission) || permissions.includes("revenue.admin"))
}

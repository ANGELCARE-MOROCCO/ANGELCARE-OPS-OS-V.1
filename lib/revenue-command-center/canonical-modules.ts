export const REVENUE_COMMAND_CANONICAL_MODULES = {
  commandCenter: {
    route: "/revenue-command-center",
    canonicalComponent: "CentralRevenueCore",
    status: "canonical",
    replaceLegacy: [
      "RevenueCommandHQV11Cockpit",
      "RevenueCommandFinalWorkspace",
      "RevenueCommandHQWorkspace",
      "RevenueCommandMaxWorkspace",
      "UltimateRevenueExecutionPage",
    ],
  },
  prospectsDirectory: {
    route: "/revenue-command-center/prospects/directory",
    canonicalComponent: "RevenueProspectsLiveSyncCommandCenter",
    status: "canonical",
    sourceOfTruth: "revenue_prospects",
  },
  prospectProfile: {
    route: "/revenue-command-center/prospects/[id]",
    canonicalComponent: "ProspectFullProfileCommandCenter",
    status: "canonical",
    sourceOfTruth: "revenue_prospects + revenue_tasks/comments/appointments/documents",
  },
  tasks: {
    route: "/revenue-command-center/daily-tasks",
    canonicalComponent: "RevenueTasksSourceOfTruthWorkspace",
    status: "canonical",
    sourceOfTruth: "revenue_tasks",
  },
  appointments: {
    route: "/revenue-command-center/appointments",
    canonicalComponent: "RevenueAppointmentsProductionCommandCenter",
    status: "canonical",
    sourceOfTruth: "revenue_appointments",
  },
  partnerships: {
    route: "/revenue-command-center/partnerships",
    canonicalComponent: "RevenuePartnershipsEnterpriseWorkspace",
    status: "canonical",
    sourceOfTruth: "revenue_partnerships + revenue_activities",
  },
  analytics: {
    route: "/revenue-command-center/revenue-analytics",
    canonicalComponent: "RevenueAnalytics",
    status: "needs-audit",
    sourceOfTruth: "derived from revenue_* tables",
  },
} as const

export type RevenueCanonicalModuleId = keyof typeof REVENUE_COMMAND_CANONICAL_MODULES

export function getRevenueCanonicalModule(id: RevenueCanonicalModuleId) {
  return REVENUE_COMMAND_CANONICAL_MODULES[id]
}

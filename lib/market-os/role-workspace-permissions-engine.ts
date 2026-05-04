export type WorkspaceRole = "ceo" | "marketing_director" | "manager" | "agent" | "viewer"
export type PermissionRisk = "low" | "medium" | "high" | "critical"
export type PermissionStatus = "active" | "review" | "restricted"

export type RolePermission = {
  id: string
  role: WorkspaceRole
  status: PermissionStatus
  risk: PermissionRisk
  enginesAllowed: number
  approvalPower: string
  financialVisibility: string
  executionRights: string
  restrictedAreas: string
  reason: string
  nextAction: string
}

export const rolePermissions: RolePermission[] = [
  {
    id: "perm-001",
    role: "ceo",
    status: "active",
    risk: "low",
    enginesAllowed: 25,
    approvalPower: "Full approval authority across strategy, budget, launch, pricing and executive decisions.",
    financialVisibility: "Full financial visibility: CAC, ROI, revenue impact, budget and investor reports.",
    executionRights: "Can create, approve, escalate, archive, export and override.",
    restrictedAreas: "None.",
    reason: "CEO requires full strategic and investor-grade control.",
    nextAction: "Connect CEO role to all Market-OS engines and executive reports.",
  },
  {
    id: "perm-002",
    role: "marketing_director",
    status: "review",
    risk: "medium",
    enginesAllowed: 22,
    approvalPower: "Can approve campaigns, content, scripts, offers and execution tasks. CEO approval required for pricing and investor reports.",
    financialVisibility: "Can see campaign ROI, CAC and budget, but not full board-level financial controls.",
    executionRights: "Can create tasks, assign owners, approve assets, trigger reviews and escalate risks.",
    restrictedAreas: "Investor decisions and system-wide admin configs.",
    reason: "Marketing Director needs deep control without CEO-only governance rights.",
    nextAction: "Review pricing approval and investor report restrictions.",
  },
  {
    id: "perm-003",
    role: "agent",
    status: "restricted",
    risk: "high",
    enginesAllowed: 7,
    approvalPower: "No approval authority.",
    financialVisibility: "Limited. No ROI, budget or investor visibility.",
    executionRights: "Can update assigned tasks, submit proof, use scripts and mark work progress.",
    restrictedAreas: "Strategy, finance, admin config, investor command, pricing approval.",
    reason: "Agents should execute without accessing strategic or financial controls.",
    nextAction: "Map assigned execution pages to existing user permission system.",
  }
]

export function roleLabel(role: WorkspaceRole) {
  const map: Record<WorkspaceRole, string> = {
    ceo: "CEO",
    marketing_director: "Marketing Director",
    manager: "Manager",
    agent: "Agent",
    viewer: "Viewer",
  }
  return map[role]
}

export function statusLabel(status: PermissionStatus) {
  const map: Record<PermissionStatus, string> = {
    active: "Active",
    review: "Review",
    restricted: "Restricted",
  }
  return map[status]
}

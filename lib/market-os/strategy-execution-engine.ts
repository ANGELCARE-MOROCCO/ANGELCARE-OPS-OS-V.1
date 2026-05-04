export type ExecutionStatus =
  | "todo"
  | "doing"
  | "review"
  | "approved"
  | "blocked"
  | "done"

export type ExecutionPriority = "P0" | "P1" | "P2" | "P3"

export type ExecutionTask = {
  id: string
  objective: string
  title: string
  owner: string
  department: string
  status: ExecutionStatus
  priority: ExecutionPriority
  deadline: string
  slaHours: number
  progress: number
  evidenceRequired: boolean
  approvalRequired: boolean
  blocker: string
  nextAction: string
  expectedImpact: string
}

export const executionTasks: ExecutionTask[] = [
  {
    id: "task-001",
    objective: "Postpartum Growth System",
    title: "Finalize premium postpartum campaign brief",
    owner: "Marketing Director",
    department: "Strategy",
    status: "doing",
    priority: "P0",
    deadline: "2026-05-06",
    slaHours: 48,
    progress: 65,
    evidenceRequired: true,
    approvalRequired: true,
    blocker: "Needs final service promise validation",
    nextAction: "Attach final offer structure and submit for CEO approval",
    expectedImpact: "Unlocks campaign launch for premium postpartum segment",
  },
  {
    id: "task-002",
    objective: "B2B Clinic Partnership Pipeline",
    title: "Build 20-clinic target list and partner qualification grid",
    owner: "Partnership Lead",
    department: "Partnerships",
    status: "todo",
    priority: "P1",
    deadline: "2026-05-09",
    slaHours: 72,
    progress: 20,
    evidenceRequired: true,
    approvalRequired: false,
    blocker: "None",
    nextAction: "Segment clinics by maternity volume and decision-maker access",
    expectedImpact: "Creates qualified B2B pipeline for partnership outreach",
  },
  {
    id: "task-003",
    objective: "Caregiver Supply Brand Authority",
    title: "Prepare Academy recruitment angle and content plan",
    owner: "Academy Marketing",
    department: "Content",
    status: "review",
    priority: "P2",
    deadline: "2026-05-12",
    slaHours: 96,
    progress: 82,
    evidenceRequired: true,
    approvalRequired: true,
    blocker: "Needs brand tone approval",
    nextAction: "Submit 30-day content plan for manager validation",
    expectedImpact: "Improves caregiver recruitment lead generation",
  },
]

export function statusLabel(status: ExecutionStatus) {
  const map: Record<ExecutionStatus, string> = {
    todo: "To Do",
    doing: "Doing",
    review: "In Review",
    approved: "Approved",
    blocked: "Blocked",
    done: "Done",
  }
  return map[status]
}

export function getSlaRisk(task: ExecutionTask) {
  if (task.status === "blocked") return "Critical"
  if (task.priority === "P0" && task.progress < 70) return "High"
  if (task.progress < 40) return "Medium"
  return "Controlled"
}

import type { ContentItem, ContentTask } from "@/components/market-os/content-command/content-command-system"
import type { TaskChecklistItem, TaskExecutionMeta } from "@/lib/content-command/tasks/task-activity"

export type MissionReadinessState = {
  ready: boolean
  state: "constitution-incomplete" | "ownership-required" | "dependency-required" | "authority-required" | "ready" | "active" | "at-risk" | "closure-pending" | "closed"
  missing: string[]
  completed: number
  total: number
}

export type TaskOperatingState = {
  task: ContentTask
  item?: ContentItem | null
  meta: TaskExecutionMeta
  checklist: TaskChecklistItem[]
  openBlockers: number
  openClarifications: number
  acceptedEvidence: number
  submittedEvidence: number
  readinessMissing: string[]
  readinessReady: boolean
  nextAction: string
}

export type TaskCommandMode = "coordination" | "mission" | "review" | "risk" | "audit"
export type TaskWorkstationMode = "mandate" | "work" | "inputs" | "evidence" | "history"
export type AmendmentClass = "clarification" | "operational" | "scope" | "deadline" | "ownership" | "dependency" | "completion" | "strategic"

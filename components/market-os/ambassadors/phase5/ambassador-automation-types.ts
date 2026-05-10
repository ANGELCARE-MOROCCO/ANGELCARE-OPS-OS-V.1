export type AmbassadorAutomationPriority = "low" | "medium" | "high" | "critical";

export type AmbassadorAutomationStatus =
  | "draft"
  | "active"
  | "paused"
  | "completed"
  | "failed";

export type AmbassadorAutomationTrigger =
  | "new_application"
  | "onboarding_stalled"
  | "mission_assigned"
  | "proof_submitted"
  | "proof_approved"
  | "proof_rejected"
  | "reward_earned"
  | "payout_ready"
  | "inactive_ambassador"
  | "compliance_risk"
  | "territory_gap"
  | "campaign_deadline";

export type AmbassadorAutomationAction =
  | "notify_manager"
  | "notify_ambassador"
  | "create_task"
  | "assign_mission"
  | "request_proof_revision"
  | "approve_reward"
  | "escalate_compliance"
  | "schedule_training"
  | "flag_for_review"
  | "generate_summary";

export type AmbassadorAutomationRule = {
  id: string;
  name: string;
  description: string;
  trigger: AmbassadorAutomationTrigger;
  action: AmbassadorAutomationAction;
  status: AmbassadorAutomationStatus;
  priority: AmbassadorAutomationPriority;
  owner: string;
  targetSegment: string;
  conditionLabel: string;
  lastRunAt?: string;
  runCount: number;
  successRate: number;
};

export type AmbassadorWorkflowStage = {
  id: string;
  label: string;
  owner: string;
  slaHours: number;
  automationAction: AmbassadorAutomationAction;
  status: "ready" | "blocked" | "running" | "completed";
};

export type AmbassadorExecutionTask = {
  id: string;
  title: string;
  assignee: string;
  relatedAmbassador: string;
  dueDate: string;
  priority: AmbassadorAutomationPriority;
  status: "todo" | "doing" | "waiting" | "done";
  source: "automation" | "manual" | "campaign" | "compliance" | "payout";
};

export type AmbassadorNotification = {
  id: string;
  channel: "whatsapp" | "email" | "sms" | "in_app";
  recipient: string;
  subject: string;
  status: "queued" | "sent" | "failed" | "draft";
  scheduledFor: string;
  linkedWorkflow: string;
};

export type AmbassadorEscalation = {
  id: string;
  ambassadorName: string;
  reason: string;
  severity: AmbassadorAutomationPriority;
  owner: string;
  status: "open" | "investigating" | "resolved";
  nextAction: string;
};

export type AmbassadorPhase5Snapshot = {
  rules: AmbassadorAutomationRule[];
  workflowStages: AmbassadorWorkflowStage[];
  tasks: AmbassadorExecutionTask[];
  notifications: AmbassadorNotification[];
  escalations: AmbassadorEscalation[];
};

export const INTERVIEW_STATUSES = [
  "scheduled",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
] as const;

export const INTERVIEW_TYPES = [
  "screening",
  "technical",
  "hr_interview",
  "assessment",
  "final_interview",
  "panel_interview",
] as const;

export const INTERVIEW_MODES = ["video", "onsite", "phone"] as const;

export const INTERVIEW_DECISIONS = [
  "pending",
  "shortlisted",
  "assessment",
  "offer",
  "on_hold",
  "rejected",
  "another_interview",
] as const;

export type InterviewStatus = (typeof INTERVIEW_STATUSES)[number];
export type InterviewType = (typeof INTERVIEW_TYPES)[number];
export type InterviewMode = (typeof INTERVIEW_MODES)[number];
export type InterviewDecision = (typeof INTERVIEW_DECISIONS)[number];

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export type InterviewCandidate = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  positionTitle: string | null;
  openingId: string | null;
  pipelineStage: string | null;
  decision: string | null;
  status: string | null;
};

export type InterviewerOption = {
  id: string;
  fullName: string;
  email: string | null;
  department: string | null;
  position: string | null;
  active: boolean;
};

export type InterviewOpening = {
  id: string;
  title: string;
  department: string | null;
  status: string | null;
};

export type InterviewRecord = {
  id: string;
  candidateId: string;
  openingId: string | null;
  candidateName: string;
  candidateEmail: string | null;
  candidatePhone: string | null;
  city: string | null;
  positionTitle: string | null;
  interviewType: InterviewType;
  status: InterviewStatus;
  scheduledAt: string;
  scheduledLocal: string;
  durationMinutes: number;
  timezone: string;
  mode: InterviewMode;
  location: string | null;
  meetingUrl: string | null;
  leadInterviewer: string;
  leadInterviewerId: string | null;
  panelMembers: string[];
  coordinator: string | null;
  priority: "normal" | "high" | "urgent";
  pipelineStageAfter: string | null;
  decision: InterviewDecision;
  score: number | null;
  scorecard: JsonObject;
  notes: string | null;
  feedbackStatus: "not_required" | "pending" | "submitted" | "overdue";
  feedbackDueAt: string | null;
  feedbackCompletedAt: string | null;
  cancellationReason: string | null;
  candidateNotificationStatus: string | null;
  version: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InterviewActivity = {
  id: string;
  interviewId: string;
  candidateId: string | null;
  activityType: string;
  actorId: string | null;
  actorLabel: string | null;
  title: string;
  detail: string | null;
  visibility: string;
  metadata: JsonObject;
  createdAt: string;
};

export type InterviewCommandSnapshot = {
  generatedAt: string;
  timezone: string;
  candidates: InterviewCandidate[];
  interviewers: InterviewerOption[];
  openings: InterviewOpening[];
  interviews: InterviewRecord[];
  activities: InterviewActivity[];
  warnings: string[];
};

export type InterviewInput = {
  candidateId?: string | null;
  newCandidate?: {
    fullName: string;
    email?: string | null;
    phone?: string | null;
    city?: string | null;
    positionTitle: string;
    openingId?: string | null;
  } | null;
  openingId?: string | null;
  candidateName?: string | null;
  candidateEmail?: string | null;
  candidatePhone?: string | null;
  city?: string | null;
  positionTitle?: string | null;
  interviewType: InterviewType;
  status?: InterviewStatus;
  scheduledLocal: string;
  durationMinutes: number;
  timezone?: string;
  mode: InterviewMode;
  location?: string | null;
  meetingUrl?: string | null;
  leadInterviewer: string;
  leadInterviewerId?: string | null;
  panelMembers?: string[];
  coordinator?: string | null;
  priority?: "normal" | "high" | "urgent";
  pipelineStageAfter?: string | null;
  decision?: InterviewDecision;
  score?: number | null;
  scorecard?: JsonObject;
  notes?: string | null;
  feedbackDueAt?: string | null;
  createPreparationTask?: boolean;
  preparationTaskTitle?: string | null;
  version?: number;
};

export type InterviewMutationResult = {
  ok: true;
  interview: InterviewRecord;
  checkpoints: string[];
};

export type InterviewActionInput =
  | { action: "complete"; score?: number | null; notes?: string | null; version: number }
  | { action: "no_show"; notes?: string | null; version: number }
  | { action: "decision"; decision: InterviewDecision; pipelineStage?: string | null; notes?: string | null; version: number }
  | { action: "comment"; comment: string; visibility?: string; category?: string | null }
  | { action: "feedback"; score?: number | null; feedback: string; decision?: InterviewDecision; version: number }
  | { action: "task"; title: string; owner?: string | null; priority?: string; dueDate?: string | null; description?: string | null };

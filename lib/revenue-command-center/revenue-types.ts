
export type RevenueEntityType =
  | "prospect"
  | "partnership"
  | "appointment"
  | "task"
  | "follow_up"
  | "note"
  | "comment"
  | "document"
  | "campaign"
  | "general"
  | "team";

export type RevenueTask = {
  id: string;
  workspace_slug: string;
  entity_type: RevenueEntityType;
  entity_id: string;
  title: string;
  description: string | null;
  owner: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "done" | "cancelled";
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type RevenueAppointment = {
  id: string;
  workspace_slug: string;
  entity_type: RevenueEntityType;
  entity_id: string;
  title: string;
  appointment_at: string;
  owner: string;
  status: "scheduled" | "completed" | "cancelled";
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type RevenueComment = {
  id: string;
  workspace_slug: string;
  entity_type: RevenueEntityType;
  entity_id: string;
  author: string;
  channel: string;
  note: string;
  created_at: string;
};

export type RevenueDocument = {
  id: string;
  workspace_slug: string;
  entity_type: RevenueEntityType;
  entity_id: string;
  title: string;
  file_url: string | null;
  document_type: string;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type RevenueEvent = {
  id: string;
  workspace_slug: string;
  entity_type: RevenueEntityType;
  entity_id: string;
  event_type: string;
  event_title: string;
  event_body: string | null;
  actor: string;
  severity: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

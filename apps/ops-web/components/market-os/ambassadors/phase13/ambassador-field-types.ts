export type TerritoryStatus = "covered" | "under_covered" | "expansion" | "critical_gap";
export type FieldPriority = "low" | "medium" | "high" | "critical";
export type FieldTaskStatus = "todo" | "doing" | "blocked" | "done";

export type AmbassadorTerritoryZone = {
  id: string;
  city: string;
  region: string;
  status: TerritoryStatus;
  currentAmbassadors: number;
  targetAmbassadors: number;
  activeCampaigns: number;
  leadDemandScore: number;
  manager: string;
  priority: FieldPriority;
};

export type AmbassadorFieldActivation = {
  id: string;
  title: string;
  city: string;
  location: string;
  date: string;
  owner: string;
  expectedAmbassadors: number;
  checkedInAmbassadors: number;
  generatedLeads: number;
  status: "planned" | "live" | "completed" | "cancelled";
};

export type AmbassadorFieldTask = {
  id: string;
  title: string;
  city: string;
  type: "recruitment" | "activation" | "event" | "partner_visit" | "training" | "lead_followup" | "compliance_check" | "community_mapping";
  assignee: string;
  dueDate: string;
  priority: FieldPriority;
  status: FieldTaskStatus;
  expectedImpact: string;
};

export type AmbassadorRecruitmentGap = {
  id: string;
  city: string;
  missingAmbassadors: number;
  targetProfile: string;
  reason: string;
  recommendedSource: "academy" | "partners" | "social" | "campus" | "referral" | "community";
  urgency: FieldPriority;
};

export type AmbassadorFieldSnapshot = {
  territories: AmbassadorTerritoryZone[];
  activations: AmbassadorFieldActivation[];
  tasks: AmbassadorFieldTask[];
  recruitmentGaps: AmbassadorRecruitmentGap[];
};

export type RegionTier = "HQ" | "Country" | "City" | "Branch";
export type ServiceLine = "Postpartum" | "BabyCare" | "SpecialNeeds" | "HybridSchoolHome" | "EmergencyBackup";
export type TalentStatus = "Candidate" | "Academy" | "Ready" | "Elite" | "Restricted" | "Suspended";
export type RiskLevel = "low" | "watch" | "high" | "critical";
export type PermissionAction = "view" | "create" | "edit" | "approve" | "export" | "assign" | "block" | "escalate";

export interface AngelCareRegion {
  id: string; name: string; country: string; city?: string; tier: RegionTier;
  currency: string; language: string; laborRulePack: string; qualityFloor: number; active: boolean;
}

export interface SkillMatrix {
  newbornCare: number; postpartumSupport: number; specialNeeds: number; schoolShadowing: number;
  hygieneProtocol: number; emergencyResponse: number; clientCommunication: number; emotionalRegulation: number;
}

export interface TalentDNA {
  id: string; fullName: string; region: string; city: string; role: string; status: TalentStatus;
  languages: string[]; serviceEligibility: ServiceLine[]; skills: SkillMatrix;
  reliabilityScore: number; behaviorScore: number; emotionalIntelligence: number; punctualityScore: number;
  clientRating: number; missionCount: number; incidents90d: number; certificates: string[];
  readinessScore: number; risk: RiskLevel; supervisor: string; lastReview: string; nextAction: string;
}

export interface ExecutiveKpi {
  label: string; value: string; delta: string; status: RiskLevel; interpretation: string; action: string;
}

export interface DecisionBrief {
  title: string; signal: string; diagnosis: string; decision: string; owner: string; deadline: string; impact: string;
}

export interface Candidate {
  id: string; name: string; source: string; stage: string; city: string; serviceFit: ServiceLine[];
  screeningScore: number; cultureFit: number; documentScore: number; academyDecision: "admit" | "hold" | "reject" | "fast-track";
  redFlags: string[]; nextStep: string;
}

export interface TrainingCohort {
  id: string; name: string; serviceLine: ServiceLine; trainer: string; startDate: string; readiness: number;
  attendance: number; simulationScore: number; certificationRate: number; fieldValidation: number; blockers: string[];
}

export interface MissionNeed {
  id: string; client: string; city: string; serviceLine: ServiceLine; urgency: "normal" | "urgent" | "critical";
  emotionalSensitivity: number; requiredSkills: Partial<SkillMatrix>; schedule: string; language: string; notes: string;
}

export interface AllocationRecommendation {
  talent: TalentDNA; mission: MissionNeed; matchScore: number; reasons: string[]; risks: string[]; requiredApproval: boolean;
}

export interface IncidentCase {
  id: string; title: string; severity: RiskLevel; region: string; caregiver: string; client: string;
  rootCause: string; correctiveAction: string; owner: string; status: string; dueDate: string;
}

export interface ExportRequest {
  id: string; documentType: string; reference: string; generatedBy: string; reason: string; createdAt: string; region: string;
}

export type AmbassadorTrainingStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "failed"
  | "expired";

export type AmbassadorCertificationLevel =
  | "starter"
  | "certified"
  | "advanced"
  | "elite"
  | "regional_leader";

export type AmbassadorSkillArea =
  | "brand_knowledge"
  | "content_execution"
  | "sales_referral"
  | "compliance"
  | "customer_interaction"
  | "campaign_reporting"
  | "community_activation";

export type AmbassadorTrainingModule = {
  id: string;
  title: string;
  category:
    | "onboarding"
    | "brand"
    | "sales"
    | "content"
    | "compliance"
    | "academy"
    | "leadership";
  requiredLevel: AmbassadorCertificationLevel;
  durationMinutes: number;
  passingScore: number;
  owner: string;
  status: "active" | "draft" | "archived";
};

export type AmbassadorLearningPath = {
  id: string;
  name: string;
  targetLevel: AmbassadorCertificationLevel;
  modules: string[];
  requiredForActivation: boolean;
  estimatedHours: number;
  owner: string;
};

export type AmbassadorTrainingProgress = {
  id: string;
  ambassadorName: string;
  city: string;
  currentLevel: AmbassadorCertificationLevel;
  targetLevel: AmbassadorCertificationLevel;
  completedModules: number;
  totalModules: number;
  averageScore: number;
  status: AmbassadorTrainingStatus;
  lastActivityAt: string;
  trainerOwner: string;
};

export type AmbassadorSkillScore = {
  ambassadorName: string;
  skillArea: AmbassadorSkillArea;
  score: number;
  evidence: string;
  recommendedImprovement: string;
};

export type AmbassadorTrainerReview = {
  id: string;
  ambassadorName: string;
  reviewType:
    | "onboarding_validation"
    | "certification_upgrade"
    | "compliance_retraining"
    | "campaign_coaching"
    | "leadership_review";
  priority: "low" | "medium" | "high" | "critical";
  owner: string;
  dueDate: string;
  status: "todo" | "doing" | "blocked" | "done";
  notes: string;
};

export type AmbassadorTrainingSnapshot = {
  modules: AmbassadorTrainingModule[];
  learningPaths: AmbassadorLearningPath[];
  progress: AmbassadorTrainingProgress[];
  skillScores: AmbassadorSkillScore[];
  trainerReviews: AmbassadorTrainerReview[];
};

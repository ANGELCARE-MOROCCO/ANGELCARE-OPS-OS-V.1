import type {
  AmbassadorCertificationLevel,
  AmbassadorSkillScore,
  AmbassadorTrainerReview,
  AmbassadorTrainingProgress,
  AmbassadorTrainingSnapshot,
} from "./ambassador-training-types";

export type AmbassadorTrainingMetrics = {
  activeModules: number;
  requiredLearningPaths: number;
  averageTrainingScore: number;
  completedOrInProgress: number;
  failedOrExpired: number;
  criticalReviews: number;
  lowSkillRiskCount: number;
  trainingReadinessScore: number;
};

export function getCertificationWeight(level: AmbassadorCertificationLevel): number {
  const weights: Record<AmbassadorCertificationLevel, number> = {
    starter: 1,
    certified: 2,
    advanced: 3,
    elite: 4,
    regional_leader: 5,
  };

  return weights[level];
}

export function calculateProgressPercent(progress: AmbassadorTrainingProgress): number {
  if (progress.totalModules <= 0) return 0;
  return Math.round((progress.completedModules / progress.totalModules) * 100);
}

export function getAmbassadorsEligibleForUpgrade(progress: AmbassadorTrainingProgress[]): AmbassadorTrainingProgress[] {
  return progress.filter((item) => {
    const progressPercent = calculateProgressPercent(item);
    return progressPercent >= 80 && item.averageScore >= 85 && getCertificationWeight(item.targetLevel) > getCertificationWeight(item.currentLevel);
  });
}

export function getLowSkillRisks(skills: AmbassadorSkillScore[]): AmbassadorSkillScore[] {
  return skills.filter((skill) => skill.score < 70).sort((a, b) => a.score - b.score);
}

export function getCriticalTrainerReviews(reviews: AmbassadorTrainerReview[]): AmbassadorTrainerReview[] {
  return reviews
    .filter((review) => review.priority === "critical" && review.status !== "done")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function getAmbassadorTrainingMetrics(snapshot: AmbassadorTrainingSnapshot): AmbassadorTrainingMetrics {
  const activeModules = snapshot.modules.filter((module) => module.status === "active").length;
  const requiredLearningPaths = snapshot.learningPaths.filter((path) => path.requiredForActivation).length;

  const averageTrainingScore =
    snapshot.progress.length === 0
      ? 0
      : Math.round(snapshot.progress.reduce((sum, item) => sum + item.averageScore, 0) / snapshot.progress.length);

  const completedOrInProgress = snapshot.progress.filter(
    (item) => item.status === "completed" || item.status === "in_progress",
  ).length;

  const failedOrExpired = snapshot.progress.filter(
    (item) => item.status === "failed" || item.status === "expired",
  ).length;

  const criticalReviews = getCriticalTrainerReviews(snapshot.trainerReviews).length;
  const lowSkillRiskCount = getLowSkillRisks(snapshot.skillScores).length;

  const base = activeModules * 9 + requiredLearningPaths * 8 + averageTrainingScore;
  const penalty = failedOrExpired * 10 + criticalReviews * 8 + lowSkillRiskCount * 7;
  const trainingReadinessScore = Math.max(0, Math.min(100, Math.round(base / 2 - penalty + 35)));

  return {
    activeModules,
    requiredLearningPaths,
    averageTrainingScore,
    completedOrInProgress,
    failedOrExpired,
    criticalReviews,
    lowSkillRiskCount,
    trainingReadinessScore,
  };
}

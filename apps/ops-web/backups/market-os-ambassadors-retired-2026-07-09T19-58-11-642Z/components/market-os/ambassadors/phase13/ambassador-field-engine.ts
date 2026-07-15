import type { AmbassadorFieldSnapshot, AmbassadorFieldTask, AmbassadorRecruitmentGap, AmbassadorTerritoryZone } from "./ambassador-field-types";

export type AmbassadorFieldMetrics = {
  totalTerritories: number;
  criticalTerritories: number;
  totalAmbassadors: number;
  totalTargetAmbassadors: number;
  coveragePercent: number;
  plannedActivations: number;
  openFieldTasks: number;
  criticalRecruitmentGaps: number;
  fieldReadinessScore: number;
};

export function calculateTerritoryCoverage(zone: AmbassadorTerritoryZone): number {
  if (zone.targetAmbassadors <= 0) return 0;
  return Math.round((zone.currentAmbassadors / zone.targetAmbassadors) * 100);
}

export function getCriticalTerritories(zones: AmbassadorTerritoryZone[]): AmbassadorTerritoryZone[] {
  return zones.filter((zone) => zone.status === "critical_gap" || zone.priority === "critical").sort((a, b) => b.leadDemandScore - a.leadDemandScore);
}

export function getOpenFieldTasks(tasks: AmbassadorFieldTask[]): AmbassadorFieldTask[] {
  const weights = { critical: 4, high: 3, medium: 2, low: 1 };
  return tasks.filter((task) => task.status !== "done").sort((a, b) => weights[b.priority] - weights[a.priority]);
}

export function getCriticalRecruitmentGaps(gaps: AmbassadorRecruitmentGap[]): AmbassadorRecruitmentGap[] {
  return gaps.filter((gap) => gap.urgency === "critical" || gap.urgency === "high").sort((a, b) => b.missingAmbassadors - a.missingAmbassadors);
}

export function getAmbassadorFieldMetrics(snapshot: AmbassadorFieldSnapshot): AmbassadorFieldMetrics {
  const totalTerritories = snapshot.territories.length;
  const criticalTerritories = getCriticalTerritories(snapshot.territories).length;
  const totalAmbassadors = snapshot.territories.reduce((sum, zone) => sum + zone.currentAmbassadors, 0);
  const totalTargetAmbassadors = snapshot.territories.reduce((sum, zone) => sum + zone.targetAmbassadors, 0);
  const coveragePercent = totalTargetAmbassadors <= 0 ? 0 : Math.round((totalAmbassadors / totalTargetAmbassadors) * 100);
  const plannedActivations = snapshot.activations.filter((activation) => activation.status === "planned").length;
  const openFieldTasks = getOpenFieldTasks(snapshot.tasks).length;
  const criticalRecruitmentGaps = getCriticalRecruitmentGaps(snapshot.recruitmentGaps).length;
  const base = coveragePercent + plannedActivations * 5 + totalTerritories * 3;
  const penalty = criticalTerritories * 10 + criticalRecruitmentGaps * 8 + openFieldTasks * 2;
  const fieldReadinessScore = Math.max(0, Math.min(100, Math.round(base - penalty + 35)));
  return { totalTerritories, criticalTerritories, totalAmbassadors, totalTargetAmbassadors, coveragePercent, plannedActivations, openFieldTasks, criticalRecruitmentGaps, fieldReadinessScore };
}

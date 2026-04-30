import type { SkillMatrix, TalentDNA, MissionNeed, AllocationRecommendation, RiskLevel } from "./types";

export function averageSkill(skills: SkillMatrix) {
  const values = Object.values(skills);
  return Math.round(values.reduce((a,b)=>a+b,0) / values.length);
}

export function calculateReadiness(t: Pick<TalentDNA, "skills" | "reliabilityScore" | "behaviorScore" | "emotionalIntelligence" | "punctualityScore" | "clientRating" | "incidents90d">) {
  const skill = averageSkill(t.skills);
  const rating = Math.round((t.clientRating / 5) * 100);
  const incidentPenalty = Math.min(30, t.incidents90d * 8);
  return Math.max(0, Math.round(skill * .28 + t.reliabilityScore * .18 + t.behaviorScore * .18 + t.emotionalIntelligence * .14 + t.punctualityScore * .12 + rating * .10 - incidentPenalty));
}

export function riskFromScore(score: number): RiskLevel {
  if (score >= 82) return "low";
  if (score >= 70) return "watch";
  if (score >= 55) return "high";
  return "critical";
}

export function missionMatch(talent: TalentDNA, mission: MissionNeed): AllocationRecommendation {
  const skillReq = mission.requiredSkills;
  const required = Object.entries(skillReq).filter(([,v]) => typeof v === "number") as [keyof SkillMatrix, number][];
  const skillScore = required.length ? Math.round(required.reduce((sum,[k,v]) => sum + Math.min(100, talent.skills[k] / Math.max(1, v) * 100), 0) / required.length) : averageSkill(talent.skills);
  const cityScore = talent.city === mission.city ? 100 : 68;
  const langScore = talent.languages.includes(mission.language) ? 100 : 55;
  const qualityScore = Math.round((talent.readinessScore + talent.reliabilityScore + talent.behaviorScore + talent.emotionalIntelligence) / 4);
  const urgencyPenalty = mission.urgency === "critical" && talent.risk !== "low" ? 12 : 0;
  const matchScore = Math.max(0, Math.round(skillScore*.38 + qualityScore*.30 + cityScore*.16 + langScore*.10 + talent.punctualityScore*.06 - urgencyPenalty));
  return {
    talent, mission, matchScore,
    reasons: ["Skills aligned to mission requirements", "Quality history included", "Location/language checked", "Readiness gate applied"],
    risks: [talent.risk !== "low" ? `Talent risk is ${talent.risk}` : "No critical people-risk signal", talent.incidents90d ? `${talent.incidents90d} incident(s) in 90 days` : "No recent incidents"],
    requiredApproval: matchScore < 78 || talent.risk === "high" || talent.risk === "critical"
  };
}

export const formatReference = (prefix: string, region: string, counter: number) => `${prefix}-${region.toUpperCase()}-${new Date().getFullYear()}-${String(counter).padStart(5,"0")}`;

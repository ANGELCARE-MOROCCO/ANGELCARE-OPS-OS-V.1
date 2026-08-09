import type { Bulk2Signal, Bulk2Strategy, Collision, ReadinessCheck } from "./bulk2-types"
import type { BrandRule, ContentBrief, ContentItem } from "../content-command-system"

export function asStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : []
}

export function signalCredibility(signal: Bulk2Signal): { label: string; tone: "success" | "warning" | "danger" | "neutral"; explanation: string } {
  const confidence = Number(signal.confidence || 0)
  const hasSource = Boolean(signal.source_url || signal.source_label)
  const hasHuman = Boolean(signal.human_conclusion?.trim())
  if (signal.status === "verified" && hasSource && hasHuman) return { label: "Vérifié", tone: "success", explanation: "Source et conclusion humaine présentes." }
  if (signal.status === "rejected" || signal.status === "expired") return { label: "Non exploitable", tone: "danger", explanation: "Le signal a été rejeté ou a expiré." }
  if (!hasSource) return { label: "Source incomplète", tone: "danger", explanation: "Aucune provenance exploitable n’est attachée." }
  if (confidence >= 70 && hasHuman) return { label: "Partiellement vérifié", tone: "warning", explanation: "La provenance existe, mais la vérification formelle reste incomplète." }
  return { label: "Revue humaine requise", tone: "neutral", explanation: "La confiance ou la conclusion humaine est insuffisante." }
}

export function strategyReadiness(strategy: Bulk2Strategy | null, signals: Bulk2Signal[], planCount: number, missionCount: number): ReadinessCheck[] {
  if (!strategy) return []
  const linked = asStrings(strategy.signal_ids).filter((id) => signals.some((signal) => signal.id === id))
  return [
    { id: "evidence", label: "Évidence liée", passed: linked.length > 0, reason: linked.length ? `${linked.length} signal(aux) relié(s).` : "Aucun signal qualifié relié.", owner: "Responsable stratégie" },
    { id: "problem", label: "Problème formulé", passed: Boolean(strategy.problem_statement?.trim()), reason: strategy.problem_statement?.trim() ? "Tension stratégique explicitée." : "Le problème stratégique doit être rédigé.", owner: "Strategist" },
    { id: "business", label: "Objectif business", passed: Boolean(strategy.business_objective?.trim()), reason: strategy.business_objective?.trim() ? "Objectif business documenté." : "Objectif business manquant.", owner: "Sponsor" },
    { id: "content", label: "Objectif contenu", passed: Boolean(strategy.content_objective?.trim()), reason: strategy.content_objective?.trim() ? "Objectif contenu documenté." : "Objectif contenu manquant.", owner: "Content Lead" },
    { id: "plan", label: "Plan d’action", passed: planCount > 0, reason: planCount ? `${planCount} plan(s) présent(s).` : "Aucun plan compilé.", owner: "Responsable stratégie" },
    { id: "mission", label: "Mission constituée", passed: missionCount > 0, reason: missionCount ? `${missionCount} mission(s) reliée(s).` : "La libération de mission n’a pas encore eu lieu.", owner: "Mission owner" },
  ]
}

export function briefReadiness(brief: ContentBrief | null): ReadinessCheck[] {
  if (!brief) return []
  return [
    { id: "title", label: "Objet du brief", passed: Boolean(brief.title.trim()), reason: brief.title.trim() ? "Titre explicite." : "Titre manquant." },
    { id: "campaign", label: "Contexte campagne", passed: Boolean(brief.campaign.trim()), reason: brief.campaign.trim() ? "Campagne reliée." : "Campagne non renseignée." },
    { id: "audience", label: "Audience", passed: Boolean(brief.audience.trim()), reason: brief.audience.trim() ? "Audience identifiée." : "Audience à clarifier." },
    { id: "objective", label: "Objectif", passed: Boolean(brief.objective.trim()), reason: brief.objective.trim() ? "Objectif documenté." : "Objectif absent." },
    { id: "message", label: "Message central", passed: Boolean(brief.message.trim()), reason: brief.message.trim() ? "Message central documenté." : "Message à constituer." },
    { id: "owner", label: "Propriétaire", passed: Boolean(brief.owner.trim()), reason: brief.owner.trim() ? `Propriétaire : ${brief.owner}.` : "Aucun propriétaire." },
    { id: "deadline", label: "Échéance", passed: Boolean(brief.dueDate), reason: brief.dueDate ? `Échéance : ${brief.dueDate}.` : "Échéance manquante." },
  ]
}

export function planningCollisions(items: ContentItem[]): Collision[] {
  const collisions: Collision[] = []
  const groups = new Map<string, ContentItem[]>()
  for (const item of items.filter((entry) => entry.scheduledDate)) {
    const key = `${item.scheduledDate}|${item.channel}`
    groups.set(key, [...(groups.get(key) || []), item])
  }
  for (const [key, entries] of groups) {
    if (entries.length > 1) collisions.push({
      id: `channel:${key}`,
      severity: entries.length >= 3 ? "critical" : "warning",
      title: `${entries.length} sorties sur ${entries[0]?.channel}`,
      basis: `Même canal et même date (${entries[0]?.scheduledDate}).`,
      affectedIds: entries.map((item) => item.id),
      consequence: "Risque de concurrence éditoriale et de pression audience.",
    })
  }
  const ownerGroups = new Map<string, ContentItem[]>()
  for (const item of items.filter((entry) => entry.dueDate && entry.owner)) {
    const key = `${item.dueDate}|${item.owner}`
    ownerGroups.set(key, [...(ownerGroups.get(key) || []), item])
  }
  for (const [key, entries] of ownerGroups) {
    if (entries.length > 1) collisions.push({
      id: `owner:${key}`,
      severity: "warning",
      title: `${entries.length} livrables pour ${entries[0]?.owner}`,
      basis: `Même propriétaire et même échéance (${entries[0]?.dueDate}).`,
      affectedIds: entries.map((item) => item.id),
      consequence: "Charge observée concentrée; aucune capacité productive n’est inventée.",
    })
  }
  for (const item of items) {
    if (item.scheduledDate && item.dueDate && item.scheduledDate < item.dueDate) collisions.push({
      id: `sequence:${item.id}`,
      severity: "critical",
      title: `Séquence incohérente · ${item.title}`,
      basis: `Publication prévue le ${item.scheduledDate} avant l’échéance de production ${item.dueDate}.`,
      affectedIds: [item.id],
      consequence: "La publication ne peut pas précéder la fin du travail attendu.",
    })
  }
  return collisions
}

export function brandViolations(items: ContentItem[], rules: BrandRule[]) {
  return items.flatMap((item) => rules.filter((rule) => rule.active).flatMap((rule) => {
    let issue = ""
    if (rule.category === "CTA" && rule.required && !item.cta.trim()) issue = "Call-to-action manquant"
    if (rule.category === "Compliance" && item.brandScore < 70) issue = `Score marque observé ${item.brandScore}%`
    if (rule.category === "Visual" && rule.required && item.assets.length === 0) issue = "Aucun asset rattaché"
    if (rule.category === "Message" && rule.required && item.body.trim().length < 80) issue = "Message trop incomplet pour contrôle"
    if (rule.category === "Medical sensitivity" && /diagnos|guarantee|guérison|garanti/i.test(item.body)) issue = "Formulation potentiellement sensible"
    return issue ? [{ id: `${rule.id}:${item.id}`, rule, item, issue }] : []
  }))
}

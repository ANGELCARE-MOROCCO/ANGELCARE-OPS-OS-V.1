import type { ContentDossier, ContentHeadquartersSnapshot, JsonRecord, PublicationPackage } from "@/lib/market-os/content-command-headquarters/types"

export type ImpactMetricKey = "impressions" | "views" | "engagements" | "clicks" | "downloads" | "leads" | "conversions" | "revenueDh"
export type ImpactTone = "neutral" | "info" | "success" | "warning" | "danger" | "authority"

export type ImpactCase = {
  id: string
  package: PublicationPackage
  dossier: ContentDossier | null
  evidence: JsonRecord[]
  manifest: JsonRecord | null
  proof: JsonRecord | null
  verification: JsonRecord | null
  observations: JsonRecord[]
  observation: JsonRecord | null
  performanceConclusion: JsonRecord | null
  attribution: JsonRecord | null
  optimization: JsonRecord | null
  lesson: JsonRecord | null
  lessonGovernance: JsonRecord | null
  verified: boolean
  measurementState: "not_ready" | "awaiting_observation" | "observed" | "concluded" | "disputed"
  dominantAction: { label: string; href: string; detail: string }
}

export type ImpactModel = {
  cases: ImpactCase[]
  metrics: {
    verifiedPublications: number
    awaitingObservation: number
    observed: number
    conclusions: number
    attributed: number
    optimized: number
    acceptedLessons: number
    totalRevenueDh: number | null
  }
  provenance: Array<{ type: string; count: number }>
}

const record = (value: unknown): JsonRecord => value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {}
const records = (value: unknown): JsonRecord[] => Array.isArray(value) ? value.filter((item): item is JsonRecord => Boolean(item && typeof item === "object" && !Array.isArray(item))) : []
export const text = (value: unknown, fallback = "") => String(value ?? "").trim() || fallback
export const numberValue = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}
export const eventOf = (items: JsonRecord[], type: string) => [...items].reverse().find((item) => text(item.type) === type) || null
export const eventsOf = (items: JsonRecord[], type: string) => items.filter((item) => text(item.type) === type)
export const metricRecord = (observation: JsonRecord | null) => record(observation?.metrics)
export const metricValue = (observation: JsonRecord | null, key: ImpactMetricKey) => numberValue(metricRecord(observation)[key])

function actionFor(item: Omit<ImpactCase, "dominantAction">): ImpactCase["dominantAction"] {
  if (!item.verified) return { label: "Vérifier la publication", href: "/market-os/content-command-center/publishing", detail: "L’observation ne peut commencer qu’après une vérification externe persistée." }
  if (!item.observation) return { label: "Constituer l’observation", href: "/market-os/content-command-center/performance", detail: "Documenter la fenêtre, la provenance, les limites et les métriques réellement disponibles." }
  if (!item.performanceConclusion) return { label: "Rendre la conclusion", href: "/market-os/content-command-center/performance", detail: "La mesure existe, mais aucune conclusion humaine de suffisance n’est encore enregistrée." }
  if (text(item.performanceConclusion.conclusion) !== "sufficient") return { label: "Résoudre la suffisance", href: "/market-os/content-command-center/performance", detail: "La fenêtre doit être étendue, contestée ou complétée avant toute attribution." }
  if (!item.attribution) return { label: "Examiner l’attribution", href: "/market-os/content-command-center/attribution", detail: "Relier l’issue observée au contenu sans confondre corrélation et causalité." }
  if (!item.optimization) return { label: "Décider l’optimisation", href: "/market-os/content-command-center/optimization", detail: "Transformer le résultat et ses limites en prochaine action gouvernée." }
  if (!item.lesson) return { label: "Constituer la leçon", href: "/market-os/content-command-center/learning", detail: "Formaliser l’apprentissage, son applicabilité et ses limites." }
  if (!item.lessonGovernance || !["accepted", "accepted_with_limitations"].includes(text(item.lessonGovernance.decision))) return { label: "Gouverner la leçon", href: "/market-os/content-command-center/learning", detail: "Une leçon en brouillon ne devient pas doctrine sans décision humaine." }
  return { label: "Inspecter la mémoire", href: "/market-os/content-command-center/directory", detail: "La chaîne impact, attribution, optimisation et apprentissage est institutionnellement constituée." }
}

export function buildImpactModel(snapshot: ContentHeadquartersSnapshot | null): ImpactModel {
  const dossiers = snapshot?.dossiers || []
  const packages = snapshot?.publicationPackages || []
  const cases = packages.map((pkg): ImpactCase => {
    const evidence = records(pkg.evidence)
    const manifest = eventOf(evidence, "release_manifest")
    const proof = eventOf(evidence, "publication_proof")
    const verification = eventOf(evidence, "publication_verification")
    const observations = eventsOf(evidence, "performance_observation")
    const observation = observations.at(-1) || null
    const performanceConclusion = eventOf(evidence, "performance_conclusion")
    const attribution = eventOf(evidence, "attribution_conclusion")
    const optimization = eventOf(evidence, "optimization_decision")
    const lesson = eventOf(evidence, "institutional_lesson")
    const lessonGovernance = eventOf(evidence, "lesson_governance")
    const verified = pkg.status === "verified" && text(verification?.conclusion) === "verified"
    const measurementState: ImpactCase["measurementState"] = !verified ? "not_ready" : !observation ? "awaiting_observation" : !performanceConclusion ? "observed" : ["disputed", "insufficient"].includes(text(performanceConclusion.conclusion)) ? "disputed" : "concluded"
    const base = {
      id: pkg.id,
      package: pkg,
      dossier: dossiers.find((item) => item.id === pkg.dossier_id) || null,
      evidence,
      manifest,
      proof,
      verification,
      observations,
      observation,
      performanceConclusion,
      attribution,
      optimization,
      lesson,
      lessonGovernance,
      verified,
      measurementState,
    }
    return { ...base, dominantAction: actionFor(base) }
  }).sort((a, b) => new Date(b.package.updated_at).getTime() - new Date(a.package.updated_at).getTime())

  const provenanceMap = new Map<string, number>()
  for (const item of cases) {
    if (!item.observation) continue
    const key = text(item.observation.provenanceType, "unavailable")
    provenanceMap.set(key, (provenanceMap.get(key) || 0) + 1)
  }
  const revenueCases = cases.filter((item) => item.attribution && ["direct", "assisted"].includes(text(item.attribution.conclusion)))
  const totalRevenueDh = revenueCases.length ? revenueCases.reduce((sum, item) => sum + numberValue(item.attribution?.attributedRevenueDh), 0) : null
  return {
    cases,
    metrics: {
      verifiedPublications: cases.filter((item) => item.verified).length,
      awaitingObservation: cases.filter((item) => item.measurementState === "awaiting_observation").length,
      observed: cases.filter((item) => Boolean(item.observation)).length,
      conclusions: cases.filter((item) => Boolean(item.performanceConclusion)).length,
      attributed: cases.filter((item) => Boolean(item.attribution)).length,
      optimized: cases.filter((item) => Boolean(item.optimization)).length,
      acceptedLessons: cases.filter((item) => ["accepted", "accepted_with_limitations"].includes(text(item.lessonGovernance?.decision))).length,
      totalRevenueDh,
    },
    provenance: [...provenanceMap.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count),
  }
}

export function caseTone(item: ImpactCase): ImpactTone {
  if (!item.verified) return "neutral"
  if (item.measurementState === "disputed") return "danger"
  if (item.lessonGovernance && ["accepted", "accepted_with_limitations"].includes(text(item.lessonGovernance.decision))) return "success"
  if (item.optimization || item.attribution) return "authority"
  if (item.observation) return "info"
  return "warning"
}

export function formatDh(value: number | null | undefined) {
  if (value === null || value === undefined) return "Non établi"
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value)} Dh`
}

export function formatImpactDate(value: unknown, includeTime = false) {
  const raw = text(value)
  if (!raw) return "—"
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw
  return new Intl.DateTimeFormat("fr-FR", includeTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }).format(date)
}

export function readable(value: unknown) {
  const labels: Record<string, string> = {
    provider: "Provider réel",
    internal_event: "Événement interne",
    crm_linked: "Issue reliée au CRM",
    imported: "Donnée importée",
    manual: "Déclaration manuelle",
    customer_declared: "Source déclarée par le client",
    sufficient: "Mesure suffisante",
    insufficient: "Mesure insuffisante",
    disputed: "Conclusion contestée",
    extend_observation: "Observation à prolonger",
    direct: "Attribution directe",
    assisted: "Attribution assistée",
    correlated: "Corrélation observée",
    unestablished: "Attribution non établie",
    accepted: "Leçon acceptée",
    accepted_with_limitations: "Acceptée avec limites",
    improve_copy: "Améliorer le copy",
    replace_cta: "Remplacer le CTA",
    change_channel: "Changer de canal",
    change_timing: "Changer la fenêtre",
    change_audience: "Changer l’audience",
    localize: "Localiser",
    adapt_format: "Adapter le format",
    new_variant: "Créer une variante",
    repurpose: "Réemployer",
    rerun: "Relancer",
    return_strategy: "Retour à la stratégie",
    return_brief: "Retour au brief",
    create_mission: "Créer une mission",
  }
  const key = text(value)
  return labels[key] || key.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Non établi"
}

import type {
  BrandRule,
  ContentAsset,
  ContentItem,
  ContentStore,
} from "@/components/market-os/content-command/content-command-system"

export type ProductionTone = "neutral" | "success" | "warning" | "danger" | "info" | "violet"

export const STUDIO_DEFINITIONS = [
  {
    id: "digital",
    code: "STUDIO 01",
    label: "Digital Studio",
    description: "Social, web, email, WhatsApp, publicité et vidéo.",
    outputs: ["Publication sociale", "Carousel", "Story / Reel", "Email créatif", "Landing page", "Campagne digitale"],
    checkpoints: ["Direction", "Copy + visuel", "Adaptations", "Preuve finale"],
  },
  {
    id: "print_offline",
    code: "STUDIO 02",
    label: "Print & Field Studio",
    description: "Flyers, brochures, signalétique, événements et supports terrain.",
    outputs: ["Flyer", "Brochure", "Affiche", "Roll-up", "Signalétique", "Kit terrain"],
    checkpoints: ["Format", "Mise en page", "Bon à tirer", "Preuve production"],
  },
  {
    id: "corporate_document",
    code: "STUDIO 03",
    label: "Corporate Documentation Studio",
    description: "Rapports, propositions, SOP, manuels et présentations institutionnelles.",
    outputs: ["Rapport", "Proposition", "Présentation", "SOP", "Manuel", "Dossier institutionnel"],
    checkpoints: ["Architecture", "Contenu", "Mise en forme", "Version autorisée"],
  },
] as const

export function missingContentConstitution(item: ContentItem) {
  return [
    !item.title.trim() ? "Titre" : "",
    !item.objective.trim() ? "Objectif" : "",
    !item.audience.trim() ? "Audience" : "",
    !item.body.trim() ? "Contenu / sortie requise" : "",
    !item.owner.trim() ? "Responsable" : "",
    !item.reviewer.trim() ? "Reviewer" : "",
    !item.dueDate ? "Échéance" : "",
  ].filter(Boolean)
}

export function getAssetTruth(asset: ContentAsset, item?: ContentItem) {
  const missing: string[] = []
  if (!asset.owner.trim()) missing.push("Responsable")
  if (!asset.linkedContentId || !item) missing.push("Dossier lié")
  if (!asset.url.trim()) missing.push("Source ou référence")
  const approved = asset.status === "approved"
  const active = approved && missing.length === 0
  const risk: ProductionTone = asset.status === "needs revision" || !item
    ? "danger"
    : missing.length
      ? "warning"
      : approved
        ? "success"
        : "neutral"
  return { missing, approved, active, risk }
}

export function getAssetCounts(store: ContentStore) {
  return {
    total: store.assets.length,
    draft: store.assets.filter((asset) => asset.status === "draft").length,
    approved: store.assets.filter((asset) => asset.status === "approved").length,
    revision: store.assets.filter((asset) => asset.status === "needs revision").length,
    archived: store.assets.filter((asset) => asset.status === "archived").length,
    missingSource: store.assets.filter((asset) => !asset.url.trim()).length,
    unlinked: store.assets.filter((asset) => !asset.linkedContentId || !store.items.some((item) => item.id === asset.linkedContentId)).length,
  }
}

export function getReviewCriteria(item: ContentItem, assets: ContentAsset[], rules: BrandRule[]) {
  const linkedAssets = assets.filter((asset) => asset.linkedContentId === item.id)
  const requiredRules = rules.filter((rule) => rule.active && rule.required)
  return [
    { key: "brief", label: "Brief et objectif", pass: Boolean(item.objective.trim() && item.audience.trim()), detail: item.objective || "Objectif incomplet" },
    { key: "scope", label: "Sortie et périmètre", pass: item.body.trim().length >= 80, detail: item.body.trim().length >= 80 ? "Contenu suffisamment documenté" : "Contenu ou sortie insuffisamment documenté" },
    { key: "brand", label: "Gouvernance de marque", pass: item.brandScore >= 70 && requiredRules.length > 0, detail: `${item.brandScore}% · ${requiredRules.length} règle(s) obligatoire(s) active(s)` },
    { key: "asset", label: "Asset de production", pass: linkedAssets.some((asset) => asset.status === "approved"), detail: `${linkedAssets.length} asset(s), ${linkedAssets.filter((asset) => asset.status === "approved").length} approuvé(s)` },
    { key: "source", label: "Source / référence", pass: linkedAssets.some((asset) => Boolean(asset.url.trim())), detail: linkedAssets.some((asset) => asset.url.trim()) ? "Référence enregistrée" : "Aucune source ou référence enregistrée" },
    { key: "ownership", label: "Responsabilités", pass: Boolean(item.owner.trim() && item.reviewer.trim()), detail: `${item.owner || "Owner absent"} · ${item.reviewer || "Reviewer absent"}` },
  ]
}

export function getReviewReadiness(item: ContentItem, assets: ContentAsset[], rules: BrandRule[]) {
  const criteria = getReviewCriteria(item, assets, rules)
  const passed = criteria.filter((criterion) => criterion.pass).length
  return {
    criteria,
    passed,
    total: criteria.length,
    ready: passed === criteria.length,
    percent: Math.round((passed / Math.max(1, criteria.length)) * 100),
  }
}

export function productionStatusTone(value: string): ProductionTone {
  const status = value.toLowerCase()
  if (["approved", "active", "accepted", "published", "ready", "used"].some((token) => status.includes(token))) return "success"
  if (["revision", "rejected", "blocked", "archived", "expired"].some((token) => status.includes(token))) return "danger"
  if (["review", "draft", "submitted", "checkpoint", "idea"].some((token) => status.includes(token))) return "warning"
  return "neutral"
}

export function formatProductionDate(value: string | null | undefined, includeTime = false) {
  if (!value) return "Non renseigné"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("fr-FR", includeTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }).format(date)
}

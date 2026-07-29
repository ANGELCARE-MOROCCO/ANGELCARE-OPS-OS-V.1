import type { ContentDossier, JsonRecord, PublicationPackage } from "@/lib/market-os/content-command-headquarters/types"

export type Bulk6ExecutionMode = "manual" | "provider" | "print" | "internal" | "unsupported" | "legacy"
export type Bulk6VerificationState = "not_required" | "proof_missing" | "awaiting_verification" | "verified" | "verification_failed"

export type Bulk6ReleaseManifest = {
  type: "release_manifest"
  version: 1
  copy: string
  cta: string
  audience: string
  geography: string
  language: string
  trackingReference: string
  executionMode: Bulk6ExecutionMode
  proofExpectation: string
  releaseNote: string
  canonicalSourceId: string
  canonicalSourceVersion: number | null
  canonicalSourceHash: string
  declaredAt: string
  declaredBy?: string
}

export type Bulk6PublicationProof = {
  type: "publication_proof"
  executionMode: Bulk6ExecutionMode
  externalReference: string
  note: string
  executedAt: string
  executedBy?: string
  versionIdentity?: string
  renditionIdentity?: string
}

export type Bulk6VerificationRecord = {
  type: "publication_verification"
  conclusion: "verified" | "failed"
  reason: string
  checkedAt: string
  checkedBy?: string
  externalReference: string
}

export type Bulk6FailureRecord = {
  type: "publication_failure"
  failureClass: string
  impact: string
  recoveryOwner: string
  recoveryAction: string
  detectedAt: string
  detectedBy?: string
}

function object(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {}
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function number(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function evidenceArray(pkg: PublicationPackage): JsonRecord[] {
  return Array.isArray(pkg.evidence) ? pkg.evidence.map(object) : []
}

export function releaseManifest(pkg: PublicationPackage): Bulk6ReleaseManifest | null {
  const match = evidenceArray(pkg).find((item) => text(item.type) === "release_manifest")
  if (!match) return null
  return {
    type: "release_manifest",
    version: 1,
    copy: text(match.copy),
    cta: text(match.cta),
    audience: text(match.audience),
    geography: text(match.geography),
    language: text(match.language) || "fr",
    trackingReference: text(match.trackingReference),
    executionMode: normalizeExecutionMode(match.executionMode),
    proofExpectation: text(match.proofExpectation),
    releaseNote: text(match.releaseNote),
    canonicalSourceId: text(match.canonicalSourceId),
    canonicalSourceVersion: number(match.canonicalSourceVersion) || null,
    canonicalSourceHash: text(match.canonicalSourceHash),
    declaredAt: text(match.declaredAt),
    declaredBy: text(match.declaredBy) || undefined,
  }
}

export function publicationProof(pkg: PublicationPackage): Bulk6PublicationProof | null {
  const match = [...evidenceArray(pkg)].reverse().find((item) => text(item.type) === "publication_proof" || text(item.type) === "manual_publication_proof")
  if (!match) return null
  return {
    type: "publication_proof",
    executionMode: normalizeExecutionMode(match.executionMode || "manual"),
    externalReference: text(match.externalReference) || text(pkg.external_reference),
    note: text(match.note),
    executedAt: text(match.executedAt) || text(match.recordedAt) || text(pkg.published_at),
    executedBy: text(match.executedBy) || undefined,
    versionIdentity: text(match.versionIdentity) || undefined,
    renditionIdentity: text(match.renditionIdentity) || undefined,
  }
}

export function verificationRecord(pkg: PublicationPackage): Bulk6VerificationRecord | null {
  const match = [...evidenceArray(pkg)].reverse().find((item) => text(item.type) === "publication_verification")
  if (!match) return null
  return {
    type: "publication_verification",
    conclusion: text(match.conclusion) === "verified" ? "verified" : "failed",
    reason: text(match.reason),
    checkedAt: text(match.checkedAt),
    checkedBy: text(match.checkedBy) || undefined,
    externalReference: text(match.externalReference) || text(pkg.external_reference),
  }
}

export function failureRecord(pkg: PublicationPackage): Bulk6FailureRecord | null {
  const match = [...evidenceArray(pkg)].reverse().find((item) => text(item.type) === "publication_failure")
  if (!match) return null
  return {
    type: "publication_failure",
    failureClass: text(match.failureClass),
    impact: text(match.impact),
    recoveryOwner: text(match.recoveryOwner),
    recoveryAction: text(match.recoveryAction),
    detectedAt: text(match.detectedAt),
    detectedBy: text(match.detectedBy) || undefined,
  }
}

export function verificationState(pkg: PublicationPackage): Bulk6VerificationState {
  const verification = verificationRecord(pkg)
  if (verification?.conclusion === "verified" || pkg.status === "verified") return "verified"
  if (verification?.conclusion === "failed" || pkg.status === "verification_failed") return "verification_failed"
  if (pkg.status === "published" && publicationProof(pkg)) return "awaiting_verification"
  if (pkg.status === "published") return "proof_missing"
  return "not_required"
}

export function normalizeExecutionMode(value: unknown): Bulk6ExecutionMode {
  const mode = text(value).toLowerCase()
  if (mode === "provider") return "provider"
  if (mode === "print") return "print"
  if (mode === "internal") return "internal"
  if (mode === "unsupported") return "unsupported"
  if (mode === "legacy") return "legacy"
  return "manual"
}

export function executionModeLabel(mode: Bulk6ExecutionMode) {
  if (mode === "provider") return "Provider réel"
  if (mode === "print") return "Handover print / physique"
  if (mode === "internal") return "Release interne"
  if (mode === "unsupported") return "Provider non supporté"
  if (mode === "legacy") return "Compatibilité legacy"
  return "Exécution manuelle"
}

export function statusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: "Package en construction",
    ready: "Prêt pour autorisation",
    scheduled: "Release autorisée et planifiée",
    publishing: "Exécution engagée",
    published: "Publication confirmée",
    verified: "Publication vérifiée",
    failed: "Publication échouée",
    blocked: "Release bloquée",
    verification_failed: "Vérification échouée",
    withdrawn: "Publication retirée",
    superseded: "Publication supersédée",
    cancelled: "Package annulé",
  }
  return labels[status] || status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function requiredRenditions(pkg: PublicationPackage) {
  return (Array.isArray(pkg.required_renditions) ? pkg.required_renditions : []).map((raw, index) => {
    const item = object(raw)
    return {
      id: text(item.id) || `${pkg.id}-rendition-${index + 1}`,
      name: text(item.name) || `Rendition ${index + 1}`,
      required: item.required !== false,
      status: text(item.status) || "required",
      assetReference: text(item.assetReference),
      versionIdentity: text(item.versionIdentity),
    }
  })
}

export function packageReadiness(pkg: PublicationPackage, dossier?: ContentDossier | null) {
  const manifest = releaseManifest(pkg)
  const renditions = requiredRenditions(pkg)
  const required = renditions.filter((item) => item.required)
  const readyRequired = required.filter((item) => ["ready", "approved", "available"].includes(item.status))
  const gates = [
    Boolean(dossier && dossier.source_state === "secured"),
    Boolean(pkg.channel),
    Boolean(pkg.scheduled_at),
    Boolean(required.length && readyRequired.length === required.length),
    Boolean(manifest?.copy),
    Boolean(manifest?.cta || pkg.channel === "Internal Workspace" || pkg.channel === "Print"),
    Boolean(manifest?.audience),
    Boolean(manifest?.language),
    Boolean(manifest?.executionMode && manifest.executionMode !== "unsupported"),
    Boolean(manifest?.proofExpectation),
  ]
  return Math.round((gates.filter(Boolean).length / gates.length) * 100)
}

export function releaseBlockers(pkg: PublicationPackage, dossier?: ContentDossier | null) {
  const manifest = releaseManifest(pkg)
  const renditions = requiredRenditions(pkg)
  const blockers: string[] = []
  if (!dossier) blockers.push("Dossier source non exposé")
  if (dossier && dossier.source_state !== "secured") blockers.push("Source canonique non sécurisée")
  if (!pkg.channel) blockers.push("Canal absent")
  if (!pkg.scheduled_at) blockers.push("Horaire de release absent")
  if (!renditions.length) blockers.push("Aucune rendition déclarée")
  if (renditions.some((item) => item.required && !["ready", "approved", "available"].includes(item.status))) blockers.push("Rendition requise non prête")
  if (!manifest) blockers.push("Constitution de package absente")
  if (manifest && !manifest.copy) blockers.push("Copy canal absent")
  if (manifest && !manifest.audience) blockers.push("Audience non confirmée")
  if (manifest && !manifest.language) blockers.push("Langue non confirmée")
  if (manifest && manifest.executionMode === "unsupported") blockers.push("Provider déclaré non supporté")
  if (manifest && !manifest.proofExpectation) blockers.push("Preuve de publication attendue non définie")
  return blockers
}

export function deterministicCollisions(packages: PublicationPackage[]) {
  const groups = new Map<string, PublicationPackage[]>()
  for (const pkg of packages) {
    if (!pkg.scheduled_at) continue
    const date = new Date(pkg.scheduled_at)
    if (Number.isNaN(date.getTime())) continue
    const minuteBucket = date.toISOString().slice(0, 16)
    const key = `${pkg.channel.toLowerCase()}::${minuteBucket}`
    groups.set(key, [...(groups.get(key) || []), pkg])
  }
  return [...groups.entries()]
    .filter(([, values]) => values.length > 1)
    .map(([key, values]) => ({ key, channel: values[0]?.channel || "", scheduledAt: values[0]?.scheduled_at || "", packages: values }))
}

export function packageDominantAction(pkg: PublicationPackage, dossier?: ContentDossier | null) {
  const blockers = releaseBlockers(pkg, dossier)
  if (pkg.status === "draft" && blockers.length) return `Résoudre: ${blockers[0]}`
  if (pkg.status === "draft") return "Déclarer le package prêt"
  if (pkg.status === "ready") return "Autoriser la release"
  if (pkg.status === "scheduled") return "Exécuter la publication"
  if (pkg.status === "published" && verificationState(pkg) === "proof_missing") return "Joindre la preuve externe"
  if (pkg.status === "published") return "Vérifier la publication"
  if (["failed", "blocked", "verification_failed"].includes(pkg.status)) return "Ouvrir la récupération"
  if (pkg.status === "verified") return "Clôturer le handover"
  return "Inspecter le package"
}

export type KnowledgeTone = "success" | "warning" | "danger" | "info" | "neutral"

export type AtlasEntry = {
  id: string
  code: string
  title: string
  family: string
  category: string
  subcategory: string
  service: string
  audience: string
  city: string
  language: string
  channel: string
  campaign: string
  owner: string
  reviewer: string
  status: string
  createdAt: string
  updatedAt: string
  sourceId: string
  sourceName: string
  sourceVersion: number
  sourceIntegrity: string
  sourceHash: string
  sourceSize: number
  hasCurrentSource: boolean
  sourceHistoryCount: number
  taskCount: number
  assetCount: number
  evidenceCount: number
  reviewCount: number
  publicationCount: number
  classificationMissing: string[]
}

export type AtlasRisk = {
  id: string
  title: string
  detail: string
  tone: KnowledgeTone
  owner: string
  href: string
  category: string
}

export type ReuseCandidate = {
  id: string
  left: AtlasEntry
  right: AtlasEntry
  shared: string[]
}

export type DuplicateCandidate = {
  id: string
  left: AtlasEntry
  right: AtlasEntry
  basis: string[]
}

export type SourceEntry = {
  id: string
  dossierId: string
  contentCode: string
  contentTitle: string
  filename: string
  sizeBytes: number
  hash: string
  version: number
  integrity: string
  current: boolean
  createdAt: string
  owner: string
  rightsState: string
  retentionState: string
  storageState: string
}

export type AtlasModel = {
  entries: AtlasEntry[]
  risks: AtlasRisk[]
  reuse: ReuseCandidate[]
  duplicates: DuplicateCandidate[]
  sources: SourceEntry[]
  sourceVersions: Map<string, SourceEntry[]>
  metrics: {
    total: number
    classified: number
    unclassified: number
    missingOwner: number
    missingSource: number
    verifiedSources: number
    historicalSources: number
    reuseCandidates: number
    duplicateCandidates: number
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function text(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return ""
}

function number(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value)
  }
  return 0
}

function bool(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "boolean") return value
    if (value === 1 || value === "1" || value === "true") return true
  }
  return false
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function countByDossier(collection: unknown[], dossierId: string) {
  return collection.filter((item) => text(asRecord(item), "dossier_id", "dossierId") === dossierId).length
}

function sourceFromRecord(sourceValue: unknown, dossierById: Map<string, Record<string, unknown>>): SourceEntry {
  const source = asRecord(sourceValue)
  const dossierId = text(source, "dossier_id", "dossierId")
  const dossier = dossierById.get(dossierId) || {}
  const rights = text(source, "rights_state", "rights_status", "rights")
  const retention = text(source, "retention_state", "retention_class", "retention")
  const storage = text(source, "storage_state", "storage_status", "bridge_status")
  return {
    id: text(source, "id") || `${dossierId}-${number(source, "source_version", "version")}`,
    dossierId,
    contentCode: text(source, "content_code") || text(dossier, "content_code", "code"),
    contentTitle: text(dossier, "title", "name") || "Contenu sans titre",
    filename: text(source, "original_filename", "filename", "name") || "Fichier non renseigné",
    sizeBytes: number(source, "size_bytes", "sizeBytes", "size"),
    hash: text(source, "sha256_hash", "hash", "checksum"),
    version: number(source, "source_version", "version") || 1,
    integrity: text(source, "integrity_state", "integrity", "status") || "not_verified",
    current: bool(source, "is_current", "current"),
    createdAt: text(source, "created_at", "createdAt", "uploaded_at"),
    owner: text(source, "owner_name", "created_by_name", "uploaded_by_name") || text(dossier, "owner_name", "owner") || "Responsable non documenté",
    rightsState: rights || "not_documented",
    retentionState: retention || "not_documented",
    storageState: storage || "not_exposed",
  }
}

export function buildAtlasModel(snapshotValue: unknown): AtlasModel {
  const snapshot = asRecord(snapshotValue)
  const dossiers = asArray(snapshot.dossiers)
  const tasks = asArray(snapshot.tasks)
  const assets = asArray(snapshot.assets)
  const evidence = asArray(snapshot.evidence)
  const reviews = asArray(snapshot.reviews)
  const publications = asArray(snapshot.publications)
  const rawSources = asArray(snapshot.sources)
  const dossierById = new Map<string, Record<string, unknown>>()
  dossiers.forEach((value) => {
    const dossier = asRecord(value)
    const id = text(dossier, "id")
    if (id) dossierById.set(id, dossier)
  })
  const sources = rawSources.map((source) => sourceFromRecord(source, dossierById))
  const sourceVersions = new Map<string, SourceEntry[]>()
  sources.forEach((source) => {
    const list = sourceVersions.get(source.dossierId) || []
    list.push(source)
    sourceVersions.set(source.dossierId, list)
  })
  sourceVersions.forEach((list) => list.sort((a, b) => b.version - a.version))
  const currentSources = new Map<string, SourceEntry>()
  sources.filter((source) => source.current).forEach((source) => currentSources.set(source.dossierId, source))

  const entries: AtlasEntry[] = dossiers.map((value) => {
    const dossier = asRecord(value)
    const id = text(dossier, "id")
    const currentSource = currentSources.get(id)
    const family = text(dossier, "family")
    const category = text(dossier, "category")
    const subcategory = text(dossier, "subcategory")
    const service = text(dossier, "service_label", "service")
    const audience = text(dossier, "audience")
    const city = text(dossier, "city")
    const language = text(dossier, "language")
    const channel = text(dossier, "channel")
    const owner = text(dossier, "owner_name", "owner")
    const classificationMissing = [
      ["famille", family], ["catégorie", category], ["sous-catégorie", subcategory],
      ["service", service], ["audience", audience], ["ville", city], ["langue", language], ["canal", channel],
    ].filter(([, value]) => !value).map(([label]) => label)
    return {
      id,
      code: text(dossier, "content_code", "code") || id,
      title: text(dossier, "title", "name") || "Contenu sans titre",
      family,
      category,
      subcategory,
      service,
      audience,
      city,
      language,
      channel,
      campaign: text(dossier, "campaign_label", "campaign"),
      owner: owner || "Non assigné",
      reviewer: text(dossier, "reviewer_name", "reviewer") || "Réviseur non nommé",
      status: text(dossier, "status") || "unknown",
      createdAt: text(dossier, "created_at", "createdAt"),
      updatedAt: text(dossier, "updated_at", "updatedAt"),
      sourceId: currentSource?.id || "",
      sourceName: currentSource?.filename || "",
      sourceVersion: currentSource?.version || 0,
      sourceIntegrity: currentSource?.integrity || "missing",
      sourceHash: currentSource?.hash || "",
      sourceSize: currentSource?.sizeBytes || 0,
      hasCurrentSource: Boolean(currentSource),
      sourceHistoryCount: sourceVersions.get(id)?.filter((source) => !source.current).length || 0,
      taskCount: countByDossier(tasks, id),
      assetCount: countByDossier(assets, id),
      evidenceCount: countByDossier(evidence, id),
      reviewCount: countByDossier(reviews, id),
      publicationCount: countByDossier(publications, id),
      classificationMissing,
    }
  })

  const risks: AtlasRisk[] = []
  entries.forEach((entry) => {
    const href = `/market-os/content-command-center/dossiers/${entry.id}`
    if (!entry.owner || entry.owner === "Non assigné") risks.push({ id: `${entry.id}-owner`, title: "Responsable absent", detail: `${entry.code} · ${entry.title}`, tone: "danger", owner: "Direction Content", href, category: "ownership" })
    if (entry.classificationMissing.length) risks.push({ id: `${entry.id}-class`, title: "Classification incomplète", detail: `${entry.classificationMissing.join(", ")} · ${entry.code}`, tone: "warning", owner: entry.owner, href, category: "classification" })
    if (!entry.hasCurrentSource) risks.push({ id: `${entry.id}-source`, title: "Source canonique manquante", detail: `${entry.code} · ${entry.title}`, tone: "danger", owner: entry.owner, href: "/market-os/content-command-center/source-vault", category: "source" })
    else if (normalize(entry.sourceIntegrity) !== "verified") risks.push({ id: `${entry.id}-integrity`, title: "Intégrité à vérifier", detail: `${entry.code} · ${entry.sourceName}`, tone: "warning", owner: entry.owner, href: "/market-os/content-command-center/source-vault", category: "integrity" })
  })

  const reuse: ReuseCandidate[] = []
  const duplicates: DuplicateCandidate[] = []
  for (let i = 0; i < entries.length; i += 1) {
    for (let j = i + 1; j < entries.length; j += 1) {
      const left = entries[i]
      const right = entries[j]
      const shared = [
        ["Même famille", left.family && left.family === right.family],
        ["Même catégorie", left.category && left.category === right.category],
        ["Même service", left.service && left.service === right.service],
        ["Même audience", left.audience && left.audience === right.audience],
        ["Même canal", left.channel && left.channel === right.channel],
        ["Même langue", left.language && left.language === right.language],
        ["Même ville", left.city && left.city === right.city],
      ].filter(([, matches]) => Boolean(matches)).map(([label]) => String(label))
      if (shared.length >= 3) reuse.push({ id: `${left.id}-${right.id}`, left, right, shared })
      const basis: string[] = []
      if (normalize(left.title) && normalize(left.title) === normalize(right.title)) basis.push("Titre normalisé identique")
      if (left.sourceHash && right.sourceHash && left.sourceHash === right.sourceHash) basis.push("Empreinte source identique")
      if (left.code && left.code === right.code) basis.push("Code contenu identique")
      if (basis.length) duplicates.push({ id: `${left.id}-${right.id}`, left, right, basis })
    }
  }

  return {
    entries,
    risks,
    reuse: reuse.slice(0, 48),
    duplicates: duplicates.slice(0, 48),
    sources,
    sourceVersions,
    metrics: {
      total: entries.length,
      classified: entries.filter((entry) => !entry.classificationMissing.length).length,
      unclassified: entries.filter((entry) => entry.classificationMissing.length).length,
      missingOwner: entries.filter((entry) => entry.owner === "Non assigné").length,
      missingSource: entries.filter((entry) => !entry.hasCurrentSource).length,
      verifiedSources: entries.filter((entry) => normalize(entry.sourceIntegrity) === "verified").length,
      historicalSources: sources.filter((source) => !source.current).length,
      reuseCandidates: reuse.length,
      duplicateCandidates: duplicates.length,
    },
  }
}

export function knowledgeTone(value: string): KnowledgeTone {
  const normalized = normalize(value)
  if (["verified", "active", "published", "classified", "source secured"].some((token) => normalized.includes(token))) return "success"
  if (["missing", "failed", "corrupt", "rejected", "expired", "incident"].some((token) => normalized.includes(token))) return "danger"
  if (["not verified", "warning", "stale", "unknown", "not documented", "superseded"].some((token) => normalized.includes(token))) return "warning"
  if (["current", "canonical", "working"].some((token) => normalized.includes(token))) return "info"
  return "neutral"
}

export function readableStatus(value: string) {
  if (!value) return "Non renseigné"
  const normalized = value.replaceAll("_", " ")
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

export function formatBytes(value: number) {
  if (!value) return "Taille non renseignée"
  if (value < 1024) return `${value} o`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} Ko`
  if (value < 1024 * 1024 * 1024) return `${(value / 1024 / 1024).toFixed(2)} Mo`
  return `${(value / 1024 / 1024 / 1024).toFixed(2)} Go`
}

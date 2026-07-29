import type {
  Bulk5Dossier,
  Bulk5Evidence,
  Bulk5Review,
  Bulk5Snapshot,
  Finding,
  ProofCase,
  ReadinessGate,
  ReviewRubric,
} from "./bulk5-types"

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}
function array(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.map(record) : []
}
function text(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value : fallback
}
function numberValue(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : Number(value) || fallback
}
function dateValue(value: unknown): string { return text(value) }
function time(value: string | undefined): number {
  if (!value) return 0
  const n = new Date(value).getTime()
  return Number.isFinite(n) ? n : 0
}

export function normalizeSnapshot(value: unknown): Bulk5Snapshot {
  const root = record(value)
  const dossiers = array(root.dossiers).map((item): Bulk5Dossier => ({
    id: text(item.id), content_code: text(item.content_code), title: text(item.title, "Dossier sans titre"), status: text(item.status, "draft"),
    family: text(item.family), category: text(item.category), service_label: text(item.service_label), service: text(item.service), audience: text(item.audience), channel: text(item.channel), language: text(item.language), city: text(item.city),
    owner_name: text(item.owner_name || item.owner), reviewer_name: text(item.reviewer_name || item.reviewer), sponsor_name: text(item.sponsor_name || item.sponsor), source_state: text(item.source_state),
    progress: numberValue(item.progress), readiness: numberValue(item.readiness), due_at: dateValue(item.due_at), updated_at: dateValue(item.updated_at || item.created_at), campaign_label: text(item.campaign_label || item.campaign), brief_version: text(item.brief_version), mission_id: text(item.mission_id),
  })).filter((item) => item.id)
  const evidence = array(root.evidence).map((item): Bulk5Evidence => ({
    id: text(item.id), dossier_id: text(item.dossier_id), title: text(item.title || item.filename, "Preuve sans titre"), filename: text(item.filename), evidence_type: text(item.evidence_type), content_type: text(item.content_type), preview_url: text(item.preview_url), status: text(item.status, "submitted"), note: text(item.note), progress_percent: numberValue(item.progress_percent), created_at: dateValue(item.created_at), created_by: text(item.created_by), owner_name: text(item.owner_name || item.owner), metadata: record(item.metadata),
  })).filter((item) => item.id)
  const reviews = array(root.reviews).map((item): Bulk5Review => ({
    id: text(item.id), dossier_id: text(item.dossier_id), evidence_id: text(item.evidence_id), review_type: text(item.review_type, "human"), result: text(item.result, "pending"), summary: text(item.summary), score: numberValue(item.score), corrections: item.corrections, reviewer_name: text(item.reviewer_name || item.actor), authority_role: text(item.authority_role), created_at: dateValue(item.created_at),
  })).filter((item) => item.id)
  return {
    migrationReady: typeof root.migrationReady === "boolean" ? root.migrationReady : undefined,
    dossiers, evidence, reviews,
    tasks: array(root.tasks).map((item) => ({ id: text(item.id), dossier_id: text(item.dossier_id), mission_id: text(item.mission_id), title: text(item.title, "Tâche"), status: text(item.status, "todo"), owner_name: text(item.owner_name || item.owner), due_at: dateValue(item.due_at), blocker_reason: text(item.blocker_reason), completion_definition: text(item.completion_definition) })).filter((item) => item.id),
    missions: array(root.missions), sources: array(root.sources), publicationPackages: array(root.publicationPackages),
  }
}

function normalizeCorrections(value: unknown): Finding[] {
  const source = Array.isArray(value) ? value : typeof value === "string" ? value.split("\n") : []
  return source.map((item, index) => {
    const data = record(item)
    const instruction = typeof item === "string" ? item : text(data.instruction || data.description || data.text, "Correction à documenter")
    const severityValue = text(data.severity, instruction.toLowerCase().includes("bloqu") ? "blocking" : "material")
    const severity = ["advisory", "minor", "material", "major", "critical", "blocking"].includes(severityValue) ? severityValue as Finding["severity"] : "material"
    return { id: text(data.id, `finding-${index + 1}`), code: text(data.code, `F-${String(index + 1).padStart(2, "0")}`), criterion: text(data.criterion || data.category, "Critère de review"), instruction, severity, status: "unresolved" as const }
  }).filter((item) => item.instruction.trim())
}

export function buildProofCases(snapshot: Bulk5Snapshot): ProofCase[] {
  return snapshot.dossiers.map((dossier) => {
    const evidence = snapshot.evidence.filter((item) => item.dossier_id === dossier.id).sort((a, b) => time(b.created_at) - time(a.created_at))
    const reviews = snapshot.reviews.filter((item) => item.dossier_id === dossier.id).sort((a, b) => time(b.created_at) - time(a.created_at))
    const humanReviews = reviews.filter((item) => item.review_type !== "ai")
    const aiReviews = reviews.filter((item) => item.review_type === "ai")
    const latestHumanReview = humanReviews[0]
    const result = latestHumanReview?.result.toLowerCase() || ""
    const findings = humanReviews.flatMap((review) => normalizeCorrections(review.corrections))
    const proofState: ProofCase["proofState"] = !evidence.length ? "missing" : evidence.some((item) => ["rejected", "superseded"].includes((item.status || "").toLowerCase())) ? "incomplete" : latestHumanReview && ["approved", "pass"].includes(result) ? "sufficient" : latestHumanReview && ["revision", "blocked", "rejected"].includes(result) ? "insufficient" : "awaiting"
    const reviewState: ProofCase["reviewState"] = !humanReviews.length ? evidence.length ? "under_review" : "not_started" : ["approved", "pass"].includes(result) ? "accepted" : result === "blocked" ? "blocked" : "correction_required"
    const validationState: ProofCase["validationState"] = ["validated", "source_required", "source_secured", "classified", "ready_distribution"].includes(dossier.status) && ["approved", "pass"].includes(result) ? (findings.length ? "conditional" : "validated") : reviewState === "accepted" ? "ready" : result === "blocked" ? "rejected" : "not_ready"
    return { id: dossier.id, dossier, evidence, reviews, humanReviews, aiReviews, latestEvidence: evidence[0], latestHumanReview, latestAiReview: aiReviews[0], findings, reviewRound: Math.max(1, humanReviews.length), proofState, reviewState, validationState }
  }).filter((item) => ["checkpoint_review", "draft_submitted", "submitted", "ai_review", "human_review", "revision", "revision_required", "validated", "source_required", "source_secured", "classified", "ready_distribution"].includes(item.dossier.status) || item.evidence.length || item.reviews.length)
}

export function proofCaseTone(value: string): "neutral" | "info" | "success" | "warning" | "danger" | "violet" {
  const v = value.toLowerCase()
  if (["validated", "sufficient", "accepted", "ready", "approved", "pass"].some((x) => v.includes(x))) return "success"
  if (["blocked", "rejected", "insufficient", "critical", "missing"].some((x) => v.includes(x))) return "danger"
  if (["awaiting", "revision", "incomplete", "under_review", "not_ready"].some((x) => v.includes(x))) return "warning"
  if (["ai", "submitted"].some((x) => v.includes(x))) return "info"
  return "neutral"
}

export function validationGates(item: ProofCase): ReadinessGate[] {
  const sourceSecured = item.dossier.source_state === "secured"
  const correctVersion = Boolean(item.latestEvidence?.id)
  const evidenceReady = item.proofState === "sufficient" || item.reviewState === "accepted"
  const reviewAccepted = item.reviewState === "accepted"
  const authority = Boolean(item.dossier.reviewer_name)
  const scopeReady = Number(item.dossier.progress || 0) >= 90
  return [
    { id: "scope", label: "Périmètre de production", detail: scopeReady ? `Progression observée ${item.dossier.progress}%` : `Progression observée ${item.dossier.progress || 0}% — dossier incomplet`, passed: scopeReady, blocking: true },
    { id: "version", label: "Version contrôlée", detail: correctVersion ? item.latestEvidence?.filename || item.latestEvidence?.title || "Preuve identifiée" : "Aucune version probante liée", passed: correctVersion, blocking: true },
    { id: "evidence", label: "Preuve suffisante", detail: evidenceReady ? "La review humaine soutient la suffisance" : "Preuve à inspecter ou insuffisante", passed: evidenceReady, blocking: true },
    { id: "review", label: "Review humaine acceptée", detail: item.latestHumanReview?.summary || "Aucune conclusion humaine", passed: reviewAccepted, blocking: true },
    { id: "authority", label: "Autorité affectée", detail: item.dossier.reviewer_name || "Validateur non affecté", passed: authority, blocking: true },
    { id: "source", label: "Source canonique", detail: sourceSecured ? "Source signalée sécurisée" : "Source Gate restant après décision", passed: sourceSecured, blocking: false },
  ]
}

const C = (code: string, title: string, purpose: string, severity: ReviewRubric["criteria"][number]["severity"], blocking: boolean, evidence: string) => ({ code, title, purpose, severity, blocking, evidence })
export const REVIEW_RUBRICS: ReviewRubric[] = [
  { code: "RUB-DIG-01", name: "Digital Campaign Quality", family: "Digital", version: "1.0", authority: "Brand & Content Review", status: "active", appliesTo: ["digital", "social", "campaign", "story", "carousel"], criteria: [C("DIG-STR", "Alignement stratégique", "Le message traduit le brief approuvé.", "major", true, "Brief et version"), C("DIG-MSG", "Exactitude du message", "L’offre, le service et le CTA sont cohérents.", "major", true, "Copy finale"), C("DIG-VAR", "Complétude des variantes", "Chaque format requis possède sa version.", "material", true, "Variant matrix"), C("DIG-BRD", "Conformité de marque", "Logo, ton et doctrine applicables.", "major", true, "Brand preflight"), C("DIG-ACC", "Lisibilité et accessibilité", "Lecture mobile et alternative textuelle.", "material", false, "Capture mobile") ] },
  { code: "RUB-PRT-01", name: "Print & Field Prepress", family: "Print", version: "1.0", authority: "Production & Brand Review", status: "active", appliesTo: ["print", "flyer", "brochure", "poster", "field"], criteria: [C("PRT-DIM", "Dimensions physiques", "Format, orientation et quantité sont identifiés.", "major", true, "Specification sheet"), C("PRT-SAFE", "Fond perdu et zones sûres", "Le BAT permet de contrôler trim et safe area.", "critical", true, "BAT"), C("PRT-CTA", "Utilisabilité terrain", "Contact, QR et lecture à distance sont utilisables.", "material", true, "Proof terrain"), C("PRT-SRC", "Source et production", "La source éditable et la version finale sont liées.", "major", true, "Source link") ] },
  { code: "RUB-DOC-01", name: "Corporate Documentation Authority", family: "Document", version: "1.0", authority: "Corporate Documentation Review", status: "active", appliesTo: ["document", "report", "sop", "policy", "manual"], criteria: [C("DOC-ARC", "Architecture documentaire", "Les sections obligatoires sont présentes.", "major", true, "Outline"), C("DOC-AUT", "Autorité et contrôle", "Owner, reviewer, approver et version sont identifiés.", "critical", true, "Control box"), C("DOC-PAG", "Pagination", "Aucune rupture critique n’est signalée.", "material", true, "Print preview"), C("DOC-FOO", "Footer institutionnel", "Le footer et le code documentaire sont exacts.", "major", true, "Page proof") ] },
  { code: "RUB-COB-01", name: "Partner Co-Brand Control", family: "Co-brand", version: "1.0", authority: "Partnership Brand Authority", status: "active", appliesTo: ["partner", "co-brand", "hotel", "school"], criteria: [C("COB-LOG", "Hiérarchie des logos", "La priorité AngelCare et la place partenaire sont conformes.", "major", true, "Co-brand proof"), C("COB-AUT", "Autorisation partenaire", "L’autorité de co-branding est documentée.", "critical", true, "Approval evidence"), C("COB-EXP", "Validité", "La durée et les restrictions d’usage sont visibles.", "material", true, "Rights evidence") ] },
  { code: "RUB-CHD-01", name: "Child-facing Safeguarding", family: "Child-facing", version: "1.0", authority: "Safeguarding Review", status: "active", appliesTo: ["child", "children", "kids", "montessori"], criteria: [C("CHD-IMG", "Représentation de l’enfant", "L’image respecte la doctrine et les consentements.", "blocking", true, "Consent or rights"), C("CHD-LNG", "Langage protecteur", "Le message évite toute promesse ou exposition inappropriée.", "critical", true, "Copy review"), C("CHD-CTA", "CTA responsable", "L’appel à l’action s’adresse à l’adulte responsable.", "major", true, "Final copy") ] },
  { code: "RUB-PAR-01", name: "Parent Reassurance", family: "Parent-facing", version: "1.0", authority: "Parent Experience Review", status: "active", appliesTo: ["parent", "family", "home service", "postpartum"], criteria: [C("PAR-TRU", "Réassurance vérifiable", "Les preuves soutiennent les promesses.", "major", true, "Proof points"), C("PAR-CLY", "Clarté du service", "Périmètre, conditions et CTA sont compréhensibles.", "material", true, "Final output"), C("PAR-TON", "Ton AngelCare", "Le ton est premium, humain et responsable.", "minor", false, "Brand review") ] },
  { code: "RUB-REC-01", name: "Recruitment Communication", family: "Recruitment", version: "1.0", authority: "HR & Brand Review", status: "active", appliesTo: ["recruitment", "stage", "internship", "job"], criteria: [C("REC-ROL", "Exactitude du poste", "Missions, qualités et conditions sont exactes.", "major", true, "HR-approved brief"), C("REC-CTA", "Canal de candidature", "Contact, email et poste à préciser sont visibles.", "major", true, "Final proof"), C("REC-EQU", "Présentation équitable", "Aucune formulation discriminatoire non autorisée.", "critical", true, "Copy review") ] },
  { code: "RUB-INS-01", name: "Institutional Communication", family: "Institutional", version: "1.0", authority: "Executive Communications", status: "active", appliesTo: ["institutional", "executive", "certificate", "memorandum"], criteria: [C("INS-AUT", "Autorité institutionnelle", "Les rôles, dates et identités sont corrects.", "critical", true, "Authority metadata"), C("INS-VER", "Version officielle", "La version contrôlée est explicitement identifiée.", "critical", true, "Version evidence"), C("INS-FOO", "Coordonnées et footer", "Le footer approuvé est intact.", "major", true, "Page proof") ] },
  { code: "RUB-CLM-01", name: "High-sensitivity Claims", family: "Sensitive claims", version: "1.0", authority: "Executive & Safeguarding Review", status: "active", appliesTo: ["medical", "special needs", "guarantee", "safety", "claim"], criteria: [C("CLM-SRC", "Fondement de la revendication", "Chaque claim possède une source autorisée.", "blocking", true, "Source evidence"), C("CLM-LIM", "Limites et conditions", "Les limites sont visibles et non trompeuses.", "critical", true, "Copy and disclaimer"), C("CLM-AUT", "Autorité spécialisée", "L’opinion requise est enregistrée.", "blocking", true, "Specialist opinion") ] },
  { code: "RUB-PUB-01", name: "Publication Package Readiness", family: "Release", version: "1.0", authority: "Publishing Operations", status: "active", appliesTo: ["publication", "distribution", "package"], criteria: [C("PUB-VER", "Version autorisée", "Le package utilise la version validée.", "blocking", true, "Validation certificate"), C("PUB-CHA", "Canal et adaptation", "Le canal, le format et la copy correspondent.", "major", true, "Package preview"), C("PUB-TRK", "Tracking et preuve", "Le tracking et la preuve de publication sont définis.", "material", true, "Release checklist") ] },
]

export function rubricFor(item: ProofCase): ReviewRubric {
  const haystack = [item.dossier.family, item.dossier.category, item.dossier.channel, item.dossier.audience, item.dossier.service_label, item.dossier.title].filter(Boolean).join(" ").toLowerCase()
  return REVIEW_RUBRICS.find((rubric) => rubric.appliesTo.some((token) => haystack.includes(token.toLowerCase()))) || REVIEW_RUBRICS[0]
}

"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  FileCheck2,
  FileSignature,
  FileText,
  Languages,
  LayoutList,
  ListChecks,
  Maximize2,
  PanelTop,
  Rows3,
  Save,
  ShieldCheck,
  Table2,
  TextQuote,
} from "lucide-react"
import { useContentStore } from "../content-command-system"
import { templatesByFamily, templateById } from "./bulk4-template-estate"
import { contextFromLocation, writeBulk4Context } from "./bulk4-context"
import { useBulk4Registry } from "./bulk4-api"
import type { CreativeDocumentRecord, PreflightCheck } from "./bulk4-types"
import { Bulk4BrandCrown, Bulk4TruthState, DominantAction, PreflightPanel, SectionTitle, TonePill, styles } from "./Bulk4Shared"
import { ContentMediaPreview } from "../media-preview/ContentMediaPreview"

type DocumentSection = { id: string; title: string; kind: "cover" | "summary" | "section" | "table" | "approval" | "revision"; content: string; required: boolean }

type DocumentDraft = {
  title: string
  templateId: string
  documentType: string
  purpose: string
  audience: string
  authority: string
  classification: string
  language: string
  owner: string
  reviewer: string
  approver: string
  version: string
  effectiveDate: string
  reviewDate: string
  confidentiality: string
  footer: string
  identityField: string
  sections: DocumentSection[]
}

const defaultSections: DocumentSection[] = [
  { id: "cover", title: "Couverture", kind: "cover", content: "", required: true },
  { id: "executive-summary", title: "Résumé exécutif", kind: "summary", content: "", required: true },
  { id: "context", title: "Contexte et objectifs", kind: "section", content: "", required: true },
  { id: "operating-body", title: "Corps opérationnel", kind: "section", content: "", required: true },
  { id: "responsibility", title: "Responsabilités", kind: "table", content: "", required: true },
  { id: "risks", title: "Risques et contrôles", kind: "table", content: "", required: false },
  { id: "approval", title: "Approbation", kind: "approval", content: "", required: true },
  { id: "revision", title: "Historique de révision", kind: "revision", content: "Version initiale", required: true },
]

export default function Bulk4DocumentationStudioWorkspace() {
  const registry = useBulk4Registry()
  const { store } = useContentStore()
  const context = React.useMemo(() => contextFromLocation("/market-os/content-command-center/studio"), [])
  const dossier = store.items.find((item) => item.id === context.dossierId) || store.items[0] || null
  const requested = templateById(context.templateId)
  const [draft, setDraft] = React.useState<DocumentDraft>(() => ({
    title: dossier?.title || "",
    templateId: requested?.family === "document" ? requested.id : templatesByFamily("document")[0].id,
    documentType: requested?.category || "Executive report",
    purpose: dossier?.objective || "",
    audience: dossier?.audience || "Direction et parties prenantes autorisées",
    authority: "Aissaoui Ilyass · Managing Director",
    classification: "Internal Corporate",
    language: "fr",
    owner: dossier?.owner || "Corporate Documentation",
    reviewer: dossier?.reviewer || "Document Owner",
    approver: "Managing Director",
    version: "v1.0",
    effectiveDate: "",
    reviewDate: "",
    confidentiality: "internal",
    footer: "WWW.ANGELCARHUB.COM — BACKOFFICE@ANGELCAREHUB.COM — +212 537 581 462",
    identityField: "CIN / Passport",
    sections: defaultSections,
  }))
  const [activeSection, setActiveSection] = React.useState(draft.sections[0].id)
  const [previewMode, setPreviewMode] = React.useState<"page" | "spread" | "continuous" | "mobile">("page")
  const [notice, setNotice] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const template = templateById(draft.templateId) || templatesByFamily("document")[0]
  const selectedSection = draft.sections.find((section) => section.id === activeSection) || draft.sections[0]
  const existing = registry.documents.find((document) => document.id === context.assetId || String(document.metadata?.dossierId || "") === dossier?.id)
  const requiredMissing = draft.sections.filter((section) => section.required && !section.content.trim() && !["cover", "approval"].includes(section.kind))

  React.useEffect(() => {
    writeBulk4Context({ dossierId: dossier?.id, dossierTitle: dossier?.title, templateId: draft.templateId, assetId: existing?.id, studio: "documents", sourceHref: typeof window !== "undefined" ? window.location.pathname + window.location.search : "/market-os/content-command-center/studio/documents", returnTo: context.returnTo || "/market-os/content-command-center/studio", updatedAt: new Date().toISOString() })
  }, [context.returnTo, dossier?.id, dossier?.title, draft.templateId, existing?.id])

  const checks: PreflightCheck[] = [
    { id: "constitution", label: "Constitution documentaire", detail: `${draft.documentType} · ${draft.classification} · ${draft.language.toUpperCase()}`, passed: Boolean(draft.title && draft.documentType && draft.owner), blocking: true },
    { id: "sections", label: "Sections obligatoires", detail: requiredMissing.length ? `${requiredMissing.length} section(s) incomplète(s)` : "Toutes les sections structurantes sont renseignées", passed: requiredMissing.length === 0, blocking: true },
    { id: "authority", label: "Autorité", detail: `${draft.approver} · ${draft.authority}`, passed: Boolean(draft.approver && draft.authority), blocking: true },
    { id: "footer", label: "Pied institutionnel", detail: draft.footer || "Footer absent", passed: Boolean(draft.footer), blocking: true },
    { id: "revision", label: "Révision", detail: `${draft.version} · ${draft.sections.find((section) => section.kind === "revision")?.content || "Historique absent"}`, passed: Boolean(draft.version), blocking: true },
    { id: "dates", label: "Dates d’autorité", detail: `${draft.effectiveDate || "effective date absente"} · ${draft.reviewDate || "review date absente"}`, passed: Boolean(draft.effectiveDate && draft.reviewDate), blocking: false },
  ]

  function updateSection(content: string) {
    setDraft((current) => ({ ...current, sections: current.sections.map((section) => section.id === activeSection ? { ...section, content } : section) }))
  }

  function applyTemplate(nextId: string) {
    const next = templateById(nextId)
    setDraft((current) => ({ ...current, templateId: nextId, documentType: next?.category || current.documentType }))
  }

  async function saveDocument() {
    setBusy(true)
    setNotice("")
    const record: CreativeDocumentRecord = {
      id: existing?.id || `document-${Date.now()}`,
      title: draft.title,
      document_type: draft.documentType,
      category: template.category,
      subcategory: template.name,
      owner: draft.owner,
      version: draft.version,
      status: checks.some((check) => check.blocking && !check.passed) ? "Draft" : "Ready for Review",
      confidentiality: draft.confidentiality,
      storage_path: existing?.storage_path || null,
      metadata: {
        ...(existing?.metadata || {}),
        dossierId: dossier?.id || null,
        briefId: context.briefId || null,
        missionId: context.missionId || null,
        taskId: context.taskId || null,
        templateId: template.id,
        templateCode: template.code,
        purpose: draft.purpose,
        audience: draft.audience,
        authority: draft.authority,
        classification: draft.classification,
        language: draft.language,
        reviewer: draft.reviewer,
        approver: draft.approver,
        effectiveDate: draft.effectiveDate,
        reviewDate: draft.reviewDate,
        footer: draft.footer,
        identityField: draft.identityField,
        sections: draft.sections,
        preflight: checks,
      },
    }
    try { await registry.saveDocument(record); setNotice("Document structuré persisté dans Content Command Documents. L’approbation reste un gate distinct.") }
    catch (error) { setNotice(error instanceof Error ? error.message : "DOCUMENT_SAVE_FAILED") }
    finally { setBusy(false) }
  }

  return <main className={styles.bulk4Canvas} data-content-experience-bulk4="documentation-studio">
    <Bulk4BrandCrown eyebrow="DOCUMENT ARCHITECTURE DESK" title="Construire des documents d’autorité, pas de longues pages de texte." description="Le studio structure couverture, sections, tables, décisions, identités, footer, pagination et révision. Chaque document reste lié à son dossier, son mandat et sa version." returnTo={context.returnTo || "/market-os/content-command-center/studio"} actions={<Link href="/market-os/content-command-center/studio/templates"><BookOpenCheck/> Templates documentaires</Link>} />
    <Bulk4TruthState loading={registry.loading} error={registry.error} onRefresh={() => void registry.refresh()} />

    <section className={styles.documentConstitutionBar}>
      <div><small>DOCUMENT</small><strong>{draft.title || "Titre à constituer"}</strong><span>{draft.documentType}</span></div>
      <div><small>VERSION</small><strong>{draft.version}</strong><span>{existing ? `Persisté: ${existing.id}` : "Nouvelle constitution"}</span></div>
      <div><small>OWNER / APPROVER</small><strong>{draft.owner}</strong><span>{draft.approver}</span></div>
      <div><small>CLASSIFICATION</small><strong>{draft.classification}</strong><span>{draft.confidentiality}</span></div>
      <TonePill tone={requiredMissing.length ? "warning" : "success"}>{requiredMissing.length ? `${requiredMissing.length} section(s) manquante(s)` : "Structure complète"}</TonePill>
    </section>

    <section className={styles.documentArchitectureDesk}>
      <aside className={styles.documentOutlineNavigator}>
        <SectionTitle eyebrow="OUTLINE NAVIGATOR" title="Architecture contrôlée" description="Chaque section possède un rôle, un état et une place dans le document." />
        <label>Template<select value={draft.templateId} onChange={(event) => applyTemplate(event.target.value)}>{templatesByFamily("document").map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select></label>
        <div>{draft.sections.map((section, index) => <button type="button" key={section.id} aria-pressed={activeSection === section.id} onClick={() => setActiveSection(section.id)}>
          <span>{String(index + 1).padStart(2, "0")}</span><div><strong>{section.title}</strong><small>{section.kind} · {section.required ? "obligatoire" : "optionnelle"}</small></div>{section.content.trim() || ["cover", "approval"].includes(section.kind) ? <CheckCircle2/> : <span className={styles.outlineMissing}/>} 
        </button>)}</div>
      </aside>

      <div className={styles.activePageWorkbench}>
        <header><span><PanelTop/><small>ACTIVE PAGE WORKBENCH</small></span><strong>{selectedSection.title}</strong><div role="group"><button aria-pressed={previewMode === "page"} onClick={() => setPreviewMode("page")}><FileText/> Page</button><button aria-pressed={previewMode === "spread"} onClick={() => setPreviewMode("spread")}><Rows3/> Spread</button><button aria-pressed={previewMode === "continuous"} onClick={() => setPreviewMode("continuous")}><LayoutList/> Continu</button><button aria-pressed={previewMode === "mobile"} onClick={() => setPreviewMode("mobile")}><Maximize2/> Mobile</button></div></header>
        {existing?.storage_path || typeof existing?.metadata?.sourceUrl === "string" ? <div className={styles.studioSourcePreview}><ContentMediaPreview source={{ id: existing.id, title: existing.title, url: typeof existing.metadata?.sourceUrl === "string" ? existing.metadata.sourceUrl : null, storagePath: existing.storage_path, contentType: typeof existing.metadata?.contentType === "string" ? existing.metadata.contentType : null, filename: typeof existing.metadata?.filename === "string" ? existing.metadata.filename : existing.title, sourceLabel: "Documentation Studio · Fichier réel" }} mode="studio" fit="contain"/></div> : null}
        <div className={`${styles.documentPreviewRoom} ${styles[`preview_${previewMode}`]}`}>
          <article className={styles.a4Page}>
            <header><img src="/logo.png" alt="AngelCare"/><div><small>{draft.classification}</small><span>{draft.version}</span></div></header>
            {selectedSection.kind === "cover" ? <div className={styles.coverComposition}><span>{template.code}</span><h2>{draft.title || "Titre du document"}</h2><p>{draft.purpose || "Objet et finalité à définir"}</p><dl><div><dt>Owner</dt><dd>{draft.owner}</dd></div><div><dt>Approver</dt><dd>{draft.approver}</dd></div><div><dt>Language</dt><dd>{draft.language.toUpperCase()}</dd></div><div><dt>Classification</dt><dd>{draft.confidentiality}</dd></div></dl></div> : selectedSection.kind === "approval" ? <div className={styles.approvalComposition}><FileSignature/><h2>Approbation et autorité</h2><p>{draft.authority}</p><div><span>Nom / qualité</span><span>Date</span><span>{draft.identityField}</span></div><small>Aucune signature ou sceau préchargé.</small></div> : <div className={styles.pageBody}><small>{selectedSection.kind.toUpperCase()}</small><h2>{selectedSection.title}</h2><p>{selectedSection.content || "Le contenu de cette section n’est pas encore constitué."}</p>{selectedSection.kind === "table" ? <table><thead><tr><th>Responsabilité</th><th>Owner</th><th>Preuve</th></tr></thead><tbody><tr><td>À définir</td><td>{draft.owner}</td><td>Référence requise</td></tr></tbody></table> : null}</div>}
            <footer><span>{draft.footer}</span><b>Page {draft.sections.findIndex((section) => section.id === selectedSection.id) + 1}</b></footer>
          </article>
          {previewMode === "spread" ? <article className={styles.a4Page}><header><img src="/logo.png" alt=""/><span>PAGE SUIVANTE</span></header><div className={styles.pageBody}><small>CONTINUITY</small><h2>{draft.sections[Math.min(draft.sections.length - 1, draft.sections.findIndex((section) => section.id === selectedSection.id) + 1)]?.title}</h2><p>Aperçu de continuité et contrôle de rupture.</p></div><footer><span>{draft.footer}</span><b>Page suivante</b></footer></article> : null}
        </div>
        <label className={styles.sectionEditor}>Contenu de section<textarea value={selectedSection.content} onChange={(event) => updateSection(event.target.value)} placeholder="Constituez le contenu structuré de cette section…"/></label>
      </div>

      <aside className={styles.corporateComponentLibrary}>
        <SectionTitle eyebrow="CORPORATE COMPONENT LIBRARY" title="Composants institutionnels" description="Les composants servent l’autorité documentaire, pas la décoration." />
        <div>{[
          [TextQuote, "Résumé exécutif", "Synthèse décisionnelle"],
          [Table2, "Tableau KPI", "Mesures avec sources"],
          [ShieldCheck, "Risk matrix", "Risque, contrôle, owner"],
          [ListChecks, "SOP step", "Action, preuve, escalade"],
          [FileSignature, "Approval field", "Autorité et date"],
          [Languages, "Language control", "Divergence par version"],
        ].map(([Icon, label, detail]) => <button type="button" key={String(label)} onClick={() => updateSection(`${selectedSection.content}${selectedSection.content ? "\n\n" : ""}[${String(label)}] ${String(detail)}`)}><Icon/><span><strong>{String(label)}</strong><small>{String(detail)}</small></span></button>)}</div>
        <section className={styles.paginationInspector}><header><FileCheck2/><span><small>PAGINATION INSPECTOR</small><strong>Contrôles déterministes</strong></span></header><ul><li className={!draft.footer ? styles.issue : ""}>{draft.footer ? <CheckCircle2/> : <span/>}Footer institutionnel</li><li className={requiredMissing.length ? styles.issue : ""}>{requiredMissing.length ? <span/> : <CheckCircle2/>}Sections obligatoires</li><li><CheckCircle2/>Hiérarchie de titres contractuelle</li><li><span/>Orphelins, overflow et split tables nécessitent le rendu PDF réel</li></ul></section>
      </aside>
    </section>

    <section className={styles.documentLowerDeck}>
      <div className={styles.documentMetadataControl}>
        <SectionTitle eyebrow="DOCUMENT CONSTITUTION" title="Métadonnées d’autorité" description="Les identités, dates et classifications restent des champs gouvernés." />
        <div className={styles.formGrid}><label>Titre<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })}/></label><label>Type<input value={draft.documentType} onChange={(event) => setDraft({ ...draft, documentType: event.target.value })}/></label><label>Owner<input value={draft.owner} onChange={(event) => setDraft({ ...draft, owner: event.target.value })}/></label><label>Reviewer<input value={draft.reviewer} onChange={(event) => setDraft({ ...draft, reviewer: event.target.value })}/></label><label>Approver<input value={draft.approver} onChange={(event) => setDraft({ ...draft, approver: event.target.value })}/></label><label>Version<input value={draft.version} onChange={(event) => setDraft({ ...draft, version: event.target.value })}/></label><label>Effective date<input type="date" value={draft.effectiveDate} onChange={(event) => setDraft({ ...draft, effectiveDate: event.target.value })}/></label><label>Review date<input type="date" value={draft.reviewDate} onChange={(event) => setDraft({ ...draft, reviewDate: event.target.value })}/></label><label>Confidentialité<select value={draft.confidentiality} onChange={(event) => setDraft({ ...draft, confidentiality: event.target.value })}><option value="internal">Internal</option><option value="restricted">Restricted</option><option value="public">Public</option></select></label><label>Langue<select value={draft.language} onChange={(event) => setDraft({ ...draft, language: event.target.value })}><option value="fr">Français</option><option value="en">English</option><option value="ar">العربية</option></select></label><label className={styles.wide}>Footer<input value={draft.footer} onChange={(event) => setDraft({ ...draft, footer: event.target.value })}/></label></div>
      </div>
      <div className={styles.documentPreflight}><PreflightPanel checks={checks} title="Document authority gate" />{notice ? <div className={styles.inlineNotice} aria-live="polite">{notice}</div> : null}<DominantAction onClick={() => void saveDocument()} disabled={busy || !draft.title}>{busy ? "Enregistrement…" : existing ? "Mettre à jour le document" : "Enregistrer le document"}</DominantAction><Link className={styles.secondaryHandover} href="/market-os/content-command-center/evidence"><Save/> Préparer la preuve documentaire <ArrowRight/></Link></div>
    </section>
  </main>
}

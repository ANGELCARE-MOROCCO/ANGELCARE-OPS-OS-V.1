"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Columns3,
  Copy,
  Crop,
  FileImage,
  GitBranch,
  Globe2,
  Image as ImageIcon,
  Languages,
  LayoutGrid,
  MessageSquareText,
  MonitorSmartphone,
  Palette,
  Save,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react"
import { type ContentItem, useContentStore } from "../content-command-system"
import { templatesByFamily, templateById } from "./bulk4-template-estate"
import { contextFromLocation, readBulk4Context, writeBulk4Context } from "./bulk4-context"
import { useBulk4Registry } from "./bulk4-api"
import type { CreativeAssetRecord, PreflightCheck, TemplateDNA } from "./bulk4-types"
import { Bulk4BrandCrown, Bulk4TruthState, DominantAction, PreflightPanel, SectionTitle, TonePill, styles } from "./Bulk4Shared"
import { ContentMediaPreview } from "../media-preview/ContentMediaPreview"

const OUTPUTS = [
  { id: "instagram-square", label: "Instagram carré", dimensions: "1080×1080", channel: "Instagram", max: 90 },
  { id: "story", label: "Story portrait", dimensions: "1080×1920", channel: "Instagram Story", max: 55 },
  { id: "whatsapp", label: "WhatsApp card", dimensions: "1080×1350", channel: "WhatsApp", max: 115 },
  { id: "linkedin", label: "LinkedIn", dimensions: "1200×627", channel: "LinkedIn", max: 160 },
  { id: "email", label: "Email hero", dimensions: "1200×600", channel: "Email", max: 85 },
  { id: "web", label: "Website banner", dimensions: "1920×900", channel: "Website", max: 110 },
] as const

type Draft = {
  title: string
  headline: string
  supportingCopy: string
  proofPoint: string
  cta: string
  visualSubject: string
  service: string
  audience: string
  city: string
  language: string
  owner: string
  reviewer: string
  sourceUrl: string
  rightsState: string
  partnerName: string
  templateId: string
}

function defaultDraft(item?: ContentItem | null, template?: TemplateDNA | null): Draft {
  return {
    title: item?.title || "",
    headline: item?.angle || item?.title || "",
    supportingCopy: item?.body || "",
    proofPoint: item?.objective || "",
    cta: item?.cta || "",
    visualSubject: "",
    service: item?.campaign || "AngelCare",
    audience: item?.audience || "",
    city: "Rabat",
    language: "fr",
    owner: item?.owner || "Creative Producer",
    reviewer: item?.reviewer || "Brand Manager",
    sourceUrl: "",
    rightsState: "unknown",
    partnerName: "",
    templateId: template?.id || templatesByFamily("digital")[0].id,
  }
}

export default function Bulk4DigitalStudioWorkspace() {
  const registry = useBulk4Registry()
  const { store } = useContentStore()
  const locationContext = React.useMemo(() => contextFromLocation("/market-os/content-command-center/studio"), [])
  const remembered = React.useMemo(() => readBulk4Context(), [])
  const selectedItem = React.useMemo(() => {
    const requested = locationContext.dossierId || remembered?.dossierId
    return store.items.find((item) => item.id === requested) || store.items[0] || null
  }, [locationContext.dossierId, remembered?.dossierId, store.items])
  const requestedTemplate = templateById(locationContext.templateId || remembered?.templateId)
  const [draft, setDraft] = React.useState<Draft>(() => defaultDraft(selectedItem, requestedTemplate))
  const [selectedOutput, setSelectedOutput] = React.useState<(typeof OUTPUTS)[number]>(OUTPUTS[0])
  const [version, setVersion] = React.useState("v1.0")
  const [notice, setNotice] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const template = templateById(draft.templateId) || templatesByFamily("digital")[0]
  const existingAsset = registry.assets.find((asset) => asset.id === locationContext.assetId || String(asset.metadata?.dossierId || "") === selectedItem?.id)

  React.useEffect(() => {
    writeBulk4Context({
      dossierId: selectedItem?.id,
      dossierTitle: selectedItem?.title,
      templateId: draft.templateId,
      assetId: existingAsset?.id,
      studio: "digital",
      sourceHref: typeof window !== "undefined" ? window.location.pathname + window.location.search : "/market-os/content-command-center/studio/digital",
      returnTo: locationContext.returnTo || "/market-os/content-command-center/studio",
      updatedAt: new Date().toISOString(),
    })
  }, [draft.templateId, existingAsset?.id, locationContext.returnTo, selectedItem?.id, selectedItem?.title])

  const checks: PreflightCheck[] = [
    { id: "dossier", label: "Dossier ou mandat", detail: selectedItem ? `${selectedItem.title} · ${selectedItem.status}` : "Aucun dossier lié", passed: Boolean(selectedItem), blocking: true },
    { id: "template", label: "Template DNA", detail: `${template.code} · ${template.name}`, passed: Boolean(template), blocking: true },
    { id: "headline", label: "Message principal", detail: draft.headline ? `${draft.headline.length} caractères` : "Headline absent", passed: draft.headline.trim().length >= 8, blocking: true },
    { id: "cta", label: "CTA", detail: draft.cta || "CTA absent", passed: draft.cta.trim().length >= 3, blocking: true },
    { id: "source", label: "Source visuelle", detail: draft.sourceUrl || "Référence non documentée", passed: Boolean(draft.sourceUrl), blocking: false },
    { id: "rights", label: "Droits", detail: draft.rightsState === "valid" ? "Droits documentés" : draft.rightsState === "restricted" ? "Usage restreint" : "État inconnu", passed: draft.rightsState === "valid", blocking: false },
    { id: "owner", label: "Propriétaire et réviseur", detail: `${draft.owner || "Owner absent"} · ${draft.reviewer || "Reviewer absent"}`, passed: Boolean(draft.owner && draft.reviewer), blocking: true },
  ]
  const blocking = checks.filter((check) => check.blocking && !check.passed)

  const renditionState = OUTPUTS.map((output) => {
    const overflow = draft.headline.length > output.max
    const missing = !draft.headline || !draft.cta
    return { ...output, state: missing ? "missing" : overflow ? "overflow" : "ready" }
  })

  async function saveDraft() {
    if (!draft.title.trim()) return
    setBusy(true)
    setNotice("")
    const id = existingAsset?.id || `asset-digital-${Date.now()}`
    const record: CreativeAssetRecord = {
      id,
      family: "digital",
      title: draft.title,
      category: template.category,
      subcategory: template.name,
      output: template.outputProfiles.map((profile) => profile.label).join(" · "),
      channel: selectedOutput.channel,
      service_product: draft.service,
      owner: draft.owner,
      status: blocking.length ? "Draft" : "Ready for Review",
      priority: selectedItem?.priority || "Medium",
      storage_path: existingAsset?.storage_path || null,
      preview_url: existingAsset?.preview_url || null,
      metadata: {
        ...(existingAsset?.metadata || {}),
        dossierId: selectedItem?.id || null,
        briefId: locationContext.briefId || null,
        missionId: locationContext.missionId || null,
        taskId: locationContext.taskId || null,
        templateId: template.id,
        templateCode: template.code,
        version,
        master: {
          headline: draft.headline,
          supportingCopy: draft.supportingCopy,
          proofPoint: draft.proofPoint,
          cta: draft.cta,
          visualSubject: draft.visualSubject,
        },
        variants: renditionState,
        language: draft.language,
        city: draft.city,
        audience: draft.audience,
        sourceUrl: draft.sourceUrl,
        rightsState: draft.rightsState,
        partnerName: draft.partnerName,
        reviewer: draft.reviewer,
        preflight: checks,
      },
    }
    try {
      await registry.saveAsset(record)
      setNotice(`Working version ${version} persistée dans le registre Content Command. Le statut ne vaut pas validation formelle.`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "DIGITAL_ASSET_SAVE_FAILED")
    } finally {
      setBusy(false)
    }
  }

  function newBranch(kind: "channel" | "language" | "city" | "partner") {
    const next = version.replace(/(\d+)$/, (value) => String(Number(value) + 1))
    setVersion(next === version ? `${version}.1` : next)
    setNotice(`Branche ${kind} préparée comme nouvelle working version. Enregistrez-la pour la rendre persistante.`)
  }

  return <main className={styles.bulk4Canvas} data-content-experience-bulk4="digital-studio">
    <Bulk4BrandCrown
      eyebrow="MULTI-CHANNEL COMPOSITION STAGE"
      title="Une campagne maître. Des renditions cohérentes. Une seule vérité de message."
      description="Le Digital Studio orchestre copy, visuel, variantes, localisation, co-branding et preflight sans prétendre remplacer un moteur graphique inexistant. Les actions persistées utilisent le registre Content Command existant."
      returnTo={locationContext.returnTo || "/market-os/content-command-center/studio"}
      actions={<Link href="/market-os/content-command-center/studio/templates"><LayoutGrid/> Template Foundry</Link>}
    />
    <Bulk4TruthState loading={registry.loading} error={registry.error} onRefresh={() => void registry.refresh()} />

    <section className={styles.productionMandateBar}>
      <div><small>DOSSIER / MANDAT</small><strong>{selectedItem?.title || "Aucun dossier lié"}</strong><span>{selectedItem?.id || "Ouvrez le studio depuis Dossier 360 ou Task Execution"}</span></div>
      <div><small>TEMPLATE</small><strong>{template.code}</strong><span>{template.name}</span></div>
      <div><small>WORKING VERSION</small><strong>{version}</strong><span>{existingAsset ? `Persistée: ${existingAsset.id}` : "Nouvelle branche"}</span></div>
      <div><small>OWNER / REVIEWER</small><strong>{draft.owner || "Absent"}</strong><span>{draft.reviewer || "Absent"}</span></div>
      <TonePill tone={blocking.length ? "danger" : "success"}>{blocking.length ? `${blocking.length} blocage(s)` : "Preflight structurel prêt"}</TonePill>
    </section>

    <section className={styles.digitalStage}>
      <aside className={styles.digitalControlRail}>
        <SectionTitle eyebrow="CREATIVE CONSTITUTION" title="Message et contexte" description="Ces champs constituent la production; ils ne simulent pas un éditeur graphique." />
        <label>Titre de production<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })}/></label>
        <label>Template<select value={draft.templateId} onChange={(event) => setDraft({ ...draft, templateId: event.target.value })}>{templatesByFamily("digital").map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select></label>
        <label>Headline<input value={draft.headline} onChange={(event) => setDraft({ ...draft, headline: event.target.value })}/><small>{draft.headline.length} caractères</small></label>
        <label>Supporting copy<textarea value={draft.supportingCopy} onChange={(event) => setDraft({ ...draft, supportingCopy: event.target.value })}/></label>
        <label>Proof point<input value={draft.proofPoint} onChange={(event) => setDraft({ ...draft, proofPoint: event.target.value })}/></label>
        <label>CTA<input value={draft.cta} onChange={(event) => setDraft({ ...draft, cta: event.target.value })}/></label>
        <label>Visual subject<input value={draft.visualSubject} onChange={(event) => setDraft({ ...draft, visualSubject: event.target.value })}/></label>
        <div className={styles.controlPair}><label>Langue<select value={draft.language} onChange={(event) => setDraft({ ...draft, language: event.target.value })}><option value="fr">Français</option><option value="ar">Arabe</option><option value="en">English</option></select></label><label>Ville<input value={draft.city} onChange={(event) => setDraft({ ...draft, city: event.target.value })}/></label></div>
      </aside>

      <div className={styles.masterCompositionCanvas}>
        <header><span><Palette/><small>MASTER COMPOSITION</small></span><div><button onClick={() => newBranch("channel")}><GitBranch/> Branche canal</button><button onClick={() => newBranch("language")}><Languages/> Localiser</button></div></header>
        <div className={styles.masterPreview}>
          <div className={styles.previewBrand}><img src="/logo.png" alt="AngelCare"/><span>{draft.service || "ANGELCARE"}</span></div>
          <div className={styles.previewVisual}><ContentMediaPreview source={{ title: draft.title || draft.visualSubject || "Source de production", url: draft.sourceUrl || null, filename: draft.sourceUrl || draft.visualSubject || null, sourceLabel: "Digital Studio · Source de composition" }} mode="studio" fit="contain"/></div>
          <div className={styles.previewCopy}><small>{draft.city} · {draft.language.toUpperCase()}</small><h2>{draft.headline || "Headline à constituer"}</h2><p>{draft.supportingCopy || "Supporting copy non renseignée."}</p><strong>{draft.proofPoint || "Preuve ou bénéfice à documenter"}</strong><button>{draft.cta || "CTA requis"}</button></div>
          <footer><span>{version}</span><span>{template.code}</span><span>{draft.partnerName ? `Co-brand: ${draft.partnerName}` : "AngelCare master"}</span></footer>
        </div>
        <section className={styles.copyVisualSynchronizer}>
          <header><MessageSquareText/><span><small>COPY–VISUAL SYNCHRONIZER</small><strong>Contrat du message</strong></span></header>
          <div><article><small>Promesse</small><p>{draft.headline || "Manquante"}</p></article><article><small>Preuve</small><p>{draft.proofPoint || "Manquante"}</p></article><article><small>CTA</small><p>{draft.cta || "Manquant"}</p></article><article><small>Sujet visuel</small><p>{draft.visualSubject || "Non défini"}</p></article></div>
        </section>
      </div>

      <aside className={styles.renditionWall}>
        <SectionTitle eyebrow="CHANNEL RENDITION WALL" title="Famille de sorties" description="Les contrôles sont déterministes: présence des champs, longueur et cohérence des métadonnées." />
        <div>{renditionState.map((output) => <button key={output.id} type="button" aria-pressed={selectedOutput.id === output.id} onClick={() => setSelectedOutput(output)} className={output.state === "ready" ? styles.rendition_ready : output.state === "overflow" ? styles.rendition_overflow : styles.rendition_missing}>
          <header><MonitorSmartphone/><TonePill tone={output.state === "ready" ? "success" : output.state === "overflow" ? "warning" : "danger"}>{output.state === "ready" ? "Prêt" : output.state === "overflow" ? "Overflow" : "Incomplet"}</TonePill></header>
          <strong>{output.label}</strong><span>{output.dimensions}</span><small>{draft.headline.length}/{output.max} caractères headline</small>
        </button>)}</div>
        <section className={styles.safeZoneInspector}><header><Crop/><span><small>SAFE-ZONE INSPECTOR</small><strong>{selectedOutput.label}</strong></span></header><ul><li><CheckCircle2/>Logo hors zones d’interface</li><li className={draft.headline.length > selectedOutput.max ? styles.issue : ""}>{draft.headline.length > selectedOutput.max ? <AlertTriangle/> : <CheckCircle2/>}Headline {draft.headline.length > selectedOutput.max ? "trop longue" : "compatible"}</li><li className={!draft.cta ? styles.issue : ""}>{draft.cta ? <CheckCircle2/> : <AlertTriangle/>}CTA {draft.cta ? "présent" : "manquant"}</li><li><Columns3/>Crop et contraste nécessitent une preuve visuelle réelle</li></ul></section>
      </aside>
    </section>

    <section className={styles.digitalLowerDeck}>
      <div className={styles.branchTree}>
        <SectionTitle eyebrow="CREATIVE BRANCH TREE" title="Master, canaux, langues, villes et partenaires" description="Une branche locale devient institutionnelle uniquement après persistance dans le registre." />
        <div className={styles.branchDiagram}><article className={styles.branchMaster}><GitBranch/><strong>{version} · Master {draft.language.toUpperCase()}</strong><small>{template.name}</small></article><div>{[
          {
            label: "Canaux",
            count: renditionState.filter(
              (output) => output.state === "ready",
            ).length,
            icon: <MonitorSmartphone/>,
          },
          {
            label: "Langues",
            count: draft.language ? 1 : 0,
            icon: <Languages/>,
          },
          {
            label: "Villes",
            count: draft.city ? 1 : 0,
            icon: <Globe2/>,
          },
          {
            label: "Partenaire",
            count: draft.partnerName ? 1 : 0,
            icon: <ShieldCheck/>,
          },
        ].map(({ label, count, icon }) => (
          <article key={label}>
            {icon}
            <strong>{label}</strong>
            <small>{count} branche(s) observée(s)</small>
          </article>
        ))}</div></div>
      </div>
      <div className={styles.preflightAndSave}>
        <PreflightPanel checks={checks} title="Digital production preflight" />
        <section className={styles.sourceRightsDock}><SectionTitle eyebrow="SOURCE & RIGHTS" title="Aucun visuel n’est opérationnel sans origine claire" description="Les droits restent explicitement inconnus tant qu’ils ne sont pas documentés." /><label>Source URL<input value={draft.sourceUrl} onChange={(event) => setDraft({ ...draft, sourceUrl: event.target.value })}/></label><label>Droits<select value={draft.rightsState} onChange={(event) => setDraft({ ...draft, rightsState: event.target.value })}><option value="unknown">Inconnus</option><option value="valid">Validés</option><option value="restricted">Restreints</option></select></label><label>Co-brand partenaire<input value={draft.partnerName} onChange={(event) => setDraft({ ...draft, partnerName: event.target.value })}/></label></section>
        {notice ? <div className={styles.inlineNotice} aria-live="polite">{notice}</div> : null}
        <DominantAction onClick={() => void saveDraft()} disabled={busy || !draft.title.trim()}>{busy ? "Enregistrement…" : existingAsset ? "Mettre à jour la working version" : "Enregistrer la working version"}</DominantAction>
        <Link className={styles.secondaryHandover} href="/market-os/content-command-center/evidence"><FileImage/> Préparer le handover Evidence <ArrowRight/></Link>
      </div>
    </section>
  </main>
}

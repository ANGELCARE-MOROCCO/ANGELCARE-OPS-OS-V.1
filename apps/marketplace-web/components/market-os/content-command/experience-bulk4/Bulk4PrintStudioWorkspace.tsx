"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  FileOutput,
  Layers3,
  MapPinned,
  PackageCheck,
  Printer,
  QrCode,
  Ruler,
  Scissors,
  ShieldCheck,
  Shirt,
  Truck,
} from "lucide-react"
import { useContentStore } from "../content-command-system"
import { templatesByFamily, templateById } from "./bulk4-template-estate"
import { contextFromLocation, writeBulk4Context } from "./bulk4-context"
import { useBulk4Registry } from "./bulk4-api"
import type { CreativeAssetRecord, PreflightCheck } from "./bulk4-types"
import { Bulk4BrandCrown, Bulk4TruthState, DominantAction, PreflightPanel, SectionTitle, TonePill, styles } from "./Bulk4Shared"
import { ContentMediaPreview, contentMediaSourceFromAsset } from "../media-preview/ContentMediaPreview"

type PrintDraft = {
  title: string
  templateId: string
  format: string
  dimensions: string
  orientation: string
  bleed: string
  safeArea: string
  material: string
  finishing: string
  quantity: string
  colorMode: string
  resolution: string
  owner: string
  reviewer: string
  vendor: string
  destination: string
  qrDestination: string
  sourceUrl: string
  rightsState: string
  proofState: string
  kit: string
}

const initial: PrintDraft = {
  title: "",
  templateId: templatesByFamily("print")[0].id,
  format: "A4",
  dimensions: "210 × 297 mm",
  orientation: "Portrait",
  bleed: "3 mm",
  safeArea: "8 mm",
  material: "Couché mat 250 g",
  finishing: "Pelliculage mat recto",
  quantity: "100",
  colorMode: "CMJN",
  resolution: "300 dpi",
  owner: "Print Production",
  reviewer: "Brand Manager",
  vendor: "",
  destination: "Rabat",
  qrDestination: "",
  sourceUrl: "",
  rightsState: "unknown",
  proofState: "specification-incomplete",
  kit: "Aucun kit",
}

export default function Bulk4PrintStudioWorkspace() {
  const registry = useBulk4Registry()
  const { store } = useContentStore()
  const context = React.useMemo(() => contextFromLocation("/market-os/content-command-center/studio"), [])
  const dossier = store.items.find((item) => item.id === context.dossierId) || store.items[0] || null
  const requested = templateById(context.templateId)
  const [draft, setDraft] = React.useState<PrintDraft>(() => ({ ...initial, title: dossier?.title || "", templateId: requested?.family === "print" ? requested.id : initial.templateId, owner: dossier?.owner || initial.owner, reviewer: dossier?.reviewer || initial.reviewer }))
  const [placementMode, setPlacementMode] = React.useState<"proof" | "vehicle" | "uniform">("proof")
  const [notice, setNotice] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const template = templateById(draft.templateId) || templatesByFamily("print")[0]
  const existing = registry.assets.find((asset) => asset.id === context.assetId || (asset.family === "print_offline" && String(asset.metadata?.dossierId || "") === dossier?.id))

  React.useEffect(() => {
    writeBulk4Context({ dossierId: dossier?.id, dossierTitle: dossier?.title, templateId: draft.templateId, assetId: existing?.id, studio: "print", sourceHref: typeof window !== "undefined" ? window.location.pathname + window.location.search : "/market-os/content-command-center/studio/print", returnTo: context.returnTo || "/market-os/content-command-center/studio", updatedAt: new Date().toISOString() })
  }, [context.returnTo, dossier?.id, dossier?.title, draft.templateId, existing?.id])

  const checks: PreflightCheck[] = [
    { id: "mandate", label: "Mandat et titre", detail: draft.title || "Titre absent", passed: Boolean(draft.title), blocking: true },
    { id: "format", label: "Format physique", detail: `${draft.format} · ${draft.dimensions} · ${draft.orientation}`, passed: Boolean(draft.dimensions), blocking: true },
    { id: "prepress", label: "Pré-presse", detail: `${draft.bleed} bleed · ${draft.safeArea} zone sûre · ${draft.colorMode} · ${draft.resolution}`, passed: Boolean(draft.bleed && draft.safeArea && draft.colorMode && draft.resolution), blocking: true },
    { id: "production", label: "Production", detail: `${draft.material} · ${draft.finishing} · quantité ${draft.quantity}`, passed: Boolean(draft.material && draft.quantity), blocking: true },
    { id: "source", label: "Source et droits", detail: draft.sourceUrl ? `${draft.rightsState}` : "Source non documentée", passed: Boolean(draft.sourceUrl && draft.rightsState === "valid"), blocking: false },
    { id: "proof", label: "BAT", detail: draft.proofState, passed: draft.proofState === "prepress-approved" || draft.proofState === "production-authorized", blocking: true },
  ]

  async function save() {
    setBusy(true)
    setNotice("")
    const record: CreativeAssetRecord = {
      id: existing?.id || `asset-print-${Date.now()}`,
      family: "print_offline",
      title: draft.title,
      category: template.category,
      subcategory: template.name,
      output: `${draft.format} · ${draft.dimensions}`,
      channel: "Print & Field",
      service_product: dossier?.campaign || "AngelCare",
      owner: draft.owner,
      status: checks.some((check) => check.blocking && !check.passed) ? "Draft" : "Ready for Review",
      priority: dossier?.priority || "Medium",
      storage_path: existing?.storage_path || null,
      preview_url: existing?.preview_url || null,
      metadata: {
        ...(existing?.metadata || {}),
        dossierId: dossier?.id || null,
        missionId: context.missionId || null,
        taskId: context.taskId || null,
        templateId: template.id,
        templateCode: template.code,
        version: String(existing?.metadata?.version || "v1.0"),
        physicalSpecification: draft,
        sourceUrl: draft.sourceUrl,
        rightsState: draft.rightsState,
        proofState: draft.proofState,
        preflight: checks,
      },
    }
    try { await registry.saveAsset(record); setNotice("Spécification physique persistée. La production et le BAT restent des gates distincts.") }
    catch (error) { setNotice(error instanceof Error ? error.message : "PRINT_ASSET_SAVE_FAILED") }
    finally { setBusy(false) }
  }

  return <main className={styles.bulk4Canvas} data-content-experience-bulk4="print-studio">
    <Bulk4BrandCrown eyebrow="PHYSICAL PRODUCTION TABLE" title="Du pixel au terrain, sans perdre un millimètre d’autorité." description="Print & Field Studio contrôle format, bleed, zones sûres, matériaux, BAT, kits terrain et placements physiques. Il ne prétend pas mesurer un fichier absent: chaque limite reste explicitement documentée." returnTo={context.returnTo || "/market-os/content-command-center/studio"} actions={<Link href="/market-os/content-command-center/studio/templates"><Layers3/> Templates Print</Link>} />
    <Bulk4TruthState loading={registry.loading} error={registry.error} onRefresh={() => void registry.refresh()} />

    <section className={styles.printMandateStrip}>
      <div><small>MANDAT</small><strong>{dossier?.title || "Aucun dossier lié"}</strong><span>{context.taskId ? `Tâche ${context.taskId}` : "Contexte de tâche non fourni"}</span></div>
      <div><small>TEMPLATE</small><strong>{template.code}</strong><span>{template.name}</span></div>
      <div><small>FORMAT</small><strong>{draft.format}</strong><span>{draft.dimensions} · {draft.orientation}</span></div>
      <div><small>BAT</small><strong>{draft.proofState}</strong><span>État persisté dans metadata après enregistrement</span></div>
      <TonePill tone={checks.some((check) => check.blocking && !check.passed) ? "warning" : "success"}>{checks.filter((check) => check.passed).length}/{checks.length} contrôles</TonePill>
    </section>

    <section className={styles.physicalProductionTable}>
      <aside className={styles.physicalSpecificationRail}>
        <SectionTitle eyebrow="PHYSICAL SPECIFICATION" title="Constitution de production" description="Les spécifications sont structurées et transmises; elles ne sont pas déduites d’un fichier inexistant." />
        <label>Titre<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })}/></label>
        <label>Template<select value={draft.templateId} onChange={(event) => setDraft({ ...draft, templateId: event.target.value })}>{templatesByFamily("print").map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select></label>
        <div className={styles.controlPair}><label>Format<input value={draft.format} onChange={(event) => setDraft({ ...draft, format: event.target.value })}/></label><label>Orientation<select value={draft.orientation} onChange={(event) => setDraft({ ...draft, orientation: event.target.value })}><option>Portrait</option><option>Paysage</option><option>Technique</option></select></label></div>
        <label>Dimensions<input value={draft.dimensions} onChange={(event) => setDraft({ ...draft, dimensions: event.target.value })}/></label>
        <div className={styles.controlPair}><label>Fond perdu<input value={draft.bleed} onChange={(event) => setDraft({ ...draft, bleed: event.target.value })}/></label><label>Zone sûre<input value={draft.safeArea} onChange={(event) => setDraft({ ...draft, safeArea: event.target.value })}/></label></div>
        <div className={styles.controlPair}><label>Mode couleur<input value={draft.colorMode} onChange={(event) => setDraft({ ...draft, colorMode: event.target.value })}/></label><label>Résolution<input value={draft.resolution} onChange={(event) => setDraft({ ...draft, resolution: event.target.value })}/></label></div>
        <label>Matériau<input value={draft.material} onChange={(event) => setDraft({ ...draft, material: event.target.value })}/></label>
        <label>Finition<input value={draft.finishing} onChange={(event) => setDraft({ ...draft, finishing: event.target.value })}/></label>
        <div className={styles.controlPair}><label>Quantité<input value={draft.quantity} onChange={(event) => setDraft({ ...draft, quantity: event.target.value })}/></label><label>Destination<input value={draft.destination} onChange={(event) => setDraft({ ...draft, destination: event.target.value })}/></label></div>
      </aside>

      <div className={styles.physicalProofTable}>
        <header><div role="tablist"><button aria-selected={placementMode === "proof"} onClick={() => setPlacementMode("proof")}><FileOutput/> BAT</button><button aria-selected={placementMode === "vehicle"} onClick={() => setPlacementMode("vehicle")}><Truck/> Véhicule</button><button aria-selected={placementMode === "uniform"} onClick={() => setPlacementMode("uniform")}><Shirt/> Uniforme</button></div><TonePill tone="info">{placementMode === "proof" ? "Front / back proof" : placementMode === "vehicle" ? "Placement technique" : "Placement textile"}</TonePill></header>
        {placementMode === "proof" ? <div className={styles.frontBackProof}>
          <article><div className={styles.printSheet}><span className={styles.bleedBoundary}/><span className={styles.trimBoundary}/><span className={styles.safeBoundary}/><img src="/logo.png" alt=""/><h2>{draft.title || "Titre de production"}</h2><p>{dossier?.objective || "Objectif issu du dossier"}</p><footer>{draft.qrDestination ? <QrCode/> : <span>QR non requis</span>}<b>RECTO</b></footer></div><strong>Recto</strong><small>Bleed {draft.bleed} · safe {draft.safeArea}</small></article>
          <article><div className={styles.printSheet}><span className={styles.bleedBoundary}/><span className={styles.trimBoundary}/><span className={styles.safeBoundary}/><h3>Preuves & contact</h3><ul><li>Service: {dossier?.campaign || "AngelCare"}</li><li>Destination: {draft.destination}</li><li>Matériau: {draft.material}</li></ul><footer><ShieldCheck/><b>VERSO</b></footer></div><strong>Verso</strong><small>Contenu institutionnel et CTA</small></article>
        </div> : placementMode === "vehicle" ? <div className={styles.placementBoard}><article><Truck/><span className={styles.vehicleLogo}>ANGELCARE</span><strong>Vue latérale</strong></article><article><Truck/><span className={styles.vehicleRear}>QR / contact</span><strong>Vue arrière</strong></article><aside><Ruler/><p>Les dimensions exactes nécessitent le gabarit du véhicule. Cette vue contrôle les zones de placement, pas la mesure finale.</p></aside></div> : <div className={styles.placementBoard}><article><Shirt/><span className={styles.uniformFront}>LOGO</span><strong>Face</strong></article><article><Shirt/><span className={styles.uniformBack}>ANGELCARE</span><strong>Dos</strong></article><aside><BadgeCheck/><p>Le placement doit conserver lisibilité, fonction et identification. Les tailles finales restent dans la fiche technique.</p></aside></div>}
        <section className={styles.dielineLegend}><div><span className={styles.legendBleed}/><strong>Bleed</strong><small>{draft.bleed}</small></div><div><span className={styles.legendTrim}/><strong>Trim</strong><small>{draft.dimensions}</small></div><div><span className={styles.legendSafe}/><strong>Safe</strong><small>{draft.safeArea}</small></div><div><Scissors/><strong>Découpe / plis</strong><small>Selon template</small></div></section>
      </div>

      <aside className={styles.fieldUsabilityInspector}>
        <SectionTitle eyebrow="FIELD USABILITY" title="Le terrain décide de la forme" description="Lisibilité, distribution, QR, durabilité et destination restent des contraintes de production visibles." />
        <div className={styles.usabilityCards}>
          <article><MapPinned/><span><strong>{draft.destination}</strong><small>Destination terrain</small></span></article>
          <article><Ruler/><span><strong>{draft.dimensions}</strong><small>Format final</small></span></article>
          <article><QrCode/><span><strong>{draft.qrDestination || "Non configuré"}</strong><small>Destination QR</small></span></article>
          <article><PackageCheck/><span><strong>{draft.kit}</strong><small>Kit opérationnel</small></span></article>
        </div>
        <label>Kit terrain<select value={draft.kit} onChange={(event) => setDraft({ ...draft, kit: event.target.value })}><option>Aucun kit</option><option>Event kit</option><option>Hotel partnership kit</option><option>School activation kit</option><option>Commercial field kit</option><option>Academy training kit</option></select></label>
        <label>QR / URL courte<input value={draft.qrDestination} onChange={(event) => setDraft({ ...draft, qrDestination: event.target.value })}/></label>
        <label>Vendor / production<input value={draft.vendor} onChange={(event) => setDraft({ ...draft, vendor: event.target.value })}/></label>
        <label>État BAT<select value={draft.proofState} onChange={(event) => setDraft({ ...draft, proofState: event.target.value })}><option value="specification-incomplete">Spécification incomplète</option><option value="proof-required">BAT requis</option><option value="proof-received">BAT reçu</option><option value="correction-required">Correction requise</option><option value="prepress-approved">Pré-presse approuvée</option><option value="production-authorized">Production autorisée</option></select></label>
      </aside>
    </section>

    <section className={styles.printLowerDeck}>
      <div><PreflightPanel checks={checks} title="Physical production preflight" /></div>
      <div className={styles.productionSpecificationSheet}><SectionTitle eyebrow="PRODUCTION SPECIFICATION SHEET" title="Handover physique gouverné" description="La fiche regroupe la version, le format, les matériaux, le BAT, la source, l’autorité et la destination." /><div className={styles.studioSourcePreview}><ContentMediaPreview source={existing ? contentMediaSourceFromAsset(existing) : { title: draft.title || "Source print", url: draft.sourceUrl || null, filename: draft.sourceUrl || `${draft.format} ${draft.dimensions}`, sourceLabel: "Print Studio · Source / BAT" }} mode="studio" fit="contain"/></div><dl><div><dt>Version</dt><dd>{String(existing?.metadata?.version || "v1.0")}</dd></div><div><dt>Format</dt><dd>{draft.format} · {draft.dimensions}</dd></div><div><dt>Pré-presse</dt><dd>{draft.colorMode} · {draft.resolution}</dd></div><div><dt>Support</dt><dd>{draft.material}</dd></div><div><dt>Finition</dt><dd>{draft.finishing}</dd></div><div><dt>Quantité</dt><dd>{draft.quantity}</dd></div><div><dt>BAT</dt><dd>{draft.proofState}</dd></div><div><dt>Authority</dt><dd>{draft.reviewer}</dd></div></dl><label>Source URL<input value={draft.sourceUrl} onChange={(event) => setDraft({ ...draft, sourceUrl: event.target.value })}/></label><label>Droits<select value={draft.rightsState} onChange={(event) => setDraft({ ...draft, rightsState: event.target.value })}><option value="unknown">Inconnus</option><option value="valid">Validés</option><option value="restricted">Restreints</option></select></label>{notice ? <div className={styles.inlineNotice} aria-live="polite">{notice}</div> : null}<DominantAction onClick={() => void save()} disabled={busy || !draft.title}>{busy ? "Enregistrement…" : "Enregistrer la spécification"}</DominantAction><Link className={styles.secondaryHandover} href="/market-os/content-command-center/evidence"><ClipboardCheck/> Préparer le BAT pour preuve <ArrowRight/></Link></div>
    </section>
  </main>
}

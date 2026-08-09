"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  CircleDot,
  FileWarning,
  Filter,
  GitBranch,
  History,
  Layers3,
  LayoutTemplate,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { BULK4_TEMPLATE_COUNTS, BULK4_TEMPLATE_ESTATE } from "./bulk4-template-estate"
import type { Bulk4TemplateFamily, TemplateDNA } from "./bulk4-types"
import { useBulk4Registry } from "./bulk4-api"
import { Bulk4BrandCrown, Bulk4TruthState, DominantAction, SectionTitle, TonePill, styles } from "./Bulk4Shared"

const FAMILY_META: Record<Bulk4TemplateFamily, { label: string; detail: string }> = {
  digital: { label: "Digital Campaign", detail: "20 structures multi-canal" },
  print: { label: "Print & Field", detail: "16 productions physiques" },
  document: { label: "Corporate Documentation", detail: "16 architectures institutionnelles" },
  accelerator: { label: "Quick Create", detail: "8 accélérateurs gouvernés" },
}

function templatePayload(template: TemplateDNA) {
  return {
    id: template.id,
    name: template.name,
    family: template.family,
    familyId: "bulk4-template-foundry",
    category: template.category,
    subcategory: template.purpose,
    modalScope: "Bulk 4 Template DNA",
    output: template.outputProfiles.map((profile) => profile.label).join(" · "),
    channel: template.channels.join(" · "),
    owner: template.owner,
    status: template.status,
    readiness: template.status === "Active" ? 100 : 72,
    tone: template.tone,
    icon: "LayoutTemplate",
    rules: template.rules,
    matchedParams: [
      ...template.services.map((value) => ({ key: "service", value })),
      ...template.audiences.map((value) => ({ key: "audience", value })),
      { key: "version", value: template.version },
      { key: "authority", value: template.authority },
    ],
  }
}

export default function Bulk4TemplateFoundryWorkspace() {
  const registry = useBulk4Registry()
  const [family, setFamily] = React.useState<Bulk4TemplateFamily | "all">("all")
  const [query, setQuery] = React.useState("")
  const [selected, setSelected] = React.useState<TemplateDNA>(BULK4_TEMPLATE_ESTATE[0])
  const [busy, setBusy] = React.useState(false)
  const [notice, setNotice] = React.useState("")
  const persisted = React.useMemo(() => new Map(registry.templates.map((template) => [template.id, template])), [registry.templates])
  const visible = BULK4_TEMPLATE_ESTATE.filter((template) => {
    if (family !== "all" && template.family !== family) return false
    const needle = query.trim().toLowerCase()
    if (!needle) return true
    return [template.name, template.code, template.category, template.purpose, ...template.channels, ...template.anatomy].join(" ").toLowerCase().includes(needle)
  })

  async function synchronize() {
    setBusy(true)
    setNotice("")
    try {
      await registry.saveTemplate(templatePayload(selected))
      setNotice(`${selected.code} a été synchronisé dans le registre Content Command. La constitution code reste la référence du package Bulk 4.`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "TEMPLATE_SYNC_FAILED")
    } finally {
      setBusy(false)
    }
  }

  return <main className={styles.bulk4Canvas} data-content-experience-bulk4="template-foundry">
    <Bulk4BrandCrown
      eyebrow="TEMPLATE ARCHITECTURE LABORATORY"
      title="60 constitutions créatives. Zéro variation cosmétique déguisée."
      description="Le Foundry décrit la structure, les zones verrouillées, les formats, les adaptations autorisées, les preuves et l’autorité de chaque système de production AngelCare."
      returnTo="/market-os/content-command-center/studio"
      actions={<Link href="/market-os/content-command-center/studio/quick-create"><Sparkles/> Utiliser un template</Link>}
    />
    <Bulk4TruthState loading={registry.loading} error={registry.error} onRefresh={() => void registry.refresh()} />

    <section className={styles.foundryCommand}>
      <div className={styles.foundryFamilies}>
        <button aria-pressed={family === "all"} onClick={() => setFamily("all")}><Boxes/><span><strong>{BULK4_TEMPLATE_COUNTS.total}</strong><small>Tous les contrats</small></span></button>
        {(Object.keys(FAMILY_META) as Bulk4TemplateFamily[]).map((key) => <button key={key} aria-pressed={family === key} onClick={() => setFamily(key)}><LayoutTemplate/><span><strong>{BULK4_TEMPLATE_COUNTS[key]}</strong><small>{FAMILY_META[key].label}</small></span></button>)}
      </div>
      <label className={styles.foundrySearch}><Search/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher par objectif, anatomie, canal ou code…"/><Filter/></label>
    </section>

    <section className={styles.foundryLaboratory}>
      <div className={styles.templateConstellation}>
        <SectionTitle eyebrow="TEMPLATE CONSTELLATION" title={`${visible.length} architecture(s) visible(s)`} description="Le catalogue contractuel peut être synchronisé avec le registre existant, sans migration et sans création d’un store parallèle." />
        <div className={styles.templateList}>
          {visible.map((template) => <button type="button" key={template.id} aria-pressed={selected.id === template.id} onClick={() => setSelected(template)}>
            <span className={styles.templateGlyph}>{template.family === "digital" ? "DIG" : template.family === "print" ? "PRT" : template.family === "document" ? "DOC" : "ACC"}</span>
            <div><small>{template.code}</small><strong>{template.name}</strong><p>{template.purpose}</p><em>{template.anatomy.slice(0, 3).join(" · ")}</em></div>
            <TonePill tone={persisted.has(template.id) ? "success" : template.tone}>{persisted.has(template.id) ? "Persisté" : template.status}</TonePill>
          </button>)}
        </div>
      </div>

      <div className={styles.templateAnatomyViewer}>
        <header><span><LayoutTemplate/><small>ANATOMY VIEWER</small></span><TonePill tone={selected.tone}>{selected.category}</TonePill></header>
        <div className={styles.anatomyPreview}>
          <div className={styles.anatomyBrand}><img src="/logo.png" alt=""/><span>{selected.code}</span></div>
          <div className={styles.anatomyZones}>{selected.anatomy.map((zone, index) => <article key={zone} className={index === 0 ? styles.anatomyPrimary : ""}><span>{String(index + 1).padStart(2, "0")}</span><strong>{zone}</strong><small>{selected.slots[index]?.label || "Zone structurante"}</small></article>)}</div>
          <footer>{selected.outputProfiles.map((profile) => <span key={profile.id}>{profile.dimensions}</span>)}</footer>
        </div>
        <div className={styles.templateIdentity}><small>{selected.code} · {selected.version}</small><h2>{selected.name}</h2><p>{selected.purpose}</p><div><TonePill tone="info">{selected.owner}</TonePill><TonePill tone="violet">Autorité: {selected.authority}</TonePill></div></div>
      </div>

      <aside className={styles.templateConstitution}>
        <header><span>TEMPLATE DNA</span><strong>Constitution institutionnelle</strong></header>
        <section><h3>Slots</h3>{selected.slots.map((slot) => <div key={slot.id}><span>{slot.required ? <CheckCircle2/> : <CircleDot/>}<strong>{slot.label}</strong></span><small>{slot.kind}{slot.locked ? " · verrouillé" : ""}{slot.limit ? ` · ${slot.limit}` : ""}</small></div>)}</section>
        <section><h3>Zones verrouillées</h3><ul>{selected.lockedZones.map((rule) => <li key={rule}><ShieldCheck/>{rule}</li>)}</ul></section>
        <section><h3>Adaptations autorisées</h3><ul>{selected.allowedAdaptations.map((rule) => <li key={rule}><GitBranch/>{rule}</li>)}</ul></section>
        <section><h3>Preuves</h3><ul>{selected.evidence.map((rule) => <li key={rule}><CheckCircle2/>{rule}</li>)}</ul></section>
        {notice ? <div className={styles.inlineNotice} aria-live="polite">{notice}</div> : null}
        <DominantAction onClick={() => void synchronize()} disabled={busy}>{busy ? "Synchronisation…" : persisted.has(selected.id) ? "Mettre à jour le registre" : "Synchroniser au registre"}</DominantAction>
      </aside>
    </section>

    <section className={styles.variantAuthority}>
      <div>
        <SectionTitle eyebrow="VARIANT MATRIX" title="Une constitution, plusieurs sorties maîtrisées" description="Les variantes restent intentionnelles et identifiables. Elles ne remplacent jamais silencieusement la composition maître." />
        <div className={styles.variantMatrix}>{selected.outputProfiles.map((profile) => <article key={profile.id}><header><span>{profile.orientation}</span><TonePill tone="success">Contractuel</TonePill></header><strong>{profile.label}</strong><p>{profile.dimensions}</p><small>{profile.safeZone}</small></article>)}</div>
        <section className={styles.templateVersionAuthority}><header><History/><span><small>VERSION AUTHORITY</small><strong>{selected.version} · {selected.status}</strong></span></header><div>{["Draft","Under test","Approved","Active","Superseded","Suspended","Retired"].map((state) => <TonePill key={state} tone={state === selected.status ? "success" : state === "Active" && selected.status === "Active" ? "success" : "neutral"}>{state}</TonePill>)}</div><p>Une modification produit une nouvelle version gouvernée. L’architecture active et ses usages ne sont jamais écrasés silencieusement.</p></section>
      </div>
      <aside className={styles.templateImpact}>
        <header><FileWarning/><span><small>IMPACT INSPECTOR</small><strong>Avant toute modification active</strong></span></header>
        <p>Le registre expose actuellement <b>{registry.assets.filter((asset) => String(asset.metadata?.templateId || "") === selected.id).length}</b> asset(s) liés et <b>{registry.documents.filter((document) => String(document.metadata?.templateId || "") === selected.id).length}</b> document(s) liés.</p>
        <ul><li><Layers3/>Créer une nouvelle version, jamais écraser l’active.</li><li><RefreshCcw/>Identifier les exports et variantes à régénérer.</li><li><ShieldCheck/>Exiger la même autorité que la constitution.</li></ul>
        <Link href={`/market-os/content-command-center/studio/quick-create?template=${encodeURIComponent(selected.id)}`}>Créer avec ce template <ArrowRight/></Link>
      </aside>
    </section>
  </main>
}

"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowRight,
  BookOpenCheck,
  Boxes,
  Building2,
  CheckCircle2,
  FileText,
  Image,
  Layers3,
  Plus,
  Printer,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react"
import { PageStatus } from "./primitives"
import { CONTENT_FAMILIES, headquartersAction, statusLabel, useHeadquartersSnapshot } from "./client"
import {
  CommandHero,
  EmptyOperational,
  MetricCard,
  ProductionCanvas,
  SectionHeading,
  StatusPill,
  TextLink,
  TruthNotice,
  styles,
} from "../production/production-ui"
import { STUDIO_DEFINITIONS, productionStatusTone } from "../production/production-model"

type FormState = {
  title: string
  family: string
  category: string
  subcategory: string
  serviceKey: string
  serviceLabel: string
  audience: string
  city: string
  language: string
  channel: string
  journeyStage: string
  objective: string
  messagePillar: string
  offer: string
  cta: string
  ownerName: string
  reviewerName: string
  dueAt: string
  campaignLabel: string
  requiredOutput: string
  constraints: string
}

const initial: FormState = {
  title: "",
  family: "digital",
  category: "Photos produits ou service",
  subcategory: "A.A ANGELCARE ACADEMY",
  serviceKey: "academy",
  serviceLabel: "ANGELCARE Academy",
  audience: "",
  city: "Rabat",
  language: "fr",
  channel: "Instagram",
  journeyStage: "awareness",
  objective: "",
  messagePillar: "",
  offer: "",
  cta: "",
  ownerName: "",
  reviewerName: "",
  dueAt: "",
  campaignLabel: "",
  requiredOutput: "",
  constraints: "",
}

const portalIcons = { digital: Image, print_offline: Printer, corporate_document: Building2 } as const

export default function StudioWorkspace() {
  const { snapshot, loading, error, refresh } = useHeadquartersSnapshot()
  const [family, setFamily] = React.useState<FormState["family"]>(initial.family)
  const [open, setOpen] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [form, setForm] = React.useState<FormState>(initial)
  const familyData = CONTENT_FAMILIES.find((item) => item.id === family) ?? CONTENT_FAMILIES[0]
  const selectedStudio = STUDIO_DEFINITIONS.find((item) => item.id === family) ?? STUDIO_DEFINITIONS[0]
  const dossiers = snapshot?.dossiers ?? []
  const active = dossiers.filter((item) => ["in_creation", "checkpoint_review", "draft_submitted", "revision"].includes(item.status))
  const checkpoint = dossiers.filter((item) => item.status === "checkpoint_review")
  const sourceRequired = dossiers.filter((item) => item.status === "source_required")

  function choose(next: string) {
    const selected = CONTENT_FAMILIES.find((item) => item.id === next) ?? CONTENT_FAMILIES[0]
    setFamily(next)
    setForm({
      ...initial,
      family: next,
      category: selected.categories[0],
      subcategory: selected.subcategories[0],
      channel: next === "digital" ? "Instagram" : next === "print_offline" ? "Print Shop" : "Internal Workspace",
    })
    setOpen(true)
  }

  async function create() {
    setBusy(true)
    try {
      await headquartersAction("create_dossier", {
        ...form,
        scopeConstitution: {
          requiredOutput: form.requiredOutput,
          constraints: form.constraints,
          checkpoints: ["brief", "creative_direction", "first_draft", "evidence_submission", "review_readiness"],
        },
        brief: {
          objective: form.objective,
          audience: form.audience,
          message: form.messagePillar,
          offer: form.offer,
          cta: form.cta,
        },
      })
      setOpen(false)
      setForm(initial)
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  return <ProductionCanvas>
    <PageStatus loading={loading} error={error} migrationReady={snapshot?.migrationReady} refresh={refresh} />
    <CommandHero
      eyebrow="ANGELCARE CREATIVE PRODUCTION HEADQUARTERS"
      title="Trois studios spécialisés. Une seule discipline institutionnelle."
      description="Chaque production naît d’un dossier autorisé, d’un brief, d’un périmètre, de versions et de preuves. Le Studio ne remplace jamais la gouvernance: il la rend visible pendant la création."
      icon={WandSparkles}
      tone="violet"
      metrics={[
        { label: "Productions actives", value: active.length, detail: "Dossiers observés dans une phase de création ou correction" },
        { label: "Points de contrôle", value: checkpoint.length, detail: "Productions attendant une inspection de checkpoint" },
        { label: "Sources requises", value: sourceRequired.length, detail: "État réel du snapshot, sans source inventée" },
      ]}
      actions={<>
        <button className={styles.primaryAction} onClick={() => choose("digital")}><Plus /> Nouvelle production</button>
        <Link className={styles.secondaryAction} href="/market-os/content-command-center/evidence"><ShieldCheck /> Ouvrir Evidence Lab</Link>
        <Link className={styles.secondaryAction} href="/market-os/content-command-center/review"><BookOpenCheck /> Ouvrir la révision</Link>
      </>}
    />

    <section className={styles.metricGrid} aria-label="État de production">
      <MetricCard icon={Layers3} label="Dossiers institutionnels" value={dossiers.length} detail="Source Headquarters existante" tone="info" />
      <MetricCard icon={Sparkles} label="Création ou correction" value={active.length} detail="Charge de production observée" tone={active.length ? "violet" : "neutral"} />
      <MetricCard icon={ShieldCheck} label="Checkpoint review" value={checkpoint.length} detail="Éléments nécessitant un contrôle" tone={checkpoint.length ? "warning" : "success"} />
      <MetricCard icon={Boxes} label="Taxonomie studio" value="3" detail="Digital, Print & Field, Corporate Documentation" tone="success" />
    </section>

    <section className={styles.studioGrid} aria-label="Sélection des studios">
      {STUDIO_DEFINITIONS.map((studio) => {
        const Icon = portalIcons[studio.id]
        const portalClass = studio.id === "digital" ? styles.studioDigital : studio.id === "print_offline" ? styles.studioPrint : styles.studioCorporate
        return <button key={studio.id} type="button" className={`${styles.studioPortal} ${portalClass}`} onClick={() => choose(studio.id)}>
          <span><Icon /></span>
          <small>{studio.code}</small>
          <h2>{studio.label}</h2>
          <p>{studio.description}</p>
          <ul>{studio.outputs.slice(0, 4).map((output) => <li key={output}><CheckCircle2 />{output}</li>)}</ul>
          <b>Constituer la production <ArrowRight /></b>
        </button>
      })}
    </section>

    <section className={styles.section}>
      <SectionHeading
        eyebrow="PRODUCTION RUNWAY"
        title="Working version system · travail créatif actuellement gouverné"
        description="La liste reste liée au snapshot Headquarters. Une absence de données produit un état vide, jamais des cartes de démonstration présentées comme réelles."
        action={<TextLink href="/market-os/content-command-center/dossiers/active">Dossiers opérationnels</TextLink>}
      />
      {active.length ? <div className={styles.cardGrid}>{active.slice(0, 6).map((dossier) => <article className={styles.assetCard} key={dossier.id}>
        <header><StatusPill tone={productionStatusTone(dossier.status)}>{statusLabel(dossier.status)}</StatusPill><span className={styles.statusPill}>{dossier.content_code}</span></header>
        <h3>{dossier.title}</h3>
        <p>{dossier.owner_name || "Responsable à affecter"}</p>
        <div className={styles.assetMeta}><div><span>Famille</span><strong>{dossier.family || "Non renseignée"}</strong></div><div><span>Échéance</span><strong>{dossier.due_at ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(dossier.due_at)) : "Non renseignée"}</strong></div></div>
        <footer><Link className={styles.quietAction} href={`/market-os/content-command-center/dossiers/${dossier.id}`}>Ouvrir Dossier 360 <ArrowRight /></Link></footer>
      </article>)}</div> : <EmptyOperational title="Aucune production active" detail="Les dossiers entrant en création, checkpoint, soumission ou correction apparaîtront ici depuis le snapshot institutionnel." action="Créer un dossier" href="/market-os/content-command-center/create" />}
    </section>

    <section className={styles.section}>
      <SectionHeading eyebrow="GOVERNED CREATIVE CHAIN" title="Le premier pixel arrive après la constitution" description="Le Studio rend l’autorité et la preuve visibles avant, pendant et après la création." />
      <div className={styles.workflowRail}>{[
        ["Brief", "Objectif, audience et message"],
        ["Constitution", "Sortie, périmètre et interdits"],
        ["Direction", "Concept, copy et langage visuel"],
        ["Version", "Draft courant et historique"],
        ["Checkpoint", "Preuve et findings"],
        ["Review", "Correction et décision humaine"],
        ["Validation", "Destination formelle, hors scope MZ5"],
      ].map(([label, detail]) => <div key={label}><strong>{label}</strong><small>{detail}</small></div>)}</div>
    </section>

    {open ? <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="mz5-studio-title" onMouseDown={() => setOpen(false)}>
      <section className={styles.modal} onMouseDown={(event) => event.stopPropagation()}>
        <header><div><p>CREATIVE CONSTITUTION</p><h2 id="mz5-studio-title">{familyData.label}</h2></div><button type="button" aria-label="Fermer" onClick={() => setOpen(false)}>×</button></header>
        <div className={styles.modalBody}>
          <TruthNotice title="Création gouvernée" detail="Cette action utilise create_dossier dans le Headquarters existant. Elle ne crée pas un faux dossier local et ne vaut pas validation." tone="info" />
          <div className={styles.cardGrid} style={{ marginTop: 16 }}>
            <article className={styles.assetCard}><header><StatusPill tone="violet">Sorties du studio</StatusPill></header><h3>{selectedStudio.label}</h3><ul className={styles.truthList}>{selectedStudio.outputs.map((output) => <li key={output}><CheckCircle2 />{output}</li>)}</ul></article>
            <article className={styles.assetCard}><header><StatusPill tone="info">Checkpoints dédiés</StatusPill></header><h3>Chaîne de contrôle</h3><ul className={styles.truthList}>{selectedStudio.checkpoints.map((checkpoint) => <li key={checkpoint}><ShieldCheck />{checkpoint}</li>)}</ul></article>
            <article className={styles.assetCard}><header><StatusPill tone="warning">Limite contractuelle</StatusPill></header><h3>Versioning honnête</h3><p>Le dossier conserve les checkpoints et l’état. Un historique de fichiers complet reste indisponible tant que le backend ne le persiste pas.</p></article>
          </div>
          <div className={styles.formGrid} style={{ marginTop: 16 }}>
            <label className={styles.wide}>Titre de production<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
            <label>Catégorie<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{familyData.categories.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Sous-catégorie<select value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })}>{familyData.subcategories.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Service<input value={form.serviceLabel} onChange={(e) => setForm({ ...form, serviceLabel: e.target.value, serviceKey: e.target.value.toLowerCase().replace(/\W+/g, "_") })} /></label>
            <label>Campagne<input value={form.campaignLabel} onChange={(e) => setForm({ ...form, campaignLabel: e.target.value })} /></label>
            <label>Audience<input value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} /></label>
            <label>Ville<input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
            <label>Canal<input value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} /></label>
            <label>Étape parcours<select value={form.journeyStage} onChange={(e) => setForm({ ...form, journeyStage: e.target.value })}><option value="awareness">Notoriété</option><option value="consideration">Considération</option><option value="conversion">Conversion</option><option value="retention">Fidélisation</option><option value="authority">Autorité</option></select></label>
            <label className={styles.wide}>Objectif<textarea value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} /></label>
            <label className={styles.wide}>Pilier de message<textarea value={form.messagePillar} onChange={(e) => setForm({ ...form, messagePillar: e.target.value })} /></label>
            <label>Offre<input value={form.offer} onChange={(e) => setForm({ ...form, offer: e.target.value })} /></label>
            <label>CTA<input value={form.cta} onChange={(e) => setForm({ ...form, cta: e.target.value })} /></label>
            <label className={styles.wide}>Sortie exacte requise<textarea value={form.requiredOutput} onChange={(e) => setForm({ ...form, requiredOutput: e.target.value })} /></label>
            <label className={styles.wide}>Contraintes et éléments interdits<textarea value={form.constraints} onChange={(e) => setForm({ ...form, constraints: e.target.value })} /></label>
            <label>Responsable<input value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} /></label>
            <label>Reviewer<input value={form.reviewerName} onChange={(e) => setForm({ ...form, reviewerName: e.target.value })} /></label>
            <label>Échéance<input type="datetime-local" value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} /></label>
          </div>
        </div>
        <footer className={styles.modalFooter}><button className={styles.quietAction} type="button" onClick={() => setOpen(false)}>Annuler</button><button className={styles.primaryAction} type="button" disabled={busy || !form.title || !form.objective || !form.audience || !form.requiredOutput} onClick={() => void create()}><Plus /> Créer Dossier 360</button></footer>
      </section>
    </div> : null}
  </ProductionCanvas>
}

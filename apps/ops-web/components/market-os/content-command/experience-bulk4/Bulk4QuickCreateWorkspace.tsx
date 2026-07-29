"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowRight,
  BookOpenCheck,
  Boxes,
  BriefcaseBusiness,
  CheckCircle2,
  FileStack,
  GitBranch,
  Languages,
  LayoutTemplate,
  MapPinned,
  PackagePlus,
  Rocket,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { headquartersAction, CONTENT_FAMILIES } from "../headquarters/client"
import { loadStore, uid } from "../content-command-system"
import { BULK4_TEMPLATE_ESTATE, templateById } from "./bulk4-template-estate"
import { contextFromLocation, bulk4ContextHref, writeBulk4Context } from "./bulk4-context"
import type { Bulk4TemplateFamily, PreflightCheck, TemplateDNA } from "./bulk4-types"
import { Bulk4BrandCrown, DominantAction, PreflightPanel, SectionTitle, TonePill, styles } from "./Bulk4Shared"

type Origin = "brief" | "dossier" | "mission" | "task" | "asset" | "template" | "urgent"
type Objective = "inform" | "reassure" | "promote" | "convert" | "recruit" | "educate" | "report" | "activate" | "formalize"

const ORIGINS: Array<{ id: Origin; label: string; detail: string; icon: typeof Rocket }> = [
  { id: "brief", label: "Brief approuvé", detail: "Conserver objectif, audience, message et contraintes", icon: BookOpenCheck },
  { id: "dossier", label: "Dossier 360", detail: "Créer dans le cycle de contenu actif", icon: Boxes },
  { id: "mission", label: "Livrable mission", detail: "Transformer un livrable gouverné en production", icon: BriefcaseBusiness },
  { id: "task", label: "Tâche de production", detail: "Ouvrir le studio depuis le mandat d’exécution", icon: CheckCircle2 },
  { id: "asset", label: "Asset existant", detail: "Créer une variante sans écraser l’original", icon: FileStack },
  { id: "template", label: "Template DNA", detail: "Partir d’une constitution approuvée", icon: LayoutTemplate },
  { id: "urgent", label: "Communication urgente", detail: "Canal accéléré mais toujours contrôlé", icon: Rocket },
]

const OBJECTIVES: Array<{ id: Objective; label: string; icon: typeof Rocket }> = [
  { id: "inform", label: "Informer", icon: BookOpenCheck },
  { id: "reassure", label: "Rassurer", icon: ShieldCheck },
  { id: "promote", label: "Promouvoir", icon: Sparkles },
  { id: "convert", label: "Convertir", icon: Rocket },
  { id: "recruit", label: "Recruter", icon: BriefcaseBusiness },
  { id: "educate", label: "Éduquer", icon: BookOpenCheck },
  { id: "report", label: "Rapporter", icon: FileStack },
  { id: "activate", label: "Activer le terrain", icon: MapPinned },
  { id: "formalize", label: "Formaliser", icon: LayoutTemplate },
]

function familyForTemplate(template: TemplateDNA): "digital" | "print" | "documents" {
  return template.family === "print" ? "print" : template.family === "document" ? "documents" : "digital"
}

export default function Bulk4QuickCreateWorkspace() {
  const router = useRouter()
  const context = React.useMemo(() => contextFromLocation("/market-os/content-command-center/studio"), [])
  const [store] = React.useState(() => loadStore())
  const [step, setStep] = React.useState(0)
  const [origin, setOrigin] = React.useState<Origin>(context.dossierId ? "dossier" : context.taskId ? "task" : context.templateId ? "template" : "brief")
  const [objective, setObjective] = React.useState<Objective>("reassure")
  const [family, setFamily] = React.useState<Bulk4TemplateFamily>("digital")
  const [templateId, setTemplateId] = React.useState(context.templateId || BULK4_TEMPLATE_ESTATE.find((item) => item.family === "digital")?.id || "")
  const [title, setTitle] = React.useState(store.items.find((item) => item.id === context.dossierId)?.title || "")
  const [audience, setAudience] = React.useState(store.items.find((item) => item.id === context.dossierId)?.audience || "")
  const [message, setMessage] = React.useState(store.items.find((item) => item.id === context.dossierId)?.angle || "")
  const [cta, setCta] = React.useState(store.items.find((item) => item.id === context.dossierId)?.cta || "")
  const [city, setCity] = React.useState("Rabat")
  const [language, setLanguage] = React.useState("fr")
  const [owner, setOwner] = React.useState(store.items.find((item) => item.id === context.dossierId)?.owner || "Creative Producer")
  const [reviewer, setReviewer] = React.useState(store.items.find((item) => item.id === context.dossierId)?.reviewer || "Brand Manager")
  const [busy, setBusy] = React.useState(false)
  const [notice, setNotice] = React.useState("")
  const templates = BULK4_TEMPLATE_ESTATE.filter((template) => template.family === family)
  const template = templateById(templateId) || templates[0]
  const destination = template ? familyForTemplate(template) : "digital"

  React.useEffect(() => {
    if (!templates.some((item) => item.id === templateId) && templates[0]) setTemplateId(templates[0].id)
  }, [family, templateId, templates])

  const checks: PreflightCheck[] = [
    { id: "origin", label: "Origine", detail: ORIGINS.find((item) => item.id === origin)?.label || origin, passed: Boolean(origin), blocking: true },
    { id: "template", label: "Template DNA", detail: template ? `${template.code} · ${template.name}` : "Aucun template", passed: Boolean(template), blocking: true },
    { id: "title", label: "Production", detail: title || "Titre absent", passed: title.trim().length >= 4, blocking: true },
    { id: "message", label: "Message", detail: message || "Message absent", passed: message.trim().length >= 8, blocking: true },
    { id: "audience", label: "Audience", detail: audience || "Audience absente", passed: Boolean(audience), blocking: true },
    { id: "governance", label: "Owner / reviewer", detail: `${owner || "Owner absent"} · ${reviewer || "Reviewer absent"}`, passed: Boolean(owner && reviewer), blocking: true },
    { id: "context", label: "Contexte continu", detail: context.dossierId || context.taskId || context.missionId ? "Contexte reçu" : "Nouvelle initiative contrôlée", passed: true, blocking: false },
  ]
  const blockers = checks.filter((check) => check.blocking && !check.passed)

  async function launch() {
    if (!template || blockers.length) return
    setBusy(true)
    setNotice("")
    try {
      let dossierId = context.dossierId
      if (!dossierId) {
        const result = await headquartersAction("create_dossier", {
          title,
          family: template.family === "print" ? "print_offline" : template.family === "document" ? "corporate_document" : "digital",
          category: template.category,
          subcategory: template.name,
          serviceKey: "angelcare",
          serviceLabel: "ANGELCARE",
          audience,
          city,
          language,
          channel: template.channels[0] || "Internal Workspace",
          journeyStage: "production",
          objective: OBJECTIVES.find((item) => item.id === objective)?.label || objective,
          messagePillar: message,
          cta,
          ownerName: owner,
          reviewerName: reviewer,
          campaignLabel: "Creative Production Bulk 4",
          requiredOutput: template.outputProfiles.map((profile) => profile.label).join(" · "),
          constraints: template.prohibitedAdaptations.join(" · "),
          scopeConstitution: {
            templateId: template.id,
            templateCode: template.code,
            outputProfiles: template.outputProfiles,
            evidence: template.evidence,
            rules: template.rules,
          },
          brief: { objective, audience, message, cta },
        }) as { dossier?: { id?: string }; id?: string } | null
        dossierId = result?.dossier?.id || result?.id || undefined
      }
      const target = `/market-os/content-command-center/studio/${destination}`
      const href = bulk4ContextHref(target, {
        dossierId,
        dossierTitle: title,
        briefId: context.briefId,
        missionId: context.missionId,
        taskId: context.taskId,
        templateId: template.id,
        studio: destination,
        returnTo: context.returnTo || "/market-os/content-command-center?workspace=my-work",
      })
      writeBulk4Context({ dossierId, dossierTitle: title, briefId: context.briefId, missionId: context.missionId, taskId: context.taskId, templateId: template.id, studio: destination, sourceHref: typeof window !== "undefined" ? window.location.pathname + window.location.search : "/market-os/content-command-center/studio/quick-create", returnTo: context.returnTo || "/market-os/content-command-center?workspace=my-work", updatedAt: new Date().toISOString() })
      router.push(href)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "QUICK_CREATE_LAUNCH_FAILED")
    } finally {
      setBusy(false)
    }
  }

  return <main className={styles.bulk4Canvas} data-content-experience-bulk4="quick-create">
    <Bulk4BrandCrown eyebrow="CREATIVE LAUNCH CORRIDOR" title="Six décisions. Puis le bon studio, avec tout le contexte." description="Quick Create ne duplique pas aveuglément un fichier. Il constitue l’origine, l’objectif, la famille de sortie, le Template DNA, les responsabilités et le retour avant de créer ou poursuivre un dossier réel." returnTo={context.returnTo || "/market-os/content-command-center/studio"} />

    <section className={styles.launchProgress} aria-label="Progression Quick Create">
      {["Origine", "Objectif", "Famille", "Template", "Contexte", "Lancement"].map((label, index) => <button key={label} aria-current={step === index ? "step" : undefined} onClick={() => setStep(index)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{label}</strong><i/></button>)}
    </section>

    <section className={styles.launchCorridor}>
      <div className={styles.launchWorkbench}>
        {step === 0 ? <><SectionTitle eyebrow="01 · CREATION ORIGIN" title="D’où vient cette production?" description="L’origine reste visible dans le studio et dans le registre créé." /><div className={styles.originGrid}>{ORIGINS.map((item) => { const Icon = item.icon; return <button key={item.id} aria-pressed={origin === item.id} onClick={() => setOrigin(item.id)}><Icon/><span><strong>{item.label}</strong><small>{item.detail}</small></span>{origin === item.id ? <CheckCircle2/> : null}</button>})}</div></> : null}
        {step === 1 ? <><SectionTitle eyebrow="02 · BUSINESS OBJECTIVE" title="Quel mouvement doit produire le contenu?" description="L’objectif oriente la structure, mais ne remplace jamais le brief." /><div className={styles.objectiveGrid}>{OBJECTIVES.map((item) => { const Icon = item.icon; return <button key={item.id} aria-pressed={objective === item.id} onClick={() => setObjective(item.id)}><Icon/><strong>{item.label}</strong></button>})}</div></> : null}
        {step === 2 ? <><SectionTitle eyebrow="03 · OUTPUT FAMILY" title="Choisir une famille de production" description="Chaque famille ouvre une architecture différente, pas un éditeur générique." /><div className={styles.familyLaunchGrid}>{(["digital","print","document"] as Bulk4TemplateFamily[]).map((item) => <button key={item} aria-pressed={family === item} onClick={() => setFamily(item)}><span>{item === "digital" ? <Sparkles/> : item === "print" ? <MapPinned/> : <FileStack/>}</span><strong>{item === "digital" ? "Digital Campaign" : item === "print" ? "Print & Field" : "Corporate Documentation"}</strong><small>{BULK4_TEMPLATE_ESTATE.filter((template) => template.family === item).length} constitutions</small></button>)}</div></> : null}
        {step === 3 ? <><SectionTitle eyebrow="04 · TEMPLATE DNA" title="Sélection structurelle" description="Les recommandations reposent sur la famille et le contexte saisis — aucune prétention AI non supportée." /><div className={styles.templateRecommendationGrid}>{templates.map((item) => <button key={item.id} aria-pressed={templateId === item.id} onClick={() => setTemplateId(item.id)}><span>{item.code}</span><strong>{item.name}</strong><p>{item.purpose}</p><small>{item.anatomy.slice(0, 3).join(" · ")}</small></button>)}</div></> : null}
        {step === 4 ? <><SectionTitle eyebrow="05 · REQUIRED CONTEXT" title="Constituer le mandat avant le lancement" description="Le studio reçoit le message, l’audience, le lieu, la langue et les responsabilités." /><div className={styles.formGrid}><label>Titre<input value={title} onChange={(event) => setTitle(event.target.value)}/></label><label>Audience<input value={audience} onChange={(event) => setAudience(event.target.value)}/></label><label className={styles.wide}>Message<textarea value={message} onChange={(event) => setMessage(event.target.value)}/></label><label>CTA<input value={cta} onChange={(event) => setCta(event.target.value)}/></label><label>Ville<input value={city} onChange={(event) => setCity(event.target.value)}/></label><label>Langue<select value={language} onChange={(event) => setLanguage(event.target.value)}><option value="fr">Français</option><option value="ar">Arabe</option><option value="en">English</option></select></label><label>Owner<input value={owner} onChange={(event) => setOwner(event.target.value)}/></label><label>Reviewer<input value={reviewer} onChange={(event) => setReviewer(event.target.value)}/></label></div></> : null}
        {step === 5 ? <><SectionTitle eyebrow="06 · LAUNCH READINESS" title="Résumé de constitution" description="Le lancement crée ou poursuit un dossier réel, puis ouvre le studio spécialisé avec le contexte préservé." /><div className={styles.launchSummary}><article><Rocket/><span><small>ORIGINE</small><strong>{ORIGINS.find((item) => item.id === origin)?.label}</strong></span></article><article><WandSparkles/><span><small>OBJECTIF</small><strong>{OBJECTIVES.find((item) => item.id === objective)?.label}</strong></span></article><article><LayoutTemplate/><span><small>TEMPLATE</small><strong>{template?.code} · {template?.name}</strong></span></article><article><PackagePlus/><span><small>DESTINATION</small><strong>{destination}</strong></span></article><article><Languages/><span><small>LOCALISATION</small><strong>{language.toUpperCase()} · {city}</strong></span></article><article><BriefcaseBusiness/><span><small>RESPONSABILITÉ</small><strong>{owner} → {reviewer}</strong></span></article></div><PreflightPanel checks={checks} title="Creative launch readiness" />{notice ? <div className={styles.inlineNotice} aria-live="polite">{notice}</div> : null}<DominantAction onClick={() => void launch()} disabled={busy || blockers.length > 0}>{busy ? "Constitution en cours…" : context.dossierId ? "Continuer dans le studio" : "Créer et ouvrir le studio"}</DominantAction></> : null}
      </div>

      <aside className={styles.launchContextRail}>
        <header><ShieldCheck/><span><small>PERSISTENT CONTEXT</small><strong>Le record reste identique</strong></span></header>
        <dl><div><dt>Dossier</dt><dd>{context.dossierId || "À créer"}</dd></div><div><dt>Mission</dt><dd>{context.missionId || "Non fournie"}</dd></div><div><dt>Tâche</dt><dd>{context.taskId || "Non fournie"}</dd></div><div><dt>Brief</dt><dd>{context.briefId || "Non fourni"}</dd></div><div><dt>Retour</dt><dd>{context.returnTo || "Creative Universe"}</dd></div></dl>
        {template ? <section><small>TEMPLATE SELECTED</small><strong>{template.name}</strong><p>{template.purpose}</p><ul>{template.rules.slice(0, 4).map((rule) => <li key={rule}><CheckCircle2/>{rule}</li>)}</ul></section> : null}
        <div className={styles.launchNavigation}><button disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}>Précédent</button><button disabled={step === 5} onClick={() => setStep((current) => Math.min(5, current + 1))}>Continuer <ArrowRight/></button></div>
      </aside>
    </section>
  </main>
}

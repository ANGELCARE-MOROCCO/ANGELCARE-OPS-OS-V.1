"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import {
  Activity,
  AlertOctagon,
  ArrowLeft,
  ArrowRight,
  Bot,
  Boxes,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Clock3,
  Download,
  ExternalLink,
  FileArchive,
  FileCheck2,
  FileImage,
  FilePenLine,
  FileText,
  Flag,
  GitBranch,
  ImagePlus,
  Languages,
  Link2,
  ListChecks,
  MapPin,
  Megaphone,
  MessageSquareText,
  Network,
  PackageCheck,
  PencilLine,
  Radar,
  Route,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  UploadCloud,
  UserRound,
  UserRoundCheck,
  UsersRound,
  Workflow,
} from "lucide-react"
import type { DossierDecisionVM, DossierLifecycleStage, DossierViewModel, Severity } from "../mz2-view-models"
import { formatDateFr, humanStatus, severityFor } from "../mz2-view-models"
import styles from "../mz2-executive-dossier.module.css"

function severityClass(value: Severity) {
  return styles[`severity_${value}`] || styles.severity_neutral
}

function EmptyChamber({ title, detail, action, href }: { title: string; detail: string; action?: string; href?: string }) {
  return <div className={styles.chamberEmpty}><span>AC</span><div><strong>{title}</strong><p>{detail}</p></div>{action && href ? <Link href={href}>{action}<ArrowRight/></Link> : null}</div>
}

function DossierSectionHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <header className={styles.dossierSectionHeading}><div><span>{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>{action}</header>
}

export function DossierIdentityHeader({ dossier }: { dossier: DossierViewModel }) {
  const facts = [
    { label: "Service", value: dossier.service, icon: BriefcaseBusiness },
    { label: "Audience", value: dossier.audience, icon: UsersRound },
    { label: "Ville", value: dossier.city, icon: MapPin },
    { label: "Langue", value: dossier.language, icon: Languages },
    { label: "Canal", value: dossier.channel, icon: Megaphone },
    { label: "Échéance", value: dossier.dueAt ? formatDateFr(dossier.dueAt) : "Non définie", icon: CalendarClock },
  ]
  return <section className={styles.dossierIdentity} aria-labelledby="cc-mz2-dossier-title">
    <div className={styles.dossierIdentityMain}>
      <Link className={styles.backLink} href="/market-os/content-command-center/directory"><ArrowLeft/> Content Atlas</Link>
      <div className={styles.dossierCodeRow}><span>{dossier.code}</span><i aria-hidden="true"/><strong>{dossier.sourceType === "legacy" ? "COMPATIBILITÉ HISTORIQUE" : "DOSSIER INSTITUTIONNEL"}</strong></div>
      <h1 id="cc-mz2-dossier-title">{dossier.title}</h1>
      <p>{dossier.family} · {dossier.category} · {dossier.subcategory}</p>
      <div className={styles.dossierStateRow}>
        <span className={`${styles.dossierState} ${severityClass(dossier.risk)}`}><i aria-hidden="true"/>{humanStatus(dossier.status)}</span>
        <span><UserRound/> {dossier.owner}</span>
        <span><UserRoundCheck/> {dossier.reviewer}</span>
        {dossier.partial ? <span className={styles.partialState}><CircleAlert/> Données historiques partielles</span> : null}
      </div>
    </div>
    <aside className={styles.dossierIdentityMetrics}>
      <div className={styles.dossierScore}><small>PROGRESSION</small><strong>{dossier.progress === null ? "—" : `${dossier.progress}%`}</strong><i aria-hidden="true"><b style={{ width: `${dossier.progress ?? 0}%` }}/></i></div>
      <div className={styles.dossierScore}><small>READINESS</small><strong>{dossier.readiness === null ? "—" : `${dossier.readiness}%`}</strong><i aria-hidden="true"><b style={{ width: `${dossier.readiness ?? 0}%` }}/></i></div>
      <div className={styles.identityFacts}>{facts.map((fact) => { const Icon = fact.icon; return <span key={fact.label}><Icon/><small>{fact.label}</small><strong>{fact.value}</strong></span> })}</div>
      <small className={styles.identityFreshness}>Dernière actualisation : {dossier.updatedAt ? formatDateFr(dossier.updatedAt, true) : "Non disponible"}</small>
    </aside>
  </section>
}

const lifecycleStateClass: Record<DossierLifecycleStage["state"], string> = {
  complete: styles.lifecycle_complete,
  current: styles.lifecycle_current,
  blocked: styles.lifecycle_blocked,
  waiting: styles.lifecycle_waiting,
  future: styles.lifecycle_future,
  skipped: styles.lifecycle_skipped,
}

function lifecycleIcon(state: DossierLifecycleStage["state"]) {
  if (state === "complete") return <Check aria-hidden="true"/>
  if (state === "blocked") return <AlertOctagon aria-hidden="true"/>
  if (state === "current") return <Sparkles aria-hidden="true"/>
  return <span aria-hidden="true"/>
}

export function DossierLifecycleSpine({ dossier }: { dossier: DossierViewModel }) {
  return <nav className={styles.dossierLifecycle} aria-label="Cycle de vie du dossier">
    <header><Route/><span><small>CYCLE DE VIE</small><strong>{humanStatus(dossier.currentStage)}</strong></span></header>
    <ol>{dossier.lifecycle.map((stage, index) => <li key={stage.key} className={lifecycleStateClass[stage.state]} aria-current={stage.state === "current" || stage.state === "blocked" ? "step" : undefined}>
      <span className={styles.stageMarker}>{lifecycleIcon(stage.state)}</span>
      <div><small>{String(index + 1).padStart(2, "0")}</small><strong>{stage.label}</strong><span>{stage.detail}</span></div>
    </li>)}</ol>
  </nav>
}

export function DossierConstitution({ dossier }: { dossier: DossierViewModel }) {
  const lists = [
    { label: "Dans le périmètre", values: dossier.constitution.inScope, icon: CheckCircle2, tone: "success" as Severity },
    { label: "Hors périmètre", values: dossier.constitution.outOfScope, icon: ShieldAlert, tone: "critical" as Severity },
    { label: "Éléments obligatoires", values: dossier.constitution.mandatory, icon: ClipboardCheck, tone: "info" as Severity },
    { label: "Éléments interdits", values: dossier.constitution.prohibited, icon: AlertOctagon, tone: "warning" as Severity },
  ]
  return <section id="constitution" className={styles.dossierChamber}>
    <DossierSectionHeading eyebrow="DOSSIER CONSTITUTION" title="Le contrat opérationnel du contenu" description="Objectif, message, livrable, périmètre et critères de complétion sont séparés pour empêcher toute dérive de production." action={<span className={`${styles.constitutionState} ${severityClass(severityFor(dossier.constitution.state))}`}><ShieldCheck/>{humanStatus(dossier.constitution.state)}</span>}/>
    <div className={styles.constitutionCore}>
      <article><Target/><small>OBJECTIF MÉTIER</small><strong>{dossier.constitution.objective}</strong></article>
      <article><Radar/><small>OBJECTIF DE CONTENU</small><strong>{dossier.constitution.contentObjective}</strong></article>
      <article><MessageSquareText/><small>MESSAGE CENTRAL</small><strong>{dossier.constitution.message}</strong></article>
      <article><PackageCheck/><small>LIVRABLE REQUIS</small><strong>{dossier.constitution.requiredOutput}</strong></article>
      <article><Flag/><small>OFFRE</small><strong>{dossier.constitution.offer}</strong></article>
      <article><Send/><small>APPEL À L’ACTION</small><strong>{dossier.constitution.cta}</strong></article>
    </div>
    <div className={styles.scopeMatrix}>{lists.map((list) => { const Icon = list.icon; return <article key={list.label} className={severityClass(list.tone)}><header><Icon/><strong>{list.label}</strong><span>{list.values.length}</span></header>{list.values.length ? <ul>{list.values.map((value) => <li key={value}>{value}</li>)}</ul> : <p>Non documenté dans la source actuelle.</p>}</article> })}</div>
    <div className={styles.completionDefinition}><CheckCircle2/><div><small>DÉFINITION DE COMPLÉTION</small><strong>{dossier.constitution.completionDefinition}</strong></div></div>
    {dossier.constitution.constraints.length ? <div className={styles.constraintStrip}><AlertOctagon/><div><small>CONTRAINTES</small><span>{dossier.constitution.constraints.join(" · ")}</span></div></div> : null}
  </section>
}

export function DossierLineageOwnership({ dossier }: { dossier: DossierViewModel }) {
  return <section className={styles.lineageOwnershipGrid}>
    <article id="lineage" className={styles.lineagePanel}>
      <DossierSectionHeading eyebrow="STRATEGIC LINEAGE" title="Pourquoi ce dossier existe" description="La chaîne ne complète jamais automatiquement une relation absente."/>
      {dossier.lineage.length ? <div className={styles.lineageChain}>{dossier.lineage.map((node, index) => <Link href={node.href} key={`${node.type}-${node.title}`}><span>{String(index + 1).padStart(2, "0")}</span><div><small>{node.type}</small><strong>{node.title}</strong><p>{node.state}</p></div><ArrowRight/></Link>)}</div> : <EmptyChamber title="Lignée stratégique incomplète" detail="Aucun signal, stratégie, plan d’action ou mission lié n’est visible dans la source actuelle." action="Ouvrir la Fabrique stratégique" href="/market-os/content-command-center/strategies"/>}
    </article>
    <article id="ownership" className={styles.ownershipPanel}>
      <DossierSectionHeading eyebrow="OWNERSHIP & AUTHORITY" title="Responsabilité et autorité" description="Chaque responsabilité manquante est affichée comme un défaut opérationnel."/>
      <div className={styles.ownershipRows}>{dossier.ownership.map((entry) => <div key={entry.role} className={entry.state === "Manquant" ? styles.missingOwnership : ""}>
        <span className={styles.ownerAvatar}>{entry.person.split(/\s+/).filter(Boolean).slice(0,2).map((part) => part[0]).join("").toUpperCase() || "AC"}</span>
        <div><small>{entry.role}</small><strong>{entry.person}</strong></div>
        <span>{entry.state}</span>
      </div>)}</div>
    </article>
  </section>
}

export function DossierBrief({ dossier }: { dossier: DossierViewModel }) {
  return <section id="brief" className={styles.dossierChamber}>
    <DossierSectionHeading eyebrow="BRIEF CHAMBER" title="Le brief comme document stratégique lisible" description="Le dossier résume le brief sans remplacer la future Briefing Suite dédiée." action={<Link className={styles.chamberLink} href="/market-os/content-command-center/briefs">Ouvrir les briefs <ArrowRight/></Link>}/>
    <div className={styles.briefDocument}>
      <aside><FileText/><small>VERSION</small><strong>{dossier.brief.version}</strong><span className={severityClass(severityFor(dossier.brief.state))}>{humanStatus(dossier.brief.state)}</span></aside>
      <div className={styles.briefMain}>
        <section><small>OBJECTIF</small><p>{dossier.brief.objective}</p></section>
        <section><small>AUDIENCE</small><p>{dossier.brief.audience}</p></section>
        <section><small>PROBLÈME UTILISATEUR</small><p>{dossier.brief.userProblem}</p></section>
        <section className={styles.briefMessage}><small>MESSAGE CENTRAL</small><blockquote>{dossier.brief.coreMessage}</blockquote></section>
        <div className={styles.briefMeta}><span><strong>Format</strong>{dossier.brief.format}</span><span><strong>Ton</strong>{dossier.brief.tone}</span><span><strong>Échéance</strong>{dossier.brief.deadline ? formatDateFr(dossier.brief.deadline) : "Non définie"}</span></div>
        {dossier.brief.supportingMessages.length ? <section><small>MESSAGES DE SOUTIEN</small><ul>{dossier.brief.supportingMessages.map((message) => <li key={message}>{message}</li>)}</ul></section> : null}
      </div>
    </div>
  </section>
}

export function DossierExecution({ dossier }: { dossier: DossierViewModel }) {
  return <section id="execution" className={styles.dossierChamber}>
    <DossierSectionHeading eyebrow="EXECUTION & DEPENDENCIES" title="La chaîne de travail ordonnée" description="Les tâches montrent propriétaire, définition de complétion, échéance et blocage sans reconstruire Task Command dans le dossier." action={<Link className={styles.chamberLink} href="/market-os/content-command-center/tasks">Task Command <ArrowRight/></Link>}/>
    {dossier.tasks.length ? <div className={styles.executionGraph}>{dossier.tasks.map((task, index) => <Link href={task.href} key={task.id} className={`${styles.executionNode} ${severityClass(severityFor(task.status))}`}>
      <span className={styles.executionSequence}>{String(task.sequence || index + 1).padStart(2, "0")}</span>
      <div className={styles.executionCopy}><small>{humanStatus(task.status)}</small><strong>{task.title}</strong><p>{task.completion}</p></div>
      <dl><div><dt>Responsable</dt><dd>{task.owner}</dd></div><div><dt>Échéance</dt><dd>{task.dueAt ? formatDateFr(task.dueAt) : "Non définie"}</dd></div></dl>
      {task.blocker ? <span className={styles.blockerLabel}><AlertOctagon/>{task.blocker}</span> : <span className={styles.gateReady}><CheckCircle2/> Gate sans blocage déclaré</span>}
      <ArrowRight/>
    </Link>)}</div> : <EmptyChamber title="Plan d’exécution non disponible" detail="Aucune tâche ou checkpoint lié n’est visible. La constitution peut être prête sans qu’une mission ait encore été libérée." action="Ouvrir Mission Control" href="/market-os/content-command-center/missions"/>}
  </section>
}

export function DossierCreativeEvidence({ dossier, canGenerateSample, sampleBusy, onGenerateSample }: { dossier: DossierViewModel; canGenerateSample: boolean; sampleBusy: boolean; onGenerateSample: () => void }) {
  const primaryAsset = dossier.assets.find((asset) => asset.url) || dossier.assets[0]
  const primaryEvidence = dossier.evidence.find((item) => item.previewUrl) || dossier.evidence[0]
  return <section className={styles.creativeEvidenceGrid}>
    <article id="creative" className={styles.creativeWorkbench}>
      <DossierSectionHeading eyebrow="CREATIVE WORKBENCH" title="Production courante" description="Versions, références et assets restent distincts de la source canonique." action={<Link className={styles.chamberLink} href="/market-os/content-command-center/studio">Ouvrir le Studio <ArrowRight/></Link>}/>
      {primaryAsset ? <>
        <div className={styles.assetPreview}>{primaryAsset.url ? <img src={primaryAsset.url} alt={`Aperçu de ${primaryAsset.title}`}/> : <FileImage/>}<span>{primaryAsset.type}</span></div>
        <div className={styles.assetIdentity}><div><small>ASSET COURANT</small><strong>{primaryAsset.title}</strong><p>{primaryAsset.owner}</p></div><span className={severityClass(severityFor(primaryAsset.status))}>{humanStatus(primaryAsset.status)}</span></div>
        <div className={styles.assetStrip}>{dossier.assets.slice(0, 6).map((asset) => <span key={asset.id}>{asset.url ? <img src={asset.url} alt=""/> : <FileImage/>}<small>{asset.type}</small><strong>{asset.title}</strong></span>)}</div>
      </> : <EmptyChamber title="Aucune production créative visible" detail="Le dossier ne possède aucun asset ou sample dans la source consolidée." action="Ouvrir le Studio" href="/market-os/content-command-center/studio"/>}
      {dossier.sourceType === "headquarters" ? <button type="button" className={styles.sampleButton} disabled={!canGenerateSample || sampleBusy} onClick={onGenerateSample}><ImagePlus/>{sampleBusy ? "Génération…" : canGenerateSample ? "Générer une référence IA gouvernée" : "Crédits de référence épuisés"}</button> : null}
    </article>
    <article id="evidence" className={styles.evidenceChamber}>
      <DossierSectionHeading eyebrow="EVIDENCE CHAMBER" title="Preuve soumise et inspectable" description="La preuve est séparée de l’asset de travail et de la source éditable." action={<Link className={styles.chamberLink} href="/market-os/content-command-center/evidence">Evidence Lab <ArrowRight/></Link>}/>
      {primaryEvidence ? <>
        <div className={styles.evidencePreview}>{primaryEvidence.previewUrl ? <img src={primaryEvidence.previewUrl} alt={`Preuve : ${primaryEvidence.title}`}/> : <FileCheck2/>}<span>{primaryEvidence.type}</span></div>
        <div className={styles.evidencePrimary}><div><small>PREUVE PRINCIPALE</small><strong>{primaryEvidence.title}</strong><p>{primaryEvidence.note}</p><span>{primaryEvidence.actor} · {primaryEvidence.createdAt ? formatDateFr(primaryEvidence.createdAt, true) : "Date non disponible"}</span></div><span className={severityClass(severityFor(primaryEvidence.status))}>{humanStatus(primaryEvidence.status)}</span></div>
        <div className={styles.evidenceList}>{dossier.evidence.slice(0, 6).map((proof) => <div key={proof.id}><FileCheck2/><span><strong>{proof.title}</strong><small>{proof.filename}</small></span><b>{humanStatus(proof.status)}</b></div>)}</div>
      </> : <EmptyChamber title="Aucune preuve déposée" detail="Le prochain checkpoint doit produire une preuve identifiable avant décision." action="Déposer une preuve" href="/market-os/content-command-center/evidence"/>}
    </article>
  </section>
}

function DecisionIcon({ decision }: { decision: DossierDecisionVM }) {
  return decision.type === "AI" ? <Bot/> : decision.type === "AUTHORITY" ? <ShieldCheck/> : <UserRoundCheck/>
}

export function DossierDecisions({ dossier }: { dossier: DossierViewModel }) {
  return <section id="decisions" className={styles.dossierChamber}>
    <DossierSectionHeading eyebrow="REVIEW & VALIDATION HISTORY" title="Décisions séparées de la conversation" description="Les recommandations IA, décisions humaines et autorités finales restent explicitement distinctes." action={<Link className={styles.chamberLink} href="/market-os/content-command-center/validation">Validation Chamber <ArrowRight/></Link>}/>
    {dossier.decisions.length ? <div className={styles.decisionChronology}>{dossier.decisions.map((decision) => <article key={decision.id} className={`${styles.decisionEntry} ${decision.type === "AI" ? styles.aiDecision : styles.humanDecision}`}>
      <span className={styles.decisionIcon}><DecisionIcon decision={decision}/></span>
      <div><small>{decision.type === "AI" ? "RECOMMANDATION IA" : "DÉCISION HUMAINE"}</small><strong>{decision.title}</strong><p>{decision.summary}</p><span>{decision.actor} · {decision.createdAt ? formatDateFr(decision.createdAt, true) : "Date non disponible"}</span></div>
      <aside><span className={severityClass(severityFor(decision.result))}>{humanStatus(decision.result)}</span>{decision.score !== null ? <strong>{decision.score}/100</strong> : null}</aside>
    </article>)}</div> : <EmptyChamber title="Aucune décision enregistrée" detail="Le dossier n’expose encore aucune revue IA ou décision humaine horodatée." action="Ouvrir la révision" href="/market-os/content-command-center/review"/>}
  </section>
}

export function DossierSourcesDistribution({ dossier }: { dossier: DossierViewModel }) {
  const currentSource = dossier.sources.find((source) => source.current)
  return <section className={styles.sourceDistributionGrid}>
    <article id="sources" className={styles.sourceChain}>
      <DossierSectionHeading eyebrow="CANONICAL SOURCE & VERSIONS" title="Chaîne de source institutionnelle" description="Source éditable, version antérieure, rendition, export et preuve ne sont jamais traités comme équivalents." action={<Link className={styles.chamberLink} href="/market-os/content-command-center/source-vault">Source Vault <ArrowRight/></Link>}/>
      {currentSource ? <div className={styles.currentSource}>
        <FileArchive/>
        <div><small>SOURCE CANONIQUE COURANTE</small><strong>{currentSource.filename}</strong><p>Version {currentSource.version} · droits {currentSource.rights} · rétention {currentSource.retention}</p></div>
        <span className={severityClass(severityFor(currentSource.integrity))}>{humanStatus(currentSource.integrity)}</span>
      </div> : <div className={styles.missingSource}><ShieldAlert/><div><strong>Source canonique absente</strong><p>Le dossier ne peut pas être considéré pleinement préservé tant qu’une source éditable vérifiée n’est pas visible.</p></div><Link href="/market-os/content-command-center/source-vault"><UploadCloud/> Déposer la source</Link></div>}
      {dossier.sources.length ? <div className={styles.versionChain}>{dossier.sources.map((source) => <div key={source.id}><span>{source.kind === "canonical" ? <FileArchive/> : <FileText/>}</span><div><small>{source.kind.toUpperCase()}</small><strong>{source.filename}</strong><p>v{source.version} · {source.createdAt ? formatDateFr(source.createdAt) : "Date non disponible"}</p></div><b>{humanStatus(source.integrity)}</b></div>)}</div> : null}
    </article>
    <article id="distribution" className={styles.distributionSummary}>
      <DossierSectionHeading eyebrow="DISTRIBUTION & PUBLICATION" title="Traçabilité de la sortie" description="Le dossier résume l’état sans reproduire la Tour de diffusion." action={<Link className={styles.chamberLink} href="/market-os/content-command-center/distribution">Distribution Tower <ArrowRight/></Link>}/>
      {dossier.publications.length ? <div className={styles.publicationRows}>{dossier.publications.map((publication) => <div key={publication.id} className={severityClass(severityFor(publication.status))}>
        <span><Send/><small>{publication.channel}</small></span>
        <div><strong>{humanStatus(publication.status)}</strong><p>{publication.owner}</p><small>{publication.scheduledAt ? formatDateFr(publication.scheduledAt, true) : "Date non définie"}</small></div>
        {publication.externalUrl ? <a href={publication.externalUrl} target="_blank" rel="noreferrer" aria-label={`Ouvrir la publication ${publication.channel}`}><ExternalLink/></a> : <span className={styles.noExternalLink}>Preuve externe absente</span>}
      </div>)}</div> : <EmptyChamber title="Aucun package de diffusion" detail="Aucune publication planifiée ou vérifiée n’est liée à ce dossier." action="Préparer la diffusion" href="/market-os/content-command-center/distribution"/>}
    </article>
  </section>
}

export function DossierCollaborationAudit({ dossier }: { dossier: DossierViewModel }) {
  return <section id="audit" className={styles.auditChamber}>
    <DossierSectionHeading eyebrow="COLLABORATION & AUDIT" title="Historique conséquent et imputable" description="Le mode Audit du shell expose davantage de provenance sans mélanger les décisions avec les commentaires ordinaires."/>
    {dossier.activity.length ? <div className={styles.auditTimeline}>{dossier.activity.slice(0, 18).map((entry) => <article key={`${entry.id}-${entry.timestamp}`}><i aria-hidden="true"/><span><small>{formatDateFr(entry.timestamp, true)}</small><strong>{entry.action}</strong><p>{entry.detail}</p><b>{entry.actor}</b></span></article>)}</div> : <EmptyChamber title="Aucun événement d’audit visible" detail="La source actuelle ne fournit aucun événement horodaté associé au dossier."/>}
  </section>
}

export function DossierActionRail({ dossier }: { dossier: DossierViewModel }) {
  const actions = [
    dossier.sourceType === "legacy" ? { href: `/market-os/content-command-center/${dossier.id}/edit`, label: "Modifier le dossier", detail: "Édition gouvernée", icon: PencilLine } : null,
    { href: dossier.nextAction.href, label: dossier.nextAction.label, detail: dossier.nextAction.detail, icon: Sparkles },
    { href: "/market-os/content-command-center/tasks", label: "Ouvrir les tâches", detail: `${dossier.tasks.length} élément(s) lié(s)`, icon: ListChecks },
    { href: "/market-os/content-command-center/evidence", label: "Ouvrir les preuves", detail: `${dossier.evidence.length} preuve(s) visible(s)`, icon: FileCheck2 },
    { href: "/market-os/content-command-center/validation", label: "Ouvrir les décisions", detail: `${dossier.decisions.length} décision(s)`, icon: ShieldCheck },
    { href: "/market-os/content-command-center/source-vault", label: "Source canonique", detail: dossier.sources.some((source) => source.current) ? "Source courante visible" : "Source requise", icon: FileArchive },
    dossier.sourceType === "legacy" ? { href: `/market-os/content-command-center/${dossier.id}/delete`, label: "Contrôles de cycle de vie", detail: "Archiver, retirer ou supprimer", icon: ShieldAlert } : null,
  ].filter((action): action is { href: string; label: string; detail: string; icon: typeof Sparkles } => Boolean(action))
  return <aside className={styles.dossierActionRail} aria-label="Actions contextuelles du dossier">
    <header><Network/><span><small>PROCHAIN MOUVEMENT</small><strong>{dossier.nextAction.label}</strong><p>{dossier.nextAction.detail}</p></span></header>
    <div>{actions.map((action, index) => { const Icon = action.icon; return <Link href={action.href} key={`${action.href}-${action.label}`} className={index === 0 ? styles.primaryRailAction : ""}><Icon/><span><strong>{action.label}</strong><small>{action.detail}</small></span><ChevronRight/></Link> })}</div>
    <footer><ShieldCheck/><span><strong>Autorité visible</strong><small>{dossier.reviewer}</small></span></footer>
  </aside>
}

export function DossierSectionNavigation() {
  const links = [
    ["constitution", "Constitution"],
    ["lineage", "Lignée"],
    ["brief", "Brief"],
    ["execution", "Exécution"],
    ["creative", "Création"],
    ["evidence", "Preuves"],
    ["decisions", "Décisions"],
    ["sources", "Sources"],
    ["distribution", "Diffusion"],
    ["audit", "Audit"],
  ]
  return <nav className={styles.dossierSectionNav} aria-label="Sections du dossier">{links.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}</nav>
}

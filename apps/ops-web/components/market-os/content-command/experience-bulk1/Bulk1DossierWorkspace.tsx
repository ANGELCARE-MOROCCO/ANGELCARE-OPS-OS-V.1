"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BookOpenCheck,
  Blocks,
  Bot,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CircleDot,
  ClipboardCheck,
  Clock3,
  ExternalLink,
  Eye,
  DatabaseZap,
  FileArchive,
  FileCheck2,
  FileText,
  Fingerprint,
  Flag,
  Gauge,
  GitBranch,
  History,
  ImageIcon,
  Layers3,
  Lightbulb,
  LayoutTemplate,
  Link2,
  ListChecks,
  LoaderCircle,
  LockKeyhole,
  MessageSquareText,
  Network,
  Orbit,
  PackageCheck,
  PanelRightOpen,
  PencilLine,
  Play,
  Radio,
  RefreshCcw,
  RotateCcw,
  Route,
  Scale,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  UploadCloud,
  UserRoundCheck,
  UsersRound,
  Workflow,
  Wrench,
  X,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useContentStore } from "../content-command-system"
import { headquartersAction, useHeadquartersSnapshot } from "../headquarters/client"
import {
  buildLegacyDossierViewModel,
  buildLiveDossierViewModel,
  findLiveDossier,
  formatDateFr,
  humanStatus,
  record,
  severityFor,
  type DossierViewModel,
  type Severity,
} from "../headquarters/mz2-view-models"
import {
  currentLifecycleStage,
  dossierReadinessLabel,
  dossierRequirements,
  dossierStatusSummary,
  nextTaskAction,
  stageDescription,
  stageLabel,
  stageTone,
  type DossierRequirement,
} from "./bulk1-derivations"
import { contextualHref, writeBulk1Context } from "./bulk1-context"
import styles from "./bulk1-experience.module.css"

type ActionMode = "none" | "task" | "mission" | "review" | "publication"

function toneClass(severity: Severity): string {
  return styles[`tone_${severity}`] || styles.tone_neutral
}

function DossierStatus({ severity, children }: { severity: Severity; children: React.ReactNode }) {
  return <span className={`${styles.dossierStatus} ${toneClass(severity)}`}><i aria-hidden="true" />{children}</span>
}

function MetaPair({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className={styles.metaPair}><dt>{label}</dt><dd>{value}</dd></div>
}

function EmptyStage({ icon: Icon = CircleDot, title, detail }: { icon?: typeof CircleDot; title: string; detail: string }) {
  return <div className={styles.stageEmpty}><Icon/><div><strong>{title}</strong><p>{detail}</p></div></div>
}

function StageSectionTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <header className={styles.stageSectionTitle}><div><span>{eyebrow}</span><h3>{title}</h3><p>{description}</p></div>{action}</header>
}

function SpecialistLink({ href, dossier, label, icon: Icon = ArrowRight }: { href: string; dossier: DossierViewModel; label: string; icon?: typeof ArrowRight }) {
  const contextual = contextualHref(href, dossier.id, `/market-os/content-command-center/dossiers/${dossier.id}?stage=${dossier.currentStage}`, dossier.currentStage)
  return <Link className={styles.specialistLink} href={contextual}><Icon/>{label}<ArrowRight/></Link>
}

function IntelligenceStage({ dossier }: { dossier: DossierViewModel }) {
  return <div className={styles.stageGridTwo}>
    <article className={styles.stagePrimaryCard}>
      <StageSectionTitle eyebrow="INTELLIGENCE CONSTITUANTE" title="Pourquoi ce dossier existe" description="La raison métier, la lignée et le contexte doivent être lisibles avant toute production." action={<SpecialistLink href="/market-os/content-command-center/signals" dossier={dossier} label="Observatoire" icon={Target}/>}/>
      <div className={styles.statementBlock}><Target/><div><small>OBJECTIF MÉTIER</small><strong>{dossier.constitution.objective}</strong><p>{dossier.constitution.contentObjective}</p></div></div>
      <div className={styles.messageArchitecture}><div><small>PILIER DE MESSAGE</small><strong>{dossier.constitution.message}</strong></div><div><small>OFFRE</small><strong>{dossier.constitution.offer}</strong></div><div><small>CTA</small><strong>{dossier.constitution.cta}</strong></div></div>
    </article>
    <article className={styles.stageSecondaryCard}>
      <StageSectionTitle eyebrow="LIGNÉE INSTITUTIONNELLE" title="Relations amont" description="Aucune relation absente n’est inventée par l’interface."/>
      {dossier.lineage.length ? <div className={styles.lineageStack}>{dossier.lineage.map((item) => <Link href={contextualHref(item.href, dossier.id, `/market-os/content-command-center/dossiers/${dossier.id}`)} key={`${item.type}-${item.title}`}><span><GitBranch/><small>{item.type}</small></span><strong>{item.title}</strong><b>{item.state}</b><ChevronRight/></Link>)}</div> : <EmptyStage icon={GitBranch} title="Lignée amont non documentée" detail="Le snapshot ne fournit aucun signal, stratégie ou plan d’action lié à ce dossier."/>}
    </article>
  </div>
}

function StrategyBriefStage({ dossier, stage }: { dossier: DossierViewModel; stage: string }) {
  const isBrief = stage === "brief"
  return <div className={styles.authoringDesk}>
    <aside className={styles.authoringOutline}>
      <span>{isBrief ? "STRUCTURE DU BRIEF" : "CONSTITUTION STRATÉGIQUE"}</span>
      {["Objectif", "Audience", "Problème", "Message", "Format", "Canaux", "Ton", "Références", "Échéance"].map((item, index) => <button type="button" key={item} aria-current={index === 0 ? "step" : undefined}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong>{index < 5 ? <Check/> : <CircleDot/>}</button>)}
    </aside>
    <article className={styles.authoringCanvas}>
      <StageSectionTitle eyebrow={isBrief ? "BRIEF CONSTRUCTION DESK" : "STRATEGIC CONSTITUTION"} title={isBrief ? `Brief ${dossier.brief.version}` : "Direction et périmètre autorisés"} description={isBrief ? "L’objectif, l’audience, le message et le format restent dans le dossier pendant la constitution." : "La direction choisie est séparée du hors périmètre et des contraintes."} action={isBrief ? <><SpecialistLink href="/market-os/content-command-center/briefs" dossier={dossier} label="Briefing Suite" icon={FileText}/><SpecialistLink href="/market-os/content-command-center/brand-governance" dossier={dossier} label="Brand Governance" icon={ShieldCheck}/></> : <SpecialistLink href="/market-os/content-command-center/strategies" dossier={dossier} label="Fabrique stratégique" icon={GitBranch}/>}/>
      <div className={styles.authoringFields}>
        <label><span>Objectif</span><div>{dossier.brief.objective}</div></label>
        <label><span>Audience</span><div>{dossier.brief.audience}</div></label>
        <label className={styles.fieldWide}><span>Problème utilisateur</span><div>{dossier.brief.userProblem}</div></label>
        <label className={styles.fieldWide}><span>Message central</span><div>{dossier.brief.coreMessage}</div></label>
        <label><span>Format</span><div>{dossier.brief.format}</div></label>
        <label><span>Ton</span><div>{dossier.brief.tone}</div></label>
      </div>
      <div className={styles.scopeGuard}><section><span>INCLUS</span>{dossier.constitution.inScope.length ? dossier.constitution.inScope.map((item) => <p key={item}><Check/>{item}</p>) : <p><CircleDot/>Périmètre inclus non documenté</p>}</section><section><span>EXCLU</span>{dossier.constitution.outOfScope.length ? dossier.constitution.outOfScope.map((item) => <p key={item}><X/>{item}</p>) : <p><CircleDot/>Hors périmètre non documenté</p>}</section></div>
    </article>
  </div>
}

function PlanningStage({ dossier }: { dossier: DossierViewModel }) {
  return <div className={styles.planningSurface}>
    <StageSectionTitle eyebrow="TEMPORAL COMMAND" title="Fenêtre de production et de publication" description="Le dossier résume sa fenêtre sans reconstruire l’intégralité du Planning éditorial." action={<SpecialistLink href="/market-os/content-command-center/calendar" dossier={dossier} label="Planning éditorial" icon={CalendarClock}/>}/>
    <div className={styles.planningTimeline}>
      <div className={styles.timelineAxis}><span>MAINTENANT</span><i/><span>{dossier.dueAt ? formatDateFr(dossier.dueAt) : "Échéance non définie"}</span></div>
      <article><span><BriefcaseBusiness/></span><div><small>CAMPAGNE</small><strong>{dossier.campaign}</strong><p>{dossier.service} · {dossier.audience}</p></div></article>
      <article><span><Workflow/></span><div><small>PRODUCTION</small><strong>{dossier.constitution.requiredOutput}</strong><p>{dossier.owner}</p></div></article>
      <article><span><Send/></span><div><small>CANAL</small><strong>{dossier.channel}</strong><p>{dossier.city} · {dossier.language}</p></div></article>
    </div>
    <div className={styles.planningWarnings}><AlertTriangle/><div><strong>Impact de replanification</strong><p>Le snapshot du dossier ne fournit pas de collision déterministe détaillée. Ouvrez Planning éditorial pour inspecter les conflits de calendrier et de responsabilité.</p></div></div>
  </div>
}

function MissionTasksStage({ dossier, busy, onAction }: { dossier: DossierViewModel; busy: boolean; onAction: (mode: ActionMode) => void }) {
  const nextTask = nextTaskAction(dossier)
  return <div className={styles.missionCommand}>
    <section className={styles.missionReadiness}>
      <StageSectionTitle eyebrow="MISSION READINESS" title="Mandat, responsabilité et définition de complétion" description="La mission reste visible depuis le dossier. Bulk 3 ouvre Mission Control et le poste d’exécution avec le dossier, la mission et le point de retour préservés." action={<SpecialistLink href="/market-os/content-command-center/missions" dossier={dossier} label="Mission Control" icon={Workflow}/>}/>
      <div className={styles.missionMandate}><Target/><div><small>LIVRABLE REQUIS</small><strong>{dossier.constitution.requiredOutput}</strong><p>{dossier.constitution.completionDefinition}</p></div></div>
      <dl className={styles.missionFacts}><MetaPair label="Responsable" value={dossier.owner}/><MetaPair label="Réviseur" value={dossier.reviewer}/><MetaPair label="Sponsor" value={dossier.sponsor}/><MetaPair label="Échéance" value={dossier.dueAt ? formatDateFr(dossier.dueAt, true) : "Non définie"}/></dl>
      {dossier.missionId ? <button type="button" className={styles.inlinePrimaryAction} onClick={() => onAction("mission")} disabled={busy}><Play/> Contrôler la transition de mission</button> : <div className={styles.missingInline}><AlertTriangle/><span>Aucun identifiant de mission n’est exposé par la lignée consolidée.</span></div>}
    </section>
    <section className={styles.taskArchitecture}>
      <StageSectionTitle eyebrow="TASK ARCHITECTURE" title={`${dossier.tasks.length} étape(s) d’exécution`} description="Ordre, responsabilité, blocker et définition de complétion sont visibles sans quitter le dossier."/>
      {dossier.tasks.length ? <div className={styles.taskSequence}>{dossier.tasks.map((task) => <article key={task.id} className={task.blocker ? styles.taskBlocked : ""}><span>{String(task.sequence).padStart(2, "0")}</span><div><small>{humanStatus(task.status)} · {task.owner}</small><strong>{task.title}</strong><p>{task.completion}</p>{task.blocker ? <em><ShieldAlert/>{task.blocker}</em> : null}</div><Link href={contextualHref(`/market-os/content-command-center/tasks/execution?task=${task.id}&mission=${dossier.missionId || ""}`, dossier.id, `/market-os/content-command-center/dossiers/${dossier.id}?stage=assigned`)}>Exécuter <ChevronRight/></Link></article>)}</div> : <EmptyStage icon={ListChecks} title="Aucune tâche visible" detail="Le dossier ne fournit pas encore d’architecture de tâches exploitable."/>}
      {nextTask ? <button type="button" className={styles.inlinePrimaryAction} onClick={() => onAction("task")} disabled={busy}><Play/>{nextTask.label}</button> : <div className={styles.stageSuccess}><CheckCircle2/><span>Toutes les tâches visibles sont clôturées ou aucun travail actif n’est exposé.</span></div>}
    </section>
  </div>
}

function ProductionAssetsStage({ dossier }: { dossier: DossierViewModel }) {
  const studioHref = dossier.family === "print_offline" ? "/market-os/content-command-center/studio/print" : dossier.family === "corporate_document" ? "/market-os/content-command-center/studio/documents" : "/market-os/content-command-center/studio/digital"
  return <div className={styles.productionStudio}>
    <StageSectionTitle eyebrow="IN-DOSSIER CREATIVE COMMAND" title="Version, variantes, template et assets liés" description="Bulk 4 transforme cette étape en sas de production continu: le dossier, la mission, la tâche et le point de retour suivent l’employé vers le studio spécialisé." action={<><SpecialistLink href={studioHref} dossier={dossier} label="Ouvrir le studio spécialisé" icon={LayoutTemplate}/><SpecialistLink href="/market-os/content-command-center/studio/version-control" dossier={dossier} label="Comparer les versions" icon={GitBranch}/><SpecialistLink href="/market-os/content-command-center/assets" dossier={dossier} label="Asset Library" icon={ImageIcon}/></>}/>
    <div className={styles.productionHero}>
      <div className={styles.productionPreview}>{dossier.assets[0]?.url ? <img src={dossier.assets[0].url} alt={`Aperçu ${dossier.assets[0].title}`}/> : <><ImageIcon/><span>Aperçu de version non disponible</span></>}</div>
      <aside><small>VERSION COURANTE</small><strong>{dossier.assets[0]?.title || dossier.title}</strong><p>{dossier.constitution.requiredOutput}</p><dl><MetaPair label="Asset" value={dossier.assets[0] ? humanStatus(dossier.assets[0].status) : "Absent"}/><MetaPair label="Propriétaire" value={dossier.assets[0]?.owner || dossier.owner}/><MetaPair label="Canal" value={dossier.channel}/></dl></aside>
    </div>
    {dossier.assets.length ? <div className={styles.assetShelf}>{dossier.assets.slice(0, 8).map((asset, index) => <article key={asset.id}><div>{asset.url ? <img src={asset.url} alt=""/> : <ImageIcon/>}<span>V{index + 1}</span></div><strong>{asset.title}</strong><small>{asset.type} · {humanStatus(asset.status)}</small></article>)}</div> : <EmptyStage icon={ImageIcon} title="Aucun asset lié" detail="Le dossier ne contient aucun asset ou exemple généré dans le snapshot actuel."/>}
  </div>
}

function EvidenceStage({ dossier }: { dossier: DossierViewModel }) {
  const primary = dossier.evidence[0]
  return <div className={styles.evidenceLabInline}>
    <StageSectionTitle eyebrow="PROOF INSPECTION" title="Preuves, provenance et version concernée" description="La preuve est séparée de l’asset de travail et de la source éditable." action={<SpecialistLink href="/market-os/content-command-center/evidence" dossier={dossier} label="Evidence Lab" icon={Eye}/>}/>
    {primary ? <div className={styles.evidenceInspection}><div className={styles.evidenceViewer}>{primary.previewUrl ? <img src={primary.previewUrl} alt={`Preuve ${primary.title}`}/> : <FileCheck2/>}<span>{primary.type}</span></div><aside><DossierStatus severity={severityFor(primary.status)}>{humanStatus(primary.status)}</DossierStatus><small>PREUVE PRINCIPALE</small><strong>{primary.title}</strong><p>{primary.note}</p><dl><MetaPair label="Fichier" value={primary.filename}/><MetaPair label="Contributeur" value={primary.actor}/><MetaPair label="Date" value={primary.createdAt ? formatDateFr(primary.createdAt, true) : "Non disponible"}/></dl></aside></div> : <EmptyStage icon={FileCheck2} title="Preuve requise" detail="Aucune preuve inspectable n’est liée au dossier. Le passage en revue doit rester bloqué tant que cette condition critique n’est pas résolue."/>}
    <div className={styles.evidenceStrip}>{dossier.evidence.slice(0, 8).map((proof) => <article key={proof.id}><FileCheck2/><div><small>{proof.type}</small><strong>{proof.title}</strong><p>{proof.filename}</p></div><DossierStatus severity={severityFor(proof.status)}>{humanStatus(proof.status)}</DossierStatus></article>)}</div>
  </div>
}

function ReviewValidationStage({ dossier, stage, onAction }: { dossier: DossierViewModel; stage: string; onAction: (mode: ActionMode) => void }) {
  const isValidation = stage === "validated"
  return <div className={styles.authorityChamber}>
    <StageSectionTitle eyebrow={isValidation ? "FORMAL AUTHORITY" : "REVIEW & CORRECTION"} title={isValidation ? "Décision institutionnelle sur la bonne version" : "Findings, corrections et conclusion humaine"} description="L’IA reste un avis séparé. La conclusion humaine et ses conditions dominent la progression." action={<SpecialistLink href={isValidation ? "/market-os/content-command-center/validation" : "/market-os/content-command-center/review"} dossier={dossier} label={isValidation ? "Validation Chamber" : "Review Workspace"} icon={isValidation ? Scale : ClipboardCheck}/>}/>
    <div className={styles.decisionComparison}>
      <section className={styles.aiAdvice}><Bot/><span><small>INTERPRÉTATION IA</small><strong>{dossier.decisions.find((decision) => decision.type === "AI")?.title || "Aucun avis IA visible"}</strong><p>{dossier.decisions.find((decision) => decision.type === "AI")?.summary || "L’absence d’avis IA n’est pas remplacée par une recommandation fictive."}</p></span></section>
      <section className={styles.humanAuthority}><UserRoundCheck/><span><small>AUTORITÉ HUMAINE</small><strong>{dossier.decisions.find((decision) => decision.type !== "AI")?.title || "Décision requise"}</strong><p>{dossier.decisions.find((decision) => decision.type !== "AI")?.summary || `Responsable attendu : ${dossier.reviewer}.`}</p></span></section>
    </div>
    {dossier.decisions.length ? <div className={styles.decisionTimeline}>{dossier.decisions.map((decision) => <article key={decision.id}><span>{decision.type === "AI" ? <Bot/> : <ShieldCheck/>}</span><div><small>{decision.type === "AI" ? "RECOMMANDATION" : "DÉCISION"}</small><strong>{decision.title}</strong><p>{decision.summary}</p><em>{decision.actor} · {decision.createdAt ? formatDateFr(decision.createdAt, true) : "Date indisponible"}</em></div><DossierStatus severity={severityFor(decision.result)}>{humanStatus(decision.result)}</DossierStatus></article>)}</div> : null}
    <button type="button" className={styles.authorityAction} onClick={() => onAction("review")}><ShieldCheck/> Enregistrer une conclusion humaine</button>
  </div>
}

function SourceStage({ dossier }: { dossier: DossierViewModel }) {
  const current = dossier.sources.find((source) => source.current)
  return <div className={styles.sourceVaultInline}>
    <StageSectionTitle eyebrow="CANONICAL SOURCE AUTHORITY" title="Original éditable, versions et intégrité" description="Source canonique, rendition, export et preuve restent des classes différentes." action={<SpecialistLink href="/market-os/content-command-center/source-vault" dossier={dossier} label="Source Vault" icon={FileArchive}/>}/>
    {current ? <section className={styles.canonicalSource}><Fingerprint/><div><small>SOURCE CANONIQUE COURANTE</small><strong>{current.filename}</strong><p>Version {current.version} · droits {current.rights} · rétention {current.retention}</p></div><DossierStatus severity={severityFor(current.integrity)}>{humanStatus(current.integrity)}</DossierStatus></section> : <section className={styles.sourceMissing}><ShieldAlert/><div><strong>Source canonique absente</strong><p>La classification, la distribution et la mémoire institutionnelle restent incomplètes sans source éditable vérifiée.</p></div><SpecialistLink href="/market-os/content-command-center/source-vault" dossier={dossier} label="Déposer ou lier la source" icon={UploadCloud}/></section>}
    <div className={styles.versionStack}>{dossier.sources.map((source, index) => <article key={source.id}><span>{source.current ? <FileArchive/> : <FileText/>}</span><div><small>{source.kind.toUpperCase()}</small><strong>{source.filename}</strong><p>v{source.version} · {source.createdAt ? formatDateFr(source.createdAt) : "Date non disponible"}</p></div><em>{index === 0 ? "Courante" : "Historique"}</em></article>)}</div>
  </div>
}

function DistributionPublishingStage({ dossier, stage, onAction }: { dossier: DossierViewModel; stage: string; onAction: (mode: ActionMode) => void }) {
  const isPublishing = stage === "scheduled"
  return <div className={styles.releaseTowerInline}>
    <StageSectionTitle eyebrow={isPublishing ? "PUBLISHING CONTROL" : "DISTRIBUTION PREFLIGHT"} title={isPublishing ? "Exécuter, confirmer et vérifier la sortie" : "Assembler et autoriser le package de diffusion"} description="Le dossier conserve le package, le canal, l’autorité et la preuve. Les opérations de portefeuille restent dans les workspaces spécialisés." action={<SpecialistLink href={isPublishing ? "/market-os/content-command-center/publishing" : "/market-os/content-command-center/distribution"} dossier={dossier} label={isPublishing ? "Publishing Operations" : "Distribution Tower"} icon={isPublishing ? Radio : PackageCheck}/>}/>
    <div className={styles.releaseRunway}>{dossier.publications.length ? dossier.publications.map((publication, index) => <article key={publication.id} className={toneClass(severityFor(publication.status))}><span>{String(index + 1).padStart(2, "0")}</span><div><small>{publication.channel}</small><strong>{humanStatus(publication.status)}</strong><p>{publication.owner}</p><em>{publication.scheduledAt ? formatDateFr(publication.scheduledAt, true) : "Date non définie"}</em></div>{publication.externalUrl ? <a href={publication.externalUrl} target="_blank" rel="noreferrer"><ExternalLink/> Vérifier la référence</a> : <b>Preuve externe absente</b>}</article>) : <EmptyStage icon={PackageCheck} title="Aucun package lié" detail="Le dossier ne fournit aucune adaptation de canal ou publication planifiée."/>}</div>
    {isPublishing && dossier.publications.length ? <button type="button" className={styles.authorityAction} onClick={() => onAction("publication")}><Radio/> Confirmer une publication manuelle</button> : null}
  </div>
}

function PerformanceLearningStage({ dossier, stage }: { dossier: DossierViewModel; stage: string }) {
  const publication = dossier.publications.find((item) => item.status === "verified") || dossier.publications[0]
  const events = publication?.evidence || []
  const latest = (type: string) => [...events].reverse().find((item) => String(item.type || "") === type)
  const observation = latest("performance_observation")
  const conclusion = latest("performance_conclusion")
  const attribution = latest("attribution_conclusion")
  const optimization = latest("optimization_decision")
  const lesson = latest("institutional_lesson")
  const governance = latest("lesson_governance")
  const isClosed = stage === "closed"
  return <div className={styles.stageGridTwo}>
    <article className={styles.stagePrimaryCard}>
      <StageSectionTitle eyebrow={isClosed ? "INSTITUTIONAL MEMORY" : "IMPACT TRUTH"} title={isClosed ? "Leçon acceptée et lignée de clôture" : "Mesure, attribution et décision après publication"} description="Le dossier distingue la publication vérifiée, la provenance des métriques, la conclusion humaine, l’attribution et l’apprentissage." action={<SpecialistLink href={isClosed ? "/market-os/content-command-center/learning" : "/market-os/content-command-center/performance"} dossier={dossier} label={isClosed ? "Learning Chamber" : "Impact Observatory"} icon={isClosed ? BookOpenCheck : BarChart3}/>}/>
      {publication ? <div className={styles.releaseRunway}>{([
        [DatabaseZap, "Observation", observation ? String(observation.provenanceType || "Provenance documentée") : "À constituer", observation ? `${String(observation.observedFrom || "—")} → ${String(observation.observedTo || "—")}` : "Aucune métrique inventée"],
        [BarChart3, "Conclusion", conclusion ? humanStatus(String(conclusion.conclusion || "")) : "Absente", conclusion ? String(conclusion.summary || "") : "Suffisance humaine requise"],
        [Route, "Attribution", attribution ? humanStatus(String(attribution.conclusion || "")) : "Non établie", attribution ? String(attribution.evidenceBasis || "") : "Corrélation et causalité restent séparées"],
        [Wrench, "Optimisation", optimization ? humanStatus(String(optimization.decision || "")) : "À décider", optimization ? String(optimization.rationale || "") : "Aucune retouche silencieuse"],
        [Lightbulb, "Leçon", governance ? humanStatus(String(governance.decision || "")) : lesson ? "Brouillon" : "Absente", lesson ? String(lesson.title || "") : "Mémoire à constituer"],
      ] satisfies Array<[LucideIcon, string, string, string]>).map(([Icon, label, value, detail], index) => <article key={label} className={toneClass(severityFor(value))}><span>{String(index + 1).padStart(2,"0")}</span><div><small>{label}</small><strong>{value}</strong><p>{detail}</p><em>{publication.channel}</em></div><Icon/></article>)}</div> : <EmptyStage icon={BarChart3} title="Aucune publication liée" detail="La performance ne peut pas être constituée sans package publié et vérifié."/>}
    </article>
    <article className={styles.stageSecondaryCard}>
      <StageSectionTitle eyebrow="NEXT CYCLE" title="Retour gouverné vers le système" description="Les leçons acceptées peuvent informer le prochain cycle, sans modifier le publié historique."/>
      <div className={styles.decisionComparison}><div className={styles.aiAdvice}><Bot/><span><small>AI BOUNDARY</small><strong>Conseil seulement</strong><p>Le futur AI Director peut lire une leçon acceptée, jamais l’accepter lui-même.</p></span></div><div className={styles.humanAuthority}><UserRoundCheck/><span><small>HUMAN AUTHORITY</small><strong>{governance ? humanStatus(String(governance.decision || "")) : "Décision requise"}</strong><p>{governance ? String(governance.reason || "") : "L’autorité décide de l’acceptation, des limites et de la clôture."}</p></span></div></div>
      <div className={styles.versionStack}><article><span><Fingerprint/></span><div><small>VERSION PUBLIÉE</small><strong>{publication?.externalUrl || "Référence externe absente"}</strong><p>La version publiée reste immuable.</p></div><em>Historique</em></article><article><span><GitBranch/></span><div><small>PROCHAIN MOUVEMENT</small><strong>{optimization ? humanStatus(String(optimization.decision || "")) : "À décider"}</strong><p>{optimization ? String(optimization.affectedScope || "") : "Périmètre non constitué"}</p></div><em>Nouveau cycle</em></article></div>
    </article>
  </div>
}

function AuditStage({ dossier }: { dossier: DossierViewModel }) {
  return <div className={styles.auditRoomInline}>
    <StageSectionTitle eyebrow="INSTITUTIONAL MEMORY" title="Activité, handovers et décisions" description="Les événements restent horodatés et imputables. Aucun historique fictif n’est ajouté."/>
    {dossier.activity.length ? <div className={styles.auditStream}>{dossier.activity.slice(0, 30).map((entry, index) => <article key={`${entry.id}-${entry.timestamp}`}><span>{String(index + 1).padStart(2, "0")}</span><i aria-hidden="true"/><div><small>{formatDateFr(entry.timestamp, true)}</small><strong>{entry.action}</strong><p>{entry.detail}</p><em>{entry.actor}</em></div></article>)}</div> : <EmptyStage icon={History} title="Aucun événement visible" detail="Le snapshot ne fournit aucun événement horodaté associé à ce dossier."/>}
  </div>
}

function ActiveStageWorkspace({ dossier, stage, busy, onAction }: { dossier: DossierViewModel; stage: string; busy: boolean; onAction: (mode: ActionMode) => void }) {
  if (stage === "opportunity") return <IntelligenceStage dossier={dossier}/>
  if (["ideation", "brief", "scope_locked"].includes(stage)) return <StrategyBriefStage dossier={dossier} stage={stage}/>
  if (stage === "planned") return <PlanningStage dossier={dossier}/>
  if (stage === "assigned") return <MissionTasksStage dossier={dossier} busy={busy} onAction={onAction}/>
  if (stage === "in_creation") return <ProductionAssetsStage dossier={dossier}/>
  if (stage === "checkpoint_review") return <EvidenceStage dossier={dossier}/>
  if (["ai_review", "human_review", "validated"].includes(stage)) return <ReviewValidationStage dossier={dossier} stage={stage} onAction={onAction}/>
  if (["source_required", "classified"].includes(stage)) return <SourceStage dossier={dossier}/>
  if (["ready_distribution", "scheduled"].includes(stage)) return <DistributionPublishingStage dossier={dossier} stage={stage} onAction={onAction}/>
  if (["performance_review", "closed"].includes(stage)) return <PerformanceLearningStage dossier={dossier} stage={stage}/>
  return <AuditStage dossier={dossier}/>
}

function LifecycleSpine({ dossier, selected, onSelect }: { dossier: DossierViewModel; selected: string; onSelect: (stage: string) => void }) {
  return <nav className={styles.lifecycleSpine} aria-label="Cycle de vie du dossier">
    <header><Route/><span><small>LIFECYCLE COMMAND</small><strong>{dossier.lifecycle.length} gates gouvernés</strong></span></header>
    <div>{dossier.lifecycle.map((stage, index) => <button type="button" key={stage.key} aria-current={stage.key === selected ? "step" : undefined} data-stage-state={stage.state} onClick={() => onSelect(stage.key)}>
      <span>{stage.state === "complete" ? <Check/> : String(index + 1).padStart(2, "0")}</span>
      <div><strong>{stageLabel(stage.key)}</strong><small>{stage.state === "current" ? "Étape actuelle" : stage.state === "blocked" ? "Bloquée" : stage.state === "complete" ? "Gate franchi" : "Gate futur"}</small></div>
      <i className={toneClass(stageTone(stage))}/><ChevronRight/>
    </button>)}</div>
  </nav>
}

function RequirementInspector({ requirements, dossier, onNavigate }: { requirements: DossierRequirement[]; dossier: DossierViewModel; onNavigate: (href: string) => void }) {
  return <section className={styles.requirementInspector}>
    <header><ShieldAlert/><span><small>BLOCKING REQUIREMENTS</small><strong>{requirements.filter((item) => item.blocking && !item.resolved).length} condition(s) bloquante(s)</strong></span></header>
    <div>{requirements.slice(0, 6).map((requirement) => <article key={requirement.id} className={requirement.resolved ? styles.requirementResolved : requirement.blocking ? styles.requirementBlocking : ""}>
      <span>{requirement.resolved ? <CheckCircle2/> : requirement.blocking ? <AlertTriangle/> : <CircleAlert/>}</span>
      <div><strong>{requirement.label}</strong><p>{requirement.detail}</p><small>Responsable : {requirement.owner}</small></div>
      <button type="button" onClick={() => onNavigate(requirement.href)}>{requirement.actionLabel}<ChevronRight/></button>
    </article>)}</div>
  </section>
}

function ContextRail({ dossier, requirements, selectedStage, onNavigate }: { dossier: DossierViewModel; requirements: DossierRequirement[]; selectedStage: string; onNavigate: (href: string) => void }) {
  const current = currentLifecycleStage(dossier)
  const readiness = dossierReadinessLabel(dossier, requirements)
  return <aside className={styles.contextRail} aria-label="Contexte intelligent du dossier">
    <section className={styles.nextMovement}>
      <span><Sparkles/><small>PROCHAIN MOUVEMENT</small></span>
      <h3>{dossier.nextAction.label}</h3>
      <p>{dossier.nextAction.detail}</p>
      <button type="button" onClick={() => onNavigate(dossier.nextAction.href)}>{dossier.nextAction.label}<ArrowRight/></button>
    </section>
    <section className={styles.readinessPanel}>
      <div><Gauge/><span><small>PRÉPARATION DU GATE</small><strong>{readiness.label}</strong></span></div><p>{readiness.detail}</p><DossierStatus severity={readiness.severity}>{stageLabel(current.key)}</DossierStatus>
    </section>
    <RequirementInspector requirements={requirements} dossier={dossier} onNavigate={onNavigate}/>
    <section className={styles.contextCounts}>
      <header><Network/><span><small>CONTEXTE CONNECTÉ</small><strong>{stageLabel(selectedStage)}</strong></span></header>
      <div><button type="button" onClick={() => onNavigate("?stage=assigned")}><ListChecks/><span><strong>{dossier.tasks.length}</strong><small>Tâches</small></span></button><button type="button" onClick={() => onNavigate("?stage=checkpoint_review")}><FileCheck2/><span><strong>{dossier.evidence.length}</strong><small>Preuves</small></span></button><button type="button" onClick={() => onNavigate("?stage=human_review")}><ShieldCheck/><span><strong>{dossier.decisions.length}</strong><small>Décisions</small></span></button><button type="button" onClick={() => onNavigate("?stage=source_required")}><FileArchive/><span><strong>{dossier.sources.length}</strong><small>Sources</small></span></button></div>
    </section>
    <section className={styles.ownershipMini} id="ownership"><header><UsersRound/><span><small>RESPONSABILITÉ</small><strong>Chaîne d’imputabilité</strong></span></header>{dossier.ownership.map((item) => <div key={item.role}><span><small>{item.role}</small><strong>{item.person}</strong></span><em>{item.state}</em></div>)}</section>
  </aside>
}

function ActionDialog({ mode, dossier, busy, notice, onClose, onSubmit }: { mode: ActionMode; dossier: DossierViewModel; busy: boolean; notice: string; onClose: () => void; onSubmit: (payload: Record<string, string>) => void }) {
  const [result, setResult] = React.useState("approved")
  const [summary, setSummary] = React.useState("")
  const [corrections, setCorrections] = React.useState("")
  const [externalReference, setExternalReference] = React.useState("")
  const [proofNote, setProofNote] = React.useState("")
  React.useEffect(() => { setSummary(""); setCorrections(""); setExternalReference(""); setProofNote("") }, [mode])
  if (mode === "none") return null
  const title = mode === "review" ? "Conclusion humaine" : mode === "publication" ? "Confirmation de publication" : mode === "mission" ? "Transition de mission" : "Progression de tâche"
  return <div className={styles.dialogBackdrop} role="presentation" onMouseDown={(event: React.MouseEvent<HTMLDivElement>) => { if (event.target === event.currentTarget) onClose() }}>
    <section className={styles.actionDialog} role="dialog" aria-modal="true" aria-labelledby="bulk1-action-dialog-title">
      <header><span><LockKeyhole/><small>ACTION GOUVERNÉE · {dossier.code}</small><h2 id="bulk1-action-dialog-title">{title}</h2></span><button type="button" aria-label="Fermer" onClick={onClose}><X/></button></header>
      <div className={styles.dialogContext}><strong>{dossier.title}</strong><p>{dossierStatusSummary(dossier)}</p></div>
      {mode === "review" ? <div className={styles.dialogForm}><label><span>Décision</span><select value={result} onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setResult(event.target.value)}><option value="approved">Approuver</option><option value="revision">Demander une correction</option><option value="rejected">Rejeter</option></select></label><label><span>Conclusion obligatoire</span><textarea value={summary} onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setSummary(event.target.value)} rows={5} placeholder="Expliquez la décision, la version concernée et les conditions…"/></label><label><span>Corrections, une par ligne</span><textarea value={corrections} onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setCorrections(event.target.value)} rows={4}/></label></div> : null}
      {mode === "publication" ? <div className={styles.dialogForm}><label><span>Référence externe</span><input value={externalReference} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setExternalReference(event.target.value)} placeholder="URL ou référence de publication"/></label><label><span>Note de preuve</span><textarea value={proofNote} onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setProofNote(event.target.value)} rows={4}/></label><div className={styles.dialogWarning}><AlertTriangle/><span>Une confirmation manuelle reste distincte d’une vérification provider automatisée.</span></div></div> : null}
      {mode === "task" ? <div className={styles.dialogExplanation}><ListChecks/><div><strong>{nextTaskAction(dossier)?.label || "Progression indisponible"}</strong><p>La mutation utilise l’action Headquarters existante, puis recharge le snapshot avant d’actualiser le dossier et les files personnelles.</p></div></div> : null}
      {mode === "mission" ? <div className={styles.dialogExplanation}><Workflow/><div><strong>Confirmer l’entrée en exécution</strong><p>La transition conserve le dossier comme contexte et utilise la mission liée réellement exposée par le snapshot.</p></div></div> : null}
      {notice ? <div className={styles.dialogNotice} aria-live="polite">{notice}</div> : null}
      <footer><button type="button" className={styles.dialogSecondary} onClick={onClose}>Annuler</button><button type="button" className={styles.dialogPrimary} disabled={busy || (mode === "review" && !summary.trim()) || (mode === "publication" && !externalReference.trim())} onClick={() => onSubmit({ result, summary, corrections, externalReference, proofNote })}>{busy ? <LoaderCircle className={styles.spin}/> : <ShieldCheck/>}Confirmer et synchroniser</button></footer>
    </section>
  </div>
}

export default function Bulk1DossierWorkspace({ dossierId, compatibilityMode = false }: { dossierId: string; compatibilityMode?: boolean }) {
  const { snapshot, loading, error, refresh } = useHeadquartersSnapshot()
  const { store } = useContentStore()
  const [storeReady, setStoreReady] = React.useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [actionMode, setActionMode] = React.useState<ActionMode>("none")
  const [busy, setBusy] = React.useState(false)
  const [notice, setNotice] = React.useState("")
  React.useEffect(() => setStoreReady(true), [])

  const liveRecord = findLiveDossier(snapshot, dossierId)
  const legacyItem = store.items.find((item) => item.id === dossierId)
  const dossier = React.useMemo(() => {
    if (liveRecord) return buildLiveDossierViewModel(snapshot, liveRecord)
    if (legacyItem) return buildLegacyDossierViewModel({
      item: record(legacyItem),
      tasks: store.tasks.filter((task) => task.contentId === dossierId).map(record),
      assets: store.assets.filter((asset) => asset.linkedContentId === dossierId || legacyItem.assets.includes(asset.id)).map(record),
      briefs: store.briefs.map(record),
      logs: store.logs.filter((entry) => entry.entity === dossierId || entry.detail.toLowerCase().includes(legacyItem.title.toLowerCase())).map(record),
    })
    return null
  }, [dossierId, legacyItem, liveRecord, snapshot, store.assets, store.briefs, store.logs, store.tasks])

  const requestedStage = searchParams.get("stage") || ""
  const selectedStage = dossier?.lifecycle.some((stage) => stage.key === requestedStage) ? requestedStage : dossier?.currentStage || "opportunity"
  const requirements = dossier ? dossierRequirements(dossier) : []

  React.useEffect(() => {
    if (!dossier) return
    writeBulk1Context({ dossierId: dossier.id, dossierTitle: dossier.title, dossierCode: dossier.code, stage: selectedStage, href: `${pathname}?stage=${selectedStage}`, updatedAt: new Date().toISOString() })
  }, [dossier, pathname, selectedStage])

  function navigate(target: string) {
    if (!dossier) return
    if (target.startsWith("#")) {
      document.querySelector(target)?.scrollIntoView({ behavior: "smooth", block: "start" })
      return
    }
    if (target.startsWith("?")) {
      router.replace(`${pathname}${target}`, { scroll: false })
      return
    }
    const contextual = contextualHref(target, dossier.id, `${pathname}?stage=${selectedStage}`, selectedStage)
    router.push(contextual)
  }

  function selectStage(stage: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("stage", stage)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  async function submitAction(payload: Record<string, string>) {
    if (!dossier) return
    setBusy(true)
    setNotice("")
    try {
      if (actionMode === "task") {
        const action = nextTaskAction(dossier)
        if (!action) throw new Error("Aucune tâche active n’est disponible.")
        await headquartersAction("update_task", { taskId: action.taskId, status: action.status, progress: action.progress })
      } else if (actionMode === "mission") {
        if (!dossier.missionId) throw new Error("MISSION_ID_UNAVAILABLE")
        await headquartersAction("update_mission_status", { missionId: dossier.missionId, status: "accepted", note: "Transition confirmée depuis Continuous Dossier 360 — Experience Bulk 1." })
      } else if (actionMode === "review") {
        await headquartersAction("record_human_review", {
          dossierId: dossier.id,
          evidenceId: dossier.evidence[0]?.id || "",
          result: payload.result,
          score: payload.result === "approved" ? 100 : payload.result === "revision" ? 55 : 20,
          summary: payload.summary.trim(),
          corrections: payload.corrections.split("\n").map((item) => item.trim()).filter(Boolean).map((instruction, index) => ({ code: `COR-${index + 1}`, instruction })),
          authorityRole: "Content Command Authority",
        })
      } else if (actionMode === "publication") {
        const publication = dossier.publications[0]
        if (!publication) throw new Error("PUBLICATION_PACKAGE_UNAVAILABLE")
        await headquartersAction("publication_record_execution", {
          packageId: publication.id,
          executionMode: "manual",
          externalReference: payload.externalReference.trim(),
          note: payload.proofNote.trim() || "Confirmation manuelle enregistrée depuis Continuous Dossier 360.",
          versionIdentity: "Version autorisée dans le package",
          renditionIdentity: publication.channel,
        })
      }
      setNotice("Action enregistrée. Le snapshot autoritaire a été rechargé et les surfaces connectées peuvent maintenant refléter le nouvel état.")
      await refresh()
      setActionMode("none")
    } catch (nextError) {
      setNotice(nextError instanceof Error ? nextError.message : "DOSSIER_ACTION_FAILED")
    } finally {
      setBusy(false)
    }
  }

  if ((loading || !storeReady) && !dossier) return <main className={styles.bulk1DossierCanvas}><div className={styles.bulk1Loading}><LoaderCircle className={styles.spin}/><span><strong>Ouverture du Continuous Dossier 360…</strong><small>Identité, cycle, responsabilités, preuves, décisions, sources et publication sont consolidés.</small></span></div></main>

  if (!dossier) return <main className={styles.bulk1DossierCanvas}><section className={styles.dossierFailure}><AlertTriangle/><div><span>DOSSIER INTROUVABLE</span><h1>Aucun contexte institutionnel ne correspond à cet identifiant.</h1><p>{error ? "La source Headquarters est indisponible et aucun record historique correspondant n’existe dans le registre local." : "Le record n’existe pas ou n’est pas accessible avec la session actuelle."}</p><div><Link href="/market-os/content-command-center?workspace=my-work"><ArrowLeft/> Mon travail</Link><button type="button" onClick={() => void refresh()}><RefreshCcw/> Réessayer</button></div></div></section></main>

  const activeStage = dossier.lifecycle.find((stage) => stage.key === selectedStage) || currentLifecycleStage(dossier)
  const returnTo = searchParams.get("returnTo")

  return <main className={styles.bulk1DossierCanvas} data-content-experience-bulk1-dossier data-dossier-stage={selectedStage} data-dossier-source={dossier.sourceType}>
    <div className={styles.commandLiveRegion} aria-live="polite">{notice}</div>
    {error && dossier.sourceType === "legacy" ? <div className={styles.dossierCompatibility}><AlertTriangle/><span><strong>Mode de compatibilité historique</strong><small>La source Headquarters est indisponible. Seules les informations réellement présentes dans le registre local sont affichées.</small></span></div> : null}
    {compatibilityMode && dossier.sourceType === "headquarters" ? <div className={styles.dossierCompatibility}><Link2/><span><strong>URL historique préservée</strong><small>Ce lien ouvre l’expérience Dossier 360 canonique sans casser l’adresse enregistrée.</small></span></div> : null}

    <section className={styles.dossierCrown}>
      <div className={styles.dossierReturn}>{returnTo ? <Link href={returnTo}><ArrowLeft/> Retour au contexte précédent</Link> : <Link href="/market-os/content-command-center?workspace=my-work"><ArrowLeft/> Mon travail</Link>}<span>ANGELCARE · SANILA CONTENT OPERATIONS</span></div>
      <div className={styles.dossierTitleRow}>
        <div className={styles.dossierCodeOrb}><Fingerprint/><span>{dossier.code}</span></div>
        <div><small>{dossier.family} · {dossier.service}</small><h1>{dossier.title}</h1><p>{dossierStatusSummary(dossier)}</p></div>
        <div className={styles.dossierCrownStatus}><DossierStatus severity={dossier.risk}>{humanStatus(dossier.status)}</DossierStatus><DossierStatus severity={stageTone(activeStage)}>{stageLabel(selectedStage)}</DossierStatus></div>
      </div>
      <div className={styles.dossierMetaRibbon}><MetaPair label="Responsable" value={dossier.owner}/><MetaPair label="Réviseur" value={dossier.reviewer}/><MetaPair label="Audience" value={dossier.audience}/><MetaPair label="Canal" value={dossier.channel}/><MetaPair label="Échéance" value={dossier.dueAt ? formatDateFr(dossier.dueAt, true) : "Non définie"}/><MetaPair label="Version" value={dossier.brief.version}/></div>
      <div className={styles.dossierDominantAction}><div><Sparkles/><span><small>ACTION DOMINANTE</small><strong>{dossier.nextAction.label}</strong><p>{dossier.nextAction.detail}</p></span></div><button type="button" onClick={() => navigate(dossier.nextAction.href)}>{dossier.nextAction.label}<ArrowRight/></button></div>
    </section>

    <section className={styles.dossierOperatingRoom}>
      <LifecycleSpine dossier={dossier} selected={selectedStage} onSelect={selectStage}/>
      <section className={styles.activeStageShell}>
        <header className={styles.activeStageHeader}><div><span>ACTIVE STAGE WORKSPACE · {humanStatus(activeStage.state)}</span><h2>{stageLabel(selectedStage)}</h2><p>{stageDescription(selectedStage)}</p></div><div><DossierStatus severity={stageTone(activeStage)}>{activeStage.state === "current" ? "Gate actuel" : activeStage.state === "blocked" ? "Gate bloqué" : activeStage.state === "complete" ? "Gate franchi" : "Inspection contextuelle"}</DossierStatus><button type="button" onClick={() => void refresh()}><RefreshCcw/> Synchroniser</button></div></header>
        <ActiveStageWorkspace dossier={dossier} stage={selectedStage} busy={busy} onAction={setActionMode}/>
        <section className={styles.handoverDock}><div><Orbit/><span><small>HANDOVER CONTEXTUEL</small><strong>Le dossier reste le contexte de contrôle.</strong><p>Les workspaces spécialisés s’ouvrent avec l’identifiant du dossier, le stage et une route de retour explicite.</p></span></div><button type="button" onClick={() => navigate(dossier.nextAction.href)}><PanelRightOpen/> Ouvrir le spécialiste</button></section>
      </section>
      <ContextRail dossier={dossier} requirements={requirements} selectedStage={selectedStage} onNavigate={navigate}/>
    </section>

    <ActionDialog mode={actionMode} dossier={dossier} busy={busy} notice={notice} onClose={() => setActionMode("none")} onSubmit={(payload) => void submitAction(payload)}/>
  </main>
}

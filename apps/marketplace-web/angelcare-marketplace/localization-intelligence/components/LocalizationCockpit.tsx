import Link from 'next/link'
import { AlertTriangle, CheckCircle2, Clock3, ExternalLink, FileClock, Globe2, Languages, Rocket, ScanSearch } from 'lucide-react'
import type { PublicationJob } from '../../experience-builder/types'
import styles from '../localization.module.css'

interface LatestLocalizationScan {
  status?: string | null
  new_candidates?: number | null
  changed_candidates?: number | null
  failed_sources?: number | null
  scanned_files?: number | null
}

interface LocalizationSummary {
  latestScan?: LatestLocalizationScan | null
  totalCandidates: number
  staticCandidates: number
  dynamicCandidates: number
  enComplete: number
  arComplete: number
  missingEn: number
  missingAr: number
  staleEn: number
  staleAr: number
  newSinceLastScan: number
  sourceChanged: number
  blocked: number
  lastPublicationEn?: string|null
  lastPublicationAr?: string|null
}

type EvidenceRow = Record<string, unknown>

interface Props {
  summary: LocalizationSummary
  publicationJobs?: PublicationJob[]
  publicationEvents?: EvidenceRow[]
  homepageReleases?: EvidenceRow[]
  canRunScan?: boolean
  canPublish?: boolean
}

const commands = [
  ['Sources', '/angelcare-marketplace/admin/localization/scanner', 'Actualiser les sources statiques et dynamiques, sans doublon.'],
  ['Traductions', '/angelcare-marketplace/admin/localization/translations', 'Registre et éditeur côte à côte FR / EN / AR.'],
  ['Export / Import', '/angelcare-marketplace/admin/localization/csv', 'CSV, lot ChatGPT, dry-run et application gouvernée.'],
  ['Glossaire', '/angelcare-marketplace/admin/localization/glossary', 'Terminologie de marque et règles de cohérence.'],
  ['Mémoire', '/angelcare-marketplace/admin/localization/memory', 'Réutiliser uniquement les traductions approuvées.'],
  ['SEO', '/angelcare-marketplace/admin/localization/seo', 'Titres, descriptions, canonicals et readiness locale.'],
  ['Publication', '/angelcare-marketplace/admin/localization/readiness', 'Blocages, preuve et runway de publication EN / AR.'],
  ['Qualité', '/angelcare-marketplace/admin/localization/rtl-lab', 'Placeholders, HTML, sources orphelines et RTL.'],
] as const

const runwayStatuses: Array<{ key: PublicationJob['status']; label: string }> = [
  { key: 'queued', label: 'Demandé' },
  { key: 'validating', label: 'Pré-vol' },
  { key: 'blocked', label: 'Bloqué' },
  { key: 'ready', label: 'Prêt' },
]

const text = (value: unknown) => typeof value === 'string' ? value : String(value ?? '')

export function LocalizationCockpit({
  summary,
  publicationJobs = [],
  publicationEvents = [],
  homepageReleases = [],
  canRunScan = false,
  canPublish = false,
}: Props) {
  const scan = summary.latestScan
  const status = scan?.status || 'Aucun scan'
  const truthful = summary.totalCandidates ? `${Math.round(Math.min(summary.enComplete,summary.arComplete) / summary.totalCandidates * 100)}%` : '100%'
  const blockers = summary.missingEn + summary.missingAr + summary.staleEn + summary.staleAr + summary.blocked
  const blockedJobs = publicationJobs.filter((job) => job.status === 'blocked').length
  const openReleases = homepageReleases.filter((release) => !['accepted', 'archived', 'superseded'].includes(text(release.status))).length

  return (
    <main className={styles.runwayPage}>
      <header className={styles.runwayHeader}>
        <div>
          <span>BOUTIQUE · LOCALIZATION & PUBLICATION RUNWAY</span>
          <h1>De la source française au public, sans angle mort.</h1>
          <p>Fraîcheur linguistique, contenu sensible, jobs CMS, releases Homepage et événements Commerce réunis dans une même piste de contrôle.</p>
        </div>
        <div className={styles.runwayHeaderActions}>
          {canRunScan ? <Link className={styles.secondaryButton} href="/angelcare-marketplace/admin/localization/scanner"><ScanSearch size={15}/> Lancer un scan</Link> : <button type="button" className={styles.secondaryButton} disabled title="Permission marketplace.localization.scans.run requise"><ScanSearch size={15}/> Lancer un scan</button>}
          {canPublish ? <Link className={styles.primaryButton} href="/angelcare-marketplace/admin/publication"><Rocket size={15}/> Orchestrateur</Link> : <button type="button" className={styles.primaryButton} disabled title="Permission marketplace.publication.manage requise"><Rocket size={15}/> Orchestrateur</button>}
        </div>
      </header>

      <section className={styles.runwayMetrics}>
        <Metric label="Couverture prouvée" value={truthful} icon={Globe2}/>
        <Metric label="Textes indexés" value={String(summary.totalCandidates)} icon={Languages}/>
        <Metric label="Bloquants linguistiques" value={String(blockers)} icon={AlertTriangle} risk={blockers > 0}/>
        <Metric label="Jobs publication bloqués" value={String(blockedJobs)} icon={Clock3} risk={blockedJobs > 0}/>
        <Metric label="Releases Homepage ouvertes" value={String(openReleases)} icon={FileClock}/>
      </section>

      <section className={styles.runwayGrid}>
        <div className={styles.runwayMain}>
          <section className={styles.scanPanel}>
            <header>
              <div><span>LOCALIZATION SOURCE TRUTH</span><h2>Dernier scan · {status}</h2></div>
              <span className={styles.status} data-risk={status !== 'completed'}>{status}</span>
            </header>
            <div className={styles.scanFacts}>
              <Metric label="Nouveaux" value={String(scan?.new_candidates || 0)} icon={CheckCircle2}/>
              <Metric label="Modifiés" value={String(scan?.changed_candidates || 0)} icon={Languages}/>
              <Metric label="Sources échouées" value={String(scan?.failed_sources || 0)} icon={AlertTriangle} risk={Boolean(scan?.failed_sources)}/>
              <Metric label="Fichiers scannés" value={String(scan?.scanned_files || 0)} icon={ScanSearch}/>
            </div>
            {scan?.failed_sources ? <p className={styles.truthWarning}><AlertTriangle size={15}/> La couverture ne peut pas être certifiée tant qu’une source du scan échoue.</p> : null}
          </section>

          <section className={styles.publicationRunway}>
            <header><div><span>CMS PUBLICATION JOBS</span><h2>Validation, blocage et readiness</h2></div><Link href="/angelcare-marketplace/admin/experience/publishing">Ouvrir tous les jobs <ExternalLink size={13}/></Link></header>
            <div className={styles.runwayLanes}>{runwayStatuses.map((lane) => {
              const jobs = publicationJobs.filter((job) => job.status === lane.key)
              return <section key={lane.key} data-risk={lane.key === 'blocked' && jobs.length > 0}><header><strong>{lane.label}</strong><span>{jobs.length}</span></header>{jobs.slice(0, 8).map((job) => <article key={job.id}><strong>{job.public_reference}</strong><span>{job.action} · page {job.page_id}</span><small>{job.blocker || 'Aucun blocage déclaré'}</small></article>)}{!jobs.length ? <p>Aucun job</p> : null}</section>
            })}</div>
          </section>

          <section className={styles.commandDirectory}>
            {commands.map(([title, href, description]) => <Link href={href} key={href}><div><strong>{title}</strong><p>{description}</p></div><ExternalLink size={14}/></Link>)}
          </section>
        </div>

        <aside className={styles.runwayRail}>
          <section>
            <span>HOMEPAGE RELEASES</span><h2>{openReleases} dossier(s) ouverts</h2>
            {homepageReleases.slice(0, 8).map((release) => <article key={text(release.id)}><strong>{text(release.public_reference || release.release_title)}</strong><span>{text(release.locale).toUpperCase()} · {text(release.status)}</span></article>)}
            <Link href="/angelcare-marketplace/admin/homepage/history">Historique & décisions <ExternalLink size={13}/></Link>
          </section>
          <section>
            <span>COMMERCE PUBLICATION EVIDENCE</span><h2>Dernières exécutions</h2>
            {publicationEvents.slice(0, 10).map((event) => <article key={text(event.id)} data-risk={text(event.status) === 'failed'}><strong>{text(event.object_type || 'commerce')}</strong><span>{text(event.action)} · {text(event.status)}</span></article>)}
            {!publicationEvents.length ? <p>Aucun événement récent.</p> : null}
            {canPublish ? <Link href="/angelcare-marketplace/admin/publication">Versions & rollback <ExternalLink size={13}/></Link> : null}
          </section>
          <section className={styles.releaseDoctrine}>
            <span>RELEASE GATE</span>
            <strong>{blockers || blockedJobs ? 'NOT READY' : 'SOURCE READY'}</strong>
            <p>Ce verdict reprend uniquement les autorités présentes. Il ne prétend pas qu’une validation runtime différée a réussi.</p>
          </section>
        </aside>
      </section>
    </main>
  )
}

function Metric({ label, value, icon: Icon, risk = false }: { label: string; value: string; icon: typeof Globe2; risk?: boolean }) {
  return <article className={styles.runwayMetric} data-risk={risk}><Icon size={16}/><div><strong>{value}</strong><span>{label}</span></div></article>
}

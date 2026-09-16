import { AlertTriangle, CheckCircle2, Clock3, Loader2, Rocket, ShieldAlert, XCircle } from 'lucide-react'
import type { PublicationJob } from '../types'
import styles from '../experience.module.css'

const lanes: Array<{ status: PublicationJob['status']; label: string; icon: typeof Clock3 }> = [
  { status: 'queued', label: 'Planifié', icon: Clock3 },
  { status: 'validating', label: 'Claim worker', icon: Loader2 },
  { status: 'ready', label: 'Prêt', icon: Rocket },
  { status: 'blocked', label: 'Bloqué', icon: ShieldAlert },
  { status: 'failed', label: 'Échec', icon: XCircle },
  { status: 'completed', label: 'Exécuté', icon: CheckCircle2 },
  { status: 'cancelled', label: 'Annulé', icon: AlertTriangle },
]
function dt(value:string|null|undefined){if(!value)return '—';const date=new Date(value);return Number.isNaN(date.valueOf())?value:new Intl.DateTimeFormat('fr-FR',{dateStyle:'medium',timeStyle:'short'}).format(date)}
export function PublishingRunway({ jobs }: { jobs: PublicationJob[] }) {
  const active=jobs.filter(job=>['queued','validating','ready'].includes(job.status)).length;const broken=jobs.filter(job=>['blocked','failed'].includes(job.status)).length
  return <div className={styles.releaseWorkspace}><section className={styles.releaseSummary}><div><span>ACTIVE QUEUE</span><strong>{active}</strong><small>jobs encore opérables</small></div><div data-alert={broken>0}><span>ATTENTION</span><strong>{broken}</strong><small>bloqués / échoués</small></div><div><span>PINNED</span><strong>{jobs.filter(job=>Boolean(job.revision_id)).length}</strong><small>jobs avec revision exacte</small></div><div><span>EXECUTED</span><strong>{jobs.filter(job=>job.status==='completed').length}</strong><small>preuves d’exécution</small></div></section><section className={styles.runway}>{lanes.map(lane=>{const LaneIcon=lane.icon;const laneJobs=jobs.filter(job=>job.status===lane.status);return <section className={styles.lane} key={lane.status}><header className={styles.laneHeader}><span><LaneIcon size={14}/>{lane.label}</span><strong>{laneJobs.length}</strong></header>{laneJobs.slice(0,40).map(job=><article className={styles.job} data-status={job.status} key={job.id}><div className={styles.jobHead}><strong>{job.public_reference}</strong><span>{job.action}</span></div><dl><div><dt>Page</dt><dd>{job.page_id}</dd></div><div><dt>Revision</dt><dd>{job.revision_id||'NON PINNÉE'}</dd></div><div><dt>Scheduled</dt><dd>{dt(job.scheduled_at)}</dd></div><div><dt>Executed</dt><dd>{dt(job.executed_at||job.completed_at)}</dd></div><div><dt>Attempts</dt><dd>{job.attempt_count||0}</dd></div><div><dt>Worker</dt><dd>{job.claimed_by||'—'}</dd></div></dl>{job.blocker||job.last_error?<p className={styles.jobIssue}><AlertTriangle size={12}/>{job.blocker||job.last_error}</p>:<p className={styles.jobOk}><CheckCircle2 size={12}/>Aucun blocage déclaré</p>}</article>)}{!laneJobs.length?<div className={styles.laneEmpty}>Aucun job</div>:null}</section>})}</section></div>
}

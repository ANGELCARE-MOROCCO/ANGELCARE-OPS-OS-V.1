import type { PublicationJob } from '../types'
import styles from '../experience.module.css'

const lanes: Array<{ status: PublicationJob['status']; label: string }>=[{status:'queued',label:'Demandé'},{status:'validating',label:'Pré-vol'},{status:'blocked',label:'Bloqué'},{status:'ready',label:'Prêt'}]
export function PublishingRunway({jobs}:{jobs:PublicationJob[]}){return <div className={styles.runway}>{lanes.map(lane=><section className={styles.lane} key={lane.status}><header className={styles.laneHeader}>{lane.label} · {jobs.filter(job=>job.status===lane.status).length}</header>{jobs.filter(job=>job.status===lane.status).map(job=><article className={styles.job} key={job.id}><strong>{job.public_reference}</strong><span>{job.action} · page {job.page_id}</span><span>{job.blocker||'Aucun blocage déclaré'}</span></article>)}</section>)}</div>}

'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { Angelcare360PresencesOverviewData } from '@/lib/angelcare360/server/presences-overview'
import styles from './PresenceZoneBFrame.module.css'
import { dateFr, initials } from './presence-ui'
import { ClassPresenceQuickCommand, DayClosureChamber } from './PresenceCommandSurfaces'

type Props = { data: Angelcare360PresencesOverviewData; schoolName: string }

export default function PresenceOverviewCommand({ data, schoolName }: Props) {
  const [classIndex,setClassIndex]=useState<number|null>(null)
  const [closure,setClosure]=useState(false)
  const selectedClass=classIndex===null?null:data.classes[classIndex]||null
  const unresolved=data.unjustifiedAbsences.length
  return <div className={styles.page} data-zone-b-page="overview">
    <section className={styles.crown}>
      <div className={styles.crownTop}><div><h2 className={styles.crownTitle}>Présences aujourd’hui</h2><p className={styles.crownSub}>La réalité de présence de {schoolName} pour {dateFr(data.selectedDate)} — exceptions en premier, données inventées jamais.</p></div><div className={styles.contextPills}><span className={styles.pillBlue}>{data.selectedDateLabel}</span>{data.activeAcademicYearLabel?<span className={styles.pill}>{data.activeAcademicYearLabel}</span>:null}<button className={styles.secondaryButton} type="button" onClick={()=>setClosure(true)}>Clôture journée</button></div></div>
      <div className={styles.metricGrid}>
        <Link className={styles.metricAction} href={`/angelcare-360-command-center/presences/eleves?date=${data.selectedDate}`}><div className={styles.metric}><span className={styles.metricLabel}>Attendus</span><strong className={styles.metricValue}>{data.expectedStudents}</strong><span className={styles.metricNote}>Élèves attendus aujourd’hui</span></div></Link>
        <Link className={styles.metricAction} href={`/angelcare-360-command-center/presences/jour?date=${data.selectedDate}&state=present`}><div className={styles.metric}><span className={styles.metricLabel}>Présents</span><strong className={styles.metricValue}>{data.presentCount}</strong><span className={styles.metricNote}>{data.attendanceRate === null ? 'Taux non calculable' : `${data.attendanceRate}% de présence`}</span></div></Link>
        <Link className={styles.metricAction} href={`/angelcare-360-command-center/presences/absences?from=${data.selectedDate}&to=${data.selectedDate}`}><div className={styles.metric}><span className={styles.metricLabel}>Absents</span><strong className={styles.metricValue}>{data.absentCount}</strong><span className={styles.metricNote}>{unresolved} à vérifier</span></div></Link>
        <Link className={styles.metricAction} href={`/angelcare-360-command-center/presences/retards?from=${data.selectedDate}&to=${data.selectedDate}`}><div className={styles.metric}><span className={styles.metricLabel}>Retards</span><strong className={styles.metricValue}>{data.lateCount}</strong><span className={styles.metricNote}>Arrivées tardives enregistrées</span></div></Link>
        <Link className={styles.metricAction} href={`/angelcare-360-command-center/presences/justifications`}><div className={styles.metric}><span className={styles.metricLabel}>Justifications</span><strong className={styles.metricValue}>{data.pendingJustifications.length}</strong><span className={styles.metricNote}>Décisions en attente</span></div></Link>
        <Link className={styles.metricAction} href={`/angelcare-360-command-center/presences/classes?date=${data.selectedDate}`}><div className={styles.metric}><span className={styles.metricLabel}>Complétude</span><strong className={styles.metricValue}>{data.completionRate}%</strong><span className={styles.metricNote}>{data.unmarkedCount} pointage(s) manquant(s)</span></div></Link>
        <Link className={styles.metricAction} href={`/angelcare-360-command-center/presences/classes?date=${data.selectedDate}&attention=true`}><div className={styles.metric}><span className={styles.metricLabel}>Classes à voir</span><strong className={styles.metricValue}>{data.classAlertsCount}</strong><span className={styles.metricNote}>Écarts ou feuille incomplète</span></div></Link>
      </div>
    </section>

    <section className={styles.grid2}>
      <div className={styles.panel}>
        <div className={styles.panelHeader}><div><div className={styles.panelEyebrow}>Temps réel</div><h3 className={styles.panelTitle}>Live School Day Runway</h3><p className={styles.panelDescription}>Une lecture de la journée par phase opérationnelle, sans prétendre connaître un événement non enregistré.</p></div><Link className={styles.panelLink} href={`/angelcare-360-command-center/presences/jour?date=${data.selectedDate}`}>Ouvrir la journée</Link></div>
        <div className={styles.runway}><div className={styles.runwayTrack}><div className={styles.runwayHours}>{['07:30','09:00','12:00','14:00','16:00','18:00'].map((h)=><div className={styles.runwayHour} key={h}><span>{h}</span></div>)}</div><div className={`${styles.runwayBand} ${styles.runwayArrival}`}>Arrivées</div><div className={`${styles.runwayBand} ${styles.runwayLearning}`}>Présence pédagogique</div><div className={`${styles.runwayBand} ${styles.runwayTransition}`}>Transitions</div><div className={`${styles.runwayBand} ${styles.runwayDeparture}`}>Départs</div></div></div>
      </div>
      <div className={styles.panel} data-zone-b-secondary="true">
        <div className={styles.panelHeader}><div><div className={styles.panelEyebrow}>À traiter</div><h3 className={styles.panelTitle}>Exceptions prioritaires</h3></div></div>
        <div className={styles.attentionBoard}>{data.alerts.length?data.alerts.slice(0,5).map((alert)=><Link href={alert.href} key={alert.id} className={styles.attentionItem}><span className={styles.attentionIcon}>!</span><span><strong className={styles.attentionTitle}>{alert.title}</strong><span className={styles.attentionText}>{alert.detail}</span></span><span className={styles.countBadge}>{alert.count}</span></Link>):<div className={styles.empty}><strong className={styles.emptyTitle}>Aucune exception prioritaire</strong><p className={styles.emptyText}>Les contrôles disponibles ne signalent rien à traiter dans cette vue.</p></div>}</div>
      </div>
    </section>

    <section className={styles.panel}>
      <div className={styles.panelHeader}><div><div className={styles.panelEyebrow}>Classes</div><h3 className={styles.panelTitle}>Class Presence Wall</h3><p className={styles.panelDescription}>Chaque classe devient une surface opérationnelle : attendus, présents, absents, retards et complétude.</p></div><Link className={styles.panelLink} href={`/angelcare-360-command-center/presences/classes?date=${data.selectedDate}`}>Toutes les classes</Link></div>
      {data.classes.length?<div className={styles.classWall}>{data.classes.slice(0,9).map((row,index)=><button type="button" className={styles.classCard} key={row.id} onClick={()=>setClassIndex(index)} style={{textAlign:'left',font:'inherit',cursor:'pointer'}}><div className={styles.classCardTop}><div><div className={styles.className}>{row.label}</div><div className={styles.classSection}>{row.hasSession ? `Session ${row.sessionStatus || 'active'}` : 'Feuille à préparer'}</div></div><span className={styles.classRate}>{row.completionRate}%</span></div><div className={styles.classStats}><div className={styles.classStat}><strong>{row.present}</strong><span>Présents</span></div><div className={styles.classStat}><strong>{row.absent}</strong><span>Absents</span></div><div className={styles.classStat}><strong>{row.late}</strong><span>Retards</span></div><div className={styles.classStat}><strong>{row.unmarked}</strong><span>À pointer</span></div></div><div className={styles.progress}><div className={styles.progressBar} style={{width:`${Math.max(0,Math.min(100,row.completionRate))}%`}} /></div></button>)}</div>:<div className={styles.panelPad}><div className={styles.empty}><strong className={styles.emptyTitle}>Aucune classe attendue dans cette vue</strong><p className={styles.emptyText}>Vérifiez le calendrier scolaire ou la structure de classes pour cette date.</p></div></div>}
    </section>

    <section className={styles.grid2} data-zone-b-secondary="true">
      <div className={styles.panel}><div className={styles.panelHeader}><div><div className={styles.panelEyebrow}>Arrival Pulse</div><h3 className={styles.panelTitle}>Retards récents</h3></div><Link className={styles.panelLink} href="/angelcare-360-command-center/presences/retards">Ouvrir les retards</Link></div><div className={styles.list}>{data.lateRows.length?data.lateRows.slice(0,6).map((row)=><Link key={row.id} className={styles.listRow} href={row.href}><span className={styles.avatar}>{initials(row.studentName)}</span><span className={styles.rowCopy}><strong className={styles.rowTitle}>{row.studentName}</strong><span className={styles.rowMeta}>{row.classLabel} · {row.minutesLate} min de retard</span></span><span className={styles.rowRight}><strong className={styles.rowTime}>{row.timeLabel}</strong></span></Link>):<div className={styles.empty}><strong className={styles.emptyTitle}>Aucun retard à traiter</strong><p className={styles.emptyText}>Toutes les arrivées enregistrées pour cette vue sont dans les horaires prévus.</p></div>}</div></div>
      <div className={styles.panel}><div className={styles.panelHeader}><div><div className={styles.panelEyebrow}>Justifications</div><h3 className={styles.panelTitle}>Review Desk</h3></div><Link className={styles.panelLink} href="/angelcare-360-command-center/presences/justifications">Examiner</Link></div><div className={styles.list}>{data.pendingJustifications.length?data.pendingJustifications.slice(0,6).map((row)=><Link key={row.id} className={styles.listRow} href={row.href}><span className={styles.avatar}>{initials(row.studentName)}</span><span className={styles.rowCopy}><strong className={styles.rowTitle}>{row.studentName}</strong><span className={styles.rowMeta}>{row.classLabel} · {row.reason}</span></span><span className={styles.rowRight}><span className={styles.pillAmber}>À examiner</span></span></Link>):<div className={styles.empty}><strong className={styles.emptyTitle}>Aucune justification en attente</strong><p className={styles.emptyText}>Les décisions à examiner apparaîtront ici.</p></div>}</div></div>
    </section>

    {selectedClass?<ClassPresenceQuickCommand open={classIndex!==null} onClose={()=>setClassIndex(null)} className={selectedClass.label} classId={selectedClass.classId} date={data.selectedDate} expected={selectedClass.expected} present={selectedClass.present} absent={selectedClass.absent} late={selectedClass.late}/>:null}
    <DayClosureChamber open={closure} onClose={()=>setClosure(false)} date={data.selectedDate} expected={data.expectedStudents} marked={data.markedStudents} unresolved={unresolved} missingCheckout={0}/>
  </div>
}

import type { ReactNode } from 'react'

import Link from 'next/link'
import styles from './AcademicZoneAChrome.module.css'

export type ZoneAR3Metric = {
  label: string
  value: string | number
  detail?: string
  tone?: 'navy' | 'cyan' | 'indigo' | 'teal' | 'green' | 'amber' | 'coral' | 'purple' | 'graphite'
}

export type ZoneAR3Item = {
  id: string
  title: string
  meta?: string
  secondary?: string
  status?: string
  value?: number | null
  maxValue?: number | null
  href?: string
  attention?: boolean
}

export type ZoneAR3Variant =
  | 'courses'
  | 'lesson-detail'
  | 'homework'
  | 'homework-detail'
  | 'submissions'
  | 'assessments'
  | 'assessment-detail'
  | 'assessment-sessions'
  | 'gradebook'
  | 'averages'
  | 'bulletins'
  | 'bulletin-detail'
  | 'commentary'
  | 'history'

type Props = {
  variant: ZoneAR3Variant
  eyebrow: string
  title: string
  description: string
  metrics?: ZoneAR3Metric[]
  items?: ZoneAR3Item[]
  secondaryItems?: ZoneAR3Item[]
  emptyLabel?: string
  actionHref?: string
  actionLabel?: string
}

function MetricCards({ metrics = [] }: { metrics?: ZoneAR3Metric[] }) {
  if (!metrics.length) return null
  return (
    <div className={styles.r3MetricGrid}>
      {metrics.map((metric) => (
        <article key={`${metric.label}-${metric.value}`} className={styles.r3MetricCard} data-tone={metric.tone || 'navy'}>
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
          {metric.detail ? <small>{metric.detail}</small> : null}
        </article>
      ))}
    </div>
  )
}

function Status({ value, attention = false }: { value?: string; attention?: boolean }) {
  return <span className={styles.r3Status} data-attention={attention}>{value || 'À suivre'}</span>
}

function ItemLink({ item, children }: { item: ZoneAR3Item; children: ReactNode }) {
  return item.href ? <Link href={item.href} className={styles.r3ItemLink}>{children}</Link> : <>{children}</>
}

function Empty({ label }: { label?: string }) {
  return <div className={styles.r3Empty}><strong>Aucune donnée à afficher</strong><span>{label || 'Le contenu apparaîtra ici dès que l’activité académique sera disponible.'}</span></div>
}

function CourseFlow({ items, emptyLabel }: { items: ZoneAR3Item[]; emptyLabel?: string }) {
  const states = [
    ['draft', 'À préparer'],
    ['planned', 'À venir'],
    ['completed', 'Réalisés'],
    ['cancelled', 'À reprendre'],
  ] as const
  if (!items.length) return <Empty label={emptyLabel} />
  return (
    <div className={styles.r3CourseFlow}>
      {states.map(([key, label]) => {
        const matches = items.filter((item) => (item.status || '').toLowerCase() === key)
        return (
          <section key={key} data-state={key}>
            <header><span>{label}</span><strong>{matches.length}</strong></header>
            <div>
              {(matches.length ? matches : items.filter((item) => !states.some(([state]) => state === (item.status || '').toLowerCase())).slice(0, key === 'planned' ? 4 : 2)).map((item) => (
                <ItemLink key={item.id} item={item}>
                  <article>
                    <div><strong>{item.title}</strong><span>{item.meta || 'Contexte pédagogique'}</span></div>
                    <Status value={item.status} attention={item.attention} />
                  </article>
                </ItemLink>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function HomeworkStudio({ items, emptyLabel }: { items: ZoneAR3Item[]; emptyLabel?: string }) {
  if (!items.length) return <Empty label={emptyLabel} />
  const attention = items.filter((item) => item.attention || /late|retard|pending|submitted/i.test(item.status || ''))
  return (
    <div className={styles.r3HomeworkStudio}>
      <aside>
        <span>Bibliothèque de devoirs</span>
        {items.slice(0, 7).map((item) => <ItemLink item={item} key={item.id}><div><strong>{item.title}</strong><small>{item.meta || 'Classe / matière'}</small></div></ItemLink>)}
      </aside>
      <main>
        <div className={styles.r3StudioCanvasTitle}><span>Flux actif</span><strong>Publication → remise → correction</strong></div>
        {items.slice(0, 6).map((item) => (
          <ItemLink item={item} key={item.id}>
            <article className={styles.r3HomeworkCard} data-attention={item.attention}>
              <div><strong>{item.title}</strong><span>{item.meta}</span></div>
              <div><Status value={item.status} attention={item.attention} />{item.secondary ? <small>{item.secondary}</small> : null}</div>
            </article>
          </ItemLink>
        ))}
      </main>
      <aside data-sidecar="true">
        <span>À traiter</span>
        <strong>{attention.length}</strong>
        <p>Devoirs, remises ou corrections nécessitant une attention explicite.</p>
        {attention.slice(0, 4).map((item) => <ItemLink item={item} key={item.id}><small>{item.title}</small></ItemLink>)}
      </aside>
    </div>
  )
}

function SubmissionBoard({ items, emptyLabel }: { items: ZoneAR3Item[]; emptyLabel?: string }) {
  if (!items.length) return <Empty label={emptyLabel} />
  const lanes = [
    { key: 'submitted', label: 'À corriger' },
    { key: 'late', label: 'En retard' },
    { key: 'graded', label: 'Corrigées' },
    { key: 'reviewed', label: 'À revoir' },
  ]
  return (
    <div className={styles.r3SubmissionBoard}>
      {lanes.map((lane) => {
        const laneItems = items.filter((item) => (item.status || '').toLowerCase() === lane.key)
        return <section key={lane.key}><header><span>{lane.label}</span><strong>{laneItems.length}</strong></header><div>{laneItems.slice(0, 6).map((item) => <ItemLink item={item} key={item.id}><article><strong>{item.title}</strong><span>{item.meta}</span>{item.secondary ? <small>{item.secondary}</small> : null}</article></ItemLink>)}</div></section>
      })}
    </div>
  )
}

function AssessmentPipeline({ items, emptyLabel }: { items: ZoneAR3Item[]; emptyLabel?: string }) {
  if (!items.length) return <Empty label={emptyLabel} />
  const stages = [
    { keys: ['draft'], label: 'Brouillons' },
    { keys: ['planned', 'scheduled'], label: 'Planifiées' },
    { keys: ['active', 'open'], label: 'À administrer' },
    { keys: ['completed', 'closed'], label: 'À corriger' },
    { keys: ['graded'], label: 'Notées' },
    { keys: ['archived'], label: 'Terminées' },
  ]
  return (
    <div className={styles.r3AssessmentPipeline}>
      {stages.map((stage, index) => {
        const stageItems = items.filter((item) => stage.keys.includes((item.status || '').toLowerCase()))
        return <section key={stage.label}><div className={styles.r3PipelineIndex}>{String(index + 1).padStart(2, '0')}</div><header><span>{stage.label}</span><strong>{stageItems.length}</strong></header><div>{stageItems.slice(0, 4).map((item) => <ItemLink item={item} key={item.id}><article><strong>{item.title}</strong><span>{item.meta}</span><Status value={item.status} attention={item.attention} /></article></ItemLink>)}</div></section>
      })}
    </div>
  )
}

function SessionAirspace({ items, emptyLabel }: { items: ZoneAR3Item[]; emptyLabel?: string }) {
  if (!items.length) return <Empty label={emptyLabel} />
  return (
    <div className={styles.r3SessionTimeline}>
      {items.slice(0, 12).map((item, index) => (
        <ItemLink key={item.id} item={item}>
          <article data-attention={item.attention}>
            <div className={styles.r3TimelineMarker}><span>{String(index + 1).padStart(2, '0')}</span></div>
            <div><strong>{item.title}</strong><span>{item.meta}</span>{item.secondary ? <small>{item.secondary}</small> : null}</div>
            <Status value={item.status} attention={item.attention} />
          </article>
        </ItemLink>
      ))}
    </div>
  )
}

function GradeMatrix({ items, emptyLabel }: { items: ZoneAR3Item[]; emptyLabel?: string }) {
  if (!items.length) return <Empty label={emptyLabel} />
  return (
    <div className={styles.r3GradeMatrix} role="table" aria-label="Aperçu des notes et de la maîtrise">
      <div role="row" className={styles.r3GradeHeader}><span role="columnheader">Élève / évaluation</span><span role="columnheader">Contexte</span><span role="columnheader">Résultat</span><span role="columnheader">État</span></div>
      {items.slice(0, 14).map((item) => {
        const max = item.maxValue && item.maxValue > 0 ? item.maxValue : 20
        const percent = item.value == null ? 0 : Math.max(0, Math.min(100, (item.value / max) * 100))
        return <ItemLink item={item} key={item.id}><div role="row" className={styles.r3GradeRow}><strong role="cell">{item.title}</strong><span role="cell">{item.meta || '—'}</span><div role="cell"><b>{item.value == null ? '—' : `${item.value}/${max}`}</b><i><em style={{ width: `${percent}%` }} /></i></div><Status value={item.status} attention={item.attention} /></div></ItemLink>
      })}
    </div>
  )
}

function AverageReadiness({ items, metrics, emptyLabel }: { items: ZoneAR3Item[]; metrics: ZoneAR3Metric[]; emptyLabel?: string }) {
  return (
    <div className={styles.r3AverageCommand}>
      <div className={styles.r3AverageGauge}>
        <span>Consolidation</span>
        <strong>{metrics[0]?.value ?? '—'}</strong>
        <small>{metrics[0]?.detail || 'État institutionnel'}</small>
      </div>
      <div className={styles.r3AverageChecklist}>
        {items.length ? items.slice(0, 8).map((item) => <article key={item.id} data-attention={item.attention}><span aria-hidden="true">{item.attention ? '!' : '✓'}</span><div><strong>{item.title}</strong><small>{item.meta}</small></div><Status value={item.status} attention={item.attention} /></article>) : <Empty label={emptyLabel} />}
      </div>
    </div>
  )
}

function BulletinAtelier({ items, emptyLabel }: { items: ZoneAR3Item[]; emptyLabel?: string }) {
  if (!items.length) return <Empty label={emptyLabel} />
  return (
    <div className={styles.r3BulletinAtelier}>
      <header><div><span>Publication Readiness</span><strong>Bulletin Atelier</strong></div><small>Chaque dossier reste inspectable avant validation.</small></header>
      <div className={styles.r3BulletinMatrix}>
        <div className={styles.r3BulletinMatrixHeader}><span>Dossier</span><span>Période</span><span>Moyenne</span><span>État</span></div>
        {items.slice(0, 12).map((item) => <ItemLink item={item} key={item.id}><article data-attention={item.attention}><strong>{item.title}</strong><span>{item.meta || '—'}</span><b>{item.value == null ? '—' : item.value}</b><Status value={item.status} attention={item.attention} /></article></ItemLink>)}
      </div>
    </div>
  )
}

function CommentaryStudio({ items, emptyLabel }: { items: ZoneAR3Item[]; emptyLabel?: string }) {
  return (
    <div className={styles.r3CommentaryStudio}>
      <aside><span>Navigation élève</span>{items.length ? items.slice(0, 8).map((item) => <ItemLink item={item} key={item.id}><div><strong>{item.title}</strong><small>{item.meta}</small></div></ItemLink>) : <Empty label={emptyLabel} />}</aside>
      <main><div className={styles.r3CommentaryPaper}><span>Teacher Commentary Studio</span><strong>Écrire avec le contexte académique visible</strong><p>Les appréciations restent humaines, traçables et liées au dossier réel. Aucun texte artificiel n’est inventé par cette interface.</p></div>{items.slice(0, 4).map((item) => <blockquote key={item.id}><strong>{item.title}</strong><p>{item.secondary || item.meta || 'Appréciation enregistrée'}</p><Status value={item.status} /></blockquote>)}</main>
    </div>
  )
}

function HistoryLens({ items, emptyLabel }: { items: ZoneAR3Item[]; emptyLabel?: string }) {
  if (!items.length) return <Empty label={emptyLabel} />
  return (
    <div className={styles.r3HistoryLens}>
      {items.slice(0, 16).map((item, index) => <article key={item.id}><div><span>{String(index + 1).padStart(2, '0')}</span><i /></div><main><header><strong>{item.title}</strong><Status value={item.status} attention={item.attention} /></header><p>{item.meta || 'Événement académique'}</p>{item.secondary ? <small>{item.secondary}</small> : null}</main></article>)}
    </div>
  )
}

function DetailCommand({ variant, items, emptyLabel }: { variant: ZoneAR3Variant; items: ZoneAR3Item[]; emptyLabel?: string }) {
  if (!items.length) return <Empty label={emptyLabel} />
  return (
    <div className={styles.r3DetailCommand} data-detail-variant={variant}>
      {items.slice(0, 8).map((item, index) => <article key={item.id} data-attention={item.attention}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{item.title}</strong><p>{item.meta || 'Contexte du dossier'}</p>{item.secondary ? <small>{item.secondary}</small> : null}</div><Status value={item.status} attention={item.attention} /></article>)}
    </div>
  )
}

export default function AcademicZoneAR3Experience({ variant, eyebrow, title, description, metrics = [], items = [], secondaryItems = [], emptyLabel, actionHref, actionLabel }: Props) {
  let body: ReactNode
  if (variant === 'courses') body = <CourseFlow items={items} emptyLabel={emptyLabel} />
  else if (variant === 'homework') body = <HomeworkStudio items={items} emptyLabel={emptyLabel} />
  else if (variant === 'submissions') body = <SubmissionBoard items={items} emptyLabel={emptyLabel} />
  else if (variant === 'assessments') body = <AssessmentPipeline items={items} emptyLabel={emptyLabel} />
  else if (variant === 'assessment-sessions') body = <SessionAirspace items={items} emptyLabel={emptyLabel} />
  else if (variant === 'gradebook') body = <GradeMatrix items={items} emptyLabel={emptyLabel} />
  else if (variant === 'averages') body = <AverageReadiness items={items} metrics={metrics} emptyLabel={emptyLabel} />
  else if (variant === 'bulletins') body = <BulletinAtelier items={items} emptyLabel={emptyLabel} />
  else if (variant === 'commentary') body = <CommentaryStudio items={items} emptyLabel={emptyLabel} />
  else if (variant === 'history') body = <HistoryLens items={items} emptyLabel={emptyLabel} />
  else body = <DetailCommand variant={variant} items={items.length ? items : secondaryItems} emptyLabel={emptyLabel} />

  return (
    <section className={styles.r3Experience} data-r3-variant={variant}>
      <header className={styles.r3ExperienceHeader}>
        <div><span>{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>
        {actionHref && actionLabel ? <Link href={actionHref}>{actionLabel}<b aria-hidden="true">→</b></Link> : null}
      </header>
      <MetricCards metrics={metrics} />
      {body}
    </section>
  )
}

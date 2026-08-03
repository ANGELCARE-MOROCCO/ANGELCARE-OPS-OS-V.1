import Link from 'next/link'
import styles from '../final-authority.module.css'
import type {
  Defect,
  Experiment,
  GrowthOpportunity,
  LaunchGate,
  MetricObservation,
  MonitoringEvent,
  PerformanceObservation,
  QaRun,
  ReleaseRecord,
  SecurityControl,
} from '../types'

type Item =
  | MetricObservation
  | GrowthOpportunity
  | Experiment
  | PerformanceObservation
  | SecurityControl
  | QaRun
  | Defect
  | LaunchGate
  | ReleaseRecord
  | MonitoringEvent

function label(item: Item): string {
  const fallbackId = item.id

  if ('definition_version' in item) return item.metric_key
  if ('budget_numeric' in item) {
    return `${item.route_key} · ${item.metric_key}`
  }
  if ('opportunity_type' in item) return item.title
  if ('hypothesis' in item) return item.name
  if ('control_key' in item) return item.name_fr
  if ('run_type' in item) return item.public_reference
  if ('critical_flag' in item) return item.title
  if ('gate_key' in item) return item.name_fr
  if ('version_label' in item) return item.public_reference
  if ('event_key' in item) return item.summary

  return fallbackId
}

function status(item: Item): string {
  return 'data_quality_status' in item
    ? item.data_quality_status
    : item.status
}

function metadata(item: Item): string {
  if ('definition_version' in item) {
    return String(item.domain)
  }

  if ('opportunity_type' in item) {
    return `${item.domain} · ${item.opportunity_type}`
  }

  if ('hypothesis' in item) {
    return `${item.experiment_type} · ${item.primary_metric_key}`
  }

  if ('budget_numeric' in item) {
    return `${item.surface} · ${item.environment}`
  }

  if ('control_key' in item) {
    return `${item.control_family} · ${item.owner_role}`
  }

  if ('run_type' in item) {
    return item.scope.join(' · ')
  }

  if ('critical_flag' in item) {
    return `${item.domain} · ${item.severity}`
  }

  if ('gate_key' in item) {
    return `${item.gate_family} · ${item.owner_role}`
  }

  if ('version_label' in item) {
    return `${item.target_environment} · ${item.version_label}`
  }

  if ('event_key' in item) {
    return `${item.surface} · ${item.severity}`
  }

  return 'governed record'
}

function displayedValue(item: Item): string | number {
  if ('definition_version' in item) {
    return item.value_numeric ?? item.value_text ?? '—'
  }

  if ('opportunity_type' in item) {
    return `${item.confidence}%`
  }

  if ('hypothesis' in item) {
    return item.primary_metric_key
  }

  if ('budget_numeric' in item) {
    return `${item.value_numeric} ${item.unit}`.trim()
  }

  if ('control_key' in item) {
    return item.risk_level
  }

  if ('run_type' in item) {
    return `${item.passed_checks}/${item.total_checks}`
  }

  if ('critical_flag' in item) {
    return item.severity
  }

  if ('gate_key' in item) {
    return `${item.score}%`
  }

  if ('version_label' in item) {
    return item.target_environment
  }

  if ('event_key' in item) {
    return item.metric_value === null
      ? item.severity
      : `${item.metric_value}${
          item.metric_unit ? ` ${item.metric_unit}` : ''
        }`
  }

  return '—'
}

export function AuthorityWorkspace({
  title,
  copy,
  eyebrow,
  items = [],
  links = [],
}: {
  title: string
  copy: string
  eyebrow: string
  items?: Item[]
  links?: Array<[string, string, string]>
}) {
  return (
    <main className={styles.shell}>
      <section className={styles.workspaceHero}>
        <div>
          <div className={styles.eyebrow}>{eyebrow}</div>
          <h1>{title}</h1>
          <p>{copy}</p>
        </div>

        <div className={styles.truthSeal}>
          <span>EVIDENCE LAW</span>
          <strong>{items.length}</strong>
          <em>persistent records</em>
        </div>
      </section>

      {links.length > 0 && (
        <section className={styles.commandAtlas}>
          {links.map(([linkTitle, href, linkCopy]) => (
            <Link href={href} key={href}>
              <span>CONTROL SURFACE</span>
              <strong>{linkTitle}</strong>
              <p>{linkCopy}</p>
              <i>Open →</i>
            </Link>
          ))}
        </section>
      )}

      <section className={styles.panel}>
        <header>
          <div>
            <span>GOVERNED REGISTER</span>
            <h2>{title}</h2>
          </div>

          <small>
            {items.length} records · no synthetic completion
          </small>
        </header>

        <div className={styles.rows}>
          {items.length ? (
            items.map((item) => {
              const currentStatus = status(item)

              const accepted = [
                'accepted',
                'effective',
                'passed',
                'completed',
                'closed',
                'resolved',
                'approved',
                'running',
              ].includes(currentStatus)

              return (
                <div className={styles.row} key={item.id}>
                  <div>
                    <strong>{label(item)}</strong>
                    <small>{metadata(item)}</small>
                  </div>

                  <b>{displayedValue(item)}</b>

                  <span data-risk={!accepted}>
                    {currentStatus}
                  </span>
                </div>
              )
            })
          ) : (
            <div className={styles.empty}>
              Aucune donnée persistante disponible. Ce workspace reste
              honnête et n’invente aucun résultat.
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

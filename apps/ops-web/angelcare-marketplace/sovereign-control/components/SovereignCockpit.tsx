import Link from 'next/link'
import { ArrowRight, CheckCircle2, Clock3, Search, ShieldAlert } from 'lucide-react'
import type { CommandSummary } from '../types'
import styles from '../sovereign.module.css'

export function SovereignCockpit({ summary }: { summary: CommandSummary }) {
  return (
    <div className={styles.commandUniverse}>
      <section className={styles.commandHero}>
        <div className={styles.heroGrid}>
          <div>
            <span className={styles.kicker}>Master Backoffice souverain</span>
            <h1 className={styles.heroTitle}>Décider, assigner et prouver depuis un seul centre de commandement.</h1>
            <p className={styles.heroText}>Chaque signal mène vers un objet réel, un propriétaire, un statut, une prochaine action et une preuve. Aucun indicateur décoratif n’est présenté comme une réalité opérationnelle.</p>
          </div>
          <div className={styles.heroDecision}>
            <strong>Point de décision exécutif</strong>
            <p>{summary.risks.length ? `${summary.risks.length} catégorie(s) de risque nécessitent une attention.` : 'Aucun risque critique calculé à partir des objets actuellement ouverts.'}</p>
          </div>
        </div>
      </section>

      <section className={styles.metricRail} aria-label="Indicateurs de commandement">
        {summary.metrics.map((metric) => (
          <Link href={metric.route} className={styles.metric} key={metric.key}>
            <div className={styles.metricTop}><span>{metric.label}</span><span className={styles.metricStatus} data-status={metric.status} /></div>
            <strong className={styles.metricValue}>{metric.value}</strong>
            <span className={styles.metricHint}>{metric.explanation}</span>
          </Link>
        ))}
      </section>

      <section className={styles.commandGrid}>
        <div className={styles.panel}>
          <header className={styles.panelHeader}>
            <div><h2>Décisions en attente</h2><p>Demandes soumises avec objet, priorité, échéance et progression.</p></div>
            <Link href="/angelcare-marketplace/admin/approvals"><ArrowRight size={18} /></Link>
          </header>
          <div className={styles.list}>
            {summary.approvals.length ? summary.approvals.map((item) => (
              <Link href={`/angelcare-marketplace/admin/approvals?focus=${item.id}`} className={styles.listRow} key={item.id}>
                <div><div className={styles.listTitle}>{item.title}</div><div className={styles.listMeta}><span>{item.object_type}</span><span>{item.public_reference}</span><span>Étape {item.current_step}/{item.required_steps}</span></div></div>
                <span className={styles.priority} data-priority={item.priority}>{item.priority}</span>
              </Link>
            )) : <div className={styles.empty}><CheckCircle2 size={22} /> Aucune décision en attente.</div>}
          </div>
        </div>
        <aside className={styles.panel}>
          <header className={styles.panelHeader}><div><h2>Risques actifs</h2><p>Calculés depuis les actions et décisions ouvertes.</p></div><ShieldAlert size={19} /></header>
          <div className={styles.riskStack}>{summary.risks.length ? summary.risks.map((risk) => <Link className={styles.risk} data-severity={risk.severity} href={risk.route} key={risk.key}><strong>{risk.count} · {risk.label}</strong><p>{risk.nextAction}</p></Link>) : <div className={styles.empty}>Aucun signal critique calculé.</div>}</div>
        </aside>
      </section>

      <section className={styles.commandGrid}>
        <div className={styles.panel}>
          <header className={styles.panelHeader}><div><h2>Actions prioritaires</h2><p>Travail assignable, traçable et clôturable.</p></div><Clock3 size={19} /></header>
          <div className={styles.list}>{summary.actions.length ? summary.actions.map((item) => <Link href={`/angelcare-marketplace/admin/action-center?focus=${item.id}`} className={styles.listRow} key={item.id}><div><div className={styles.listTitle}>{item.title}</div><div className={styles.listMeta}><span>{item.status}</span><span>{item.next_action || 'Prochaine action à confirmer'}</span></div></div><span className={styles.priority} data-priority={item.priority}>{item.priority}</span></Link>) : <div className={styles.empty}>Aucune action active.</div>}</div>
        </div>
        <div className={styles.panel}>
          <header className={styles.panelHeader}><div><h2>Recherche souveraine</h2><p>Pages, familles, demandes, territoires et décisions.</p></div><Search size={19} /></header>
          <div className={styles.riskStack}><Link href="/angelcare-marketplace/admin/search" className={styles.risk}><strong>Ouvrir la recherche globale</strong><p>Retrouver un objet sans connaître son identifiant technique.</p></Link></div>
        </div>
      </section>
    </div>
  )
}

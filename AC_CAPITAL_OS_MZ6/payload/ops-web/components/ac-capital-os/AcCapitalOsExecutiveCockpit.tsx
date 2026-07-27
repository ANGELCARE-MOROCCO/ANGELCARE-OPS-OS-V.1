import { AcCapitalOsShell } from './AcCapitalOsShell';
import styles from './ac-capital-os.module.css';
import {
  aiPreparedActions,
  capitalCommandMetrics,
  capitalReadinessPillars,
  deadlineRisks,
  documentBlockers,
  fundingRouteSplit,
  hotOpportunities,
  pipelineStageCards,
  todayCommandPlan,
} from '../../lib/ac-capital-os/executive-cockpit';

function riskClass(risk: string) {
  if (risk === 'critical' || risk === 'high') return styles.riskHigh;
  if (risk === 'medium') return styles.riskMedium;
  return styles.riskLow;
}

export function AcCapitalOsExecutiveCockpit() {
  const readinessScore = capitalReadinessPillars.reduce((sum, pillar) => sum + pillar.score, 0) / capitalReadinessPillars.length;

  return (
    <AcCapitalOsShell activeWorkspaceKey="executive-cockpit" zipLabel="Mega ZIP 02">
      <section className={styles.executiveHero}>
        <div className={styles.executiveHeroCopy}>
          <p className={styles.eyebrow}>Capital Executive Cockpit · live command room</p>
          <h2>Today’s capital priorities are visible, ranked and execution-ready.</h2>
          <p>
            AC CAPITAL OS now gives the coordinator team a premium capital command surface: readiness score, high-fit routes, deadline risks,
            AI-prepared actions, document blockers and a clear daily command plan. The AI prepares expert work; humans approve and execute.
          </p>
          <div className={styles.heroActions}>
            <a href="#today-command-plan" className={styles.primaryAction}>Open Today’s Command Plan</a>
            <a href="#ai-action-queue" className={styles.secondaryAction}>Review AI-Prepared Actions</a>
            <a href="/api/ac-capital-os/executive-cockpit" className={styles.secondaryAction}>Inspect Cockpit API</a>
          </div>
        </div>
        <aside className={styles.capitalScoreCard}>
          <span className={styles.readinessLabel}>Capital Readiness Score</span>
          <strong>{Math.round(readinessScore)}%</strong>
          <p>Executive cockpit activated. Radar, qualification and doctrine systems are next in the signed delivery chain.</p>
          <div className={styles.readinessMeter}><span style={{ width: `${Math.round(readinessScore)}%` }} /></div>
          <small>Coordinator can understand the capital day in under 60 seconds.</small>
        </aside>
      </section>

      <section className={styles.metricGrid} aria-label="Capital command metrics">
        {capitalCommandMetrics.map((metric) => (
          <article key={metric.label} className={`${styles.metricCard} ${styles[`cardAccent_${metric.accent}`]}`}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <p>{metric.context}</p>
            <small>{metric.trend}</small>
          </article>
        ))}
      </section>

      <section id="today-command-plan" className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Coordinator mission desk</p>
          <h2>Today’s command plan</h2>
          <p>Every action is written for a coordinator who executes and escalates, not for a fundraising expert starting from zero.</p>
        </div>
        <div className={styles.timelineGrid}>
          {todayCommandPlan.map((item) => (
            <article key={`${item.time}-${item.title}`} className={`${styles.timelineCard} ${item.priority === 'critical' ? styles.timelineCritical : ''}`}>
              <span>{item.time}</span>
              <h3>{item.title}</h3>
              <p>{item.instruction}</p>
              <small>{item.owner} · {item.priority}</small>
            </article>
          ))}
        </div>
      </section>

      <section id="ai-action-queue" className={styles.splitGrid}>
        <div className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>AI prepared · human controlled</p>
            <h2>Actions awaiting approval or execution</h2>
          </div>
          <div className={styles.actionStack}>
            {aiPreparedActions.map((action) => (
              <article key={action.title} className={styles.aiActionCard}>
                <div>
                  <span className={riskClass(action.risk)}>{action.risk} risk</span>
                  <h3>{action.title}</h3>
                  <p>{action.opportunity}</p>
                </div>
                <div>
                  <strong>{action.readiness}</strong>
                  <p>{action.humanAction}</p>
                  <small>Deadline: {action.deadline}</small>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Readiness pillars</p>
            <h2>Capital readiness anatomy</h2>
          </div>
          <div className={styles.readinessPillarStack}>
            {capitalReadinessPillars.map((pillar) => (
              <div key={pillar.label} className={styles.pillarRow}>
                <div><strong>{pillar.label}</strong><span>{pillar.score}%</span></div>
                <div className={styles.pillarTrack}><span style={{ width: `${pillar.score}%` }} /></div>
                <p>{pillar.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>High-fit funding routes</p>
          <h2>Recommended capital opportunities to protect and prepare</h2>
        </div>
        <div className={styles.capitalTable}>
          <div className={styles.capitalTableHead}><span>Opportunity</span><span>Route</span><span>Type</span><span>Score</span><span>Deadline</span><span>Next action</span></div>
          {hotOpportunities.map((opportunity) => (
            <div key={opportunity.name} className={styles.capitalTableRow}>
              <strong>{opportunity.name}<small>{opportunity.estimatedValue}</small></strong>
              <span>{opportunity.route}</span>
              <span>{opportunity.type}</span>
              <span className={styles.scorePill}>{opportunity.score}/100</span>
              <span>{opportunity.deadline}</span>
              <span>{opportunity.nextAction}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.splitGrid}>
        <div className={styles.sectionBlock}>
          <div className={styles.sectionHeader}><p className={styles.eyebrow}>Deadline heat</p><h2>Risks that must not be ignored</h2></div>
          <div className={styles.compactList}>
            {deadlineRisks.map((risk) => (
              <article key={risk.label}><span className={riskClass(risk.risk)}>{risk.deadline}</span><strong>{risk.label}</strong><p>{risk.status}</p></article>
            ))}
          </div>
        </div>
        <div className={styles.sectionBlock}>
          <div className={styles.sectionHeader}><p className={styles.eyebrow}>Document blockers</p><h2>Missing proof before submission readiness</h2></div>
          <div className={styles.compactList}>
            {documentBlockers.map((blocker) => (
              <article key={blocker.document}><span>{blocker.owner}</span><strong>{blocker.document}</strong><p>{blocker.neededFor} · {blocker.status}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}><p className={styles.eyebrow}>Pipeline visibility</p><h2>Capital pipeline stage snapshot</h2></div>
        <div className={styles.pipelineGrid}>
          {pipelineStageCards.map((stage) => (
            <article key={stage.stage} className={styles.pipelineStage}><span>{stage.stage}</span><strong>{stage.count}</strong><p>{stage.note}</p></article>
          ))}
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}><p className={styles.eyebrow}>Funding route split</p><h2>Where AC CAPITAL OS is watching and preparing</h2></div>
        <div className={styles.routeSplitGrid}>
          {fundingRouteSplit.map((route) => (
            <div key={route.label} className={styles.routeSplitRow}>
              <div><strong>{route.label}</strong><span>{route.value}%</span></div>
              <div className={`${styles.routeSplitTrack} ${styles[`track_${route.accent}`]}`}><span style={{ width: `${route.value}%` }} /></div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.doctrineWall}>
        <p>Human coordinator approves and executes — AI prepares expert work.</p>
        <p>No external communication without approval.</p>
        <p>No submission without document readiness.</p>
        <p>No opportunity without source confidence once Radar activates.</p>
        <p>No deadline hidden in memory or chat.</p>
        <p>Every capital route becomes owned, visible and controlled.</p>
      </section>
    </AcCapitalOsShell>
  );
}

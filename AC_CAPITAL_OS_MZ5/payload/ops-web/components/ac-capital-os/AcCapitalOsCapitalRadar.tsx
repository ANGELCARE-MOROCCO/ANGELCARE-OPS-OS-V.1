import { AcCapitalOsShell } from './AcCapitalOsShell';
import styles from './ac-capital-os.module.css';
import {
  capitalRadarAdapterStatus,
  capitalRadarFilters,
  capitalRadarHandoffQueue,
  capitalRadarOpportunities,
  capitalRadarResearchRuns,
} from '../../lib/ac-capital-os/capital-radar';
import { capitalCommandMetrics, deadlineRisks, hotOpportunities } from '../../lib/ac-capital-os/executive-cockpit';

function heatClass(heat: string) {
  if (heat === 'critical' || heat === 'hot') return styles.riskHigh;
  if (heat === 'warm' || heat === 'watch' || heat === 'unknown') return styles.riskMedium;
  return styles.riskLow;
}

function confidenceLabel(score: number) {
  if (score >= 85) return 'High Source Confidence';
  if (score >= 70) return 'Source Confidence Under Review';
  return 'Human Source Confirmation Needed';
}

export function AcCapitalOsCapitalRadar() {
  const detectedCount = capitalRadarOpportunities.length;
  const highDeadlineCount = capitalRadarOpportunities.filter((opportunity) => opportunity.deadlineHeat === 'hot' || opportunity.deadlineHeat === 'critical').length;
  const qualificationReadyCount = capitalRadarOpportunities.filter((opportunity) => opportunity.handoffStatus === 'ready-for-qualification').length;
  const averageConfidence = Math.round(capitalRadarOpportunities.reduce((sum, opportunity) => sum + opportunity.sourceConfidence, 0) / detectedCount);
  const cockpitReadinessMetric = capitalCommandMetrics[0];

  return (
    <AcCapitalOsShell activeWorkspaceKey="capital-radar" zipLabel="Mega ZIP 03" subtitle="Capital Radar · Morocco + International Funding Intelligence">
      <section className={styles.radarHero}>
        <div className={styles.radarHeroCopy}>
          <p className={styles.eyebrow}>MZ3_AC_CAPITAL_OS_CAPITAL_RADAR · Funding Intelligence</p>
          <h2>Capital Radar is now scanning the funding universe and preparing routes for qualification.</h2>
          <p>
            This workspace captures Morocco, Africa/MENA and international funding signals, grades Source Confidence,
            shows Deadline Heat, explains why an opportunity matters to AngelCare and prepares a safe Send to Qualification handoff for Mega ZIP 04.
          </p>
          <div className={styles.heroActions}>
            <a href="#opportunity-stream" className={styles.primaryAction}>Open Opportunity Stream</a>
            <a href="#research-adapter" className={styles.secondaryAction}>Inspect Research Adapter</a>
            <a href="/api/ac-capital-os/capital-radar" className={styles.secondaryAction}>Inspect Radar API</a>
          </div>
        </div>
        <aside className={styles.radarSignalTower} aria-label="Capital Radar status">
          <span>Active Scan Status</span>
          <strong>{detectedCount}</strong>
          <p>detected opportunities in seeded safe radar contract mode</p>
          <div className={styles.radarSignalGrid}>
            <div><b>{averageConfidence}%</b><small>Avg Source Confidence</small></div>
            <div><b>{qualificationReadyCount}</b><small>Send to Qualification</small></div>
            <div><b>{highDeadlineCount}</b><small>High Deadline Heat</small></div>
          </div>
        </aside>
      </section>

      <section className={styles.radarContinuityStrip} aria-label="MZ2 cockpit preservation">
        <div>
          <span>Capital Executive Cockpit preserved</span>
          <strong>{cockpitReadinessMetric.value} · {cockpitReadinessMetric.label}</strong>
          <p>MZ2 remains active: deadline risks, AI-prepared actions and today’s command plan continue to exist while MZ3 adds radar intelligence.</p>
        </div>
        <div>
          <span>Urgent cockpit signal</span>
          <strong>{deadlineRisks[0]?.deadline} · {deadlineRisks[0]?.label}</strong>
          <p>{deadlineRisks[0]?.status}</p>
        </div>
        <div>
          <span>High-fit route still protected</span>
          <strong>{hotOpportunities[0]?.name}</strong>
          <p>{hotOpportunities[0]?.nextAction}</p>
        </div>
      </section>

      <section className={styles.radarCategoryGrid} aria-label="Radar intelligence categories">
        {capitalRadarFilters.map((filter) => (
          <article key={filter.value} className={`${styles.radarCategoryCard} ${styles[`cardAccent_${filter.accent}`]}`}>
            <span>{filter.label}</span>
            <strong>{filter.count}</strong>
            <p>Filtered route family ready for manual review, radar capture and qualification handoff governance.</p>
          </article>
        ))}
      </section>

      <section className={styles.splitGrid} id="research-adapter">
        <div className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Research Adapter · Gemini-ready / web-ready safety boundary</p>
            <h2>Adapter monitor</h2>
            <p>No secrets or provider keys are exposed. This is the MZ3 safe radar contract for future live web/Gemini wiring.</p>
          </div>
          <div className={styles.adapterPanel}>
            <div><span>Adapter</span><strong>{capitalRadarAdapterStatus.name}</strong></div>
            <div><span>Mode</span><strong>{capitalRadarAdapterStatus.mode}</strong></div>
            <div><span>Last run</span><strong>{capitalRadarAdapterStatus.lastRun}</strong></div>
            <div><span>Next scheduled run</span><strong>{capitalRadarAdapterStatus.nextScheduledRun}</strong></div>
            <div><span>Failed runs</span><strong>{capitalRadarAdapterStatus.failedRuns}</strong></div>
            <div><span>Human review required</span><strong>{capitalRadarAdapterStatus.humanReviewRequired}</strong></div>
          </div>
          <p className={styles.safetyNote}>{capitalRadarAdapterStatus.safetyNote}</p>
        </div>

        <div className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Research run history</p>
            <h2>Source capture health</h2>
          </div>
          <div className={styles.compactList}>
            {capitalRadarResearchRuns.map((run) => (
              <article key={run.id}>
                <span>{run.mode} · {run.status}</span>
                <strong>{run.label}</strong>
                <p>{run.opportunitiesDetected} opportunities · {run.sourcesCaptured} sources · {run.humanReviewRequired} human review</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="opportunity-stream" className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Opportunity stream · source confidence · deadline heat</p>
          <h2>Detected capital routes ready for review</h2>
          <p>Each card explains why the radar captured it, what AngelCare relevance exists and whether it can be sent to Qualification Engine.</p>
        </div>
        <div className={styles.radarOpportunityGrid}>
          {capitalRadarOpportunities.map((opportunity) => (
            <article key={opportunity.id} className={styles.radarOpportunityCard}>
              <div className={styles.radarOpportunityTopline}>
                <span>{opportunity.region}</span>
                <small className={heatClass(opportunity.deadlineHeat)}>Deadline Heat: {opportunity.deadlineHeat}</small>
              </div>
              <h3>{opportunity.title}</h3>
              <div className={styles.radarMetaGrid}>
                <div><span>Funding type</span><strong>{opportunity.fundingType.split('-').join(' ')}</strong></div>
                <div><span>Country</span><strong>{opportunity.country}</strong></div>
                <div><span>Amount</span><strong>{opportunity.amountRange}</strong></div>
                <div><span>Deadline</span><strong>{opportunity.deadline}</strong></div>
              </div>
              <div className={styles.confidenceRow}>
                <div><span>Source Confidence</span><strong>{opportunity.sourceConfidence}%</strong><small>{confidenceLabel(opportunity.sourceConfidence)}</small></div>
                <div className={styles.confidenceTrack}><span style={{ width: `${opportunity.sourceConfidence}%` }} /></div>
              </div>
              <div className={styles.radarTextBlock}>
                <strong>Eligibility preview</strong>
                <p>{opportunity.eligibilityPreview}</p>
              </div>
              <div className={styles.radarTextBlock}>
                <strong>Why AI captured it for AngelCare</strong>
                <p>{opportunity.whyCaptured}</p>
              </div>
              <div className={styles.keywordRow}>
                {opportunity.detectedKeywords.map((keyword) => <span key={keyword}>{keyword}</span>)}
              </div>
              <div className={styles.radarActions}>
                <button type="button">Send to Qualification</button>
                <button type="button">View Brief</button>
                <button type="button">Add to Watchlist</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Handoff panel · ZIP 04 preparation</p>
          <h2>Qualification readiness queue</h2>
          <p>Radar does not pretend to finish scoring. It prepares clean handoff signals for the signed Qualification Engine ZIP.</p>
        </div>
        <div className={styles.handoffGrid}>
          {capitalRadarHandoffQueue.map((item) => (
            <article key={item.label} className={`${styles.handoffCard} ${styles[`cardAccent_${item.accent}`]}`}>
              <span>{item.label}</span>
              <strong>{item.count}</strong>
              <p>{item.instruction}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.doctrineWall}>
        <p>Capital Radar detects. Qualification Engine decides.</p>
        <p>No live provider key belongs in the browser.</p>
        <p>No opportunity moves forward without Source Confidence.</p>
        <p>Deadline Heat must be visible before human follow-up.</p>
        <p>Morocco and International routes are tracked in one command surface.</p>
        <p>Every detected route has a safe Send to Qualification handoff.</p>
      </section>
    </AcCapitalOsShell>
  );
}

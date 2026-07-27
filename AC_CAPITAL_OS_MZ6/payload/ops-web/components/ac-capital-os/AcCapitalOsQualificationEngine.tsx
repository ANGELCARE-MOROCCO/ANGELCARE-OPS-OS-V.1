import { AcCapitalOsShell } from './AcCapitalOsShell';
import styles from './ac-capital-os.module.css';
import { capitalRadarOpportunities } from '../../lib/ac-capital-os/capital-radar';
import { capitalCommandMetrics } from '../../lib/ac-capital-os/executive-cockpit';
import {
  qualificationBoardColumns,
  qualificationDossiers,
  qualificationQueue,
  qualificationSummaryMetrics,
} from '../../lib/ac-capital-os/qualification-engine';
import type { AcCapitalOsRiskLevel, AcCapitalQualificationDecision, AcCapitalQualificationStatus } from '../../lib/ac-capital-os/types';

function riskClass(risk: AcCapitalOsRiskLevel) {
  if (risk === 'critical' || risk === 'high') return styles.riskHigh;
  if (risk === 'medium') return styles.riskMedium;
  return styles.riskLow;
}

function decisionClass(decision: AcCapitalQualificationDecision) {
  if (decision === 'Pursue Immediately' || decision === 'Strong — Prepare Package') return styles.qualificationDecisionStrong;
  if (decision === 'Prepare Missing Documents' || decision === 'Escalate to Founder') return styles.qualificationDecisionWarning;
  if (decision === 'Reject' || decision === 'Low Priority') return styles.qualificationDecisionReject;
  return styles.qualificationDecisionWatch;
}

function statusLabel(status: AcCapitalQualificationStatus) {
  return status.split('-').join(' ');
}

export function AcCapitalOsQualificationEngine() {
  const primaryDossier = qualificationDossiers[0];
  if (!primaryDossier) {
    return null;
  }
  const averageScore = Math.round(qualificationDossiers.reduce((sum, dossier) => sum + dossier.totalScore, 0) / (qualificationDossiers.length || 1));
  const readyForCaseBuilderCount = qualificationDossiers.filter((dossier) => dossier.decisionLabel === 'Pursue Immediately' || dossier.decisionLabel === 'Strong — Prepare Package').length;
  const founderReviewCount = qualificationDossiers.filter((dossier) => dossier.founderReviewRequired).length;
  const radarReadyCount = capitalRadarOpportunities.filter((opportunity) => opportunity.handoffStatus === 'ready-for-qualification').length;
  const cockpitSignal = capitalCommandMetrics[0];

  return (
    <AcCapitalOsShell activeWorkspaceKey="qualification-engine" zipLabel="Mega ZIP 04" subtitle="Qualification Engine · Opportunity Fit, Eligibility & Strategic Pursuit Scoring">
      <section className={styles.qualificationHero}>
        <div className={styles.qualificationHeroCopy}>
          <p className={styles.eyebrow}>MZ4_AC_CAPITAL_OS_QUALIFICATION_ENGINE · investment committee scoring room</p>
          <h2>Every opportunity is scored, explained, risk-tested and routed before AngelCare spends time on it.</h2>
          <p>
            Qualification Engine transforms Capital Radar signals into AngelCare-specific Fit Score dossiers. It explains Eligibility Fit,
            Women Cofounder Fit, SaaS Fit, Childcare Impact Fit, Deadline Feasibility, Documentation Readiness, Risk and Objections,
            Founder Review Required status and the exact next action before any case is built or submitted.
          </p>
          <div className={styles.heroActions}>
            <a href="#qualification-queue" className={styles.primaryAction}>Review Radar Handoff</a>
            <a href="#opportunity-dossier" className={styles.secondaryAction}>Open High-Fit Dossiers</a>
            <a href="/api/ac-capital-os/qualification-engine" className={styles.secondaryAction}>Inspect Qualification API</a>
          </div>
        </div>
        <aside className={styles.qualificationScoreTower} aria-label="Qualification Engine status">
          <span>Average Fit Score</span>
          <strong>{averageScore}/100</strong>
          <p>qualification dossiers scored in seeded safe MZ4 contract mode</p>
          <div className={styles.qualificationTowerGrid}>
            <div><b>{qualificationQueue.length}</b><small>Awaiting Qualification</small></div>
            <div><b>{readyForCaseBuilderCount}</b><small>Send to Case Builder candidates</small></div>
            <div><b>{founderReviewCount}</b><small>Founder Review Required</small></div>
          </div>
        </aside>
      </section>

      <section className={styles.qualificationContinuityStrip} aria-label="MZ1 MZ2 MZ3 preservation">
        <div>
          <span>AC CAPITAL OS preserved</span>
          <strong>{cockpitSignal?.value ?? 'MZ2'} · {cockpitSignal?.label ?? 'Capital Executive Cockpit'}</strong>
          <p>MZ1 shell and MZ2 Capital Executive Cockpit remain active while MZ4 adds committee-grade pursuit scoring.</p>
        </div>
        <div>
          <span>Capital Radar handoff preserved</span>
          <strong>{radarReadyCount} ready from Radar</strong>
          <p>Source Confidence, Deadline Heat and Research Adapter signals remain visible and feed the scoring queue.</p>
        </div>
        <div>
          <span>Case Builder boundary</span>
          <strong>{readyForCaseBuilderCount} candidates</strong>
          <p>MZ4 can recommend Send to Case Builder but does not claim to complete the later Fundraising Case Builder ZIP.</p>
        </div>
      </section>

      <section className={styles.qualificationMetricGrid} aria-label="Qualification Engine metrics">
        {qualificationSummaryMetrics.map((metric) => (
          <article key={metric.label} className={`${styles.qualificationMetricCard} ${styles[`cardAccent_${metric.accent}`]}`}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <p>{metric.context}</p>
          </article>
        ))}
      </section>

      <section id="qualification-queue" className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Radar handoff · qualification queue</p>
          <h2>Opportunity queue from Capital Radar</h2>
          <p>Each row preserves radar context while adding preliminary Fit Score, missing information count and recommended committee action.</p>
        </div>
        <div className={styles.qualificationQueueTable}>
          <div className={styles.qualificationQueueHead}>
            <span>Opportunity</span><span>Region</span><span>Type</span><span>Radar Source Confidence</span><span>Fit Score</span><span>Status</span><span>Decision</span>
          </div>
          {qualificationQueue.map((item) => (
            <div key={item.id} className={styles.qualificationQueueRow}>
              <strong>{item.title}<small>{item.source} · {item.deadline}</small></strong>
              <span>{item.region}</span>
              <span>{item.fundingType.split('-').join(' ')}</span>
              <span>{item.radarSourceConfidence}% · Deadline Heat {item.deadlineHeat}</span>
              <span className={styles.scorePill}>{item.preliminaryFitScore}/100</span>
              <span>{statusLabel(item.currentQualificationStatus)}</span>
              <span className={decisionClass(item.recommendedAction)}>{item.recommendedAction}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="opportunity-dossier" className={styles.qualificationDossierShell}>
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Opportunity scoring dossier · Fit Score · Eligibility Fit · Women Cofounder Fit</p>
          <h2>{primaryDossier.title}</h2>
          <p>{primaryDossier.executiveSummary}</p>
        </div>

        <div className={styles.qualificationDecisionGrid}>
          <article className={styles.qualificationDecisionCard}>
            <span>Final Fit Score</span>
            <strong>{primaryDossier.totalScore}/100</strong>
            <p>{primaryDossier.decisionLabel}</p>
            <div className={styles.qualificationScoreTrack}><span style={{ width: `${primaryDossier.totalScore}%` }} /></div>
          </article>
          <article className={styles.qualificationDecisionCard}>
            <span>AI confidence</span>
            <strong>{primaryDossier.aiConfidence}%</strong>
            <p>Human verification remains required before submission.</p>
            <div className={styles.qualificationScoreTrack}><span style={{ width: `${primaryDossier.aiConfidence}%` }} /></div>
          </article>
          <article className={styles.qualificationDecisionCard}>
            <span>Documentation Readiness</span>
            <strong>{primaryDossier.documentationReadiness}%</strong>
            <p>Prepare Missing Documents before Send to Case Builder.</p>
            <div className={styles.qualificationScoreTrack}><span style={{ width: `${primaryDossier.documentationReadiness}%` }} /></div>
          </article>
          <article className={styles.qualificationDecisionCard}>
            <span>Founder Review Required</span>
            <strong>{primaryDossier.founderReviewRequired ? 'YES' : 'NO'}</strong>
            <p>{primaryDossier.recommendedOwner}</p>
          </article>
        </div>

        <div className={styles.splitGrid}>
          <article className={styles.qualificationInsightPanel}>
            <span>Eligibility analysis panel</span>
            <h3>What AngelCare appears to satisfy</h3>
            <p>{primaryDossier.eligibilitySummary}</p>
            <ul>
              <li>Confirmed / Likely / Unclear / Missing / Blocking labels are supported in criterion evidence.</li>
              <li>Human Verification Required remains visible when source criteria are incomplete.</li>
              <li>Legal and compliance caution is preserved before external submission.</li>
            </ul>
          </article>
          <article className={styles.qualificationInsightPanel}>
            <span>Strategic AngelCare match panel</span>
            <h3>Why this matters specifically for AngelCare</h3>
            <p>{primaryDossier.angelCareMatchSummary}</p>
            <ul>
              <li>B2C family services, B2B schools/crèches and Partner OS SaaS relevance.</li>
              <li>Academy, Quality Check 360, marketplace and job-creation relevance.</li>
              <li>Cost-control doctrine and phased Morocco-to-international expansion logic.</li>
            </ul>
          </article>
        </div>

        <section className={styles.qualificationCriteriaGrid} aria-label="Scoring breakdown">
          {primaryDossier.criteria.map((criterion) => (
            <article key={criterion.criterionKey} className={styles.qualificationCriterionCard}>
              <div>
                <span>{criterion.label}</span>
                <strong>{criterion.score}/{criterion.weight}</strong>
              </div>
              <p>{criterion.explanation}</p>
              <div className={styles.criterionTrack}><span style={{ width: `${Math.min(100, Math.round((criterion.score / criterion.weight) * 100))}%` }} /></div>
              <small>{criterion.evidenceStatus} · confidence {criterion.aiConfidence}% · {criterion.riskNote}</small>
            </article>
          ))}
        </section>
      </section>

      <section className={styles.splitGrid}>
        <div className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Risk and Objections</p>
            <h2>Likely funder objections and mitigation</h2>
          </div>
          <div className={styles.qualificationRiskStack}>
            {primaryDossier.risks.map((risk) => (
              <article key={risk.riskType}>
                <span className={riskClass(risk.severity)}>{risk.severity} · {risk.riskType}</span>
                <strong>{risk.description}</strong>
                <p>{risk.mitigation}</p>
                <small>{risk.owner} · Founder Review Required: {risk.founderReviewRequired ? 'Yes' : 'No'}</small>
              </article>
            ))}
          </div>
        </div>

        <div className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Documentation Readiness</p>
            <h2>Missing documents and submission blockers</h2>
          </div>
          <div className={styles.qualificationDocumentStack}>
            {primaryDossier.missingDocuments.map((document) => (
              <article key={document.documentName}>
                <span>{document.status} · {document.priority}</span>
                <strong>{document.documentName}</strong>
                <p>{document.category} · owner: {document.owner} · due: {document.dueDate}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Recommended next action panel</p>
          <h2>Coordinator-ready execution commands</h2>
          <p>Scoring is converted into direct actions so the human coordinator approves, verifies and routes — not rethinks the strategy from zero.</p>
        </div>
        <div className={styles.qualificationNextActionGrid}>
          {primaryDossier.nextActions.map((action) => (
            <article key={action.label} className={styles.qualificationNextActionCard}>
              <span>{action.priority} · {action.relatedWorkspace}</span>
              <h3>{action.label}</h3>
              <p>{action.why}</p>
              <strong>{action.expectedOutput}</strong>
              <small>{action.owner} · deadline: {action.deadline}</small>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Qualification board · committee status</p>
          <h2>Portfolio of pursuit decisions</h2>
        </div>
        <div className={styles.qualificationBoardGrid}>
          {qualificationBoardColumns.map((column) => (
            <article key={column.status} className={`${styles.qualificationBoardCard} ${styles[`cardAccent_${column.accent}`]}`}>
              <span>{column.label}</span>
              <strong>{column.count}</strong>
              <p>{column.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.doctrineWall}>
        <p>Fit Score is explainable, weighted and AngelCare-specific.</p>
        <p>No pursuit decision happens without Eligibility Fit and risk analysis.</p>
        <p>Women Cofounder Fit and SaaS Fit are visible scoring criteria.</p>
        <p>Documentation Readiness controls Send to Case Builder.</p>
        <p>Founder Review Required is explicit when strategy is sensitive.</p>
        <p>MZ4 scores and routes — it does not submit or replace human approval.</p>
      </section>
    </AcCapitalOsShell>
  );
}

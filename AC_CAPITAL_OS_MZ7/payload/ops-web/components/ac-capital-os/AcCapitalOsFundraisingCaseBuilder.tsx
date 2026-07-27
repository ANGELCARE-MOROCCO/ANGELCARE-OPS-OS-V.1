import { AcCapitalOsShell } from './AcCapitalOsShell';
import styles from './ac-capital-os.module.css';
import {
  caseBuilderCases,
  caseBuilderCoordinatorHandovers,
  caseBuilderDocuments,
  caseBuilderFinancialSections,
  caseBuilderFounderApprovals,
  caseBuilderHandoffTargets,
  caseBuilderImpactSections,
  caseBuilderNarratives,
  caseBuilderPositioningBlocks,
  caseBuilderProofPacks,
  caseBuilderRiskPlans,
  caseBuilderStages,
  caseBuilderOutreachScripts,
  getCaseBuilderSnapshot,
} from '../../lib/ac-capital-os/case-builder';
import type { AcCapitalOsRiskLevel } from '../../lib/ac-capital-os/types';

function riskClass(risk: AcCapitalOsRiskLevel) {
  if (risk === 'critical' || risk === 'high') return styles.riskHigh;
  if (risk === 'medium') return styles.riskMedium;
  return styles.riskLow;
}

function readinessClass(score: number) {
  if (score >= 84) return styles.qualificationDecisionStrong;
  if (score >= 70) return styles.qualificationDecisionWarning;
  return styles.qualificationDecisionWatch;
}

export function AcCapitalOsFundraisingCaseBuilder() {
  const snapshot = getCaseBuilderSnapshot();
  const selectedCase = caseBuilderCases[0];
  const readyDocs = caseBuilderDocuments.filter((doc) => doc.status === 'Ready').length;
  const missingDocs = caseBuilderDocuments.filter((doc) => doc.status === 'Missing' || doc.status.includes('Needs')).length;

  return (
    <AcCapitalOsShell activeWorkspaceKey="case-builder" zipLabel="Mega ZIP 07" subtitle="Fundraising Case Builder · Opportunity-to-Package Capital Dossier Factory">
      <section className={styles.caseHero}>
        <div className={styles.caseHeroCopy}>
          <p className={styles.eyebrow}>MZ7_AC_CAPITAL_OS_FUNDRAISING_CASE_BUILDER · capital case factory / dossier production studio</p>
          <h2>Every qualified opportunity becomes a structured, doctrine-aligned, review-ready fundraising package.</h2>
          <p>
            Fundraising Case Builder assembles Opportunity Brief, Pursuit Strategy, Funder Narrative, Required Documents Map,
            AngelCare Positioning Builder, Financial Section Builder, Risk Plan Builder, Impact Section Builder, Outreach Scripts,
            Proof Pack, Founder Approval and Coordinator Handover without automatic sending or false production claims.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.primaryAction} href="#case-board">Create Case from Qualified Opportunity</a>
            <a className={styles.secondaryAction} href="#founder-approval">Send to Founder Approval</a>
            <a className={styles.secondaryAction} href="/api/ac-capital-os/case-builder">Inspect Case Builder API</a>
          </div>
        </div>
        <aside className={styles.caseReadinessTower} aria-label="Case Builder readiness tower">
          <span>Case Readiness</span>
          <strong>{snapshot.metrics.averagePackageReadiness}%</strong>
          <p>Structured dossier production activated with seeded bank, VC and grant package logic.</p>
          <div className={styles.caseTowerGrid}>
            <div><b>{snapshot.metrics.activeCases}</b><small>Active cases</small></div>
            <div><b>{snapshot.metrics.founderApprovalRequired}</b><small>Founder approvals</small></div>
            <div><b>{missingDocs}</b><small>Document checks</small></div>
            <div><b>{snapshot.metrics.outreachScripts}</b><small>Outreach Scripts</small></div>
          </div>
        </aside>
      </section>

      <section className={styles.caseContinuityStrip} aria-label="MZ1 to MZ7 preservation">
        <div>
          <span>AC CAPITAL OS progression</span>
          <strong>Executive Cockpit → Capital Radar → Qualification Engine → Funder Intelligence Room → Capital Doctrine Vault → Fundraising Case Builder</strong>
          <p>MZ1/MZ2/MZ3/MZ4/MZ5/MZ6 remain preserved while MZ7 adds package-production structure and handover readiness.</p>
        </div>
        <div>
          <span>Source intelligence used</span>
          <strong>Source Confidence · Fit Score · Investor Psychology · Best AngelCare Narrative · Monthly Doctrine Injection</strong>
          <p>Case assembly is shown as a handoff from the previous intelligence layers, not an isolated document page.</p>
        </div>
        <div>
          <span>Safety boundary</span>
          <strong>No automatic email sending · no live AI generation · no legal/financial guarantee</strong>
          <p>MZ7 creates the workflow, seeded content, approval gate and coordinator execution sheet only.</p>
        </div>
      </section>

      <section id="case-board" className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Case pipeline board</p>
            <h3>Opportunity-to-Package production cases</h3>
          </div>
          <span className={styles.secureBadge}>{snapshot.metrics.readyCases} cases above 80% readiness</span>
        </div>
        <div className={styles.caseBoardGrid}>
          {caseBuilderCases.map((item) => (
            <article key={item.id} className={`${styles.caseCard} ${readinessClass(item.totalReadinessScore)}`}>
              <div className={styles.caseCardTopline}>
                <span>{item.packageType}</span>
                <strong>{item.totalReadinessScore}%</strong>
              </div>
              <h4>{item.title}</h4>
              <p>{item.opportunity}</p>
              <div className={styles.caseMetaGrid}>
                <span>Funder <b>{item.funder}</b></span>
                <span>Funding <b>{item.fundingType}</b></span>
                <span>Deadline <b>{item.deadline}</b></span>
                <span>Status <b>{item.status}</b></span>
                <span>Qualification <b>{item.qualificationScore}/100</b></span>
                <span>Doctrine <b>{item.doctrineAlignmentScore}%</b></span>
              </div>
              <p className={styles.safetyNote}>{item.nextAction}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.caseDossierShell} aria-label="Case dossier workspace">
        <div className={styles.caseDossierHeader}>
          <div>
            <p className={styles.eyebrow}>Case dossier workspace</p>
            <h3>{selectedCase.title}</h3>
            <p>{selectedCase.amountRange} · {selectedCase.packageType} · Founder Approval Required: {selectedCase.founderApprovalRequired ? 'yes' : 'no'}</p>
          </div>
          <div className={styles.caseReadinessStack}>
            <span>Package readiness</span>
            <strong>{selectedCase.totalReadinessScore}%</strong>
            <small>Documents {selectedCase.documentReadinessScore}% · Financial {selectedCase.financialReadinessScore}% · Risk {selectedCase.riskReadinessScore}%</small>
          </div>
        </div>
        <div className={styles.caseProductionFlow}>
          {caseBuilderStages.map((stage, index) => (
            <article key={stage.label} className={styles.caseStageCard}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h4>{stage.label}</h4>
              <strong>{stage.status}</strong>
              <div className={styles.caseMiniMeter}><i style={{ width: `${stage.readiness}%` }} /></div>
              <p>{stage.blockers}</p>
              <small>{stage.action} · AI confidence {stage.aiConfidence}%</small>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.caseTabGrid} aria-label="Case builder tabs">
        <article className={styles.caseTabPanel}>
          <p className={styles.eyebrow}>Tab 1 · Executive Opportunity Brief</p>
          <h3>Understand the case in 90 seconds</h3>
          <p>{selectedCase.opportunity}</p>
          <ul>
            <li>Qualification score: {selectedCase.qualificationScore}/100 from Qualification Engine.</li>
            <li>Funder profile: {selectedCase.funder} linked to Funder Intelligence Room.</li>
            <li>Doctrine used: Founder Doctrine, Bank Funding Doctrine, Risk Doctrine and Dh currency rule.</li>
            <li>Coordinator summary: review documents, confirm attachments, request founder approval, never auto-send.</li>
          </ul>
        </article>
        <article className={styles.caseTabPanel}>
          <p className={styles.eyebrow}>Tab 2 · Pursuit Strategy</p>
          <h3>Selected package strategy</h3>
          <p>Bank-safe conservative file with repayment capacity, cost optimization, BFR logic, treasury discipline and founder-level approval.</p>
          <ul>
            <li>Strategy: prepare package now; founder approves before external execution.</li>
            <li>Human effort: coordinator document confirmation + founder review.</li>
            <li>Risk posture: controlled, realistic and proof-backed.</li>
          </ul>
        </article>
        <article className={styles.caseTabPanel}>
          <p className={styles.eyebrow}>Tab 3 · Funder Narrative</p>
          <h3>Best AngelCare Narrative by funding type</h3>
          <div className={styles.narrativeGrid}>
            {caseBuilderNarratives.map((narrative) => (
              <div key={narrative.type} className={styles.narrativeCard}>
                <strong>{narrative.type}</strong>
                <h4>{narrative.headline}</h4>
                <p>{narrative.opening}</p>
                <small>Proof: {narrative.proofToEmphasize}</small>
                <small>Avoid: {narrative.avoid}</small>
              </div>
            ))}
          </div>
        </article>
        <article className={styles.caseTabPanel}>
          <p className={styles.eyebrow}>Tab 4 · Required Documents Map</p>
          <h3>{readyDocs} ready · {missingDocs} need action</h3>
          <div className={styles.caseDocumentTable}>
            <div className={styles.caseDocumentHead}><span>Document</span><span>Status</span><span>Owner</span><span>Source</span></div>
            {caseBuilderDocuments.map((doc) => (
              <div key={doc.name} className={styles.caseDocumentRow}>
                <span><b>{doc.name}</b><small>{doc.category}</small></span>
                <span>{doc.status}</span>
                <span>{doc.owner}</span>
                <span>{doc.sourceWorkspace}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Tab 5 · AngelCare Positioning Builder</p>
            <h3>Case-specific positioning blocks</h3>
          </div>
          <span className={styles.secureBadge}>Include / exclude logic is prepared conceptually</span>
        </div>
        <div className={styles.positioningGrid}>
          {caseBuilderPositioningBlocks.map((block) => (
            <article key={block.label} className={styles.positioningCard}>
              <span>{block.included ? 'Included' : 'Excluded'}</span>
              <h4>{block.label}</h4>
              <p>{block.recommendedEmphasis}</p>
              <small>Tone: {block.tone}</small>
              <small>Proof needed: {block.proofNeeded}</small>
              <small>Source doctrine: {block.sourceDoctrine}</small>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.caseBuilderMatrix} aria-label="Financial risk and impact builders">
        <article>
          <p className={styles.eyebrow}>Tab 6 · Financial Section Builder</p>
          <h3>Financial narrative structure</h3>
          {caseBuilderFinancialSections.map((section) => (
            <div key={section.label} className={styles.caseBuilderLine}>
              <strong>{section.label}</strong>
              <span>{section.value}</span>
              <small>{section.status} · {section.owner}</small>
            </div>
          ))}
        </article>
        <article>
          <p className={styles.eyebrow}>Tab 7 · Risk Plan Builder</p>
          <h3>Plan B / C / D risk readiness</h3>
          {caseBuilderRiskPlans.map((risk) => (
            <div key={risk.riskType} className={`${styles.caseRiskCard} ${riskClass(risk.severity)}`}>
              <strong>{risk.riskType}</strong>
              <p>{risk.mitigation}</p>
              <small>Plan B: {risk.planB}</small>
              <small>Plan C: {risk.planC}</small>
              <small>Plan D: {risk.planD}</small>
            </div>
          ))}
        </article>
        <article>
          <p className={styles.eyebrow}>Tab 8 · Impact Section Builder</p>
          <h3>Impact proof logic</h3>
          {caseBuilderImpactSections.map((impact) => (
            <div key={impact.category} className={styles.caseBuilderLine}>
              <strong>{impact.category}</strong>
              <span>{impact.statement}</span>
              <small>Indicator: {impact.measurableIndicator}</small>
            </div>
          ))}
        </article>
      </section>

      <section className={styles.caseTabGrid}>
        <article className={styles.caseTabPanel}>
          <p className={styles.eyebrow}>Tab 9 · Outreach Scripts</p>
          <h3>No automatic sending</h3>
          {caseBuilderOutreachScripts.map((script) => (
            <div key={script.type} className={styles.outreachScriptCard}>
              <strong>{script.type}</strong>
              <span>{script.subject}</span>
              <p>{script.bodyPreview}</p>
              <small>{script.coordinatorInstruction}</small>
            </div>
          ))}
        </article>
        <article className={styles.caseTabPanel}>
          <p className={styles.eyebrow}>Tab 10 · Annexes / Proof Pack</p>
          <h3>Proof Pack readiness</h3>
          {caseBuilderProofPacks.map((proof) => (
            <div key={proof.proofType} className={styles.proofPackRow}>
              <span>{proof.attachToPackage ? 'Attach' : 'Hold'}</span>
              <strong>{proof.proofType}</strong>
              <small>{proof.credibilityLevel} · {proof.source}</small>
            </div>
          ))}
        </article>
      </section>

      <section id="founder-approval" className={styles.caseBuilderMatrix}>
        <article>
          <p className={styles.eyebrow}>Tab 11 · Founder Approval</p>
          <h3>Strict approval panel</h3>
          {caseBuilderFounderApprovals.map((approval) => (
            <div key={approval.item} className={styles.founderApprovalCard}>
              <strong>{approval.item}</strong>
              <span>{approval.status}</span>
              <p>{approval.reason}</p>
              <small>Approver: {approval.approver} · Due: {approval.dueDate}</small>
            </div>
          ))}
        </article>
        <article>
          <p className={styles.eyebrow}>Tab 12 · Coordinator Handover</p>
          <h3>Execution sheet</h3>
          {caseBuilderCoordinatorHandovers.map((handover) => (
            <div key={handover.block} className={styles.coordinatorHandoverCard}>
              <strong>{handover.block}</strong>
              <p>{handover.instruction}</p>
              <small>Proof after action: {handover.proofAfterAction}</small>
              <small>Escalate if: {handover.escalationCondition}</small>
            </div>
          ))}
        </article>
        <article>
          <p className={styles.eyebrow}>Future handoff targets</p>
          <h3>MZ7 boundary is clean</h3>
          {caseBuilderHandoffTargets.map((target) => (
            <div key={target.target} className={styles.caseBuilderLine}>
              <strong>{target.target}</strong>
              <span>{target.purpose}</span>
              <small>{target.status}</small>
            </div>
          ))}
        </article>
      </section>
    </AcCapitalOsShell>
  );
}

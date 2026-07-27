import { AcCapitalOsShell } from './AcCapitalOsShell';
import styles from './ac-capital-os.module.css';
import {
  dataRoomCaseEvidenceLinks,
  dataRoomCategories,
  dataRoomDocuments,
  dataRoomMissingEvidence,
  dataRoomPackageBuilders,
  dataRoomReadinessScores,
  dataRoomSubmissionArchive,
  dataRoomVersionControl,
  getDataRoomSnapshot,
} from '../../lib/ac-capital-os/data-room';

function scoreClass(score: number) {
  if (score >= 82) return styles.dataRoomScoreStrong;
  if (score >= 68) return styles.dataRoomScoreWatch;
  return styles.dataRoomScoreRisk;
}

function statusClass(status: string) {
  if (status.includes('Ready') || status === 'Approved' || status === 'Reusable Evidence') return styles.dataRoomStatusReady;
  if (status.includes('Missing') || status.includes('Expired') || status.includes('Rejected')) return styles.dataRoomStatusRisk;
  return styles.dataRoomStatusWatch;
}

export function AcCapitalOsDueDiligenceDataRoom() {
  const snapshot = getDataRoomSnapshot();

  return (
    <AcCapitalOsShell activeWorkspaceKey="data-room" zipLabel="Mega ZIP 08" subtitle="Due Diligence Data Room · Capital Proof Vault, Documents, Annexes, Evidence & Submission Packs">
      <section className={styles.dataRoomHero}>
        <div className={styles.dataRoomHeroCopy}>
          <p className={styles.eyebrow}>MZ8_AC_CAPITAL_OS_DUE_DILIGENCE_DATA_ROOM · secure proof vault / due-diligence evidence room</p>
          <h2>Every proof, annex, document and evidence item is controlled before AngelCare submits a funding file.</h2>
          <p>
            Due Diligence Data Room creates the Capital Proof Vault: Evidence Vault categories, Data Room Readiness,
            Missing Evidence, Version Control, Bank Pack, VC Pack, Grant Pack, Case Evidence Linker, Submission Archive,
            Credibility Score, Founder Approval, Signature Required and Stamp Required safeguards.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.primaryAction} href="#package-builders">Build Bank Pack</a>
            <a className={styles.secondaryAction} href="#missing-evidence">Review Missing Evidence</a>
            <a className={styles.secondaryAction} href="/api/ac-capital-os/data-room">Inspect Data Room API</a>
          </div>
        </div>
        <aside className={styles.dataRoomReadinessTower} aria-label="Data Room readiness score">
          <span>Data Room Readiness</span>
          <strong>{snapshot.readiness}%</strong>
          <p>Institutional evidence control activated with seeded proof, versions, package builders and submission archive boundaries.</p>
          <div className={styles.dataRoomHeroGrid}>
            <div><b>{snapshot.totalDocuments}</b><small>Evidence records</small></div>
            <div><b>{snapshot.bankReady}</b><small>Bank Ready</small></div>
            <div><b>{snapshot.vcReady}</b><small>VC Ready</small></div>
            <div><b>{snapshot.grantReady}</b><small>Grant Ready</small></div>
          </div>
        </aside>
      </section>

      <section className={styles.caseContinuityStrip} aria-label="MZ1 to MZ8 preservation">
        <div>
          <span>AC CAPITAL OS progression</span>
          <strong>Executive Cockpit → Capital Radar → Qualification Engine → Funder Intelligence Room → Capital Doctrine Vault → Fundraising Case Builder → Due Diligence Data Room</strong>
          <p>MZ1/MZ2/MZ3/MZ4/MZ5/MZ6/MZ7 remain preserved while MZ8 adds proof vault and pack readiness controls.</p>
        </div>
        <div>
          <span>Case evidence logic</span>
          <strong>Source Confidence · Fit Score · Investor Psychology · Best AngelCare Narrative · Monthly Doctrine Injection · Coordinator Handover</strong>
          <p>Evidence is linked conceptually to radar signals, qualification gaps, funder objections, active doctrine and case-builder handovers.</p>
        </div>
        <div>
          <span>Safety boundary</span>
          <strong>No real storage integration · no automatic PDF export · no automatic submission · no signing automation</strong>
          <p>MZ8 provides data contracts, UI and readiness logic only; humans still approve, attach, sign, stamp, submit and upload proof.</p>
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Evidence Vault</p>
            <h3>Due-diligence category universe</h3>
          </div>
          <span className={styles.secureBadge}>{snapshot.reusable} reusable evidence items · {snapshot.outdated} update warnings</span>
        </div>
        <div className={styles.dataRoomCategoryGrid}>
          {dataRoomCategories.map((category) => (
            <article key={category.category} className={styles.dataRoomCategoryCard}>
              <span className={`${styles.navDot} ${styles[`accent_${category.accent}`]}`} />
              <h4>{category.category}</h4>
              <p>{category.purpose}</p>
              <small>{category.evidenceExamples}</small>
              <div className={styles.caseMiniMeter}><i style={{ width: `${category.readiness}%` }} /></div>
              <b>{category.count} records · {category.readiness}% ready</b>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.dataRoomMatrix} aria-label="Data Room Readiness scorecards">
        {dataRoomReadinessScores.map((score) => (
          <article key={score.label} className={`${styles.dataRoomScoreCard} ${scoreClass(score.score)}`}>
            <span>{score.label}</span>
            <strong>{score.score}%</strong>
            <p>{score.blockers} blockers</p>
            <small>{score.nextAction}</small>
          </article>
        ))}
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Capital Proof Vault</p>
            <h3>Document cards with version, sensitivity, approval and credibility control</h3>
          </div>
          <span className={styles.secureBadge}>Founder Approval · Signature Required · Stamp Required · Credibility Score</span>
        </div>
        <div className={styles.dataRoomDocumentGrid}>
          {dataRoomDocuments.map((doc) => (
            <article key={doc.id} className={styles.dataRoomDocumentCard}>
              <div className={styles.dataRoomDocumentTopline}>
                <span className={statusClass(doc.status)}>{doc.status}</span>
                <strong>{doc.credibilityScore}/100</strong>
              </div>
              <h4>{doc.title}</h4>
              <p>{doc.category} · {doc.documentType}</p>
              <div className={styles.dataRoomDocMeta}>
                <span>Readiness <b>{doc.readinessLevel}</b></span>
                <span>Version <b>{doc.version}</b></span>
                <span>Language <b>{doc.language}</b></span>
                <span>Sensitivity <b>{doc.sensitivityLevel}</b></span>
                <span>Owner <b>{doc.owner}</b></span>
                <span>Case <b>{doc.relatedCase}</b></span>
              </div>
              <div className={styles.dataRoomFlags}>
                {doc.founderApprovalRequired ? <span>Founder Approval Required</span> : <span>No founder approval</span>}
                {doc.signatureRequired ? <span>Signature Required</span> : <span>No signature</span>}
                {doc.stampRequired ? <span>Stamp Required</span> : <span>No stamp</span>}
                {doc.reusable ? <span>Reusable Evidence</span> : <span>Case-specific</span>}
              </div>
              <p className={styles.safetyNote}>{doc.missingDependencies}</p>
              <small>{doc.nextAction}</small>
            </article>
          ))}
        </div>
      </section>

      <section id="missing-evidence" className={styles.dataRoomSplitGrid}>
        <article className={styles.dataRoomPanel}>
          <p className={styles.eyebrow}>Missing Evidence</p>
          <h3>Submission blockers and proof gaps</h3>
          {dataRoomMissingEvidence.map((item) => (
            <div key={item.item} className={styles.dataRoomEvidenceLine}>
              <strong>{item.item}</strong>
              <span>{item.priority} · {item.owner} · {item.dueDate}</span>
              <small>{item.relatedCase} / {item.relatedFunder}</small>
              <p>{item.action}</p>
            </div>
          ))}
        </article>
        <article className={styles.dataRoomPanel}>
          <p className={styles.eyebrow}>Version Control</p>
          <h3>Expiry, duplicate and submitted-version alerts</h3>
          {dataRoomVersionControl.map((alert) => (
            <div key={alert.title} className={`${styles.dataRoomEvidenceLine} ${alert.severity === 'high' || alert.severity === 'critical' ? styles.riskHigh : styles.riskMedium}`}>
              <strong>{alert.title}</strong>
              <span>{alert.alertType} · {alert.document}</span>
              <p>{alert.action}</p>
            </div>
          ))}
        </article>
      </section>

      <section id="package-builders" className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Package Builder Panel</p>
            <h3>Bank Pack · VC Pack · Grant Pack · Custom Case Pack</h3>
          </div>
          <span className={styles.secureBadge}>Export placeholder only — no automatic submission</span>
        </div>
        <div className={styles.dataRoomPackageGrid}>
          {dataRoomPackageBuilders.map((pack) => (
            <article key={pack.packageName} className={`${styles.dataRoomPackageCard} ${scoreClass(pack.readinessScore)}`}>
              <span>{pack.packageType}</span>
              <h4>{pack.packageName}</h4>
              <strong>{pack.readinessScore}% ready</strong>
              <div className={styles.dataRoomDocMeta}>
                <span>Included <b>{pack.includedDocuments}</b></span>
                <span>Missing <b>{pack.missingDocuments}</b></span>
                <span>Outdated <b>{pack.outdatedDocuments}</b></span>
                <span>Status <b>{pack.status}</b></span>
              </div>
              <p>{pack.nextAction}</p>
              {pack.founderApprovalRequired ? <small>Founder Approval Required before external use.</small> : <small>No founder approval flag on this package.</small>}
            </article>
          ))}
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Case Evidence Linker</p>
            <h3>Attach evidence to active Fundraising Case Builder dossiers</h3>
          </div>
          <span className={styles.secureBadge}>Attach Evidence · Mark Missing · Request Update · Request Founder Approval</span>
        </div>
        <div className={styles.dataRoomLinkerGrid}>
          {dataRoomCaseEvidenceLinks.map((link) => (
            <article key={link.caseTitle} className={styles.dataRoomLinkerCard}>
              <h4>{link.caseTitle}</h4>
              <p>{link.opportunity} · {link.funder}</p>
              <div className={styles.dataRoomDocMeta}>
                <span>Required <b>{link.requiredDocuments}</b></span>
                <span>Attached <b>{link.attachedEvidence}</b></span>
                <span>Missing <b>{link.missingEvidence}</b></span>
                <span>Handover <b>{link.coordinatorHandoverReadiness}%</b></span>
              </div>
              <small>{link.recommendedEvidence}</small>
              <p className={styles.safetyNote}>{link.action}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Submission Archive</p>
            <h3>Submitted Packages Archive and proof-of-submission control</h3>
          </div>
          <span className={styles.secureBadge}>Prepared · Submitted · Follow-Up Due · Under Review · Won/Lost · Learning Injected</span>
        </div>
        <div className={styles.dataRoomArchiveTable}>
          <div className={styles.dataRoomArchiveHead}><span>Submission</span><span>Funder</span><span>Version</span><span>Status</span><span>Follow-up</span></div>
          {dataRoomSubmissionArchive.map((item) => (
            <div key={item.submissionName} className={styles.dataRoomArchiveRow}>
              <span><b>{item.submissionName}</b><small>{item.relatedCase} · {item.packageType}</small></span>
              <span>{item.funder}</span>
              <span>{item.versionSubmitted}</span>
              <span>{item.resultStatus}</span>
              <span>{item.followUpDate}</span>
            </div>
          ))}
        </div>
      </section>
    </AcCapitalOsShell>
  );
}

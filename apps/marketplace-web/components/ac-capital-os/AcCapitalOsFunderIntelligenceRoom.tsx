import { AcCapitalOsShell } from './AcCapitalOsShell';
import styles from './ac-capital-os.module.css';
import { qualificationDossiers } from '../../lib/ac-capital-os/qualification-engine';
import {
  funderContacts,
  funderFollowUpActions,
  funderLikelyObjections,
  funderNarrativeRecommendations,
  funderOpportunityLinks,
  funderProfiles,
  funderPsychologyBriefs,
  funderRelationshipHistory,
  funderStrategicSegments,
  getAcCapitalFunderIntelligenceSnapshot,
} from '../../lib/ac-capital-os/funder-intelligence';
import type { AcCapitalOsRiskLevel } from '../../lib/ac-capital-os/types';

function riskClass(risk: AcCapitalOsRiskLevel) {
  if (risk === 'critical' || risk === 'high') return styles.riskHigh;
  if (risk === 'medium') return styles.riskMedium;
  return styles.riskLow;
}

export function AcCapitalOsFunderIntelligenceRoom() {
  const snapshot = getAcCapitalFunderIntelligenceSnapshot();
  const primaryFunder = funderProfiles[0];
  const psychology = funderPsychologyBriefs.find((brief) => brief.funderId === primaryFunder.id) ?? funderPsychologyBriefs[0];
  const contacts = funderContacts.filter((contact) => contact.funderId === primaryFunder.id);
  const objections = funderLikelyObjections.filter((objection) => objection.funderId === primaryFunder.id);
  const narratives = funderNarrativeRecommendations.filter((narrative) => narrative.funderId === primaryFunder.id);
  const relationshipEvents = funderRelationshipHistory.filter((event) => event.funderId === primaryFunder.id);
  const linkedOpportunities = funderOpportunityLinks.filter((link) => link.funderId === primaryFunder.id);
  const followUps = funderFollowUpActions.filter((action) => action.funderId === primaryFunder.id);
  const linkedQualification = qualificationDossiers.find((dossier) => dossier.totalScore >= 85);

  return (
    <AcCapitalOsShell activeWorkspaceKey="funder-intelligence" zipLabel="Mega ZIP 05" subtitle="Funder Intelligence Room · Banks, VCs, Grants, Angels, Institutions & Strategic Capital Relationships">
      <section className={styles.funderHero}>
        <div className={styles.funderHeroCopy}>
          <p className={styles.eyebrow}>MZ5_AC_CAPITAL_OS_FUNDER_INTELLIGENCE · private investor intelligence office</p>
          <h2>Every funder is profiled, every objection anticipated, every relationship prepared.</h2>
          <p>
            Funder Intelligence Room turns capital sources into executive dossiers: Investor Psychology, Likely Objections,
            Best AngelCare Narrative, Relationship Status, Relationship Temperature, Contact Strategy, Ticket Range,
            Funding Stage Focus, Strategic Priority, Follow-Up Due, Opportunity Links and Founder-Level Approach.
          </p>
          <div className={styles.heroActions}>
            <a href="#funder-registry" className={styles.primaryAction}>Review High-Fit Funders</a>
            <a href="#investor-psychology" className={styles.secondaryAction}>Open Investor Psychology Briefs</a>
            <a href="/api/ac-capital-os/funder-intelligence" className={styles.secondaryAction}>Inspect Funder API</a>
          </div>
        </div>
        <aside className={styles.funderIntelTower} aria-label="Funder Intelligence Room status">
          <span>Average AngelCare Fit</span>
          <strong>{snapshot.metrics.averageFit}/100</strong>
          <p>relationship intelligence profiles seeded in safe MZ5 contract mode</p>
          <div className={styles.funderTowerGrid}>
            <div><b>{snapshot.metrics.totalFunders}</b><small>Funders tracked</small></div>
            <div><b>{snapshot.metrics.highFit}</b><small>High-fit funders</small></div>
            <div><b>{snapshot.metrics.followUpsDue}</b><small>Follow-Up Due</small></div>
          </div>
        </aside>
      </section>

      <section className={styles.funderContinuityStrip} aria-label="MZ1 to MZ5 preservation">
        <div>
          <span>AC CAPITAL OS progression</span>
          <strong>Executive Cockpit → Capital Radar → Qualification Engine → Funder Intelligence Room</strong>
          <p>MZ1/MZ2/MZ3/MZ4 remain preserved while MZ5 adds relationship intelligence.</p>
        </div>
        <div>
          <span>Linked qualification</span>
          <strong>{linkedQualification?.decisionLabel ?? 'Pursue Immediately'} · Fit Score {linkedQualification?.totalScore ?? 91}/100</strong>
          <p>Funder dossiers reference Qualification Engine scores, risks, missing documents and recommended action.</p>
        </div>
        <div>
          <span>Safety boundary</span>
          <strong>No auto outreach · no fake contacts · no guarantees</strong>
          <p>MZ5 prepares intelligence and Contact Strategy only. Human coordinators execute later after approval.</p>
        </div>
      </section>

      <section className={styles.funderSegmentGrid} aria-label="Strategic funder segments">
        {funderStrategicSegments.map((segment) => (
          <article key={segment.label} className={`${styles.funderSegmentCard} ${styles[`cardAccent_${segment.accent}`]}`}>
            <span>{segment.label}</span>
            <strong>{segment.count}</strong>
            <p>{segment.description}</p>
          </article>
        ))}
      </section>

      <section id="funder-registry" className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Funder registry · relationship intelligence</p>
          <h2>High-value capital source dossiers</h2>
          <p>Each profile includes type, country, Ticket Range, Funding Stage Focus, Relationship Status, Strategic Priority, Follow-Up Due and Opportunity Links.</p>
        </div>
        <div className={styles.funderRegistryGrid}>
          {funderProfiles.map((funder) => (
            <article key={funder.id} className={styles.funderCard}>
              <div className={styles.funderCardTopline}>
                <span>{funder.funderType}</span>
                <b>{funder.relationshipTemperature}</b>
              </div>
              <h3>{funder.name}</h3>
              <p>{funder.summary}</p>
              <div className={styles.funderMetaGrid}>
                <div><span>Country / region</span><strong>{funder.country} · {funder.region}</strong></div>
                <div><span>Ticket Range</span><strong>{funder.ticketRange}</strong></div>
                <div><span>Funding Stage Focus</span><strong>{funder.fundingStageFocus}</strong></div>
                <div><span>Relationship Status</span><strong>{funder.relationshipStatus}</strong></div>
              </div>
              <div className={styles.funderFitRow}>
                <div><span>AngelCare relevance score</span><strong>{funder.angelCareFitScore}/100</strong><small>{funder.fitLabel}</small></div>
                <div className={styles.confidenceTrack}><span style={{ width: `${funder.angelCareFitScore}%` }} /></div>
              </div>
              <div className={styles.funderActionRow}>
                <span>Strategic Priority: {funder.strategicPriority}</span>
                <span>{funder.founderLevelApproach ? 'Founder-Level Approach' : 'Coordinator-led research'}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.funderDossierShell}>
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Executive funder profile dossier · Best AngelCare Narrative</p>
          <h2>{primaryFunder.name}</h2>
          <p>{primaryFunder.recommendedNarrative}</p>
        </div>

        <div className={styles.funderExecutiveGrid}>
          <article><span>Strategic Priority</span><strong>{primaryFunder.strategicPriority}</strong><p>{primaryFunder.nextAction}</p></article>
          <article><span>Source Confidence</span><strong>{primaryFunder.sourceConfidence}%</strong><p>seeded profile; live sources require human verification</p></article>
          <article><span>Likely Objections</span><strong>{primaryFunder.likelyObjectionCount}</strong><p>objection-response pack prepared</p></article>
          <article><span>Proof Required</span><strong>{primaryFunder.proofRequiredCount}</strong><p>documents to prepare before serious submission</p></article>
        </div>

        <div className={styles.splitGrid} id="investor-psychology">
          <article className={styles.funderIntelPanel}>
            <span>Investor Psychology</span>
            <h3>Likely decision style</h3>
            <p>{psychology.decisionStyle}</p>
            <div className={styles.funderMiniColumns}>
              <div><b>Likely priorities</b>{psychology.likelyPriorities.map((item) => <small key={item}>{item}</small>)}</div>
              <div><b>Likely concerns</b>{psychology.likelyConcerns.map((item) => <small key={item}>{item}</small>)}</div>
            </div>
          </article>
          <article className={styles.funderIntelPanel}>
            <span>Best AngelCare Narrative</span>
            {narratives.map((narrative) => (
              <div key={narrative.narrativeType} className={styles.narrativeCard}>
                <strong>{narrative.narrativeType}</strong>
                <p>{narrative.recommendedAngle}</p>
                <small>{narrative.idealNextAction}</small>
              </div>
            ))}
          </article>
        </div>

        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Likely Objections · mitigation control</p>
            <h2>Objection-response briefing</h2>
            <p>The panel prepares the coordinator before contact and flags where founder review or proof is required.</p>
          </div>
          <div className={styles.objectionGrid}>
            {objections.map((objection) => (
              <article key={objection.objectionTitle} className={styles.objectionCard}>
                <div><span className={riskClass(objection.severity)}>{objection.severity}</span><small>{objection.founderReviewRequired ? 'Founder Review Required' : 'Coordinator can prepare'}</small></div>
                <h3>{objection.objectionTitle}</h3>
                <p>{objection.whyItMayHappen}</p>
                <strong>Best answer</strong>
                <p>{objection.bestAnswer}</p>
                <small>Required proof: {objection.requiredProof}</small>
              </article>
            ))}
          </div>
        </section>

        <div className={styles.splitGrid}>
          <article className={styles.funderIntelPanel}>
            <span>Contact Strategy</span>
            <h3>Stakeholder panel</h3>
            {contacts.map((contact) => (
              <div key={contact.contactName} className={styles.contactCard}>
                <strong>{contact.contactName}</strong>
                <p>{contact.roleTitle} · preferred language {contact.preferredLanguage}</p>
                <small>{contact.communicationStyle}</small>
              </div>
            ))}
          </article>
          <article className={styles.funderIntelPanel}>
            <span>Relationship Status</span>
            <h3>Relationship timeline</h3>
            {relationshipEvents.map((event) => (
              <div key={`${event.funderId}-${event.title}`} className={styles.relationshipEvent}>
                <b>{event.eventDate}</b>
                <strong>{event.title}</strong>
                <p>{event.summary}</p>
              </div>
            ))}
          </article>
        </div>

        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Opportunity Links · Radar + Qualification continuity</p>
            <h2>Linked opportunities and next relationship actions</h2>
            <p>MZ5 prepares the handoff to Capital Pipeline CRM while preserving Capital Radar and Qualification Engine context.</p>
          </div>
          <div className={styles.funderLinkTable}>
            <div className={styles.funderLinkHead}><span>Opportunity</span><span>Radar origin</span><span>Qualification</span><span>Fit Score</span><span>Next action</span></div>
            {linkedOpportunities.map((link) => (
              <div key={link.opportunityTitle} className={styles.funderLinkRow}>
                <strong>{link.opportunityTitle}</strong>
                <span>{link.radarOrigin}</span>
                <span>{link.qualificationDecision}</span>
                <span className={styles.scorePill}>{link.fitScore}/100</span>
                <span>{link.nextAction}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Follow-Up Due · relationship operating board</p>
            <h2>Next actions prepared for human execution</h2>
            <p>MZ5 does not send emails automatically. It prepares who to contact, why, what to say and when to follow up.</p>
          </div>
          <div className={styles.followUpGrid}>
            {followUps.map((action) => (
              <article key={action.title} className={styles.followUpCard}>
                <span>{action.actionType}</span>
                <h3>{action.title}</h3>
                <p>{action.instruction}</p>
                <small>{action.owner} · {action.dueDate} · {action.priority}</small>
              </article>
            ))}
          </div>
        </section>
      </section>
    </AcCapitalOsShell>
  );
}

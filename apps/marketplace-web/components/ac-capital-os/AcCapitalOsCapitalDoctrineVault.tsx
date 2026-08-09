import { AcCapitalOsShell } from './AcCapitalOsShell';
import styles from './ac-capital-os.module.css';
import {
  capitalDoctrineAgentBindings,
  capitalDoctrineApplications,
  capitalDoctrineAuditEvents,
  capitalDoctrineCategories,
  capitalDoctrineCommands,
  capitalDoctrineConflicts,
  capitalDoctrineItems,
  capitalDoctrineMonthlyInjections,
  capitalDoctrinePrompts,
  capitalDoctrineSkills,
  getAcCapitalDoctrineVaultSnapshot,
} from '../../lib/ac-capital-os/capital-doctrine';
import type { AcCapitalOsRiskLevel } from '../../lib/ac-capital-os/types';

function riskClass(risk: AcCapitalOsRiskLevel) {
  if (risk === 'critical' || risk === 'high') return styles.riskHigh;
  if (risk === 'medium') return styles.riskMedium;
  return styles.riskLow;
}

export function AcCapitalOsCapitalDoctrineVault() {
  const snapshot = getAcCapitalDoctrineVaultSnapshot();
  const activeDoctrine = capitalDoctrineItems.filter((item) => item.status.startsWith('Active'));
  const founderDoctrine = capitalDoctrineItems.filter((item) => item.category === 'Founder Doctrine');
  const criticalDoctrine = capitalDoctrineItems.filter((item) => item.priority === 'Critical');

  return (
    <AcCapitalOsShell activeWorkspaceKey="doctrine-vault" zipLabel="Mega ZIP 06" subtitle="Capital Doctrine Vault · Strategic Memory, Commands, Prompts, Skills & Monthly Intelligence Injection">
      <section className={styles.doctrineHero}>
        <div className={styles.doctrineHeroCopy}>
          <p className={styles.eyebrow}>MZ6_AC_CAPITAL_OS_CAPITAL_DOCTRINE · strategic doctrine vault / AI brain control archive</p>
          <h2>AC CAPITAL OS does not guess. It operates from AngelCare-approved doctrine, objectives, commands and skills.</h2>
          <p>
            Capital Doctrine Vault governs Core AngelCare Doctrine, Founder Doctrine, Bank Funding Doctrine, VC Investor Doctrine,
            Grant Impact Doctrine, SaaS Partner OS Doctrine, Prompt Library, Skills Library, Doctrine Conflicts, Doctrine Application Matrix,
            AI Agent Doctrine Binding and Founder Approval Required safeguards.
          </p>
          <div className={styles.heroActions}>
            <a href="#manual-injection" className={styles.primaryAction}>Inject Manual Doctrine</a>
            <a href="#monthly-injection" className={styles.secondaryAction}>Run Monthly Doctrine Injection</a>
            <a href="/api/ac-capital-os/capital-doctrine" className={styles.secondaryAction}>Inspect Doctrine API</a>
          </div>
        </div>
        <aside className={styles.doctrineVaultTower} aria-label="Capital Doctrine Vault status">
          <span>Doctrine Freshness Score</span>
          <strong>{snapshot.metrics.doctrineFreshnessScore}%</strong>
          <p>Founder-controlled doctrine, prompt and skill structure installed in safe MZ6 contract mode.</p>
          <div className={styles.doctrineTowerGrid}>
            <div><b>{snapshot.metrics.activeDoctrine}</b><small>Active doctrine</small></div>
            <div><b>{snapshot.metrics.commands}</b><small>Manual commands</small></div>
            <div><b>{snapshot.metrics.skills}</b><small>Active skill packs</small></div>
            <div><b>{snapshot.metrics.conflicts}</b><small>Doctrine conflicts</small></div>
          </div>
        </aside>
      </section>

      <section className={styles.doctrineContinuityStrip} aria-label="MZ1 to MZ6 preservation">
        <div>
          <span>AC CAPITAL OS progression</span>
          <strong>Executive Cockpit → Capital Radar → Qualification Engine → Funder Intelligence Room → Capital Doctrine Vault</strong>
          <p>MZ1/MZ2/MZ3/MZ4/MZ5 remain preserved while MZ6 adds strategic memory, commands, prompts and skills.</p>
        </div>
        <div>
          <span>Safety boundary</span>
          <strong>No automatic AI activation · no hidden prompt execution · no secrets</strong>
          <p>Monthly Doctrine Injection is queued for review and cannot auto-activate without approval.</p>
        </div>
        <div>
          <span>Founder control</span>
          <strong>{snapshot.metrics.founderApprovalRequired} Founder Approval Required items</strong>
          <p>Strategic direction, dilution, legal commitments and sensitive files stay under human control.</p>
        </div>
      </section>

      <section className={styles.doctrineCategoryGrid} aria-label="Doctrine category universe">
        {capitalDoctrineCategories.map((category) => (
          <article key={category.label} className={`${styles.doctrineCategoryCard} ${styles[`cardAccent_${category.accent}`]}`}>
            <span>{category.label}</span>
            <strong>{category.count}</strong>
            <p>{category.summary}</p>
          </article>
        ))}
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Core AngelCare Doctrine · Founder Doctrine · Bank Funding Doctrine · VC Investor Doctrine · Grant Impact Doctrine</p>
          <h2>Founder-controlled doctrine cards</h2>
          <p>Each doctrine card contains category, status, priority, source, injection mode, affected workspaces, affected AI agents, version and approval state.</p>
        </div>
        <div className={styles.doctrineCardGrid}>
          {capitalDoctrineItems.map((item) => (
            <article key={item.id} className={styles.doctrineCard}>
              <div className={styles.doctrineCardTopline}>
                <span>{item.category}</span>
                <b>{item.status}</b>
              </div>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
              <div className={styles.doctrineMetaGrid}>
                <div><span>Priority</span><strong>{item.priority}</strong></div>
                <div><span>Injection mode</span><strong>{item.injectionMode}</strong></div>
                <div><span>Version</span><strong>{item.version}</strong></div>
                <div><span>Approval</span><strong>{item.approvalStatus}</strong></div>
              </div>
              <div className={styles.keywordRow}>
                {item.appliesToAgents.slice(0, 3).map((agent) => <span key={agent}>{agent}</span>)}
              </div>
              <small>{item.founderApprovalRequired ? 'Founder Approval Required' : 'Founder approval not required for current state'}</small>
            </article>
          ))}
        </div>
      </section>

      <section id="manual-injection" className={styles.doctrineInjectionShell}>
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Manual Doctrine Injection · founder and coordinator controlled</p>
          <h2>Manual doctrine injection flow</h2>
          <p>This contract UI prepares the future form: title, category, type, doctrine text, priority, affected workspaces, affected agents, source, validity, approval and conflict sensitivity.</p>
        </div>
        <div className={styles.doctrineInjectionGrid}>
          <article className={styles.doctrineInjectionCard}>
            <span>Manual Doctrine Injection</span>
            <h3>Use Dh currency label in Moroccan bank-facing documents, not MAD.</h3>
            <p>Category: Bank Funding Doctrine · Priority: Critical · Applies to Finance Agent, Document Factory Agent and future Case Builder.</p>
            <div className={styles.heroActions}><button type="button" className={styles.primaryAction}>Save Draft</button><button type="button" className={styles.secondaryAction}>Request Founder Approval</button></div>
          </article>
          <article className={styles.doctrineInjectionCard}>
            <span>Manual Command Example</span>
            <h3>Reject funding routes requiring three years audited financial statements unless strategically important.</h3>
            <p>Command status: Active · Target: Qualification Agent · This prevents wasted coordinator time while preserving strategic watchlist exceptions.</p>
            <div className={styles.heroActions}><button type="button" className={styles.primaryAction}>Activate</button><button type="button" className={styles.secondaryAction}>Compare with Existing Doctrine</button></div>
          </article>
        </div>
      </section>

      <section id="monthly-injection" className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Monthly Doctrine Injection · AI-generated but not auto-activated</p>
          <h2>Monthly intelligence queue</h2>
          <p>Monthly AI Doctrine Injection can suggest trends, investor objections, opportunity categories and narrative improvements, but MZ6 keeps approval mandatory.</p>
        </div>
        <div className={styles.monthlyInjectionGrid}>
          {capitalDoctrineMonthlyInjections.map((injection) => (
            <article key={injection.title} className={styles.monthlyInjectionCard}>
              <div><span>{injection.month}</span><b>{injection.reviewStatus}</b></div>
              <h3>{injection.title}</h3>
              <p>AI confidence {injection.aiConfidence}% · generated doctrine items {injection.generatedDoctrineItems} · sources required {injection.sourcesRequired ? 'yes' : 'no'}</p>
              {injection.suggestedChanges.map((change) => <small key={change}>{change}</small>)}
            </article>
          ))}
        </div>
      </section>

      <section className={styles.splitGrid}>
        <article className={styles.doctrineIntelPanel}>
          <span>Prompt Library</span>
          <h3>Reusable prompts and commands</h3>
          {capitalDoctrinePrompts.map((prompt) => (
            <div key={prompt.id} className={styles.promptCard}>
              <strong>{prompt.promptName}</strong>
              <p>{prompt.purpose}</p>
              <small>{prompt.targetAgent} · {prompt.targetWorkspace} · risk {prompt.riskLevel} · approval {prompt.approvalRequired ? 'required' : 'not required'}</small>
            </div>
          ))}
        </article>
        <article className={styles.doctrineIntelPanel}>
          <span>Skills Library</span>
          <h3>Expert skill packs</h3>
          {capitalDoctrineSkills.map((skill) => (
            <div key={skill.id} className={styles.skillCard}>
              <strong>{skill.skillName}</strong>
              <p>{skill.skillDescription}</p>
              <small>{skill.skillCategory} · {skill.status} · {skill.version}</small>
            </div>
          ))}
        </article>
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Doctrine Conflicts · founder-level resolution control</p>
          <h2>Doctrine conflict detection panel</h2>
          <p>Conflicts are surfaced instead of hidden. The system can keep both with context, deactivate one, create reconciled doctrine or escalate to founder.</p>
        </div>
        <div className={styles.doctrineConflictGrid}>
          {capitalDoctrineConflicts.map((conflict) => (
            <article key={conflict.id} className={styles.doctrineConflictCard}>
              <div><span className={riskClass(conflict.severity)}>{conflict.severity}</span><small>{conflict.founderReviewRequired ? 'Founder Approval Required' : 'Coordinator can prepare resolution'}</small></div>
              <h3>{conflict.conflictTitle}</h3>
              <p><b>A:</b> {conflict.doctrineA}</p>
              <p><b>B:</b> {conflict.doctrineB}</p>
              <strong>Recommended resolution</strong>
              <p>{conflict.recommendedResolution}</p>
              <small>Status: {conflict.status}</small>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Doctrine Application Matrix · active-case propagation control</p>
          <h2>How doctrine affects each workspace</h2>
          <p>Doctrine can affect Radar detection priorities, Qualification scoring weights, Funder narratives, future Case Builder tone and future Coordinator tasks.</p>
        </div>
        <div className={styles.doctrineMatrixTable}>
          <div className={styles.doctrineMatrixHead}><span>Workspace</span><span>Active</span><span>Critical</span><span>Conflicts</span><span>Missing doctrine</span><span>Owner</span></div>
          {capitalDoctrineApplications.map((row) => (
            <div key={row.workspace} className={styles.doctrineMatrixRow}>
              <strong>{row.workspace}</strong>
              <span>{row.activeDoctrineCount}</span>
              <span>{row.criticalDoctrineCount}</span>
              <span>{row.conflicts}</span>
              <span>{row.missingDoctrine}</span>
              <span>{row.owner}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>AI Agent Doctrine Binding · AI behavior governance</p>
          <h2>Agent doctrine, prompt and skill binding</h2>
          <p>Each agent shows active doctrine count, prompt count, skill count, forbidden behaviors, human approval requirement and confidence policy.</p>
        </div>
        <div className={styles.agentBindingGrid}>
          {capitalDoctrineAgentBindings.map((agent) => (
            <article key={agent.agentName} className={styles.agentBindingCard}>
              <span>AI Agent Doctrine Binding</span>
              <h3>{agent.agentName}</h3>
              <div className={styles.doctrineMetaGrid}>
                <div><span>Doctrine</span><strong>{agent.activeDoctrineCount}</strong></div>
                <div><span>Prompts</span><strong>{agent.activePromptCount}</strong></div>
                <div><span>Skills</span><strong>{agent.activeSkillCount}</strong></div>
                <div><span>Conflicts</span><strong>{agent.doctrineConflicts}</strong></div>
              </div>
              <p>{agent.humanApprovalRequirement}</p>
              <small>{agent.confidencePolicy}</small>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Doctrine audit timeline · versioning and trace</p>
          <h2>Doctrine Versioning and Audit</h2>
          <p>Every doctrine change is conceptually versioned and audited: created, edited, activated, deactivated, deprecated, replaced, conflict raised, applied or rejected.</p>
        </div>
        <div className={styles.doctrineAuditGrid}>
          {capitalDoctrineAuditEvents.map((event) => (
            <article key={event.id} className={styles.doctrineAuditCard}>
              <span>{event.createdAt}</span>
              <h3>{event.eventType}</h3>
              <p>{event.doctrineTitle}</p>
              <small>{event.actor} · {event.summary}</small>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.doctrineFinalRule}>
        <h2>Apply Doctrine to Active Cases</h2>
        <p>
          MZ6 prepares the governed action that will later propagate doctrine into Radar, Qualification, Funder Intelligence,
          Fundraising Case Builder, Data Room, Human Coordinator Cockpit, AI Command Center, Strategy Simulator, Reports and Manual & SOP.
          No uncontrolled doctrine changes, no automatic activation and no hidden prompt execution are allowed.
        </p>
        <div className={styles.keywordRow}>
          {activeDoctrine.slice(0, 4).map((item) => <span key={item.id}>{item.category}</span>)}
          {founderDoctrine.map((item) => <span key={item.id}>{item.title}</span>)}
          {criticalDoctrine.slice(0, 2).map((item) => <span key={item.id}>{item.priority} doctrine</span>)}
        </div>
      </section>
    </AcCapitalOsShell>
  );
}

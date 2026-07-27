import { AcCapitalOsShell } from './AcCapitalOsShell';
import { AcCapitalOsWorkspaceCard } from './AcCapitalOsWorkspaceCard';
import styles from './ac-capital-os.module.css';
import {
  AC_CAPITAL_OS_FOUNDATION,
  AC_CAPITAL_OS_WORKSPACES,
  getAcCapitalOsReadinessSummary,
} from '../../lib/ac-capital-os/foundation';

const commandPillars = [
  'Capital command shell installed',
  'Protected internal access doctrine active',
  'Workspace registry prepared',
  'Audit + RBAC contracts mounted',
  'Future AI controls reserved',
  'Manual/SOP shell reserved',
];

const operatingStates = [
  ['Ready now', 'Foundation shell, workspace navigation, contract registry, premium visual system'],
  ['Next activation', 'Executive Cockpit, Capital Radar and Qualification Engine'],
  ['Locked future', 'Case Builder, Data Room, Pipeline, AI Command, Simulator and Reports'],
  ['Never accepted', 'Mock-only pages, dead CTAs, unprotected investor data, unaudited sensitive actions'],
];

export function AcCapitalOsFoundation() {
  const readiness = getAcCapitalOsReadinessSummary();
  const readyWorkspaces = AC_CAPITAL_OS_WORKSPACES.filter((workspace) => workspace.status === 'foundation-ready');
  const nextWorkspaces = AC_CAPITAL_OS_WORKSPACES.filter((workspace) => workspace.status === 'contracted-next');

  return (
    <AcCapitalOsShell>
      <section className={styles.heroPanel}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Capital intelligence operating system</p>
          <h2>Every funding route detected. Every case prepared. Every opportunity controlled.</h2>
          <p>
            {AC_CAPITAL_OS_FOUNDATION.mission}
          </p>
          <div className={styles.heroActions}>
            <a href="/ac-capital-os" className={styles.primaryAction}>Open Foundation Cockpit</a>
            <a href="/api/ac-capital-os/foundation" className={styles.secondaryAction}>Inspect Foundation API</a>
          </div>
        </div>
        <div className={styles.readinessCard}>
          <span className={styles.readinessLabel}>Foundation Readiness</span>
          <strong>{readiness.foundationReady}/{readiness.total}</strong>
          <p>{readiness.readinessLabel}</p>
          <div className={styles.readinessMeter} aria-hidden="true">
            <span style={{ width: `${Math.round((readiness.foundationReady / readiness.total) * 100)}%` }} />
          </div>
          <small>{readiness.contractedNext} next workspaces contracted · {readiness.futureLocked} future workspaces locked</small>
        </div>
      </section>

      <section className={styles.commandGrid}>
        {commandPillars.map((pillar, index) => (
          <article key={pillar} className={styles.commandCard}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <p>{pillar}</p>
          </article>
        ))}
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Mega ZIP 01 contract proof</p>
          <h2>Premium shell + protected capital universe foundation</h2>
          <p>
            This first ZIP does not pretend to finish every capital workspace. It installs the operating shell, visual doctrine,
            workspace registry, RBAC/audit contracts, protected-access posture and future activation map required for the signed AC CAPITAL OS plan.
          </p>
        </div>
        <div className={styles.stateTable}>
          {operatingStates.map(([label, description]) => (
            <div key={label} className={styles.stateRow}>
              <strong>{label}</strong>
              <span>{description}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Foundation-ready workspaces</p>
          <h2>Activated in the shell today</h2>
        </div>
        <div className={styles.workspaceGrid}>
          {readyWorkspaces.map((workspace) => <AcCapitalOsWorkspaceCard key={workspace.key} workspace={workspace} />)}
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Next build line</p>
          <h2>Strictly contracted next activations</h2>
        </div>
        <div className={styles.workspaceGrid}>
          {nextWorkspaces.map((workspace) => <AcCapitalOsWorkspaceCard key={workspace.key} workspace={workspace} />)}
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Signed doctrine</p>
          <h2>What AC CAPITAL OS must never become</h2>
        </div>
        <div className={styles.doctrineWall}>
          <p>No open public investor data room.</p>
          <p>No unapproved external communication.</p>
          <p>No AI autonomous submission.</p>
          <p>No opportunity without source confidence.</p>
          <p>No case without human approval.</p>
          <p>No funding route lost in memory or chat.</p>
        </div>
      </section>
    </AcCapitalOsShell>
  );
}

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
  'Executive Cockpit activated in MZ2',
  'Future AI controls reserved',
];

export function AcCapitalOsFoundation() {
  const readiness = getAcCapitalOsReadinessSummary();
  const readyWorkspaces = AC_CAPITAL_OS_WORKSPACES.filter((workspace) => workspace.status === 'foundation-ready' || workspace.status === 'activated-mz2');
  const nextWorkspaces = AC_CAPITAL_OS_WORKSPACES.filter((workspace) => workspace.status === 'contracted-next');

  return (
    <AcCapitalOsShell zipLabel="Mega ZIP 02" activeWorkspaceKey="settings">
      <section className={styles.heroPanel}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Capital intelligence operating system</p>
          <h2>Every funding route detected. Every case prepared. Every opportunity controlled.</h2>
          <p>{AC_CAPITAL_OS_FOUNDATION.mission}</p>
          <div className={styles.heroActions}>
            <a href="/ac-capital-os" className={styles.primaryAction}>Open Executive Cockpit</a>
            <a href="/api/ac-capital-os/executive-cockpit" className={styles.secondaryAction}>Inspect Cockpit API</a>
          </div>
        </div>
        <div className={styles.readinessCard}>
          <span className={styles.readinessLabel}>Foundation Readiness</span>
          <strong>{(readiness.activated || 0) + readiness.foundationReady}/{readiness.total}</strong>
          <p>{readiness.readinessLabel}</p>
          <div className={styles.readinessMeter} aria-hidden="true">
            <span style={{ width: `${Math.round((((readiness.activated || 0) + readiness.foundationReady) / readiness.total) * 100)}%` }} />
          </div>
          <small>{readiness.contractedNext} next workspaces contracted · {readiness.futureLocked} future workspaces locked</small>
        </div>
      </section>
      <section className={styles.commandGrid}>
        {commandPillars.map((pillar, index) => (
          <article key={pillar} className={styles.commandCard}><span>{String(index + 1).padStart(2, '0')}</span><p>{pillar}</p></article>
        ))}
      </section>
      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}><p className={styles.eyebrow}>Ready workspaces</p><h2>Activated or foundation-ready today</h2></div>
        <div className={styles.workspaceGrid}>{readyWorkspaces.map((workspace) => <AcCapitalOsWorkspaceCard key={workspace.key} workspace={workspace} />)}</div>
      </section>
      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}><p className={styles.eyebrow}>Next build line</p><h2>Strictly contracted next activations</h2></div>
        <div className={styles.workspaceGrid}>{nextWorkspaces.map((workspace) => <AcCapitalOsWorkspaceCard key={workspace.key} workspace={workspace} />)}</div>
      </section>
    </AcCapitalOsShell>
  );
}

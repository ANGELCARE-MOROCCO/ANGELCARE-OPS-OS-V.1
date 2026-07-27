import type { ReactNode } from 'react';
import styles from './ac-capital-os.module.css';
import { AC_CAPITAL_OS_WORKSPACES } from '../../lib/ac-capital-os/foundation';
import type { AcCapitalOsWorkspaceKey } from '../../lib/ac-capital-os/types';

interface AcCapitalOsShellProps {
  children: ReactNode;
  activeWorkspaceKey?: AcCapitalOsWorkspaceKey;
  zipLabel?: string;
  subtitle?: string;
}

export function AcCapitalOsShell({
  children,
  activeWorkspaceKey = 'executive-cockpit',
  zipLabel = 'Mega ZIP 02',
  subtitle = 'AngelCare internal capital command module',
}: AcCapitalOsShellProps) {
  return (
    <main className={styles.rootShell} aria-label="AC CAPITAL OS">
      <aside className={styles.sidebar} aria-label="AC CAPITAL OS workspaces">
        <div className={styles.sidebarBrand}>
          <span className={styles.brandMark}>AC</span>
          <div>
            <p className={styles.brandTitle}>AC CAPITAL OS</p>
            <p className={styles.brandSubtitle}>Capital Intelligence</p>
          </div>
        </div>
        <nav className={styles.workspaceNav}>
          {AC_CAPITAL_OS_WORKSPACES.map((workspace) => {
            const isActive = workspace.key === activeWorkspaceKey;
            const isReady = workspace.status === 'foundation-ready' || workspace.status === 'activated-mz2';
            return (
              <a
                key={workspace.key}
                className={`${styles.workspaceNavItem} ${isReady ? styles.workspaceNavItemReady : ''} ${isActive ? styles.workspaceNavItemActive : ''}`}
                href={workspace.route}
                aria-label={`${workspace.name} - ${workspace.status}`}
              >
                <span className={`${styles.navDot} ${styles[`accent_${workspace.accent}`]}`} />
                <span>{workspace.name}</span>
                <small>{workspace.status.split('-').join(' ')}</small>
              </a>
            );
          })}
        </nav>
      </aside>
      <section className={styles.mainSurface}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.eyebrow}>{subtitle}</p>
            <h1>AC CAPITAL OS</h1>
          </div>
          <div className={styles.topbarActions}>
            <span className={styles.secureBadge}>Protected internal access</span>
            <span className={styles.zipBadge}>{zipLabel}</span>
            <a className={styles.apiBadge} href="/api/ac-capital-os/executive-cockpit">Cockpit API</a>
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}

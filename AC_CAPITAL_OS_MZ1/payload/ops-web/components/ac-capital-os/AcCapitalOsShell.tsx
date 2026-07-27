import type { ReactNode } from 'react';
import styles from './ac-capital-os.module.css';
import { AC_CAPITAL_OS_WORKSPACES } from '../../lib/ac-capital-os/foundation';

export function AcCapitalOsShell({ children }: { children: ReactNode }) {
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
          {AC_CAPITAL_OS_WORKSPACES.map((workspace) => (
            <a
              key={workspace.key}
              className={`${styles.workspaceNavItem} ${workspace.status === 'foundation-ready' ? styles.workspaceNavItemReady : ''}`}
              href={workspace.route}
              aria-label={`${workspace.name} - ${workspace.status}`}
            >
              <span className={`${styles.navDot} ${styles[`accent_${workspace.accent}`]}`} />
              <span>{workspace.name}</span>
              <small>{workspace.status.split('-').join(' ')}</small>
            </a>
          ))}
        </nav>
      </aside>
      <section className={styles.mainSurface}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.eyebrow}>AngelCare internal capital command module</p>
            <h1>AC CAPITAL OS</h1>
          </div>
          <div className={styles.topbarActions}>
            <span className={styles.secureBadge}>Protected internal access</span>
            <span className={styles.zipBadge}>Mega ZIP 01</span>
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}

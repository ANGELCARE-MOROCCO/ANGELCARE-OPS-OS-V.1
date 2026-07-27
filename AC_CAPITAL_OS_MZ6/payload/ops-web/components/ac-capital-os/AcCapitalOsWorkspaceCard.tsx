import styles from './ac-capital-os.module.css';
import type { AcCapitalOsWorkspace } from '../../lib/ac-capital-os/types';

export function AcCapitalOsWorkspaceCard({ workspace }: { workspace: AcCapitalOsWorkspace }) {
  return (
    <article className={`${styles.workspaceCard} ${styles[`cardAccent_${workspace.accent}`]}`}>
      <div className={styles.workspaceCardHeader}>
        <span>{workspace.universe}</span>
        <strong>ZIP {workspace.megaZip.toString().padStart(2, '0')}</strong>
      </div>
      <h3>{workspace.name}</h3>
      <p>{workspace.mission}</p>
      <div className={styles.workspaceMetaGrid}>
        <span>{workspace.status.split('-').join(' ')}</span>
        <span>{workspace.protected ? 'protected' : 'public'}</span>
      </div>
    </article>
  );
}

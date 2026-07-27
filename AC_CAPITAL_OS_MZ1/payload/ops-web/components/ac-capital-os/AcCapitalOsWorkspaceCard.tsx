import type { AcCapitalOsWorkspace } from '../../lib/ac-capital-os/types';
import styles from './ac-capital-os.module.css';

export function AcCapitalOsWorkspaceCard({ workspace }: { workspace: AcCapitalOsWorkspace }) {
  return (
    <article className={styles.workspaceCard}>
      <div className={styles.workspaceCardHeader}>
        <span className={`${styles.workspaceIcon} ${styles[`accent_${workspace.accent}`]}`}>{workspace.name.slice(0, 2)}</span>
        <div>
          <h3>{workspace.name}</h3>
          <p>{workspace.universe}</p>
        </div>
      </div>
      <p className={styles.workspaceMission}>{workspace.mission}</p>
      <div className={styles.workspaceMetaGrid}>
        <span>ZIP {String(workspace.megaZip).padStart(2, '0')}</span>
        <span>{workspace.status.split('-').join(' ')}</span>
        <span>{workspace.protected ? 'protected' : 'public'}</span>
      </div>
      <div className={styles.contractStack}>
        <p><strong>Front-end:</strong> {workspace.frontEndObligation}</p>
        <p><strong>Back-end:</strong> {workspace.backEndObligation}</p>
        <p><strong>Control:</strong> {workspace.backofficeObligation}</p>
      </div>
    </article>
  );
}

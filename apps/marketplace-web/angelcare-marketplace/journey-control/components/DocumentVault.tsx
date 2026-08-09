import { Download, FileCheck2, FileLock2, Files } from 'lucide-react'
import type { JourneyDocument } from '../types'
import styles from '../journey.module.css'

export function DocumentVault({ documents }: { documents: JourneyDocument[] }) {
  return <section className={styles.documentVault} aria-labelledby="document-vault-title">
    <div className={styles.sectionHeading}><div><span>DOCUMENT & EVIDENCE VAULT</span><h2 id="document-vault-title">Vos documents gouvernés</h2></div><strong>{documents.length}</strong></div>
    {documents.length ? <div className={styles.documentGrid}>{documents.map((document) => <article className={styles.documentCard} key={document.id}>
      <div className={styles.documentIcon}>{document.visibility === 'restricted' ? <FileLock2 size={20}/> : <FileCheck2 size={20}/>}</div>
      <div><span>{document.document_type}</span><h3>{document.title}</h3><p>{document.source_system}{document.version_label ? ` · ${document.version_label}` : ''}</p></div>
      {document.download_url ? <a href={document.download_url} className={styles.iconButton} aria-label={`Télécharger ${document.title}`}><Download size={17}/></a> : <span className={styles.pendingBadge}>En préparation</span>}
    </article>)}</div> : <div className={styles.emptyState}><Files size={22}/> Aucun document n’est publié pour ce parcours.</div>}
  </section>
}

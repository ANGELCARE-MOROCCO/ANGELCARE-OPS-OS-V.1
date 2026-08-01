import type { FreshnessState } from '../types'
import styles from '../localization.module.css'

interface InventoryRow {
  candidate_id: string
  translation_key: string
  source_path?: string | null
  source_line?: number | null
  source_text_fr: string
  domain: string
  freshness_state: FreshnessState
  en_translation?: string | null
  ar_translation?: string | null
  sensitivity: string
}

export function InventoryTable({rows}:{rows:InventoryRow[]}){ return <section className={styles.panel}><div className={styles.panelHeader}><div><h2>Inventaire maître des zones traduisibles</h2><p className={styles.muted}>Source française, preuve technique, fraîcheur et fulfillment par langue.</p></div><span className={styles.status}>{rows.length} résultats</span></div><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Clé / preuve</th><th>Source française</th><th>Domaine</th><th>Fraîcheur</th><th>EN</th><th>AR</th><th>Sensibilité</th></tr></thead><tbody>{rows.map((r)=><tr key={r.candidate_id}><td><strong>{r.translation_key}</strong><div className={styles.code}>{r.source_path}:{r.source_line}</div></td><td>{r.source_text_fr}</td><td>{r.domain}</td><td><span className={`${styles.status} ${r.freshness_state==='current'?styles.success:r.freshness_state==='missing'?styles.danger:styles.warning}`}>{r.freshness_state}</span></td><td>{r.en_translation||'—'}</td><td dir="rtl">{r.ar_translation||'—'}</td><td>{r.sensitivity}</td></tr>)}</tbody></table></div></section> }

import Link from 'next/link'; import styles from '../localization.module.css'

interface LatestLocalizationScan {
  status?: string | null
  new_candidates?: number | null
  changed_candidates?: number | null
  failed_sources?: number | null
  scanned_files?: number | null
}

interface LocalizationSummary {
  latestScan?: LatestLocalizationScan | null
  truthfulCoverage?: number | null
  totalCandidates: number
  missing: number
  stale?: number
  sensitiveBlockers: number
}

export function LocalizationCockpit({summary}:{summary:LocalizationSummary}){ const scan=summary.latestScan; const status=scan?.status||'Aucun scan'; const truthful=summary.truthfulCoverage==null?'Non calculable':`${summary.truthfulCoverage}%`; const commands=[['Scanner continu','/angelcare-marketplace/admin/localization/scanner','Lancer un scan complet, incrémental ou ciblé avec transparence des sources.'],['Inventaire maître','/angelcare-marketplace/admin/localization/inventory','Tous les textes détectés, leur preuve, fraîcheur, statut et couverture.'],['Fulfillment CSV','/angelcare-marketplace/admin/localization/csv','Exporter, valider, simuler, appliquer et annuler les traductions.'],['Mémoire & glossaire','/angelcare-marketplace/admin/localization/memory','Réutiliser les traductions approuvées et protéger la terminologie ANGELCARE.'],['Laboratoire RTL','/angelcare-marketplace/admin/localization/rtl-lab','Contrôler structure, navigation, formulaires, tables et contenu mixte.'],['SEO localisé','/angelcare-marketplace/admin/localization/seo','Titres, slugs, canonicals, alternates et readiness par territoire.']]; return <div className={styles.page}><section className={styles.hero}><div className={styles.eyebrow}>MEGA ZIP 03 · LOCALIZATION INTELLIGENCE OS</div><h1>La vérité linguistique de tout le Marketplace.</h1><p>Le français reste la source canonique. Le scanner découvre, versionne et prouve chaque zone traduisible; aucune couverture à 100% n’est affichée si une source échoue ou reste périmée.</p><div className={styles.heroActions}><Link className={`${styles.button} ${styles.secondary}`} href="/angelcare-marketplace/admin/localization/scanner">Lancer un scan</Link><Link className={styles.button} href="/angelcare-marketplace/admin/localization/inventory">Ouvrir l’inventaire</Link></div></section><section className={styles.grid}><Metric label="Couverture prouvée" value={truthful}/><Metric label="Textes indexés" value={String(summary.totalCandidates)}/><Metric label="Traductions manquantes" value={String(summary.missing)} tone={summary.missing?'danger':'success'}/><Metric label="Bloquants sensibles" value={String(summary.sensitiveBlockers)} tone={summary.sensitiveBlockers?'danger':'success'}/></section><section className={styles.panel}><div className={styles.panelHeader}><div><h2>État du dernier scan</h2><p className={styles.muted}>La complétude dépend de tous les adaptateurs obligatoires.</p></div><span className={`${styles.status} ${status==='completed'?styles.success:styles.warning}`}>{status}</span></div><div className={styles.grid}><Metric label="Nouveaux" value={String(scan?.new_candidates||0)}/><Metric label="Modifiés" value={String(scan?.changed_candidates||0)}/><Metric label="Sources échouées" value={String(scan?.failed_sources||0)} tone={scan?.failed_sources?'danger':'success'}/><Metric label="Fichiers scannés" value={String(scan?.scanned_files||0)}/></div></section><section className={styles.cards}>{commands.map(([title,href,desc])=><Link className={styles.command} href={href} key={href}><h3>{title}</h3><p className={styles.muted}>{desc}</p></Link>)}</section></div> }
function Metric({label,value,tone}:{label:string;value:string;tone?:'danger'|'success'}){return <div className={styles.metric}><strong className={tone?styles[tone]:undefined}>{value}</strong><span>{label}</span></div>}

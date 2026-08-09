import { Globe2, LockKeyhole, MonitorSmartphone, Store, UsersRound } from 'lucide-react'
import type { TerritoryDetailBundle } from '../types'
import styles from '../territory-os.module.css'
import { TerritoryHealthPill, TerritoryStatusPill } from './TerritoryPrimitives'

export function TerritoryPreview({bundle}:{bundle:TerritoryDetailBundle}){
  const {territory,readiness,overrides}=bundle
  const modules=[
    ['Public shell',true,'Fondation de navigation et contexte territorial.'],
    ['Marketplace',false,'Mega ZIP 09 non installé. Aucune transaction simulée.'],
    ['Partner OS',false,'Mega ZIP 11 non installé. Aucun tenant fictif.'],
    ['Workspaces verticaux',false,'Mega ZIPs 12–18 non installés.'],
  ] as const
  return <div className={styles.territoryCommand}><div className={styles.noticeWarning}><LockKeyhole size={16}/><span>Mode preview gouverné. Les contenus et modules non publiés restent clairement signalés; cette vue ne constitue pas une mise en service.</span></div><section className={styles.previewFrame}><header className={styles.previewBar}><div className={styles.previewContext}><span className={styles.previewBadge}>PREVIEW</span><span className={styles.previewBadge}>{territory.territory_code}</span><span className={styles.previewBadge}>{territory.default_locale.toUpperCase()} · {territory.currency_label} · {territory.timezone}</span></div><div className={styles.previewContext}><TerritoryStatusPill status={territory.status}/><TerritoryHealthPill status={territory.health_status}/></div></header><div className={styles.previewBody}><div className={styles.previewPublicHero}><span>ANGELCARE · {territory.country_code}</span><h2>{territory.name}</h2><p>Expérience territoriale préparée avec {territory.active_locales.join(', ').toUpperCase()}, un score readiness de {readiness.score}% et {overrides.filter((item)=>['submitted','in_review'].includes(item.status)).length} override(s) non publié(s). Les conversions publiques restent bloquées tant que les Mega ZIPs concernés et leurs gates ne sont pas acceptés.</p></div><div className={styles.previewAvailability}>{modules.map(([label,available,description],index)=>{const Icon=index===0?Globe2:index===1?Store:index===2?UsersRound:MonitorSmartphone;return <article className={styles.previewModule} key={label}><Icon size={18} color={available?'#126b47':'#8b5207'}/><strong style={{marginTop:10}}>{label}</strong><span>{available?'Disponible dans le périmètre actuel':'Indisponible par contrat'} · {description}</span></article>})}</div></div></section></div>
}

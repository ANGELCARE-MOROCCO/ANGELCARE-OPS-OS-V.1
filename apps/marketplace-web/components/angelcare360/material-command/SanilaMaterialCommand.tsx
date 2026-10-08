import Link from 'next/link'
import styles from './MaterialCommand.module.css'
import { BarcodeLookup } from './BarcodeLookup'
import { MaterialCommandShell, EmptyState, formatMad, formatDate } from './MaterialCommandShell'
import type { MaterialItem, MaterialSnapshot } from '@/types/angelcare360/material-control'

function stateLabel(item: MaterialItem) {
  if (item.status === 'damaged') return 'Endommagé'
  if (item.status === 'lost') return 'Perdu'
  if (item.health === 'critical') return 'Rupture'
  if (item.health === 'pressure') return 'Sous seuil'
  return 'Stable'
}
function tone(item: MaterialItem) { return item.health === 'healthy' ? 'success' : item.health === 'pressure' ? 'warning' : 'danger' }
function width(item: MaterialItem) { if (item.reorderLevel <= 0) return item.currentStock > 0 ? 100 : 0; return Math.max(3,Math.min(100,(item.currentStock/(item.reorderLevel*2))*100)) }
function casablancaDay(value: string | Date) { return new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Casablanca'}).format(new Date(value)) }
function interventionWeight(item: MaterialItem) {
  if (item.status === 'lost') return 120
  if (item.status === 'damaged') return 110
  if (item.currentStock <= 0 || item.health === 'critical') return 100
  if (!item.responsibleStaffId) return 65
  if (item.health === 'pressure') return 55
  return 0
}
function interventionReason(item: MaterialItem) {
  if (item.status === 'lost') return 'Matériel déclaré perdu · suivi institutionnel requis'
  if (item.status === 'damaged') return 'Matériel endommagé · disponibilité compromise'
  if (item.currentStock <= 0 || item.health === 'critical') return `Rupture · stock ${item.currentStock} ${item.unit}`
  if (!item.responsibleStaffId) return 'Responsabilité matérielle non attribuée'
  if (item.health === 'pressure') return `Sous seuil · ${item.currentStock} / seuil ${item.reorderLevel}`
  return 'Aucune intervention immédiate'
}

export function SanilaMaterialCommand({ snapshot }: { snapshot: MaterialSnapshot }) {
  const healthy = snapshot.items.filter(i=>i.health==='healthy').slice(0,7)
  const pressure = snapshot.items.filter(i=>i.health==='pressure').slice(0,7)
  const critical = snapshot.items.filter(i=>i.health==='critical'||i.health==='exception').slice(0,7)
  const lanes = [['Stable',healthy],['Pression',pressure],['Action requise',critical]] as const
  const today = casablancaDay(new Date())
  const todayMovements = snapshot.movements.filter(m=>casablancaDay(m.createdAt||m.movementDate)===today).slice(0,8)
  const interventions = snapshot.items
    .filter(item=>interventionWeight(item)>0)
    .sort((a,b)=>interventionWeight(b)-interventionWeight(a)||a.label.localeCompare(b.label,'fr'))
    .slice(0,9)
  const activeItems = snapshot.items.filter(item=>!['inactive','archived'].includes(item.status)).length
  const exceptions = snapshot.items.filter(item=>item.health==='exception').length

  return <MaterialCommandShell schoolName={snapshot.schoolName} academicYearLabel={snapshot.academicYearLabel} integrity={snapshot.integrity} activePath="/angelcare-360-command-center/inventaire">
    <section className={styles.operatorStrip} aria-label="État opérationnel inventaire">
      <Link href="/angelcare-360-command-center/inventaire/articles" className={styles.operatorMetric}><span>Articles actifs</span><strong>{activeItems}</strong><small>registre matériel exploitable</small></Link>
      <Link href="/angelcare-360-command-center/inventaire/stock-bas" className={styles.operatorMetric} data-tone={snapshot.totals.pressure?'warning':'success'}><span>Sous seuil</span><strong>{snapshot.totals.pressure}</strong><small>références à réapprovisionner</small></Link>
      <Link href="/angelcare-360-command-center/inventaire/stock-bas" className={styles.operatorMetric} data-tone={snapshot.totals.outOfStock?'danger':'success'}><span>Ruptures</span><strong>{snapshot.totals.outOfStock}</strong><small>stock nul / indisponible</small></Link>
      <Link href="/angelcare-360-command-center/inventaire/stock-bas" className={styles.operatorMetric} data-tone={exceptions?'danger':'success'}><span>Exceptions</span><strong>{exceptions}</strong><small>dommage ou perte</small></Link>
      <Link href="/angelcare-360-command-center/inventaire/responsables" className={styles.operatorMetric} data-tone={snapshot.totals.unassigned?'warning':'success'}><span>Sans responsable</span><strong>{snapshot.totals.unassigned}</strong><small>gouvernance à compléter</small></Link>
      <Link href="/angelcare-360-command-center/inventaire/mouvements" className={styles.operatorMetric}><span>Mouvements aujourd’hui</span><strong>{todayMovements.length}</strong><small>faits matériels enregistrés</small></Link>
    </section>

    <section className={styles.operationsGrid}>
      <div className={styles.watchtower}>
        <div className={styles.panelHead}><div><p className={styles.eyebrow}>MATERIAL WATCHTOWER</p><h2>À traiter maintenant</h2><p>Une file d’intervention transparente basée uniquement sur rupture, seuil, dommage, perte et responsabilité.</p></div><Link className={styles.link} href="/angelcare-360-command-center/inventaire/stock-bas">Toutes les exceptions</Link></div>
        {interventions.length?<div className={styles.interventionList}>{interventions.map(item=><Link href={item.detailHref} className={styles.interventionRow} data-tone={item.health==='critical'||item.health==='exception'?'danger':'warning'} key={item.id}><div><span className={styles.code}>{item.code}</span><strong>{item.label}</strong><p>{interventionReason(item)}</p></div><div className={styles.interventionFacts}><span>{item.categoryLabel||'Sans catégorie'}</span><b>{item.responsibleStaffName||'Sans responsable'}</b></div></Link>)}</div>:<EmptyState title="Aucune intervention prioritaire" body="Aucune rupture, exception ou responsabilité manquante n’est actuellement détectée dans le registre matériel actif."/>}
      </div>
      <div className={styles.todayBoard}>
        <div className={styles.panelHead}><div><p className={styles.eyebrow}>TODAY MOVEMENT PULSE</p><h2>Ce qui a physiquement changé</h2><p>Chronologie des mouvements enregistrés aujourd’hui dans l’établissement.</p></div><span className={styles.panelMeta}>{todayMovements.length} mouvement(s)</span></div>
        {todayMovements.length?<div className={styles.todayList}>{todayMovements.map(m=><Link className={styles.todayRow} href={`/angelcare-360-command-center/inventaire/mouvements/${m.id}`} key={m.id}><time>{formatDate(m.createdAt)}</time><span className={styles.movementType} data-type={m.movementType}>{m.movementType}</span><div><strong>{m.itemLabel||m.itemCode||'Article'}</strong><p>{m.quantity} · {m.notes||'Mouvement enregistré'}</p></div></Link>)}</div>:<EmptyState title="Aucun mouvement aujourd’hui" body="Aucun mouvement de stock n’a encore été enregistré pour la journée courante."/>}
      </div>
    </section>

    <section className={styles.commandGrid}>
      <div className={styles.readinessField}>
        <div className={styles.panelHead}><div><p className={styles.eyebrow}>MATERIAL READINESS FIELD</p><h2>État matériel de l’établissement</h2><p>Les articles sont organisés par réalité de stock et exception. Aucun pronostic de consommation n’est inventé.</p></div><span className={styles.panelMeta}>{snapshot.totals.items} articles</span></div>
        {snapshot.items.length ? <div className={styles.readinessLanes}>{lanes.map(([label,items])=><div className={styles.lane} key={label}><div className={styles.laneHead}><span>{label}</span><b>{items.length}</b></div><div className={styles.laneStack}>{items.map(item=><Link href={item.detailHref} className={styles.materialCard} data-health={item.health} key={item.id}><div className={styles.materialTop}><span className={styles.code}>{item.code}</span><span className={styles.pill} data-tone={tone(item)}>{stateLabel(item)}</span></div><strong>{item.label}</strong><p>{item.categoryLabel || 'Catégorie non résolue'} · {item.responsibleStaffName || 'Sans responsable'}</p><div className={styles.stockLine}><div className={styles.stockTrack}><div className={styles.stockFill} data-health={item.health} style={{width:`${width(item)}%`}} /></div><b>{item.currentStock} / seuil {item.reorderLevel}</b></div></Link>)}</div></div>)}</div> : <EmptyState title="Aucun article actif" body="Le registre matériel de cet établissement est vide. Créez le premier article depuis le Registre." />}
      </div>
      <div className={styles.sideStack}>
        <div className={styles.categoryField}><div className={styles.panelHead}><div><p className={styles.eyebrow}>CATEGORY CONSTELLATION</p><h2>Domaines matériels</h2></div><Link className={styles.link} href="/angelcare-360-command-center/inventaire/categories">Ouvrir</Link></div><div className={styles.categoryList}>{snapshot.categories.slice(0,8).map(cat=><Link className={styles.categoryNode} href={`/angelcare-360-command-center/inventaire/categories/${cat.id}`} key={cat.id}><strong>{cat.label}</strong><p>{cat.description || 'Catégorie matérielle institutionnelle'}</p><div className={styles.categoryStats}><span>{cat.itemCount} articles</span><span>{cat.pressureCount} sous pression</span><b>{cat.criticalCount} critiques</b></div></Link>)}</div></div>
        <div className={styles.movementRiver}><div className={styles.panelHead}><div><p className={styles.eyebrow}>MOVEMENT RIVER</p><h2>Flux récents</h2></div><Link className={styles.link} href="/angelcare-360-command-center/inventaire/mouvements">Chronologie</Link></div><div className={styles.movementList}>{snapshot.movements.slice(0,7).map(m=><Link className={styles.categoryNode} href={`/angelcare-360-command-center/inventaire/mouvements/${m.id}`} key={m.id}><div className={styles.materialTop}><span className={styles.movementType} data-type={m.movementType}>{m.movementType}</span><span className={styles.code}>{formatDate(m.createdAt)}</span></div><strong>{m.itemLabel || m.movementCode}</strong><p>{m.quantity} · {m.notes || 'Mouvement enregistré'} · {m.performerName || 'Acteur système/utilisateur'}</p></Link>)}</div></div>
        <BarcodeLookup schoolId={snapshot.schoolId} />
      </div>
    </section>
    <section className={styles.metricStrip} aria-label="Indicateurs matériels factuels">
      <div className={styles.metric}><span>Stock stable</span><strong>{snapshot.totals.healthy}</strong><small>articles au-dessus de leur seuil</small></div>
      <div className={styles.metric}><span>Sous pression</span><strong>{snapshot.totals.pressure}</strong><small>stock inférieur ou égal au seuil</small></div>
      <div className={styles.metric}><span>Ruptures</span><strong>{snapshot.totals.outOfStock}</strong><small>stock nul / état rupture</small></div>
      <div className={styles.metric}><span>Sans responsable</span><strong>{snapshot.totals.unassigned}</strong><small>gouvernance matérielle à compléter</small></div>
      <div className={styles.metric}><span>Valeur indicative</span><strong>{formatMad(snapshot.totals.indicativeValue)}</strong><small>stock × prix d’achat enregistré; non comptable</small></div>
    </section>
  </MaterialCommandShell>
}

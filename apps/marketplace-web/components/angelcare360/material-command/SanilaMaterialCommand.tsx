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

export function SanilaMaterialCommand({ snapshot }: { snapshot: MaterialSnapshot }) {
  const healthy = snapshot.items.filter(i=>i.health==='healthy').slice(0,7)
  const pressure = snapshot.items.filter(i=>i.health==='pressure').slice(0,7)
  const critical = snapshot.items.filter(i=>i.health==='critical'||i.health==='exception').slice(0,7)
  const lanes = [['Stable',healthy],['Pression',pressure],['Action requise',critical]] as const
  return <MaterialCommandShell schoolName={snapshot.schoolName} academicYearLabel={snapshot.academicYearLabel} integrity={snapshot.integrity} activePath="/angelcare-360-command-center/inventaire">
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

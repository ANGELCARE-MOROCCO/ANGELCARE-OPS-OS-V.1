'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowRight, BadgeCheck, CircleAlert, ClipboardCheck, UserRoundCheck } from 'lucide-react'
import type { Wave1AccountabilityItem, Wave1ExecutiveData } from './Wave1ExecutiveTypes'
import { EmptyExecutiveState, ExecutiveDrawer, ExecutiveRibbon, SearchControl, SectionHeader, Wave1Hero } from './Wave1ExecutivePrimitives'
import styles from './Wave1ExecutiveExperience.module.css'

export default function ManagementAccountability({ data }: { data: Wave1ExecutiveData }) {
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'all' | 'unowned' | 'overdue' | 'missing_evidence' | 'blocked'>('all')
  const [selected, setSelected] = useState<Wave1AccountabilityItem | null>(null)
  const items = useMemo(() => {
    const normalized = normalize(query)
    return data.accountability.filter((item) => {
      const viewMatch = view === 'all' || (view === 'unowned' && item.owner === 'Non attribué') || (view === 'overdue' && Boolean(item.dueDate && new Date(item.dueDate).getTime() < Date.now())) || (view === 'missing_evidence' && item.evidenceState === 'missing') || (view === 'blocked' && item.state === 'blocked')
      return viewMatch && (!normalized || normalize(`${item.title} ${item.customerName} ${item.owner} ${item.sponsor} ${item.state} ${item.impact}`).includes(normalized))
    })
  }, [data.accountability, query, view])
  const unowned = data.accountability.filter((item) => item.owner === 'Non attribué')
  const overdue = data.accountability.filter((item) => item.dueDate && new Date(item.dueDate).getTime() < Date.now())
  const missing = data.accountability.filter((item) => item.evidenceState === 'missing')
  const blocked = data.accountability.filter((item) => item.state === 'blocked')

  return (
    <div className={styles.page} data-domain="accountability">
      <Wave1Hero domain="accountability" eyebrow="Management Accountability System" title="Chaque enjeu reçoit un" accent="propriétaire, un délai, une preuve et une issue." subtitle="Les tâches, activations, demandes et décisions deviennent des engagements de management visibles. Les absences d’attribution, les retards, les blocages et les preuves manquantes remontent avant le volume ordinaire." data={data} primary={{ label: 'Ouvrir les tâches opérateur', href: '/angelcare-360-operator/tasks' }} secondary={{ label: 'Voir les décisions', href: '/angelcare-360-operator/executive/decisions' }} />
      <ExecutiveRibbon signals={data.signals} />

      <section className={styles.section}>
        <SectionHeader eyebrow="Responsabilité visible" title="Les défauts de management que le volume cache habituellement" description="L’objectif n’est pas de compter des tâches, mais d’identifier les engagements sans propriétaire, dépassés, bloqués ou non prouvés." />
        <div className={styles.metricGrid}>
          <button type="button" className={styles.metric} onClick={() => setView('unowned')}><div className={styles.metricTop}><span className={styles.metricLabel}>Sans propriétaire</span><span className={styles.metricIcon}><UserRoundCheck size={17} /></span></div><div className={styles.metricValue}>{unowned.length}</div><div className={styles.metricDetail}>Engagements dont l’attribution n’est pas renseignée.</div></button>
          <button type="button" className={styles.metric} onClick={() => setView('overdue')}><div className={styles.metricTop}><span className={styles.metricLabel}>Échéance dépassée</span><span className={styles.metricIcon}><CircleAlert size={17} /></span></div><div className={styles.metricValue}>{overdue.length}</div><div className={styles.metricDetail}>Engagements datés antérieurement à aujourd’hui.</div></button>
          <button type="button" className={styles.metric} onClick={() => setView('missing_evidence')}><div className={styles.metricTop}><span className={styles.metricLabel}>Preuve manquante</span><span className={styles.metricIcon}><ClipboardCheck size={17} /></span></div><div className={styles.metricValue}>{missing.length}</div><div className={styles.metricDetail}>Objets sans description ou preuve minimale visible.</div></button>
          <button type="button" className={styles.metric} onClick={() => setView('blocked')}><div className={styles.metricTop}><span className={styles.metricLabel}>Bloqués</span><span className={styles.metricIcon}><BadgeCheck size={17} /></span></div><div className={styles.metricValue}>{blocked.length}</div><div className={styles.metricDetail}>Engagements explicitement au statut bloqué.</div></button>
        </div>
      </section>

      <section className={styles.surface}>
        <div className={styles.surfaceHeader}><div><h2 className={styles.surfaceTitle}>Registre des engagements de management</h2><p className={styles.surfaceMeta}>Le pourcentage de progression est une lecture d’état déterministe, pas une mesure déclarative de travail accompli.</p></div><div className={styles.lensBar}>{(['all','unowned','overdue','missing_evidence','blocked'] as const).map((value) => <button type="button" key={value} className={`${styles.lensButton} ${view === value ? styles.lensButtonActive : ''}`} onClick={() => setView(value)}>{labelFor(value)}</button>)}</div></div>
        <div className={styles.surfaceBody}>
          <SearchControl value={query} onChange={setQuery} count={items.length} placeholder="Rechercher un engagement, un client, un propriétaire ou un sponsor…" />
          <div style={{ height: 13 }} />
          {items.length ? <div className={styles.accountabilityList}>{items.map((item) => <button type="button" key={item.id} className={styles.accountabilityItem} onClick={() => setSelected(item)}><span><span className={styles.itemTitle}>{item.title}</span><span className={styles.itemDetail}>{item.customerName} · {item.objectType} · {item.impact}</span></span><span><span className={styles.ownerChip}>{item.owner}</span><span className={styles.itemDetail}>Sponsor · {item.sponsor}</span></span><span><div className={styles.progressTrack}><div className={styles.progressBar} style={{ '--progress': `${item.progress}%` } as React.CSSProperties} /></div><span className={styles.itemDetail}>{item.state} · preuve {item.evidenceState}</span></span><span className={styles.itemMeta}>{item.dueDate ? new Date(item.dueDate).toLocaleDateString('fr-FR') : 'Date à fixer'}<br />{item.priority}</span></button>)}</div> : <EmptyExecutiveState title="Aucun engagement correspondant" text="Aucun objet de management ne correspond à la vue et à la recherche sélectionnées." />}
        </div>
      </section>

      <section className={styles.equalGrid}>
        <article className={`${styles.surface} ${styles.surfaceSoft}`}><div className={styles.surfaceBody}><div className={styles.sectionEyebrow}>Doctrine de responsabilité</div><h2 className={styles.sectionTitle}>Owner ≠ Sponsor</h2><p className={styles.sectionDescription}>Le propriétaire exécute et met à jour. Le sponsor lève les obstacles, arbitre et garantit que l’issue reste cohérente avec l’intérêt d’AngelCare et du client.</p></div></article>
        <article className={`${styles.surface} ${styles.surfaceSoft}`}><div className={styles.surfaceBody}><div className={styles.sectionEyebrow}>Doctrine de preuve</div><h2 className={styles.sectionTitle}>Done ≠ Outcome</h2><p className={styles.sectionDescription}>Une tâche terminée n’est pas un résultat. L’issue doit confirmer que le risque, le blocage, l’exposition ou la pression a réellement diminué.</p></div></article>
      </section>

      <ExecutiveDrawer open={Boolean(selected)} onClose={() => setSelected(null)} eyebrow="Accountability Micro-App" title={selected?.title || ''} subtitle={selected ? `${selected.customerName} · ${selected.objectType}` : ''} stats={selected ? [{ label: 'Owner', value: selected.owner }, { label: 'Sponsor', value: selected.sponsor }, { label: 'Échéance', value: selected.dueDate ? new Date(selected.dueDate).toLocaleDateString('fr-FR') : 'À fixer' }, { label: 'Progression indicative', value: `${selected.progress}%` }] : []} footer={selected ? <><button type="button" className={styles.secondaryButton} onClick={() => setSelected(null)}>Fermer</button><Link href={selected.href} className={styles.primaryButton}>Ouvrir l’objet source<ArrowRight size={13} /></Link></> : null}>
        {selected ? <><section className={styles.drawerSection}><div className={styles.drawerSectionTitle}><span>Engagement actuel</span><span className={styles.statusChip}>{selected.state}</span></div><div className={styles.drawerSectionText}>{selected.impact}</div><div className={styles.progressTrack}><div className={styles.progressBar} style={{ '--progress': `${selected.progress}%` } as React.CSSProperties} /></div></section><section className={styles.drawerSection}><div className={styles.drawerSectionTitle}><span>Contrôle de preuve</span><span className={styles.categoryChip}>{selected.evidenceState}</span></div><div className={styles.drawerSectionText}>La présence de preuve est déduite des informations actuellement disponibles. La validation finale doit être effectuée dans le dossier source et le journal d’audit.</div></section><section className={styles.drawerSection}><div className={styles.drawerSectionTitle}><span>Issue attendue</span></div><div className={styles.drawerSectionText}>Le responsable doit décrire le changement réellement obtenu, pas seulement l’action exécutée, puis permettre au sponsor de le vérifier.</div></section></> : null}
      </ExecutiveDrawer>
    </div>
  )
}

function labelFor(value: 'all' | 'unowned' | 'overdue' | 'missing_evidence' | 'blocked') { return ({ all: 'Tous', unowned: 'Sans owner', overdue: 'En retard', missing_evidence: 'Preuve manquante', blocked: 'Bloqués' })[value] }
function normalize(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() }

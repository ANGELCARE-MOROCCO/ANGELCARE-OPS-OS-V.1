'use client'

import Link from 'next/link'
import { Layers3, Sparkles } from 'lucide-react'
import type { CustomerRelationshipOverview } from '../types'
import styles from '../customer-relationship.module.css'
import { SegmentBuilder } from '@/angelcare-marketplace/enterprise-command/components/SegmentBuilder'

export function SegmentIntelligenceWorkspace({ snapshot, canManage, canActivate }: { snapshot: CustomerRelationshipOverview; canManage: boolean; canActivate: boolean }) {
  return <main className={styles.workspaceCanvas}>
    <section className={styles.workspaceHero}>
      <div><span>CLIENTS · SEGMENTS & AUDIENCES</span><h2>Construire, prévisualiser et activer des audiences persistantes.</h2><p>Le moteur existant agrège les signaux commerciaux puis matérialise les memberships. Les activations réutilisent l’autorité Promotions, sans recréer un moteur d’audience parallèle.</p></div>
      <div className={styles.introActions}><Link className={styles.secondaryAction} href="/angelcare-marketplace/admin/customers">Registre clients</Link><Link className={styles.primaryAction} href="/angelcare-marketplace/admin/promotions">Promotions</Link></div>
    </section>
    <section className={styles.segmentLens}>
      <header><Layers3 size={16}/><div><span>LENTILLES RELATIONNELLES</span><strong>Perspectives de gestion calculées depuis la source</strong></div></header>
      {snapshot.segments.map((segment) => <article key={segment.key} data-severity={segment.severity}><Sparkles size={15}/><div><strong>{segment.label}</strong><small>{segment.description}</small></div><b>{segment.count}</b></article>)}
    </section>
    <section className={styles.embeddedAuthority}>
      <div className={styles.authorityLabel}><span>STUDIO D’AUDIENCE CANONIQUE</span><strong>Règles AND/OR, estimation, sauvegarde, export et activation gouvernée</strong></div>
      <SegmentBuilder canManage={canManage} canActivate={canActivate}/>
    </section>
  </main>
}

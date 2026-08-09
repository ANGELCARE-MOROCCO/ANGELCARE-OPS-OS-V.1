'use client'

import type { SovereignEntity, SovereignWorkspaceSnapshot } from './SovereignTypes'
import { DeepNavigation, EntityMatrix, FlowField, PressureList, Surface } from './SovereignPrimitives'
import styles from './SovereignExperience.module.css'

export default function RevenueSovereignScene({snapshot,onOpen}:{snapshot:SovereignWorkspaceSnapshot;onOpen:(entity:SovereignEntity)=>void}) {
  const accounts=snapshot.entities.filter(e=>e.kind==='billing-account')
  const invoices=snapshot.entities.filter(e=>e.kind==='invoice')
  const payments=snapshot.entities.filter(e=>e.kind==='payment')
  const exposure=invoices.filter(e=>!['paid','cancelled','archived'].includes(e.status||'')).map(e=>({title:e.title,detail:e.subtitle||'Compte client',value:e.fields.find(f=>f.label==='Solde')?.value||e.status||'À traiter'}))
  return <div className={styles.sceneGrid}>
    <div className={styles.sceneMain}>
      <Surface eyebrow="Revenue Circulation System" title="De la valeur contractée au cash sécurisé" description="La chaîne économique relie abonnement, facture, paiement, exposition, recouvrement et renouvellement."><FlowField nodes={[{label:'MRR actif',value:snapshot.metrics.find(m=>m.key==='mrr')?.value||'—'},{label:'Facturé',value:snapshot.metrics.find(m=>m.key==='invoiced')?.value||'—'},{label:'Encaissé',value:snapshot.metrics.find(m=>m.key==='collected')?.value||'—'},{label:'Échu',value:snapshot.metrics.find(m=>m.key==='overdue')?.value||'—'},{label:'Renouvellements',value:String(snapshot.entities.filter(e=>e.kind==='renewal').length)}]}/></Surface>
      <Surface eyebrow="Financial Relationships" title="Comptes de facturation" count={accounts.length}><EntityMatrix entities={accounts} empty="Aucun compte de facturation disponible." onOpen={onOpen}/></Surface>
      <Surface eyebrow="Invoice Observatory" title="Factures et paiements" count={invoices.length+payments.length}><EntityMatrix entities={[...invoices.slice(0,8),...payments.slice(0,8)]} empty="Aucun mouvement financier chargé." onOpen={onOpen}/></Surface>
      <Surface eyebrow="Economic Instruments" title="Contrôle financier"><DeepNavigation items={[{eyebrow:'Overview',label:'Billing Command',href:'/angelcare-360-operator/billing'},{eyebrow:'Receivables',label:'Invoices',href:'/angelcare-360-operator/billing/invoices'},{eyebrow:'Cash',label:'Payments',href:'/angelcare-360-operator/billing/payments'},{eyebrow:'Collection',label:'Dunning',href:'/angelcare-360-operator/billing/dunning'},{eyebrow:'Exposure',label:'Balances',href:'/angelcare-360-operator/billing/balances'}]}/></Surface>
    </div>
    <aside className={styles.sceneSide}><Surface eyebrow="Exposure Matrix" title="Encours à intervenir" count={exposure.length}><PressureList items={exposure} empty="Aucune exposition financière ouverte dans les données chargées."/></Surface><Surface eyebrow="Profitability Twin" title="Rentabilité client"><div className={styles.emptySignal}>Le revenu, les remises et la charge support sont visibles. Le coût de service et la marge exacte restent indiqués indisponibles tant qu’une source de coûts fiable n’est pas publiée.</div></Surface></aside>
  </div>
}

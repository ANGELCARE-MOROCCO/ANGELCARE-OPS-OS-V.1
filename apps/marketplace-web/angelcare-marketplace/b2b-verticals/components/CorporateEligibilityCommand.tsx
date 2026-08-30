'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGovernedAction } from '../../shells/GovernedActionProvider'
import type { CorporateEligibilityRule, CorporateQuota } from '../types'
import styles from '../b2b.module.css'
import operatorStyles from './b2b-operator.module.css'

export function CorporateEligibilityCommand({ rules, quotas }: { rules: CorporateEligibilityRule[]; quotas: CorporateQuota[] }) {
  const requestAction = useGovernedAction()
  const router = useRouter()
  const [selected, setSelected] = useState<CorporateQuota | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [serviceReference, setServiceReference] = useState('')
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState('')

  async function consume() {
    if (!selected) return
    const reason = await requestAction({ title: 'Enregistrer une consommation Corporate', objectLabel: `${selected.beneficiary_reference} · ${selected.period_key}`, currentState: `${selected.remaining_quantity} unités disponibles`, nextState: `${selected.remaining_quantity - quantity} unités disponibles`, consequence: 'La consommation est persistée dans le quota Corporate et devient une preuve d’usage du programme.', permission: 'marketplace.b2b.corporates.eligibility_manage', reversibility: 'Aucune annulation de consommation n’est exposée par cette autorité.' })
    if (!reason) return
    setBusy(true); setFeedback('')
    const response = await fetch(`/api/angelcare-marketplace/b2b/corporates/quotas/${selected.id}/consume`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ quantity, serviceReference: `${serviceReference} · ${reason}` }) })
    const payload = await response.json().catch(() => ({})) as { error?: { message?: string } }
    setBusy(false)
    if (!response.ok) { setFeedback(payload.error?.message || 'Consommation refusée.'); return }
    setFeedback('Consommation enregistrée et auditée.'); setSelected(null); setServiceReference(''); router.refresh()
  }

  return <div className={styles.universe}>
    <section className={styles.panel}><header className={styles.panelHead}><div><h1 className={styles.panelTitle}>Règles d’éligibilité</h1><p className={styles.panelSub}>Priorités, configuration et état de publication.</p></div></header><div className={styles.panelBody}><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Règle</th><th>Type</th><th>Priorité</th><th>Statut</th><th>Configuration</th></tr></thead><tbody>{rules.map((rule) => <tr key={rule.id}><td>{rule.rule_key}</td><td>{rule.rule_type}</td><td>{rule.priority}</td><td><span className={styles.status} data-state={rule.status}>{rule.status}</span></td><td>{Object.keys(rule.configuration).join(', ') || '—'}</td></tr>)}</tbody></table></div></div></section>
    <section className={styles.panel}><header className={styles.panelHead}><div><h2 className={styles.panelTitle}>Allocations, soldes & consommation</h2><p className={styles.panelSub}>La commande serveur bloque toute quantité supérieure au quota disponible.</p></div></header><div className={styles.panelBody}>{feedback ? <div className={operatorStyles.success}>{feedback}</div> : null}<div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Bénéficiaire</th><th>Période</th><th>Alloué</th><th>Réservé</th><th>Consommé</th><th>Restant</th><th>Action</th></tr></thead><tbody>{quotas.map((quota) => <tr key={quota.id}><td>{quota.beneficiary_reference}</td><td>{quota.period_key}</td><td>{quota.allocated_quantity}</td><td>{quota.reserved_quantity}</td><td>{quota.consumed_quantity}</td><td><strong>{quota.remaining_quantity}</strong></td><td><button type="button" className={styles.ghost} disabled={quota.remaining_quantity <= 0} onClick={() => { setSelected(quota); setQuantity(1); setFeedback('') }}>Enregistrer usage</button></td></tr>)}</tbody></table></div></div></section>
    {selected ? <section className={styles.panel}><header className={styles.panelHead}><div><h2 className={styles.panelTitle}>Consommation · {selected.beneficiary_reference}</h2><p className={styles.panelSub}>{selected.remaining_quantity} unités disponibles sur {selected.period_key}.</p></div><button type="button" className={styles.ghost} onClick={() => setSelected(null)}>Fermer</button></header><div className={styles.panelBody}><div className={styles.fieldGrid}><label className={styles.field}><span>Quantité</span><input type="number" min="1" max={selected.remaining_quantity} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} /></label><label className={styles.field}><span>Référence du service réel</span><input value={serviceReference} onChange={(event) => setServiceReference(event.target.value)} placeholder="Commande, réservation ou mission" /></label></div><div className={styles.heroActions}><button type="button" className={styles.primary} disabled={busy || !serviceReference.trim() || quantity < 1 || quantity > selected.remaining_quantity} onClick={() => void consume()}>{busy ? 'Enregistrement…' : 'Examiner et confirmer'}</button></div></div></section> : null}
  </div>
}

'use client'

import { useState, type ChangeEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import CustomerOverlaySurface from '@/components/angelcare360/customer-experience/CustomerOverlaySurface'
import {
  SchoolAdminActionDock,
  SchoolAdminBreadcrumb,
  SchoolAdminDossierHeader,
  SchoolAdminImpactPreview,
  SchoolAdminSituationSummary,
} from '@/components/angelcare360/customer-experience/SchoolAdminWorkbench'
import { useCustomerExperience } from '@/components/angelcare360/customer-experience/CustomerExperienceProvider'
import styles from './FoundationDecisionComposer.module.css'

export default function FoundationDecisionComposer() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [detail, setDetail] = useState('')
  const [severity, setSeverity] = useState('info')
  const [dueAt, setDueAt] = useState('')
  const [busy, setBusy] = useState(false)
  const { notify } = useCustomerExperience()
  const router = useRouter()

  async function submit() {
    if (!title.trim()) {
      notify({ title: 'Titre à compléter', message: 'Indiquez clairement la décision attendue.', tone: 'warning' })
      return
    }
    setBusy(true)
    try {
      const response = await fetch('/api/angelcare360/customer-foundation', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ entity: 'management-decision', operation: 'create', payload: { title, detail, severity, dueAt: dueAt || null, domain: 'direction' } }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok || !result?.ok) throw new Error(result?.error || 'La décision n’a pas pu être enregistrée.')
      setOpen(false)
      setTitle('')
      setDetail('')
      setDueAt('')
      notify({ title: 'Décision ajoutée', message: 'Elle apparaît maintenant dans les éléments à traiter par la direction.', tone: 'success' })
      router.refresh()
    } catch (error) {
      notify({ title: 'Décision non enregistrée', message: error instanceof Error ? error.message : 'Vérifiez les informations puis réessayez.', tone: 'error' })
    } finally {
      setBusy(false)
    }
  }

  return <>
    <button type="button" className={styles.trigger} onClick={() => setOpen(true)}><Plus size={16}/> Ajouter une décision</button>
    {open ? <CustomerOverlaySurface kind="nested-command" onClose={() => setOpen(false)} className={styles.backdrop} dirty={Boolean(title || detail || dueAt || severity !== 'info')} ariaLabel="Ajouter une décision de direction">
      <section className={styles.drawer} role="dialog" aria-modal="true" aria-label="Ajouter une décision de direction">
        <SchoolAdminDossierHeader
          eyebrow="Direction de l’école"
          title="Ajouter une décision à prendre"
          description="Décrivez la question, son importance et la date à laquelle une réponse est nécessaire."
          status="Brouillon"
          tone="approval"
          context={<SchoolAdminBreadcrumb items={[{ key: 'direction', label: 'Direction' }, { key: 'decisions', label: 'Décisions' }, { key: 'new', label: 'Nouvelle décision' }]} />}
        >
          <button type="button" onClick={() => setOpen(false)} aria-label="Fermer"><X size={18}/></button>
        </SchoolAdminDossierHeader>
        <div className={styles.body}>
          <SchoolAdminSituationSummary
            summary="Cette décision sera ajoutée à la liste de la direction."
            reason="Utilisez cette fenêtre lorsqu’une situation a besoin d’un choix clair, d’un responsable et d’une échéance."
            consequence="Après enregistrement, la direction pourra la valider, demander des informations ou l’attribuer à une personne."
            tone="approval"
          />
          <label>Décision attendue<input value={title} onChange={(event: ChangeEvent<HTMLInputElement>) => setTitle(event.target.value)} placeholder="Ex. Valider l’ouverture d’une nouvelle section" /></label>
          <label>Contexte et résultat souhaité<textarea value={detail} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setDetail(event.target.value)} rows={5} placeholder="Expliquez la situation, les personnes concernées et ce qui doit changer" /></label>
          <div className={styles.grid}>
            <label>Priorité<select value={severity} onChange={(event: ChangeEvent<HTMLSelectElement>) => setSeverity(event.target.value)}><option value="info">Normale</option><option value="warning">Importante</option><option value="critical">Urgente</option></select></label>
            <label>Réponse souhaitée avant<input type="datetime-local" value={dueAt} onChange={(event: ChangeEvent<HTMLInputElement>) => setDueAt(event.target.value)}/></label>
          </div>
          <SchoolAdminImpactPreview items={[
            { key: 'queue', label: 'La décision apparaîtra dans la liste de la direction' },
            { key: 'owner', label: 'Elle pourra être attribuée à une personne responsable' },
            { key: 'history', label: 'Les choix, motifs et dates resteront dans l’historique' },
          ]} tone="approval" />
        </div>
        <SchoolAdminActionDock
          note="Formulez une seule question claire par décision."
          secondary={[{ key: 'cancel', label: 'Annuler', onClick: () => setOpen(false), disabled: busy }]}
          primary={{ label: 'Ajouter à la liste de la direction', onClick: submit, disabled: busy, busy }}
        />
      </section>
    </CustomerOverlaySurface> : null}
  </>
}

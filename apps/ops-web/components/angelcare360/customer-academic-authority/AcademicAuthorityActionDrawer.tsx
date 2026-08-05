'use client'

import { useState, type ChangeEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import CustomerOverlaySurface from '@/components/angelcare360/customer-experience/CustomerOverlaySurface'
import {
  SchoolAdminActionDock,
  SchoolAdminBreadcrumb,
  SchoolAdminDossierHeader,
  SchoolAdminErrorState,
  SchoolAdminImpactPreview,
  SchoolAdminSituationSummary,
} from '@/components/angelcare360/customer-experience/SchoolAdminWorkbench'
import type { AcademicAuthorityEntity } from '@/types/angelcare360/customer-academic-authority'
import styles from './AcademicAuthorityActionDrawer.module.css'

function academicAreaLabel(entity: AcademicAuthorityEntity) {
  const labels: Partial<Record<AcademicAuthorityEntity, string>> = {
    'attendance-correction': 'Correction de présence',
    'day-closure': 'Clôture des présences',
    'timetable-publication': 'Emploi du temps',
    'grade-correction': 'Correction de note',
    'academic-validation': 'Validation pédagogique',
    'report-card-publication': 'Publication des bulletins',
  }
  return labels[entity] || 'Suivi pédagogique'
}

export default function AcademicAuthorityActionDrawer({ entity, label, defaultTitle }: { entity: AcademicAuthorityEntity; label: string; defaultTitle: string }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [title, setTitle] = useState(defaultTitle)
  const [detail, setDetail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const area = academicAreaLabel(entity)

  async function submit() {
    if (!title.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      const response = await fetch('/api/angelcare360/customer-academic-authority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity, operation: 'create', payload: { title, detail } }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.error || 'Cette demande n’a pas pu être enregistrée.')
      setOpen(false)
      setDetail('')
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Cette demande n’a pas pu être enregistrée. Réessayez après avoir vérifié les informations.')
    } finally {
      setBusy(false)
    }
  }

  return <>
    <button type="button" className={styles.trigger} onClick={() => setOpen(true)}><Plus size={16}/>{label}</button>
    {open ? <CustomerOverlaySurface kind="nested-command" onClose={() => setOpen(false)} className={styles.backdrop} dirty={Boolean(detail || title !== defaultTitle)} ariaLabel={label}>
      <section className={styles.drawer} role="dialog" aria-modal="true" aria-label={label}>
        <SchoolAdminDossierHeader
          eyebrow={area}
          title={label}
          description="Préparez la demande avec les informations utiles. Elle restera liée au contexte scolaire actuel."
          status="Brouillon"
          tone="info"
          context={<SchoolAdminBreadcrumb items={[{ key: 'academics', label: 'Pédagogie' }, { key: entity, label: area }, { key: 'action', label }]} />}
        >
          <button type="button" onClick={() => setOpen(false)} aria-label="Fermer"><X size={18}/></button>
        </SchoolAdminDossierHeader>
        <div className={styles.body}>
          <SchoolAdminSituationSummary
            summary={`Vous préparez : ${label.toLowerCase()}.`}
            reason="Cette fenêtre permet de créer la demande sans quitter la classe, l’enfant ou la période que vous consultez."
            consequence="Après enregistrement, la demande apparaîtra dans le suivi pédagogique et pourra être complétée ou validée par la personne autorisée."
            tone="info"
          />
          <label>Objet de la demande<input value={title} onChange={(event: ChangeEvent<HTMLInputElement>) => setTitle(event.target.value)} placeholder="Décrivez l’action en quelques mots" /></label>
          <label>Informations utiles<textarea rows={7} value={detail} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setDetail(event.target.value)} placeholder="Expliquez la situation, les personnes concernées et le résultat attendu" /></label>
          <SchoolAdminImpactPreview items={[
            { key: 'context', label: 'La demande restera liée au contexte scolaire actuel' },
            { key: 'history', label: 'L’auteur et la date seront conservés dans l’historique' },
            { key: 'followup', label: 'La personne autorisée pourra la vérifier et la terminer' },
          ]} />
          {error ? <SchoolAdminErrorState detail={error} reference="PED-DEMANDE" /> : null}
        </div>
        <SchoolAdminActionDock
          note="Utilisez des mots simples et indiquez clairement le résultat attendu."
          secondary={[{ key: 'cancel', label: 'Annuler', onClick: () => setOpen(false), disabled: busy }]}
          primary={{ label: 'Enregistrer la demande', onClick: submit, disabled: busy || !title.trim(), busy }}
        />
      </section>
    </CustomerOverlaySurface> : null}
  </>
}

'use client'

import { useMemo, useState, type ChangeEvent } from 'react'
import { X } from 'lucide-react'
import CustomerOverlaySurface from '@/components/angelcare360/customer-experience/CustomerOverlaySurface'
import {
  SchoolAdminActionDock,
  SchoolAdminBreadcrumb,
  SchoolAdminDossierHeader,
  SchoolAdminErrorState,
  SchoolAdminImpactPreview,
  SchoolAdminSituationSummary,
} from '@/components/angelcare360/customer-experience/SchoolAdminWorkbench'
import { humanizeTechnicalLabel } from '@/data/angelcare360/customer-language'
import type { FinanceAuthorityCommandResult, FinanceAuthorityOperationKey } from '@/types/angelcare360/customer-finance-authority'
import styles from './FinanceAuthorityWorkspace.module.css'

type Field = { key: string; label: string; type?: 'text' | 'number' | 'date' | 'textarea' | 'select'; required?: boolean; wide?: boolean; options?: Array<{ value: string; label: string }>; placeholder?: string; source?: string }

type Props = {
  open: boolean
  operationKey: FinanceAuthorityOperationKey
  title: string
  description: string
  entityId?: string | null
  fields: Field[]
  onClose: () => void
  onCompleted: (result: FinanceAuthorityCommandResult) => void
}

function financeActionLabel(operationKey: FinanceAuthorityOperationKey, fallback: string) {
  const labels: Partial<Record<FinanceAuthorityOperationKey, string>> = {
    'finance.payment.capture': 'Enregistrer le paiement',
    'finance.payment.allocate': 'Affecter le paiement aux factures',
    'finance.receipt.issue': 'Générer le reçu',
    'finance.refund.request': 'Demander le remboursement',
    'finance.refund.approve': 'Valider le remboursement',
    'finance.discount.request': 'Demander une remise',
    'finance.discount.approve': 'Valider la remise',
    'finance.collection_case.open': 'Ouvrir le suivi de paiement',
    'finance.commitment.record': 'Enregistrer l’engagement de paiement',
    'finance.statement.generate': 'Générer le relevé de compte',
    'finance.expense.submit': 'Envoyer la dépense pour validation',
    'finance.expense.approve': 'Valider la dépense',
    'finance.period.close': 'Clôturer la période financière',
    'finance.document.generate': 'Générer le document',
    'finance.report.execute': 'Préparer le rapport',
    'finance.export.execute': 'Préparer l’export',
  }
  return labels[operationKey] || fallback || humanizeTechnicalLabel(operationKey)
}

export default function FinanceAuthorityActionDrawer({ open, operationKey, title, description, entityId, fields, onClose, onCompleted }: Props) {
  const initial = useMemo(() => Object.fromEntries(fields.map((field) => [field.key, ''])), [fields])
  const [values, setValues] = useState<Record<string, string>>(initial)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (!open) return null

  const actionLabel = financeActionLabel(operationKey, title)

  async function submit() {
    setSubmitting(true)
    setError(null)
    try {
      const payload: Record<string, unknown> = {}
      for (const field of fields) {
        const value = values[field.key]
        if (field.required && !value.trim()) throw new Error(`Complétez le champ « ${field.label} » avant de continuer.`)
        if (value.trim()) payload[field.key] = field.type === 'number' ? value.replace(',', '.') : value
      }
      const response = await fetch('/api/angelcare360/customer-finance-authority', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ operationKey, entityId: entityId || undefined, reason: values.reason || undefined, idempotencyKey: `${operationKey}:${entityId || 'new'}:${JSON.stringify(payload)}`, payload }),
      })
      const result = await response.json() as FinanceAuthorityCommandResult & { error?: string }
      if (!response.ok || !result.ok) throw new Error(result.error || result.message || 'Cette action financière n’a pas pu être enregistrée.')
      onCompleted(result)
      setValues(initial)
      onClose()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Cette action n’a pas pu être terminée. Vérifiez les informations puis réessayez.')
    } finally {
      setSubmitting(false)
    }
  }

  return <CustomerOverlaySurface kind="nested-command" onClose={onClose} className={styles.drawerBackdrop} backdropDismiss={!submitting} dirty={Object.values(values).some(Boolean)} ariaLabel={title}>
    <section className={styles.drawer} role="dialog" aria-modal="true" aria-labelledby="finance-authority-drawer-title">
      <SchoolAdminDossierHeader
        eyebrow="Facturation et paiements"
        title={title}
        description={description}
        status="À compléter"
        tone="info"
        context={<SchoolAdminBreadcrumb items={[{ key: 'finance', label: 'Finance' }, { key: operationKey, label: actionLabel }]} />}
      >
        <button className={styles.close} type="button" onClick={onClose} disabled={submitting} aria-label="Fermer"><X size={18} /></button>
      </SchoolAdminDossierHeader>
      <div className={styles.drawerBody}>
        <SchoolAdminSituationSummary
          summary={description || actionLabel}
          reason="Vous avez ouvert cette fenêtre pour effectuer une action financière précise sans quitter le dossier en cours."
          consequence="Après confirmation, les montants, statuts et historiques concernés seront mis à jour automatiquement."
          tone="info"
        />
        <div className={styles.formGrid}>
          {fields.map((field) => {
            const fieldLabel = field.key === 'reason' ? 'Pourquoi cette action est-elle nécessaire ?' : field.label
            return <div className={styles.field} data-wide={field.wide || undefined} key={field.key}>
            <label htmlFor={`finance-${field.key}`}>{fieldLabel}{field.required ? ' *' : ''}</label>
            {field.type === 'textarea' ? <textarea id={`finance-${field.key}`} value={values[field.key] || ''} placeholder={field.placeholder} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}/>
              : field.type === 'select' ? <select id={`finance-${field.key}`} value={values[field.key] || ''} onChange={(event: ChangeEvent<HTMLSelectElement>) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}><option value="">Choisir…</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                : <input id={`finance-${field.key}`} type={field.type === 'number' ? 'text' : field.type || 'text'} inputMode={field.type === 'number' ? 'decimal' : undefined} value={values[field.key] || ''} placeholder={field.placeholder} onChange={(event: ChangeEvent<HTMLInputElement>) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}/>}</div>
          })}
        </div>
        <SchoolAdminImpactPreview items={[
          { key: 'record', label: 'Le dossier financier concerné sera mis à jour' },
          { key: 'history', label: 'L’action et son auteur resteront dans l’historique' },
          { key: 'refresh', label: 'Les montants et indicateurs de la page seront actualisés' },
        ]} />
        {error ? <SchoolAdminErrorState detail={error} reference="FIN-ACTION" /> : null}
      </div>
      <SchoolAdminActionDock
        note="Vérifiez les montants et le motif avant de confirmer."
        secondary={[{ key: 'cancel', label: 'Annuler', onClick: onClose, disabled: submitting }]}
        primary={{ label: actionLabel, onClick: submit, disabled: submitting, busy: submitting }}
      />
    </section>
  </CustomerOverlaySurface>
}

"use client"

import { useState } from 'react'
import { ArrowLeft, CheckCircle2, FileText, MessageSquare, Save, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import styles from '../../design-system/marketplace.module.css'
import { Button, Card, PageHeader, StatusChip } from '../../design-system/ui'

type RequestRow = Record<string, unknown>
type FamilyRow = Record<string, unknown>

type Envelope<T> = { data: T }

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
  })
  const payload = await response.json() as Envelope<T> | { error?: { message?: string } }
  if (!response.ok || !('data' in payload)) throw new Error('error' in payload ? payload.error?.message || 'Action impossible.' : 'Action impossible.')
  return payload.data
}

const value = (row: RequestRow | FamilyRow | null | undefined, key: string) => row?.[key] === null || row?.[key] === undefined ? '—' : String(row[key])

export function FamilyRequestDossier({ item, family }: { item: RequestRow | null; family: FamilyRow | null }) {
  const currentStatus = value(item, 'status')
  const [status, setStatus] = useState(['qualified', 'proposal_ready', 'declined'].includes(currentStatus) ? currentStatus : 'qualified')
  const [notes, setNotes] = useState(value(item, 'qualification_notes') === '—' ? '' : value(item, 'qualification_notes'))
  const [nextAction, setNextAction] = useState(value(item, 'next_action') === '—' ? '' : value(item, 'next_action'))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  if (!item) {
    return <div><PageHeader eyebrow="FAMILY REQUEST" title="Demande introuvable" description="Le dossier demandé n’existe plus ou n’est pas accessible." /><Card><div className={styles.noticeDanger}>Aucune demande famille correspondante.</div></Card></div>
  }

  async function saveQualification() {
    setBusy(true)
    setError(null)
    try {
      await request(`/api/angelcare-marketplace/admin/family-requests/${value(item, 'id')}/qualify`, {
        method: 'POST',
        body: JSON.stringify({ status, notes, nextAction }),
      })
      setNotice('Qualification enregistrée dans le dossier.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Qualification impossible.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="FAMILY REQUEST DOSSIER"
        title={value(item, 'public_reference')}
        description={value(item, 'next_action') === '—' ? 'Dossier de demande famille.' : value(item, 'next_action')}
        breadcrumbs={<Link href="/angelcare-marketplace/admin/family-requests">← Retour aux demandes familles</Link>}
        actions={<Link className={styles.buttonSecondary} href={`/angelcare-marketplace/admin/customers?query=${encodeURIComponent(value(family, 'email') === '—' ? value(family, 'display_name') : value(family, 'email'))}`}>Ouvrir Customer Command</Link>}
      />

      {error ? <div className={styles.noticeDanger} style={{ marginBottom: 14 }}>{error}</div> : null}
      {notice ? <div className={styles.noticeSuccess} style={{ marginBottom: 14 }}><CheckCircle2 size={16} /> {notice}</div> : null}

      <div className={styles.gridTwo}>
        <div style={{ display: 'grid', gap: 16 }}>
          <Card title="Besoin commercial" subtitle="Les données opérationnelles de la demande, présentées comme un vrai dossier.">
            <div className={styles.detailMeta}>
              <div><span className={styles.metricLabel}>Service</span><strong>{value(item, 'service_family')}</strong></div>
              <div><span className={styles.metricLabel}>Ville</span><strong>{value(item, 'city')}</strong></div>
              <div><span className={styles.metricLabel}>Début souhaité</span><strong>{value(item, 'requested_start_date')}</strong></div>
            </div>
            <div className={styles.list} style={{ marginTop: 16 }}>
              <div className={styles.listItem}><FileText size={16} /><div className={styles.listItemContent}><strong>Priorités</strong><p>{Array.isArray(item.priorities) ? item.priorities.map(String).join(' · ') : '—'}</p></div></div>
              <div className={styles.listItem}><MessageSquare size={16} /><div className={styles.listItemContent}><strong>Contexte</strong><p>{value(item, 'location_notes')}</p></div></div>
            </div>
          </Card>

          <Card title="Dossier famille" subtitle="Le lien commercial vers le client ne doit jamais être perdu.">
            <div className={styles.detailMeta}>
              <div><span className={styles.metricLabel}>Famille</span><strong>{value(family, 'public_reference')}</strong></div>
              <div><span className={styles.metricLabel}>Nom</span><strong>{value(family, 'display_name')}</strong></div>
              <div><span className={styles.metricLabel}>Email</span><strong>{value(family, 'email')}</strong></div>
            </div>
            <div className={styles.notice} style={{ marginTop: 14 }}><ShieldCheck size={16} /><span>Le dossier complet du client est disponible dans Customer Command pour les coordonnées, adresses, enfants, paiements et commandes.</span></div>
          </Card>
        </div>

        <Card title="Décision opérateur" subtitle="Une demande n’est pas une ligne morte : elle doit être qualifiée et continuer vers une prochaine action.">
          <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Statut</label><select className={styles.selectField} value={status} onChange={(event) => setStatus(event.target.value)}><option value="qualified">Qualifiée</option><option value="proposal_ready">Proposition à préparer</option><option value="declined">Refusée</option></select></div>
          <div className={styles.fieldGroup} style={{ marginTop: 12 }}><label className={styles.fieldLabel}>Notes</label><textarea className={styles.textArea} value={notes} onChange={(event) => setNotes(event.target.value)} /></div>
          <div className={styles.fieldGroup} style={{ marginTop: 12 }}><label className={styles.fieldLabel}>Prochaine action</label><textarea className={styles.textArea} value={nextAction} onChange={(event) => setNextAction(event.target.value)} /></div>
          <div className={styles.pageActions} style={{ justifyContent: 'flex-start', marginTop: 14 }}><Button disabled={busy} onClick={() => void saveQualification()}><Save size={15} /> Enregistrer la décision</Button><StatusChip status={status} /></div>
        </Card>
      </div>
    </div>
  )
}

'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */
import { FormEvent, useMemo, useState } from 'react'
import { Check, ChevronDown, KeyRound, MoreHorizontal, ShieldCheck, UserCheck, XCircle } from 'lucide-react'
import type { SanilaAdminRow } from '../types'
import styles from '../sanila-admin.module.css'

function value(row: SanilaAdminRow, key: string) { return row[key] == null ? '' : String(row[key]) }

export function SanilaDemoCommand({ config, grants, inquiries }: { config: SanilaAdminRow | null; grants: SanilaAdminRow[]; inquiries: SanilaAdminRow[] }) {
  const [rows, setRows] = useState(grants)
  const [message, setMessage] = useState('')
  const [pin, setPin] = useState<string | null>(null)
  const demoInquiries = useMemo(() => inquiries.filter((row) => value(row, 'source_route').endsWith('/demonstration')), [inquiries])
  const [inquiryId, setInquiryId] = useState(value(demoInquiries[0] || {}, 'id'))
  const [policyType, setPolicyType] = useState('single_use')

  async function act(payload: Record<string, unknown>) {
    setMessage('Action en cours…'); setPin(null)
    const response = await fetch('/api/angelcare-marketplace/admin/sanila-demo', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
    const result = await response.json()
    if (!response.ok || !result.ok) { setMessage(result.error || 'Action impossible.'); return }
    if (result.pin) setPin(result.pin)
    if (result.grant) setRows((current) => [result.grant, ...current.filter((row) => value(row, 'id') !== String(result.grant.id))])
    setMessage('PASS · Dossier Demo mis à jour.')
  }

  function createGrant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fd = new FormData(event.currentTarget)
    const absoluteValue = String(fd.get('absoluteExpiresAt') || '')
    void act({ action: 'create_grant', publicInquiryId: inquiryId, policyType, maxUses: fd.get('maxUses'), activationDurationMinutes: fd.get('activationDurationMinutes'), absoluteExpiresAt: absoluteValue ? new Date(absoluteValue).toISOString() : null, notes: fd.get('notes') })
  }

  return <div className={styles.root}>
    {message ? <div className={styles.notice}>{message}</div> : null}
    {pin ? <div className={styles.notice}><KeyRound size={15}/> PIN affiché une seule fois · <strong>{pin}</strong></div> : null}
    <div className={styles.grid3}>
      <article className={styles.card}><span>MASTER DEMO</span><strong className={config ? styles.good : styles.warn}>{config ? 'ONLINE' : 'ABSENT'}</strong><small className={styles.muted}>{config ? `Seed ${value(config,'seed_version')} · ${value(config,'safety_status')}` : 'Configuration non provisionnée'}</small></article>
      <article className={styles.card}><span>DEMANDES DEMO</span><strong>{demoInquiries.length}</strong><small className={styles.muted}>Source SANILA /demonstration uniquement</small></article>
      <article className={styles.card}><span>GRANTS</span><strong>{rows.length}</strong><small className={styles.muted}>{rows.filter((row)=>value(row,'approval_state')==='approved').length} approuvés</small></article>
    </div>

    <section className={styles.panel}>
      <div className={styles.sectionHead}><div><span>ÉMISSION CONTRÔLÉE</span><h2>Créer un accès depuis une demande SANILA.</h2></div><ShieldCheck size={20}/></div>
      <form onSubmit={createGrant} className={styles.grid3}>
        <label>Demande<select required value={inquiryId} onChange={(event)=>setInquiryId(event.target.value)}><option value="">Sélectionner…</option>{demoInquiries.map((row)=><option key={value(row,'id')} value={value(row,'id')}>{value(row,'public_reference')} · {value(row,'full_name')} · {value(row,'organization')}</option>)}</select></label>
        <label>Politique<select value={policyType} onChange={(event)=>setPolicyType(event.target.value)}><option value="single_use">Usage unique</option><option value="n_uses">N usages</option><option value="unlimited">Illimité</option></select></label>
        {policyType==='n_uses'?<label>Usages<input name="maxUses" type="number" min="1" max="100" defaultValue="3"/></label>:<div/>}
        <label>Durée après activation<input name="activationDurationMinutes" type="number" min="1" placeholder="720 min"/></label>
        <label>Expiration fixe<input name="absoluteExpiresAt" type="datetime-local"/></label>
        <label>Notes<input name="notes" maxLength={1000}/></label>
        <div><button className={styles.primaryButton} disabled={!config||!inquiryId} type="submit"><UserCheck size={14}/> Créer le grant</button></div>
      </form>
    </section>

    <section className={styles.panel}>
      <div className={styles.sectionHead}><div><span>GRANTS & APPROBATIONS</span><h2>Cycle de vie complet.</h2></div><span className={styles.tag}>{rows.length} dossiers</span></div>
      <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Prospect</th><th>État</th><th>Politique</th><th>Usage</th><th>PIN</th><th>Expiration</th><th>Actions</th></tr></thead><tbody>{rows.map((row)=><tr key={value(row,'id')}><td><b>{value(row,'requester_name')||'—'}</b><br/><span className={styles.muted}>{value(row,'requester_email')||'—'}</span></td><td><span className={styles.tag} data-tone={value(row,'approval_state')==='approved'?undefined:'warn'}>{value(row,'approval_state')}</span><br/><small>{value(row,'status')}</small></td><td>{value(row,'policy_type')}</td><td>{value(row,'used_count')||'0'} / {value(row,'max_uses')||'∞'}</td><td>••••{value(row,'pin_last4')||'—'}</td><td>{value(row,'effective_expires_at')||value(row,'absolute_expires_at')||'—'}</td><td><div className={styles.actions}><button onClick={()=>void act({action:'approve',grantId:value(row,'id')})}><Check size={12}/> Approuver</button><button onClick={()=>void act({action:'needs_info',grantId:value(row,'id')})}>Info requise</button><details><summary><MoreHorizontal size={14}/></summary><div><button onClick={()=>void act({action:'under_review',grantId:value(row,'id')})}>Sous revue</button><button onClick={()=>void act({action:'suspend',grantId:value(row,'id')})}>Suspendre</button><button onClick={()=>void act({action:'reactivate',grantId:value(row,'id')})}>Réactiver</button><button onClick={()=>{const expiry=window.prompt('Nouvelle expiration ISO');if(expiry)void act({action:'extend',grantId:value(row,'id'),absoluteExpiresAt:expiry})}}>Prolonger</button><button onClick={()=>{if(window.confirm('Régénérer le PIN et invalider les sessions ?'))void act({action:'regenerate_pin',grantId:value(row,'id')})}}><KeyRound size={12}/> Régénérer PIN</button><button onClick={()=>void act({action:'reject',grantId:value(row,'id')})}><XCircle size={12}/> Rejeter</button><button onClick={()=>{if(window.confirm('Révoquer définitivement ce grant ?'))void act({action:'revoke',grantId:value(row,'id')})}}>Révoquer</button></div></details></div></td></tr>)}</tbody></table></div>
    </section>
  </div>
}

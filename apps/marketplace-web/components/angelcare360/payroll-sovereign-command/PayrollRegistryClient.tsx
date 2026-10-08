'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { PayrollResult } from '@/types/angelcare360/payroll-sovereign-control'
import { formatMoneyMinor, StatusPill, toneFor } from './PayrollCommandShell'
import styles from './PayrollCommand.module.css'

const BASE = '/angelcare-360-command-center/paie'

export function PayrollRegistryClient({ rows }: { rows: PayrollResult[] }) {
  const [query, setQuery] = useState('')
  const [state, setState] = useState('all')
  const filtered = useMemo(() => rows.filter(row => {
    const haystack = `${row.staffName} ${row.staffCode} ${row.status}`.toLowerCase()
    return (!query || haystack.includes(query.toLowerCase())) && (state === 'all' || row.status === state)
  }), [rows, query, state])

  return <>
    <div className={styles.toolbar}>
      <label className={styles.search}><span>⌕</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Collaborateur, matricule, état…" /></label>
      <select className={styles.selectCompact} value={state} onChange={event => setState(event.target.value)}><option value="all">Tous les états</option>{Array.from(new Set(rows.map(row => row.status))).map(value => <option key={value} value={value}>{value}</option>)}</select>
      <span className={styles.resultCount}>{filtered.length} dossier(s)</span>
    </div>
    <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Personnel</th><th>Base</th><th>Brut</th><th>Retenues</th><th>Remb.</th><th>Net</th><th>État</th><th></th></tr></thead><tbody>{filtered.map(row => <tr key={row.id}><td><div className={styles.primary}>{row.staffName}</div><div className={styles.secondary}>{row.staffCode}</div></td><td className={styles.number}>{formatMoneyMinor(row.baseMinor)}</td><td className={styles.number}>{formatMoneyMinor(row.grossMinor)}</td><td className={styles.number}>{formatMoneyMinor(row.employeeContributionsMinor + row.deductionsMinor)}</td><td className={styles.number}>{formatMoneyMinor(row.reimbursementsMinor)}</td><td className={styles.numberStrong}>{formatMoneyMinor(row.netPayableMinor)}</td><td><StatusPill value={row.status} tone={toneFor(row.status)} /></td><td><Link className={styles.link} href={`${BASE}/dossiers/${row.id}`}>Ouvrir →</Link></td></tr>)}</tbody></table></div>
    <div className={styles.mobileCards}>{filtered.map(row => <Link href={`${BASE}/dossiers/${row.id}`} className={styles.mobilePayrollCard} key={row.id}><div><span>{row.staffCode}</span><strong>{row.staffName}</strong><small>Net payable</small></div><div><b>{formatMoneyMinor(row.netPayableMinor)}</b><StatusPill value={row.status} tone={toneFor(row.status)} /></div></Link>)}</div>
  </>
}

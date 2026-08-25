'use client'

import { Download, History } from 'lucide-react'
import type { CatalogLocale } from '../../catalog-discovery/types'
import type { WalletLedgerEntry } from '../types'
import { WALLET_BUCKET_COPY } from '../content'
import { CustomerPortalNavigation } from './CustomerPortalNavigation'
import styles from '../customer-commerce.module.css'

function csvCell(value: unknown) {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replaceAll('"','""')}"` : text
}

export function WalletTransactions({entries,locale}:{entries:WalletLedgerEntry[];locale:CatalogLocale}){
  function exportCsv(){
    const header=['date','reference','description','reason_code','bucket','direction','amount','balance_after']
    const rows=entries.map((entry)=>[entry.effective_at,entry.public_reference,entry.description,entry.reason_code,entry.bucket_kind,entry.direction,entry.amount,entry.balance_after])
    const csv=[header,...rows].map((row)=>row.map(csvCell).join(',')).join('\n')
    const blob=new Blob([`\uFEFF${csv}`],{type:'text/csv;charset=utf-8'})
    const url=URL.createObjectURL(blob)
    const anchor=document.createElement('a')
    anchor.href=url
    anchor.download=`ac-wallet-statement-${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(anchor);anchor.click();anchor.remove();URL.revokeObjectURL(url)
  }
  return <main className={styles.root} dir={locale==='ar'?'rtl':'ltr'}><div className={styles.portalShell}><section className={styles.portalHero}><div><span className={styles.eyebrow}>AC WALLET · IMMUTABLE LEDGER</span><h1>{locale==='fr'?'Relevé AC Wallet':locale==='ar'?'كشف محفظة AC':'AC Wallet statement'}</h1><p>{locale==='fr'?'Chaque crédit, débit, réservation, libération et remboursement possède une source et une référence.':locale==='ar'?'لكل إضافة أو خصم أو حجز أو تحرير أو استرداد مصدر ومرجع.':'Every credit, debit, reservation, release and refund has a source and reference.'}</p></div><aside className={styles.walletMini}><History/><strong>{entries.length}</strong><span>{locale==='fr'?'mouvements chargés':locale==='ar'?'معاملة محملة':'entries loaded'}</span></aside></section><CustomerPortalNavigation locale={locale}/><section className={styles.panel}><header><div><span className={styles.eyebrow}>TRANSACTION STATEMENT</span><h2>{locale==='fr'?'Historique financier':locale==='ar'?'السجل المالي':'Financial history'}</h2></div><button type="button" className={styles.secondaryButton} onClick={exportCsv} disabled={!entries.length}><Download size={16}/>{locale==='fr'?'Exporter CSV':locale==='ar'?'تصدير CSV':'Export CSV'}</button></header><div className={styles.transactionTable}><div className={styles.transactionHead}><span>Date</span><span>Description</span><span>Compartiment</span><span>Mouvement</span><span>Solde</span></div>{entries.map((e)=><div className={styles.transactionRow} key={e.id}><time>{new Date(e.effective_at).toLocaleString(locale)}</time><div><b>{e.description}</b><small>{e.public_reference} · {e.reason_code}</small></div><span>{WALLET_BUCKET_COPY[e.bucket_kind][locale]}</span><strong data-direction={e.direction}>{e.direction==='credit'?'+':'−'}{e.amount.toLocaleString(locale)} AC</strong><span>{e.balance_after.toLocaleString(locale)} AC</span></div>)}{!entries.length?<div className={styles.emptyState}>{locale==='fr'?'Aucun mouvement.':locale==='ar'?'لا توجد معاملات.':'No transaction.'}</div>:null}</div></section></div></main>
}

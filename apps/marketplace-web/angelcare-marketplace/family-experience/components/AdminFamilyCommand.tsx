import Link from 'next/link'
import type { FamilyAccount, FamilyQuoteRequest } from '../types'
import styles from '../family.module.css'

export function AdminFamilyCommand({ families, requests }: { families: FamilyAccount[]; requests: FamilyQuoteRequest[] }) {
  const open = requests.filter((item) => ['submitted', 'qualified', 'proposal_ready'].includes(item.status))
  return (
    <div className={styles.dashboard}>
      <section className={styles.welcome}>
        <div><h1>Family Command</h1><p>Qualification, propriété, prochaine action et continuité du dossier.</p></div>
        <div className={styles.identity}>{families.length} familles · {open.length} demandes actives</div>
      </section>

      <section className={styles.actions}>
        <Link className={styles.primary} href="/angelcare-marketplace/admin/customers">Ouvrir Customer Command</Link>
        <Link className={styles.secondary} href="/angelcare-marketplace/admin/customers?create=family">Créer une famille</Link>
      </section>

      <section className={styles.metrics}>
        <article className={styles.metric}><span>Dossiers familles</span><strong>{families.length}</strong><p>Dossiers persistants visibles et modifiables dans Customer Command.</p></article>
        <article className={styles.metric}><span>À qualifier</span><strong>{requests.filter(item => item.status === 'submitted').length}</strong><p>Demandes sans décision initiale.</p></article>
        <article className={styles.metric}><span>Propositions à préparer</span><strong>{requests.filter(item => item.status === 'qualified').length}</strong><p>Besoins qualifiés.</p></article>
        <article className={styles.metric}><span>Prêtes à présenter</span><strong>{requests.filter(item => item.status === 'proposal_ready').length}</strong><p>Prochaine action commerciale.</p></article>
      </section>

      <section className={styles.dashboardGrid}>
        <div className={styles.panel}>
          <header className={styles.panelHeader}><div><h2>Familles</h2><p>Le dossier opérateur complet est ouvert dans Customer Command.</p></div></header>
          <div className={styles.tableWrap} style={{ border: 0, borderRadius: 0 }}>
            <table className={styles.table}>
              <thead><tr><th>Famille</th><th>Ville</th><th>Onboarding</th><th>Consentement</th><th>Statut</th><th>Contrôle</th></tr></thead>
              <tbody>
                {families.slice(0, 200).map((family) => (
                  <tr key={family.id}>
                    <td><strong>{family.display_name}</strong><div className={styles.listMeta}><span>{family.public_reference}</span><span>{family.email || 'Sans email'}</span></div></td>
                    <td>{family.city || '—'}</td>
                    <td>{family.onboarding_status}</td>
                    <td>{family.consent_status}</td>
                    <td><span className={styles.status} data-status={family.status}>{family.status}</span></td>
                    <td><Link href={`/angelcare-marketplace/admin/customers?query=${encodeURIComponent(family.email || family.display_name)}`}>Ouvrir</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.panel}>
          <header className={styles.panelHeader}><div><h2>Demandes actives</h2><p>Qualification et continuité commerciale.</p></div></header>
          <div className={styles.list}>
            {open.map(item => (
              <div className={styles.listRow} key={item.id}>
                <div><div className={styles.listTitle}>{item.public_reference}</div><div className={styles.listMeta}><span>{item.service_family}</span><span>{item.city}</span></div></div>
                <Link href={`/angelcare-marketplace/admin/family-requests/${item.id}`}>Ouvrir</Link>
              </div>
            ))}
            {!open.length ? <div className={styles.empty}>Aucune demande active.</div> : null}
          </div>
        </div>
      </section>
    </div>
  )
}

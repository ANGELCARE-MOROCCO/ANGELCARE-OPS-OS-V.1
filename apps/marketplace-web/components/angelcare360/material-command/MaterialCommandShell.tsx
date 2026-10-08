import Link from 'next/link'
import styles from './MaterialCommand.module.css'
import type { MaterialIntegrityStatus } from '@/types/angelcare360/material-control'

const NAV = [
  ['Commandement','/angelcare-360-command-center/inventaire'],
  ['Catégories','/angelcare-360-command-center/inventaire/categories'],
  ['Articles','/angelcare-360-command-center/inventaire/articles'],
  ['Mouvements','/angelcare-360-command-center/inventaire/mouvements'],
  ['Stock critique','/angelcare-360-command-center/inventaire/stock-bas'],
  ['Responsables','/angelcare-360-command-center/inventaire/responsables'],
  ['Audit','/angelcare-360-command-center/inventaire/audit'],
] as const

export function MaterialCommandShell({
  schoolName, academicYearLabel, integrity, activePath, children,
}: {
  schoolName: string
  academicYearLabel: string | null
  integrity: MaterialIntegrityStatus
  activePath: string
  children: React.ReactNode
}) {
  return <main className={styles.page}>
    <header className={styles.hero}>
      <div>
        <p className={styles.kicker}>SANILA · MATERIAL & ASSET CONTROL</p>
        <h1 className={styles.title}>Inventaire<span>Matériel · Stock · Mouvements · Responsabilité · Disponibilité · Traçabilité</span></h1>
        <p className={styles.lead}>Le poste de contrôle matériel de l’établissement: savoir ce qui existe, ce qui est disponible, ce qui devient critique, qui en répond et quelle action a réellement modifié le stock.</p>
        <div className={styles.contextRail}><span>{schoolName}</span><span>{academicYearLabel || 'Année scolaire active non définie'}</span><span>Autorité: inventaire établissement</span></div>
      </div>
      <aside className={styles.instrument} aria-label="Intégrité transactionnelle inventaire">
        <div className={styles.instrumentHead}><span className={styles.instrumentLabel}>Intégrité stock</span><span className={styles.integrity} data-ready={String(integrity.ready)}><i />{integrity.ready ? 'AUTORITÉ ACTIVE' : 'MIGRATION REQUISE'}</span></div>
        <div className={styles.instrumentValue}><strong>{integrity.ready ? '01' : '—'}</strong><span>{integrity.ready ? `moteur atomique · ${integrity.version || 'v1'}` : 'mouvements verrouillés jusqu’à réconciliation SQL'}</span></div>
        <div className={styles.instrumentRows}><div className={styles.instrumentRow}><span>Stock négatif</span><b>{integrity.ready ? 'bloqué' : 'non garanti'}</b></div><div className={styles.instrumentRow}><span>Journal + stock</span><b>{integrity.ready ? 'atomiques' : 'verrouillés'}</b></div><div className={styles.instrumentRow}><span>Transfert</span><b>journalisé, stock global neutre</b></div></div>
      </aside>
    </header>
    <nav className={styles.nav} aria-label="Navigation Inventaire">
      {NAV.map(([label,href]) => <Link key={href} href={href} className={styles.navLink} data-active={String(activePath === href || (href !== NAV[0][1] && activePath.startsWith(href)))}>{label}</Link>)}
    </nav>
    {children}
  </main>
}

export function SectionHero({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: React.ReactNode }) {
  return <header className={styles.sectionHero}><div><p className={styles.eyebrow}>{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>{actions ? <div className={styles.actions}>{actions}</div> : null}</header>
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return <div className={styles.empty}><div><strong>{title}</strong><p>{body}</p></div></div>
}

export function formatMad(value: number) {
  return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 2 }).format(value)
}

export function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('fr-MA', { dateStyle: 'medium', timeStyle: value.includes('T') ? 'short' : undefined }).format(date)
}

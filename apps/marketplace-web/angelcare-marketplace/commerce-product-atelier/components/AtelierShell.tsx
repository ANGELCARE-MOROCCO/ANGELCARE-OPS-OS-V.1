'use client'
import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {Boxes,Factory,FileSpreadsheet,Globe2,PackagePlus,Search} from 'lucide-react'
import styles from '../commerce-product-atelier.module.css'

const nav=[
  ['/angelcare-marketplace/admin/commerce-factory','Overview'],
  ['/angelcare-marketplace/admin/commerce-factory/products','Products'],
  ['/angelcare-marketplace/admin/commerce-factory/doctrines','Doctrines'],
  ['/angelcare-marketplace/admin/commerce-factory/categories','Categories'],
  ['/angelcare-marketplace/admin/commerce-factory/collections','Collections'],
  ['/angelcare-marketplace/admin/commerce-factory/pricing','Pricing'],
  ['/angelcare-marketplace/admin/commerce-factory/availability','Availability'],
  ['/angelcare-marketplace/admin/commerce-factory/imports','Imports'],
] as const
export function AtelierShell({children}:{children:React.ReactNode}){const path=usePathname();return <div className={styles.shell}><header className={styles.areaHeader}><div><div className={styles.areaKicker}>03 · Commerce & Offer Factory</div><h1>Commerce Product Atelier</h1><p>Doctrine-driven PIM · pricing · category architecture · availability · publication.</p></div><div className={styles.areaTools}><Link className={styles.buttonSecondary} href="/angelcare-marketplace/admin/search"><Search size={14}/>Search</Link><Link className={styles.buttonSecondary} href="/angelcare-marketplace/admin/bulk-operations"><Boxes size={14}/>Bulk Ops</Link><Link className={styles.buttonSecondary} href="/angelcare-marketplace/admin/commerce-factory/imports"><FileSpreadsheet size={14}/>Import</Link><Link className={styles.button} href="/angelcare-marketplace/admin/commerce-factory/products?create=1"><PackagePlus size={14}/>Create offer</Link><Link className={styles.buttonSecondary} href="/angelcare-marketplace/fr/marketplace" target="_blank"><Globe2 size={14}/>Storefront</Link></div></header><nav className={styles.nav} aria-label="Commerce & Offer Factory">{nav.map(([href,label])=>{const active=path===href||(href!=='/angelcare-marketplace/admin/commerce-factory'&&path.startsWith(`${href}/`));return <Link key={href} href={href} data-active={active}>{label}</Link>})}</nav>{children}</div>}

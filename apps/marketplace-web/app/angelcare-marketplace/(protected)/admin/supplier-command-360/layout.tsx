import Link from 'next/link'
import type {ReactNode} from 'react'
import styles from './supplier-navigation.module.css'

/** Additive navigation: preserves ALL existing Supplier Command child routes. */
export default function SupplierOperationsShell({children}:{children:ReactNode}){
 return <>
  <nav className={styles.routeNav} aria-label="Supplier Operations Studio sections">
   <span className={styles.brand}>ANGELCARE <strong>SUPPLY OPERATIONS</strong></span>
   <div className={styles.links}>
    <Link href="/angelcare-marketplace/admin/supplier-command-360">01–10 · Supplier Studio</Link>
    <Link href="/angelcare-marketplace/admin/supplier-command-360/operations">11–16 · Operations MAX</Link>
    <Link href="/angelcare-marketplace/admin/supplier-command-360/product-launch">Product Launch</Link>
    <Link href="/angelcare-marketplace/admin/supplier-command-360/trilingual-import">Trilingual Import</Link>
   </div>
  </nav>
  {children}
 </>
}

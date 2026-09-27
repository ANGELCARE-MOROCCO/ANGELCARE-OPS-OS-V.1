import Link from 'next/link'
import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { adminWalletPolicies } from '@/angelcare-marketplace/customer-commerce/admin-repository'
import { WalletPolicyStudio } from '@/angelcare-marketplace/customer-commerce/components/WalletPolicyStudio'
import styles from '@/angelcare-marketplace/customer-commerce/customer-commerce.module.css'
export const dynamic='force-dynamic'
export default async function Page(){
  await requireMarketplacePageContext('marketplace.finance.price_books.manage')
  return <>
    <WalletPolicyStudio initialPolicies={await adminWalletPolicies()}/>
    <section className={styles.adminPanel} style={{marginTop:24}}>
      <header><div><span className={styles.eyebrow}>IMPORT COMMAND</span><h2>Affectations Wallet en masse</h2><p>Les imports financiers sont centralisés dans le workspace Imports & ingestion afin de garder le dry-run, l’impact et la confirmation dans une seule salle de contrôle.</p></div><Link className={styles.primaryButton} href="/angelcare-marketplace/admin/imports/wallet">Ouvrir Wallet Import</Link></header>
    </section>
  </>
}

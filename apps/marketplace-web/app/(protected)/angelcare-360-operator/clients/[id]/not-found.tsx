import Link from 'next/link'
import { SearchX } from 'lucide-react'
import styles from '@/components/angelcare360/operator/customer-dossier/CustomerRelationshipCommandRoom.module.css'

export default function CustomerDossierNotFound() {
  return (
    <main className={styles.customerNotFound}>
      <div>
        <span><SearchX size={28} /></span>
        <p>AngelCare 360 Operator · Customer Relationship Command Room</p>
        <h1>Dossier client introuvable</h1>
        <strong>Le client demandé n’existe pas, n’est plus accessible ou ne relève pas du périmètre autorisé.</strong>
        <div>
          <Link href="/angelcare-360-operator/clients">Retour au portefeuille clients</Link>
          <Link href="/angelcare-360-operator/growth">Ouvrir Clients & Croissance</Link>
        </div>
      </div>
    </main>
  )
}

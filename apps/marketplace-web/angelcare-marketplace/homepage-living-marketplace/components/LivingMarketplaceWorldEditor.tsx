'use client'

import { BadgeCheck, Layers3, LockKeyhole, Route, ShieldCheck, Sparkles } from 'lucide-react'
import { LIVING_MARKETPLACE_REFERENCE_IMAGE, LIVING_MARKETPLACE_WORLD_ID } from '../world'
import styles from './living-marketplace-editor.module.css'

export function LivingMarketplaceWorldEditor() {
  return (
    <section className={styles.shell} data-ac-homepage-world={LIVING_MARKETPLACE_WORLD_ID}>
      <div className={styles.preview}>
        <img src={LIVING_MARKETPLACE_REFERENCE_IMAGE} alt="Référence visuelle AngelCare Living Marketplace — Hyper-Commerce 02" />
        <div className={styles.previewShade}>
          <span>SOURCE-OWNED WORLD</span>
          <strong>Living Marketplace · Hyper-Commerce 02</strong>
        </div>
      </div>
      <div className={styles.body}>
        <div className={styles.badge}><ShieldCheck size={16}/> MONDE HOMEPAGE VERROUILLÉ</div>
        <h2>Une homepage vivante, dense et complète — sans reconstruction manuelle.</h2>
        <p>Le Studio choisit et publie ce monde. La composition visuelle reste hardcodée dans le source; les offres, prix, disponibilités, médias catalogue, catégories, Academy, B2B, campagnes et preuves viennent des autorités Marketplace réelles.</p>
        <div className={styles.grid}>
          <article><Layers3/><strong>Body complet</strong><span>Hero, univers, promos, rails commerce, services, Academy, B2B, collections, confiance, FAQ.</span></article>
          <article><Route/><strong>Conversion canonique</strong><span>Produit → basket, service → booking, formation → enrollment, B2B/audit → quotation, SaaS → subscription.</span></article>
          <article><BadgeCheck/><strong>Truth firewall</strong><span>Aucun faux prix, stock, avis, remise, urgence ou partenaire.</span></article>
          <article><LockKeyhole/><strong>Shell préservé</strong><span>Header, navigation horizontale et footer globaux restent hors du monde.</span></article>
        </div>
        <div className={styles.lock}><Sparkles size={16}/><span>Ce bloc est volontairement verrouillé: changez de monde dans la bibliothèque plutôt que de dériver la composition section par section.</span></div>
      </div>
    </section>
  )
}

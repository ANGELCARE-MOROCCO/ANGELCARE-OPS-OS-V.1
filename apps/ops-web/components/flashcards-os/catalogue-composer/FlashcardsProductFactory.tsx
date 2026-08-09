import Link from 'next/link'
import { ArrowRight, BookOpenCheck, Boxes, BrainCircuit, LibraryBig, PackagePlus, ShieldCheck, Sparkles } from 'lucide-react'
import type { CatalogueComposerOptions } from '@/lib/flashcards-os/catalogue-composer/types'
import styles from './catalogue-composer.module.css'
import { sourceLabel } from '@/lib/flashcards-os/catalogue-composer/presentation'

export default function FlashcardsProductFactory({options}:{options:CatalogueComposerOptions}){
  const active=options.collections.filter((item)=>item.status!=='archived'&&item.commercialStatus==='active')
  const priced=options.collections.filter((item)=>item.priceDh!=null&&item.priceDh>0)
  return <div className={styles.page}>
    <section className={styles.factoryHero}>
      <div className={styles.factoryCopy}><div className={styles.kicker}><Sparkles size={16}/> FLASHCARDS PRODUCT FACTORY</div><h1>Partir du catalogue réel. Composer. Comparer. Publier.</h1><p>Les catégories et collections enregistrées sont la seule source de vérité. OpenRouter Free reçoit uniquement les collections locales éligibles, puis propose des packages ou programmes détaillés sans inventer aucun produit.</p><div className={styles.trustStrip}><span><LibraryBig size={15}/>{options.collections.length} collections locales</span><span><Boxes size={15}/>{options.categories.length} catégories</span><span><ShieldCheck size={15}/>{sourceLabel(options.sourceMode)}</span></div></div>
      <aside className={styles.sourceSeal}><strong>LOCAL CATALOGUE ONLY</strong><span>Catégories → Collections → Composition AI → Validation humaine → Vitrine</span><small>Tavily absent. Prix calculés localement. Identifiants de collections obligatoires.</small></aside>
    </section>
    <section className={styles.primaryChoiceGrid}>
      <Link className={styles.primaryChoice} href="/flashcards-os/solutions/composer"><div className={styles.choiceIcon}><PackagePlus size={28}/></div><div><span>01 · PACKAGE & BUNDLE</span><h2>Composer un package vendable</h2><p>Définir client, âge, contexte, objectifs, budget et nombre maximum de collections. Recevoir jusqu’à 10 propositions réellement différentes avec détail des prix.</p><b>Ouvrir le Package Composer <ArrowRight size={16}/></b></div></Link>
      <Link className={styles.primaryChoice} href="/flashcards-os/solutions/learning-journeys/new"><div className={styles.choiceIcon}><BookOpenCheck size={28}/></div><div><span>02 · LEARNING PROGRAMME</span><h2>Créer un programme d’apprentissage</h2><p>Définir les cinq dimensions, la durée, les sessions et l’intensité. Chaque activité cite une collection locale exacte et son usage dans la séance.</p><b>Ouvrir le Programme Composer <ArrowRight size={16}/></b></div></Link>
    </section>
    <section className={styles.operatingTruth}>
      <div><span>COLLECTIONS COMMERCIALISABLES</span><strong>{active.length}</strong><small>Actives et tarifées</small></div>
      <div><span>PRIX DISPONIBLES</span><strong>{priced.length}/{options.collections.length}</strong><small>Base de calcul déterministe</small></div>
      <div><span>PROPOSITIONS PAR DEMANDE</span><strong>1–10</strong><small>Limite serveur stricte</small></div>
      <div><span>AUTORITÉ FINALE</span><strong>HUMAINE</strong><small>Sélection et publication</small></div>
    </section>
    <section className={styles.catalogueBand}><div><span>CATALOGUE SOURCE OF TRUTH</span><h2>Voir et administrer les collections qui alimentent le moteur</h2><p>Le moteur n’utilise ni Product Vault ni release de production comme prérequis. Les opérations avancées restent disponibles sans bloquer la composition commerciale.</p></div><div className={styles.bandActions}><Link href="/flashcards-os/product/collections"><LibraryBig size={15}/> Registre des collections</Link><Link href="/flashcards-os/solutions/b2c">Vitrine B2C</Link><Link href="/flashcards-os/solutions/b2b">Vitrine B2B</Link><Link href="/flashcards-os/solutions/advanced"><BrainCircuit size={15}/> Opérations avancées</Link></div></section>
  </div>
}

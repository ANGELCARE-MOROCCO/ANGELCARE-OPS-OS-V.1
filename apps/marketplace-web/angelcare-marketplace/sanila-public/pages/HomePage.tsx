import Image from 'next/image'
import Link from 'next/link'

import { getSanilaPublicPage, sanilaHref } from '../content'
import { SanilaIcon } from '../SanilaIcon'
import { ClosingStatement, DomainNavigation, EvidenceLedger, FragmentationModel, ProductSourcePanel, SectionHeading } from '../components/SanilaExperience'
import { ProductEvidenceMosaic, ProductOperatingConstellation, VisualSignalRail } from '../components/SanilaVisualSystems'
import { InteractiveDayStory, RoleSwitchboard } from '../components/SanilaInteractiveStories'
import styles from '../SanilaPublic.module.css'

export function HomePage() {
  const page = getSanilaPublicPage('accueil')!
  return (
    <>
      <section className={styles.homeHeroMaster}>
        <div className={styles.homeHeroMasterCopy}>
          <div className={styles.homeHeroMeta}><span>SANILA</span><i /><span>School Operating System</span></div>
          <h1>L’établissement fonctionne déjà comme un système.</h1>
          <p>SANILA relie direction, administration, pédagogie, finance, familles, personnel et opérations dans une architecture commune — sans effacer les responsabilités de chacun.</p>
          <div className={styles.homeHeroActions}>
            <Link href={sanilaHref('demonstration')}>Demander une démonstration <SanilaIcon name="arrow" size={15} /></Link>
            <Link href={sanilaHref('produit')}>Explorer l’architecture produit</Link>
            <Link href={sanilaHref('connexion')}>Accéder à SANILA</Link>
          </div>
          <div className={styles.homeHeroTrustLine}><span>Produit AngelCare</span><i /><span>France • Maroc • International</span><i /><span>Architecture par rôles</span></div>
        </div>
        <div className={styles.homeHeroMasterVisual}>
          <ProductSourcePanel page={getSanilaPublicPage('direction')!} title="Pilotage institutionnel — autorité produit" />
          <div className={styles.homeHeroFloatingPhoto}><Image src="/sanila/parent-login/sanila-parent-morocco-approved.webp" alt="Contexte familial marocain contemporain autour de SANILA" fill sizes="260px" priority /></div>
          <div className={styles.homeHeroFloatingSignal}><span>CONTINUITÉ</span><strong>Un dossier reste relié à l’action suivante.</strong><small>Direction → opération → famille</small></div>
        </div>
      </section>

      <VisualSignalRail items={[
        { icon: 'chart', label: 'Direction', detail: 'Lire les signaux et descendre dans leur provenance.' },
        { icon: 'users', label: 'Admissions', detail: 'Faire progresser le dossier sans reconstruire le contexte.' },
        { icon: 'book', label: 'Pédagogie', detail: 'Relier classes, enseignants, évaluations et restitution.' },
        { icon: 'wallet', label: 'Finance', detail: 'Facture, paiement, reçu, solde et relance dans une chaîne.' },
        { icon: 'bus', label: 'Transport', detail: 'Structurer circuits, arrêts, véhicules et responsabilités.' },
        { icon: 'shield', label: 'Confiance', detail: 'Identités, rôles, permissions et trace institutionnelle.' },
      ]} />

      <section className={styles.homeConstellationSection}>
        <div className={styles.homeConstellationCopy}><span>UNE ARCHITECTURE, PAS UNE COLLECTION DE MODULES</span><h2>Voir l’établissement comme un réseau de responsabilités.</h2><p>Le produit est plus lisible quand les domaines sont montrés dans leurs relations. Ce schéma est éditorial : il explique l’architecture SANILA sans fabriquer de données produit.</p></div>
        <ProductOperatingConstellation />
      </section>

      <section className={styles.homeEvidenceMaster}>
        <div className={styles.homeEvidenceHeader}><span>EXPÉRIENCES RÉELLES</span><h2>La même institution ne doit pas ressembler au même logiciel pour tout le monde.</h2></div>
        <ProductEvidenceMosaic />
      </section>

      <section className={styles.homeSystemSection}>
        <SectionHeading index="01" eyebrow="L’INSTITUTION COMME SYSTÈME" title="SANILA n’ajoute pas un outil. Il donne une architecture au travail qui existe déjà." body="La direction ne doit pas réconcilier des fragments. L’administration ne doit pas reconstruire le contexte. Les familles ne doivent pas devenir le middleware humain de l’établissement." />
        <div className={styles.homeSystemStage}><FragmentationModel /></div>
      </section>

      <section className={styles.homeDay}>
        <SectionHeading index="02" eyebrow="UNE JOURNÉE AVEC SANILA" title="Voir le système fonctionner dans le temps, pas dans une liste de fonctionnalités." body="La valeur de SANILA apparaît dans les transitions : qui agit, ce que l’information devient et comment la responsabilité suivante hérite du contexte." />
        <InteractiveDayStory />
      </section>

      <section className={styles.homeRoles}>
        <SectionHeading index="03" eyebrow="EXPÉRIENCES PAR RÔLE" title="Une institution. Six portes d’entrée. Aucune expérience générique." body="Le produit reste cohérent sans imposer le même environnement à un directeur, un enseignant, un membre du personnel, un parent ou un élève." />
        <div className={styles.homeRoleStage}><RoleSwitchboard /></div>
      </section>

      <section className={styles.homeDecisionSection}>
        <SectionHeading index="04" eyebrow="DÉCIDER AVEC PREUVE" title="Le site doit pouvoir soutenir une vraie conversation commerciale." body="SANILA se présente à travers ses opérations, ses preuves et sa méthode de mise en service — pas à travers des promesses décoratives." />
        <div className={styles.homeDecisionGrid}>
          <div><h3>Explorer le produit par responsabilité.</h3><p>Direction, Admissions, Pédagogie, Finance, Transport et Sécurité possèdent chacun leur propre logique de lecture.</p><DomainNavigation /></div>
          <div><h3>Vérifier ce qui existe.</h3><p>Les autorités physiques du produit récupéré sont documentées. Les diagrammes restent explicitement éditoriaux.</p><EvidenceLedger sources={page.evidenceSources} title="Autorités de preuve utilisées sur l’accueil" /></div>
        </div>
      </section>
      <ClosingStatement page={page} title="Voir SANILA dans le contexte réel de votre établissement." body="La démonstration doit partir de votre structure, vos priorités et votre calendrier — pas d’un script standard." />
    </>
  )
}

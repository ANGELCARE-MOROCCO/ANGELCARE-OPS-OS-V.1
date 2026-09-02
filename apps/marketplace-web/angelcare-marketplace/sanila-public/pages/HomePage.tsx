import Image from 'next/image'
import Link from 'next/link'

import { getSanilaPublicPage, sanilaHref } from '../content'
import { SanilaIcon } from '../SanilaIcon'
import { ClosingStatement, DomainNavigation, EvidenceLedger, FragmentationModel, ProductSourcePanel, SectionHeading } from '../components/SanilaExperience'
import { InteractiveDayStory, RoleSwitchboard } from '../components/SanilaInteractiveStories'
import styles from '../SanilaPublic.module.css'

export function HomePage() {
  const page = getSanilaPublicPage('accueil')!
  return (
    <>
      <section className={styles.homeHero}>
        <div className={styles.homeHeroCopy}>
          <div className={styles.homeHeroMeta}><span>SANILA</span><i /><span>School Operating System</span></div>
          <h1>L’établissement fonctionne déjà comme un système.</h1>
          <p>SANILA relie direction, administration, pédagogie, finance, familles, personnel et opérations dans une architecture commune — sans effacer les responsabilités de chacun.</p>
          <div className={styles.homeHeroActions}>
            <Link href={sanilaHref('demonstration')}>Demander une démonstration <SanilaIcon name="arrow" size={15} /></Link>
            <Link href={sanilaHref('produit')}>Explorer l’architecture produit</Link>
            <Link href={sanilaHref('connexion')}>Accéder à SANILA</Link>
          </div>
        </div>
        <div className={styles.homeHeroStage}>
          <div className={styles.homeHeroMainEvidence}><ProductSourcePanel page={getSanilaPublicPage('direction')!} title="Pilotage institutionnel — autorité produit" /></div>
          <div className={styles.homeHeroContext}><Image src="/sanila/parent-login/sanila-parent-morocco-approved.webp" alt="Contexte familial marocain contemporain autour de SANILA" fill sizes="220px" priority /></div>
          <div className={styles.homeHeroRole}><span>UNE INSTITUTION • PLUSIEURS EXPÉRIENCES</span><strong>La même école ne doit pas ressembler au même logiciel pour tout le monde.</strong><p>Direction, administration, enseignants, personnel, parents et élèves accèdent à des environnements adaptés à leur responsabilité.</p><Link href={sanilaHref('connexion')}>Voir les accès réels <SanilaIcon name="arrow" size={14} /></Link></div>
        </div>
      </section>
      <div className={styles.homeProofRail}>
        <div><span>ARCHITECTURE</span><strong>29 routes publiques organisées sous une autorité SANILA dédiée.</strong></div>
        <div><span>PRODUIT</span><strong>Preuves source et accès réels, sans faux cockpit marketing.</strong></div>
        <div><span>MAROC</span><strong>Finance en Dh, rentrée, familles, transport et réalité des établissements privés.</strong></div>
        <div><span>MISE EN SERVICE</span><strong>Diagnostic, configuration, rôles, validation, lancement et accompagnement.</strong></div>
      </div>

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

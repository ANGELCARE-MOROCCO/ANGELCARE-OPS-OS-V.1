import { getSanilaPublicPage } from '../content'
import { EvidenceLedger } from '../components/SanilaExperience'
import { DemoAgendaVisual, DemoQualificationBoard, ProductEvidenceMosaic, VisualSignalRail } from '../components/SanilaVisualSystems'
import { SanilaDemoForm } from '../SanilaDemoForm'
import styles from '../SanilaPublic.module.css'

export function DemoPage() {
  const page = getSanilaPublicPage('demonstration')!
  return <>
    <section className={styles.demoHeroMaster}>
      <div className={styles.demoHeroCopy}>
        <span>DÉMONSTRATION / QUALIFICATION</span>
        <h1>Votre démonstration doit ressembler à votre établissement.</h1>
        <p>Nous qualifions la structure, les outils actuels, les priorités, l’échelle, le calendrier et le rôle du décideur avant d’ouvrir SANILA.</p>
        <div className={styles.demoHeroChips}>
          <span>30–45 min ciblées</span><span>6 axes de qualification</span><span>Parcours adaptés par rôle</span>
        </div>
      </div>
      <div className={styles.demoHeroVisual}><DemoQualificationBoard /></div>
    </section>

    <section className={styles.demoAgendaSection}>
      <div className={styles.demoAgendaCopy}>
        <span>ORDRE DU JOUR / SUR MESURE</span>
        <h2>Montrer moins. Relier mieux. Décider plus vite.</h2>
        <p>La valeur d’une démonstration SANILA n’est pas le nombre d’écrans parcourus. C’est la capacité à relier votre réalité à une architecture de travail compréhensible.</p>
      </div>
      <DemoAgendaVisual />
    </section>

    <section className={styles.demoScopeSection}>
      <div className={styles.demoScopeLead}>
        <span>CE QUE NOUS QUALIFIONS</span>
        <h2>Six signaux suffisent pour construire une démonstration sérieuse.</h2>
      </div>
      <VisualSignalRail items={[
        { icon: 'building', label: 'Institution', detail: 'Structure, sites, organisation et responsabilités.' },
        { icon: 'layers', label: 'Système actuel', detail: 'Outils, ruptures, doubles saisies et dépendances.' },
        { icon: 'spark', label: 'Priorité', detail: 'Le problème qui mérite une preuve produit immédiate.' },
        { icon: 'users', label: 'Échelle', detail: 'Effectif, équipes, familles et complexité quotidienne.' },
        { icon: 'calendar', label: 'Calendrier', detail: 'Rentrée, bascule, décision ou phase de préparation.' },
        { icon: 'check', label: 'Décision', detail: 'Rôle du décideur, critères et prochaine étape.' },
      ]} />
    </section>

    <section className={styles.demoEvidenceSection}>
      <div className={styles.demoEvidenceHeader}><span>PREUVE VISUELLE</span><h2>Entrer dans SANILA par les personnes qui vont réellement l’utiliser.</h2></div>
      <ProductEvidenceMosaic />
    </section>

    <section className={styles.demoFormStage}>
      <aside className={styles.demoFormAside}>
        <span>AVANT LA DÉMO</span>
        <h2>Le formulaire devient déjà un diagnostic commercial.</h2>
        <p>Chaque étape prépare l’ordre du jour. Aucune création automatique d’environnement n’est déclenchée.</p>
        <div className={styles.demoFormAsideStats}>
          <div><strong>6</strong><span>étapes courtes</span></div>
          <div><strong>1</strong><span>ordre du jour ciblé</span></div>
          <div><strong>0</strong><span>environnement créé automatiquement</span></div>
        </div>
        <EvidenceLedger sources={page.evidenceSources} title="Autorités produit utilisées pour préparer la démonstration" />
      </aside>
      <SanilaDemoForm />
    </section>
  </>
}

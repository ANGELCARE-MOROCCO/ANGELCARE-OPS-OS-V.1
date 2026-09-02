import { getSanilaPublicPage } from '../content'
import { CapabilityIndex, ClosingStatement, EvidenceLedger, FinanceLedgerVisual, OutcomeStrip, ProcessSequence, SectionHeading } from '../components/SanilaExperience'
import styles from '../SanilaPublic.module.css'

export function FinancePage() {
  const page = getSanilaPublicPage('finance')!
  return <>
    <section className={styles.financeHero}><div className={styles.financeHeroInner}><div className={styles.financeHeroCopy}><span>FINANCE / Dh / TRAÇABILITÉ</span><h1>{page.title}</h1><p>{page.subtitle}</p></div><FinanceLedgerVisual /></div></section>
    <OutcomeStrip page={page} />
    <section className={styles.financeChain}><SectionHeading index="01" eyebrow="CHAÎNE FINANCIÈRE" title="Une opération financière n’existe jamais seule." body="Le frais crée une obligation. La facture la formalise. Le paiement la réduit. Le reçu la prouve. Le solde conserve la vérité. La relance agit sur ce qui reste." /><ProcessSequence steps={page.workflow} variant="ledger" /></section>
    <section className={`${styles.section} ${styles.sectionSoft}`}><SectionHeading index="02" eyebrow="DOCUMENTS & CONTRÔLE" title="La précision se construit dans la relation entre les documents." /><div className={styles.financeDocuments}><div className={styles.financeDocumentStack}><div className={styles.financeDocument}><span>FACTURE</span><strong>Frais de scolarité</strong><i/><i/><i/></div><div className={styles.financeDocument}><span>REÇU</span><strong>Paiement famille</strong><i/><i/><i/></div><div className={styles.financeDocument}><span>ÉTAT</span><strong>Solde et historique</strong><i/><i/><i/></div></div><div className={styles.financeControl}><h3>Finance scolaire ≠ tableau d’encaissements.</h3><p>Le besoin réel est une continuité entre frais, affectations, factures, paiements, reçus, remises, relances, soldes, états de compte et dépenses — avec une lecture compréhensible par l’établissement et la famille.</p><CapabilityIndex page={page} columns={2}/></div></div></section>
    <section className={styles.section}><div className={styles.domainSplit}><div className={styles.domainManifesto}>Une situation financière incomprise devient vite un problème de relation famille.</div><EvidenceLedger sources={page.evidenceSources} title="Autorités finance présentes dans le produit récupéré" /></div></section>
    <ClosingStatement page={page} title="Examiner votre chaîne financière dans SANILA." />
  </>
}

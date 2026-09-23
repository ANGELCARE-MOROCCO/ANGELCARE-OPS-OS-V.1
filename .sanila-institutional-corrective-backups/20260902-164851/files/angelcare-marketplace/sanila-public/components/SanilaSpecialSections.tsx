import Link from 'next/link'

import { sanilaHref } from '../content'
import type { SanilaPageBlueprint } from '../types'
import styles from '../SanilaPublic.module.css'

export function DomainSignature({ page }: { page: SanilaPageBlueprint }) {
  const labels: Record<string, string[]> = {
    direction: ['Signaux du jour', 'Exceptions', 'Décisions', 'Suivi exécutif'],
    administration: ['Établissement', 'Années & périodes', 'Classes & matières', 'Rôles & audit'],
    admissions: ['Demande', 'Dossier', 'Documents', 'Décision', 'Inscription'],
    presences: ['Classe', 'Présence', 'Absence', 'Retard', 'Justification'],
    pedagogie: ['Cours', 'Devoir', 'Évaluation', 'Note', 'Bulletin'],
    finance: ['Frais', 'Facture', 'Paiement', 'Reçu', 'Solde', 'Relance'],
    paie: ['Période', 'Variables', 'Validation', 'Paiement', 'Historique'],
    transport: ['Circuit', 'Arrêts', 'Véhicule', 'Affectations', 'Sécurité'],
    communication: ['Contexte', 'Destinataires', 'Message', 'Historique', 'Escalade'],
    bibliotheque: ['Catalogue', 'Disponibilité', 'Prêt', 'Retour', 'Historique'],
    inventaire: ['Article', 'Localisation', 'Mouvement', 'Risque', 'Audit'],
    reclamations: ['Réception', 'Priorité', 'Assignation', 'Action', 'Résolution'],
    rapports: ['Domaines', 'Consolidation', 'Lecture', 'Export', 'Audit'],
  }
  const items = labels[page.slug] || page.features.slice(0, 5)
  return (
    <section className={`${styles.section} ${styles.signatureSection}`} data-mode={page.mode}>
      <div className={styles.signatureStatement}><span>SIGNATURE DU DOMAINE</span><h2>{page.statement}</h2><p>{page.buyerQuestion}</p></div>
      <div className={styles.signatureLane}>{items.map((item, index) => <div key={item}><span>{String(index + 1).padStart(2,'0')}</span><strong>{item}</strong></div>)}</div>
    </section>
  )
}

export function SystemArchitectureStory() {
  const rows = [
    ['Institution', 'Établissement, année scolaire, périodes, classes, responsabilités'],
    ['Personnes', 'Direction, administration, enseignants, personnel, parents, élèves'],
    ['Opérations', 'Admissions, présences, pédagogie, finance, paie, transport'],
    ['Confiance', 'Rôles, permissions, séparation, audit, historique'],
    ['Expériences', 'Interfaces adaptées au rôle au lieu d’un cockpit unique pour tout le monde'],
  ]
  return <section className={`${styles.section} ${styles.architectureStory}`}><div className={styles.architectureIntro}><span>OPERATING MODEL</span><h2>La cohérence ne vient pas d’un menu unique. Elle vient d’un contexte partagé.</h2></div><div className={styles.architectureRows}>{rows.map((row,index)=><article key={row[0]}><span>0{index+1}</span><strong>{row[0]}</strong><p>{row[1]}</p></article>)}</div></section>
}

export function SecurityConstitution() {
  const controls = [
    ['Authentification', 'L’entrée se fait par des autorités d’accès dédiées.'],
    ['Rôles & permissions', 'Le produit possède une matrice de permissions et des gates d’autorisation dans la source.'],
    ['Contexte établissement', 'L’identité de l’établissement fait partie de l’expérience client et de la gouvernance.'],
    ['Portails séparés', 'Enseignant, personnel, parent et élève disposent d’expériences distinctes.'],
    ['Audit', 'Plusieurs domaines métier possèdent leurs propres espaces ou drawers d’audit.'],
  ]
  return <section className={`${styles.section} ${styles.securityConstitution}`}><div className={styles.securityCore}><span>SANILA TRUST CONSTITUTION</span><h2>La sécurité est un système de responsabilités.</h2><p>Aucune certification, disponibilité ou promesse chiffrée n’est inventée ici. Les éléments ci-dessous sont liés à la source récupérée.</p></div><div className={styles.securityControls}>{controls.map((control,index)=><article key={control[0]}><span>{String(index+1).padStart(2,'0')}</span><div><strong>{control[0]}</strong><p>{control[1]}</p></div></article>)}</div></section>
}

export function DemoPreparation() {
  return <section className={`${styles.section} ${styles.demoPreparation}`}><div><span>APRÈS L’ENVOI</span><h2>La demande prépare une démonstration. Elle ne crée aucun environnement.</h2></div><ol><li>La demande est enregistrée par l’API publique existante.</li><li>Les priorités servent à préparer le parcours de démonstration.</li><li>La mise en service et la proposition restent séparées de la simple demande de démo.</li><li>Les captures ou accès authentifiés nécessitent un contexte autorisé.</li></ol></section>
}

export function OnboardingGuardrail() {
  return <section className={`${styles.section} ${styles.onboardingGuardrail}`}><div><span>GARDE-FOU COMMERCIAL</span><h2>“Créer mon établissement” ne signifie pas créer un environnement de production sans contrôle.</h2><p>Le site public rassemble les informations nécessaires à une revue AngelCare. Aucune modification de base de données et aucune création automatique d’environnement n’est déclenchée par ce parcours.</p></div><div className={styles.guardrailFlow}><span>Demande</span><b>→</b><span>Qualification</span><b>→</b><span>Revue</span><b>→</b><span>Contrat / périmètre</span><b>→</b><span>Création contrôlée</span></div></section>
}

export function CrossDomainBridge({ from, to, title, body }: { from: string; to: string; title: string; body: string }) {
  return <section className={`${styles.section} ${styles.crossDomainBridge}`}><div><span>CONTINUITÉ INTER-DOMAINES</span><h2>{title}</h2><p>{body}</p></div><div className={styles.bridgeFlow}><Link href={sanilaHref(from)}>{from}</Link><b>→</b><Link href={sanilaHref(to)}>{to}</Link></div></section>
}

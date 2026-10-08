import { Children, type ReactNode } from 'react'
import Angelcare360AcademicNavigation from './Angelcare360AcademicNavigation'
import type { Angelcare360AcademicNavigationItem } from '@/data/angelcare360/academics-navigation'
import AcademicZoneAFrame from '@/components/angelcare360/zone-a-academic/AcademicZoneAFrame'
import AcademicZoneAPageActionSurface from '@/components/angelcare360/zone-a-academic/AcademicZoneAPageActionSurface'
import styles from '@/components/angelcare360/zone-a-academic/AcademicZoneAChrome.module.css'

type Angelcare360AcademicPageShellProps = {
  title: string
  subtitle: string
  badge?: string
  statusLabel?: string
  primaryAction?: ReactNode
  secondaryActions?: ReactNode
  contextRow?: ReactNode
  experience?: ReactNode
  navigationItems: Angelcare360AcademicNavigationItem[]
  children: ReactNode
}

type SlotPlan = {
  main: ReactNode[]
  primary?: { label: string; title: string; eyebrow: string; description: string; size?: 'drawer' | 'chamber' | 'wide'; content: ReactNode } | null
  secondary?: { label: string; title: string; eyebrow: string; description: string; size?: 'drawer' | 'chamber' | 'wide'; content: ReactNode } | null
}

function pagePlan(title: string, badge: string | undefined, children: ReactNode): SlotPlan {
  const nodes = Children.toArray(children)
  const slot = (index: number) => nodes[index] || null
  const rest = (...drawerIndexes: number[]) => nodes.filter((_, index) => !drawerIndexes.includes(index))
  const exact = title.toLowerCase()
  const detailKind = (badge || '').toLowerCase()

  if (exact === 'cours') return { main: rest(0, 1), primary: { label: 'Nouveau cours', title: 'Lesson Delivery Chamber', eyebrow: 'Cours · création', description: 'Créer une séance liée au contexte académique réel sans quitter le flux.', content: slot(1) }, secondary: { label: 'Filtres avancés', title: 'Affiner les cours', eyebrow: 'Learning flow', description: 'Filtrer la liste sans casser le contexte courant.', content: slot(0) } }
  if (exact === 'devoirs') return { main: rest(0, 1), primary: { label: 'Composer un devoir', title: 'Homework Composer', eyebrow: 'Homework studio', description: 'Consigne, échéance, classe, matière et publication dans une surface dédiée.', size: 'chamber', content: slot(1) }, secondary: { label: 'Recherche', title: 'Filtrer les devoirs', eyebrow: 'Homework studio', description: 'Réduire le flux aux devoirs réellement utiles.', content: slot(0) } }
  if (exact === 'examens') return { main: rest(0, 1), primary: { label: 'Nouvelle évaluation', title: 'Assessment Builder Chamber', eyebrow: 'Assessment foundry', description: 'Construire l’évaluation, son barème, sa période et sa publication avec le contexte complet.', size: 'chamber', content: slot(1) }, secondary: { label: 'Filtres', title: 'Explorer les évaluations', eyebrow: 'Assessment foundry', description: 'Filtrer les évaluations par période, classe et matière.', content: slot(0) } }
  if (exact === 'bulletins') return { main: rest(0, 1), primary: { label: 'Préparer un bulletin', title: 'Bulletin Atelier — préparation', eyebrow: 'Publication studio', description: 'Créer le brouillon dans un atelier contrôlé avant revue et publication.', size: 'chamber', content: slot(1) }, secondary: { label: 'Filtrer', title: 'Explorer les bulletins', eyebrow: 'Bulletin atelier', description: 'Conserver le cycle de publication au centre de la vue.', content: slot(0) } }
  if (exact === 'notes') return { main: rest(0, 2), primary: { label: 'Mise à jour en masse', title: 'Correction & Result Drawer', eyebrow: 'Mastery & grade matrix', description: 'Appliquer une opération de notes en lot avec contrôle du contexte.', size: 'chamber', content: slot(2) }, secondary: { label: 'Ouvrir une feuille', title: 'Sélection de feuille de notes', eyebrow: 'Gradebook', description: 'Choisir la classe, la matière et l’évaluation avant saisie.', content: slot(0) } }
  if (exact === 'moyennes') return { main: rest(0), primary: { label: 'Préparer le calcul', title: 'Average Readiness Chamber', eyebrow: 'Moyennes', description: 'Vérifier formule, période et readiness avant calcul institutionnel.', size: 'chamber', content: slot(0) } }
  if (exact === 'sessions d’examens') return { main: rest(0), primary: { label: 'Nouvelle session', title: 'Exam Session Drawer', eyebrow: 'Assessment foundry', description: 'Planifier salle, créneau, surveillance et état de session.', content: slot(0) } }
  if (exact === 'appréciations') return { main: rest(0), primary: { label: 'Nouvelle appréciation', title: 'Teacher Appreciation Studio Drawer', eyebrow: 'Bulletin atelier', description: 'Rédiger une appréciation contextualisée, traçable et liée à l’élève.', size: 'chamber', content: slot(0) } }
  if (exact === 'soumissions') return { main: rest(0), secondary: { label: 'Filtres', title: 'Submission Review Drawer', eyebrow: 'Soumissions', description: 'Isoler les remises, retards et corrections à traiter.', content: slot(0) } }
  if (exact === 'audit académique') return { main: rest(0), secondary: { label: 'Recherche historique', title: 'Academic History Chamber', eyebrow: 'Historical lens', description: 'Filtrer la chronologie académique sans quitter le journal.', content: slot(0) } }

  if (detailKind === 'cours') return { main: rest(1), primary: { label: 'Modifier le cours', title: 'Lesson Delivery Chamber', eyebrow: 'Cours · dossier', description: 'Mettre à jour la séance avec son contexte académique visible.', size: 'chamber', content: slot(1) } }
  if (detailKind === 'devoir') return { main: rest(1, 2), primary: { label: 'Modifier le devoir', title: 'Homework Composer', eyebrow: 'Devoir · dossier', description: 'Modifier le devoir sans perdre ses remises ni son historique.', size: 'chamber', content: slot(1) }, secondary: { label: 'Changer le statut', title: 'Homework Review Chamber', eyebrow: 'Publication', description: 'Faire évoluer le statut de manière explicite.', content: slot(2) } }
  if (detailKind === 'examen') return { main: rest(1, 2), primary: { label: 'Modifier l’évaluation', title: 'Assessment Builder Chamber', eyebrow: 'Évaluation · dossier', description: 'Réviser l’évaluation avec ses sessions et son barème visibles.', size: 'chamber', content: slot(1) }, secondary: { label: 'Changer le statut', title: 'Assessment Control Drawer', eyebrow: 'Gouvernance', description: 'Faire évoluer l’état sans écraser le dossier.', content: slot(2) } }
  if (detailKind === 'bulletin') return { main: rest(2, 3), primary: { label: 'Cycle du bulletin', title: 'Bulletin Review Chamber', eyebrow: 'Bulletin atelier', description: 'Contrôler validation, statut et passage vers publication.', size: 'chamber', content: slot(2) }, secondary: { label: 'PDF & verrouillage', title: 'Publication Control Chamber', eyebrow: 'Export gouverné', description: 'Prévisualiser le verrouillage et les contraintes d’export.', content: slot(3) } }

  return { main: nodes }
}


function surfaceKey(title: string, badge?: string) {
  const key = `${badge || ''} ${title}`.toLowerCase()
  if (key.includes('devoir') || key.includes('soumission')) return 'homework'
  if (key.includes('examen') || key.includes('session')) return 'assessment'
  if (key.includes('note') || key.includes('moyenne')) return 'gradebook'
  if (key.includes('bulletin') || key.includes('appréciation')) return 'bulletin'
  if (key.includes('audit') || key.includes('histor')) return 'history'
  if (key.includes('cours')) return 'lesson'
  return 'academic'
}

export default function Angelcare360AcademicPageShell({ title, subtitle, badge, statusLabel, primaryAction, secondaryActions, contextRow, experience, navigationItems, children }: Angelcare360AcademicPageShellProps) {
  const plan = pagePlan(title, badge, children)
  const surface = surfaceKey(title, badge)
  return (
    <AcademicZoneAFrame>
      <section className={styles.pageShell} data-zone-a-surface={surface}>
        <header className={styles.hero}>
          <div className={styles.heading}>
            <div className={styles.eyebrowRow}>
              {badge ? <span className={styles.badge}>{badge}</span> : null}
              {statusLabel ? <span className={styles.status}>{statusLabel}</span> : null}
            </div>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.subtitle}>{subtitle}</p>
          </div>
          {primaryAction || secondaryActions ? <div className={styles.heroActions}>{secondaryActions}{primaryAction}</div> : null}
        </header>
        {contextRow ? <div className={styles.contextRow}>{contextRow}</div> : null}
        {experience}
        <Angelcare360AcademicNavigation items={navigationItems} />
        <AcademicZoneAPageActionSurface
          primarySlot={plan.primary ? { label: plan.primary.label, title: plan.primary.title, eyebrow: plan.primary.eyebrow, description: plan.primary.description, size: plan.primary.size } : null}
          primaryContent={plan.primary?.content}
          secondarySlot={plan.secondary ? { label: plan.secondary.label, title: plan.secondary.title, eyebrow: plan.secondary.eyebrow, description: plan.secondary.description, size: plan.secondary.size } : null}
          secondaryContent={plan.secondary?.content}
        >
          {plan.main}
        </AcademicZoneAPageActionSurface>
      </section>
    </AcademicZoneAFrame>
  )
}

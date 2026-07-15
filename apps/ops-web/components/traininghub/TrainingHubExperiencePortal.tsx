import type { CSSProperties, ReactNode } from 'react'
import AngelCareLogo from '@/components/brand/AngelCareLogo'
import type { TrainingHubContext } from '@/lib/traininghub/types'
import type { TrainingHubExperience } from '@/lib/traininghub/experience'

const copy: Record<TrainingHubExperience, { eyebrow: string; title: string; subtitle: string; badge: string; cards: Array<{ title: string; text: string; href?: string }> }> = {
  admin: {
    eyebrow: 'ANGELCARE TRAININGHUB BACKOFFICE',
    title: 'Admin Command Center',
    subtitle: 'Contrôle interne AngelCare pour catalogue, commercial, delivery, e-learning, resources et access management.',
    badge: 'Internal AngelCare only',
    cards: [
      { title: 'Catalogue', text: '80 formations, 8 catégories, prix, tags, publication et fiches complètes.', href: '/traininghub/catalogue' },
      { title: 'Commercial', text: 'Pricing preview, propositions, orders, invoices et pipeline formation.', href: '/traininghub/commercial' },
      { title: 'Delivery', text: 'Sessions terrain, participants, attendance, certificats, refresh et aftersales.', href: '/traininghub/delivery' },
    ],
  },
  partner: {
    eyebrow: 'ANGELCARE PARTNER TRAINING PORTAL',
    title: 'Espace Partenaire Formation',
    subtitle: 'La crèche voit uniquement ses formations, son équipe, ses kits, ses certificats, son e-learning refresh et sa progression.',
    badge: 'Partner school scope only',
    cards: [
      { title: 'Mes formations', text: 'Sessions achetées, programmées, livrées et prochaines actions.' },
      { title: 'Mon équipe', text: 'Participants, présence, certificats et refresh e-learning à suivre.' },
      { title: 'Mes ressources', text: 'Workbooks, checklists, process cards et kits débloqués par formation.' },
    ],
  },
  trainer: {
    eyebrow: 'ANGELCARE TRAINER COCKPIT',
    title: 'Cockpit Trainer',
    subtitle: 'Le trainer accède seulement à ses sessions assignées, aux participants, aux checklists et aux preuves de delivery.',
    badge: 'Assigned sessions only',
    cards: [
      { title: 'Sessions assignées', text: 'Planning, adresse, agenda, objectifs et statut de préparation.' },
      { title: 'Attendance & quiz', text: 'Présence, quiz, validation et notes de formation.' },
      { title: 'Delivery proof', text: 'Checklist, observations, preuves autorisées et clôture trainer.' },
    ],
  },
  learner: {
    eyebrow: 'ANGELCARE LEARNING SPACE',
    title: 'Mon espace apprentissage',
    subtitle: 'Le participant accède à ses modules e-learning, ses ressources autorisées, sa progression et ses certificats.',
    badge: 'Own learning only',
    cards: [
      { title: 'Mes modules', text: 'Refresh e-learning assigné et progression individuelle.' },
      { title: 'Mes certificats', text: 'Preuves de complétion et certificats personnels.' },
      { title: 'Mes supports', text: 'Checklists, process cards et ressources liées à mes formations.' },
    ],
  },
}

export default function TrainingHubExperiencePortal({ context, experience, children }: { context: TrainingHubContext; experience: TrainingHubExperience; children?: ReactNode }) {
  const c = copy[experience]
  const org = context.organizations[0]

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <div style={brandStyle}>
          <AngelCareLogo size="md" showText />
          <span style={badgeStyle}>{c.badge}</span>
        </div>
        <div style={userStyle}>
          <strong>{context.profile.full_name || context.profile.email}</strong>
          <span>{org?.name || 'TrainingHub'} • {context.roles.map((r) => r.code).join(' / ') || 'user'}</span>
          <a href="/traininghub/logout" style={logoutStyle}>Déconnexion</a>
        </div>
      </header>

      <section style={heroStyle}>
        <div>
          <div style={eyebrowStyle}>{c.eyebrow}</div>
          <h1 style={titleStyle}>{c.title}</h1>
          <p style={subtitleStyle}>{c.subtitle}</p>
        </div>
        <div style={separationStyle}>
          <strong>Separate TrainingHub access</strong>
          <span>Supabase Auth • RBAC • RLS • no OpsOS session mixing</span>
        </div>
      </section>

      <section style={cardsStyle}>
        {c.cards.map((card) => {
          const inner = (
            <>
              <strong>{card.title}</strong>
              <span>{card.text}</span>
            </>
          )
          return card.href ? <a key={card.title} href={card.href} style={cardStyle}>{inner}</a> : <div key={card.title} style={cardStyle}>{inner}</div>
        })}
      </section>

      {children}
    </main>
  )
}

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  padding: 28,
  background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 42%, #fff7ed 100%)',
  color: '#0f172a',
  fontFamily: 'Inter, Arial, sans-serif',
}
const headerStyle: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, marginBottom: 26 }
const brandStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 14 }
const badgeStyle: CSSProperties = { border: '1px solid #bfdbfe', background: '#ffffff', borderRadius: 999, padding: '9px 12px', fontSize: 12, fontWeight: 950, color: '#1d4ed8' }
const userStyle: CSSProperties = { display: 'grid', justifyItems: 'end', gap: 4, fontSize: 12, color: '#475569', fontWeight: 800 }
const logoutStyle: CSSProperties = { color: '#1d4ed8', textDecoration: 'none', fontWeight: 950 }
const heroStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 330px', gap: 22, alignItems: 'stretch', marginBottom: 22 }
const eyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 12, fontWeight: 950, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 10 }
const titleStyle: CSSProperties = { margin: 0, fontSize: 44, lineHeight: 1, letterSpacing: '-.055em', fontWeight: 950 }
const subtitleStyle: CSSProperties = { maxWidth: 850, margin: '14px 0 0', color: '#475569', fontSize: 17, lineHeight: 1.65, fontWeight: 700 }
const separationStyle: CSSProperties = { display: 'grid', alignContent: 'center', gap: 8, padding: 22, borderRadius: 28, border: '1px solid #dbeafe', background: '#ffffff', boxShadow: '0 24px 70px rgba(15, 23, 42, .08)' }
const cardsStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }
const cardStyle: CSSProperties = { display: 'grid', gap: 10, padding: 22, minHeight: 138, borderRadius: 26, border: '1px solid #e2e8f0', background: 'rgba(255,255,255,.92)', boxShadow: '0 18px 52px rgba(15,23,42,.07)', textDecoration: 'none', color: '#0f172a', fontSize: 14, lineHeight: 1.55 }

import type { Data } from '@puckeditor/core'
import { getSanilaPublicPage } from '@/angelcare-marketplace/sanila-public/content'

export function sanilaInitialPuckData(slug: string): Data {
  const page = getSanilaPublicPage(slug)
  if (!page) return { root: { props: {} }, content: [] }
  const content: Data['content'] = [
    { type: 'SanilaHero', props: { id: `${slug}-hero`, eyebrow: page.eyebrow, title: page.title, body: page.subtitle, label: page.nextStep, href: page.nextHref, tone: 'navy' } },
    { type: 'SanilaEditorial', props: { id: `${slug}-statement`, eyebrow: 'SANILA · POSITION', title: page.statement, body: `${page.problem}\n\n${page.outcome}`, tone: 'white' } },
    { type: 'SanilaFeatureGrid', props: { id: `${slug}-features`, title: 'Capacités', items: page.features.map((title) => ({ title, body: '' })), tone: 'soft' } },
    { type: 'SanilaProcess', props: { id: `${slug}-workflow`, title: 'Parcours', items: page.workflow.map((step) => ({ title: step.label, body: step.detail })), tone: 'white' } },
    { type: 'SanilaProof', props: { id: `${slug}-proof`, eyebrow: 'PREUVES', title: page.proofPoints[0]?.title || 'Preuves SANILA', body: page.proofPoints.map((proof) => `${proof.title} — ${proof.detail}`).join('\n'), tone: 'gold' } },
  ]
  if (slug === 'demonstration' || slug === 'contact' || slug === 'creer-mon-etablissement') content.push({ type: 'SanilaWorkflowBridge', props: { id: `${slug}-workflow-bridge`, title: slug === 'demonstration' ? 'Demande de démonstration' : slug === 'contact' ? 'Contact SANILA' : 'Préparation établissement', body: 'Le workflow existant reste l’autorité d’exécution.', label: slug === 'demonstration' ? 'sanila.demo' : slug === 'contact' ? 'sanila.contact' : 'sanila.onboarding' } })
  content.push({ type: 'SanilaCTA', props: { id: `${slug}-cta`, title: page.nextStep, body: page.outcome, label: page.nextStep, href: page.nextHref, tone: 'navy' } })
  return { root: { props: { title: page.nav } }, content }
}

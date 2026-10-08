'use client'

import Link from 'next/link'
import type { Config } from '@puckeditor/core'
import styles from './sanila-studio.module.css'

type BaseProps = { eyebrow?: string; title?: string; body?: string; items?: Array<{title?: string; body?: string}>; href?: string; label?: string; tone?: string }

const toneField = { type: 'select' as const, label: 'Ton', options: [
  { label: 'Navy', value: 'navy' }, { label: 'Blanc', value: 'white' }, { label: 'Doux', value: 'soft' }, { label: 'Or', value: 'gold' },
] }

const itemFields = {
  title: { type: 'text' as const, label: 'Titre' },
  body: { type: 'textarea' as const, label: 'Texte' },
}

function Section({ children, tone = 'white' }: { children: React.ReactNode; tone?: string }) {
  return <section className={styles.block} data-tone={tone}>{children}</section>
}

export const SANILA_PUCK_CONFIG: Config = {
  categories: {
    sanila: { title: 'SANILA · Sections', defaultExpanded: true, components: ['SanilaHero', 'SanilaEditorial', 'SanilaFeatureGrid', 'SanilaProcess', 'SanilaProof', 'SanilaCTA', 'SanilaWorkflowBridge'] },
  },
  components: {
    SanilaHero: {
      label: 'SANILA Hero',
      fields: { eyebrow: { type: 'text', label: 'Eyebrow' }, title: { type: 'text', label: 'Titre' }, body: { type: 'textarea', label: 'Lead' }, label: { type: 'text', label: 'CTA' }, href: { type: 'text', label: 'Destination' }, tone: toneField },
      defaultProps: { eyebrow: 'SANILA', title: 'Une institution. Un système. Une architecture.', body: 'Structurez l’expérience publique SANILA sans toucher au runtime Demo.', label: 'Demander une démonstration', href: '/angelcare-marketplace/fr/sanila/demonstration', tone: 'navy' },
      render: (props: any) => <Section tone={props.tone}><span className={styles.eyebrow}>{props.eyebrow}</span><h1>{props.title}</h1><p className={styles.lead}>{props.body}</p>{props.href && props.label ? <Link className={styles.cta} href={props.href}>{props.label}</Link> : null}</Section>,
    },
    SanilaEditorial: {
      label: 'SANILA Editorial',
      fields: { eyebrow: { type: 'text', label: 'Eyebrow' }, title: { type: 'text', label: 'Titre' }, body: { type: 'textarea', label: 'Texte' }, tone: toneField },
      defaultProps: { eyebrow: 'CONTEXTE', title: 'Une lecture claire du problème.', body: 'Expliquez le contexte, le résultat et les preuves utiles.', tone: 'white' },
      render: (props: any) => <Section tone={props.tone}><span className={styles.eyebrow}>{props.eyebrow}</span><h2>{props.title}</h2><p>{props.body}</p></Section>,
    },
    SanilaFeatureGrid: {
      label: 'SANILA Feature Grid',
      fields: { title: { type: 'text', label: 'Titre' }, items: { type: 'array', label: 'Éléments', arrayFields: itemFields, defaultItemProps: (index: number) => ({ title: `Capacité ${index + 1}`, body: '' }), max: 12 }, tone: toneField },
      defaultProps: { title: 'Capacités', items: [{ title: 'Gouvernance', body: 'Une autorité claire.' }, { title: 'Opérations', body: 'Des workflows structurés.' }, { title: 'Confiance', body: 'Des preuves et responsabilités.' }], tone: 'soft' },
      render: (props: any) => <Section tone={props.tone}><h2>{props.title}</h2><div className={styles.grid}>{(props.items || []).map((item: {title?: string; body?: string}, index: number) => <article key={`${item.title}-${index}`}><strong>{item.title}</strong><p>{item.body}</p></article>)}</div></Section>,
    },
    SanilaProcess: {
      label: 'SANILA Process',
      fields: { title: { type: 'text', label: 'Titre' }, items: { type: 'array', label: 'Étapes', arrayFields: itemFields, defaultItemProps: (index: number) => ({ title: `Étape ${index + 1}`, body: '' }), max: 10 }, tone: toneField },
      defaultProps: { title: 'Parcours', items: [{ title: '01', body: 'Qualifier' }, { title: '02', body: 'Configurer' }, { title: '03', body: 'Exécuter' }], tone: 'white' },
      render: (props: any) => <Section tone={props.tone}><h2>{props.title}</h2><ol className={styles.process}>{(props.items || []).map((item: {title?: string; body?: string}, index: number) => <li key={`${item.title}-${index}`}><b>{item.title}</b><span>{item.body}</span></li>)}</ol></Section>,
    },
    SanilaProof: {
      label: 'SANILA Proof',
      fields: { eyebrow: { type: 'text', label: 'Eyebrow' }, title: { type: 'text', label: 'Titre' }, body: { type: 'textarea', label: 'Preuve' }, tone: toneField },
      defaultProps: { eyebrow: 'PREUVE', title: 'Ce qui est déjà réel.', body: 'Ajoutez uniquement une preuve vérifiable dans SANILA.', tone: 'gold' },
      render: (props: any) => <Section tone={props.tone}><span className={styles.eyebrow}>{props.eyebrow}</span><h2>{props.title}</h2><p>{props.body}</p></Section>,
    },
    SanilaCTA: {
      label: 'SANILA CTA',
      fields: { title: { type: 'text', label: 'Titre' }, body: { type: 'textarea', label: 'Texte' }, label: { type: 'text', label: 'CTA' }, href: { type: 'text', label: 'Destination' }, tone: toneField },
      defaultProps: { title: 'Voir SANILA avec votre réalité.', body: 'Passez d’une lecture générique à une démonstration contextualisée.', label: 'Demander une démonstration', href: '/angelcare-marketplace/fr/sanila/demonstration', tone: 'navy' },
      render: (props: any) => <Section tone={props.tone}><h2>{props.title}</h2><p>{props.body}</p>{props.href && props.label ? <Link className={styles.cta} href={props.href}>{props.label}</Link> : null}</Section>,
    },
    SanilaWorkflowBridge: {
      label: 'SANILA Workflow Bridge',
      fields: { title: { type: 'text', label: 'Titre' }, body: { type: 'textarea', label: 'Description' }, label: { type: 'select', label: 'Workflow', options: [{ label: 'Demo', value: 'sanila.demo' }, { label: 'Contact', value: 'sanila.contact' }, { label: 'Onboarding', value: 'sanila.onboarding' }] } },
      defaultProps: { title: 'Workflow SANILA', body: 'Pont natif vers le workflow existant. Aucun runtime de sécurité n’est remplacé.', label: 'sanila.demo' },
      render: (props: any) => <Section tone="soft"><span className={styles.eyebrow}>WORKFLOW NATIF</span><h2>{props.title}</h2><p>{props.body}</p><code>{props.label}</code></Section>,
    },
  },
}

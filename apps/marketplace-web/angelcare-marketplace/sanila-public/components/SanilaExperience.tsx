import Image from 'next/image'
import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'

import { CUSTOMER_ACCESS, PRODUCT_DOMAINS, sanilaHref } from '../content'
import { SanilaIcon } from '../SanilaIcon'
import type { SanilaEvidenceSource, SanilaPageBlueprint, SanilaWorkflowStep } from '../types'
import styles from '../SanilaPublic.module.css'

const iconBySlug: Record<string, Parameters<typeof SanilaIcon>[0]['name']> = {
  direction: 'chart', administration: 'building', admissions: 'users', presences: 'clock', pedagogie: 'book', finance: 'wallet', paie: 'file', transport: 'bus', communication: 'message', bibliotheque: 'book', inventaire: 'box', reclamations: 'heart', rapports: 'chart', securite: 'shield',
}

export function ProductProofFrame({
  title,
  eyebrow = 'PREUVE PRODUIT',
  children,
  note,
  compact = false,
}: {
  title: string
  eyebrow?: string
  children: ReactNode
  note?: string
  compact?: boolean
}) {
  return (
    <figure className={`${styles.proofFrame} ${compact ? styles.proofFrameCompact : ''}`}>
      <figcaption className={styles.proofFrameTop}>
        <span>{eyebrow}</span>
        <strong>{title}</strong>
        <i aria-hidden="true" />
      </figcaption>
      <div className={styles.proofFrameBody}>{children}</div>
      {note ? <p className={styles.proofFrameNote}>{note}</p> : null}
    </figure>
  )
}

export function EvidenceLedger({ sources, title = 'Autorités produit vérifiées dans la source' }: { sources: SanilaEvidenceSource[]; title?: string }) {
  return (
    <aside className={styles.evidenceLedger}>
      <div className={styles.evidenceLedgerHeader}>
        <span>TRAÇABILITÉ</span>
        <strong>{title}</strong>
      </div>
      <div className={styles.evidenceLedgerRows}>
        {sources.map((source, index) => (
          <div className={styles.evidenceLedgerRow} key={`${source.sourcePath}-${index}`}>
            <b>{String(index + 1).padStart(2, '0')}</b>
            <div><strong>{source.label}</strong><small>{source.sourcePath}</small></div>
            <em>{source.type}</em>
          </div>
        ))}
      </div>
    </aside>
  )
}

export function EditorialLead({
  page,
  index,
  label,
  align = 'left',
}: {
  page: SanilaPageBlueprint
  index?: string
  label?: string
  align?: 'left' | 'split'
}) {
  return (
    <header className={`${styles.editorialLead} ${align === 'split' ? styles.editorialLeadSplit : ''}`}>
      <div className={styles.editorialLeadMeta}>
        {index ? <b>{index}</b> : null}
        <span>{label || page.eyebrow}</span>
      </div>
      <div className={styles.editorialLeadCopy}>
        <h1>{page.title}</h1>
        <p>{page.subtitle}</p>
      </div>
      <div className={styles.editorialLeadQuestion}>
        <small>QUESTION D’ACHAT</small>
        <strong>{page.buyerQuestion}</strong>
      </div>
    </header>
  )
}

export function SectionHeading({ index, eyebrow, title, body }: { index?: string; eyebrow: string; title: string; body?: string }) {
  return (
    <header className={styles.sectionHeading}>
      <div className={styles.sectionHeadingIndex}>{index || '—'}</div>
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
        {body ? <p>{body}</p> : null}
      </div>
    </header>
  )
}

export function OutcomeStrip({ page }: { page: SanilaPageBlueprint }) {
  return (
    <div className={styles.outcomeStrip}>
      <div><small>AVANT</small><strong>{page.problem}</strong></div>
      <i aria-hidden="true"><SanilaIcon name="arrow" size={19} /></i>
      <div><small>AVEC SANILA</small><strong>{page.outcome}</strong></div>
    </div>
  )
}

export function ProcessSequence({ steps, variant = 'rail' }: { steps: SanilaWorkflowStep[]; variant?: 'rail' | 'ledger' | 'journey' | 'vertical' }) {
  return (
    <div className={`${styles.processSequence} ${styles[`processSequence_${variant}`]}`}>
      {steps.map((step, index) => (
        <div className={styles.processStep} key={`${step.label}-${index}`}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <div><strong>{step.label}</strong><p>{step.detail}</p></div>
        </div>
      ))}
    </div>
  )
}

export function CapabilityIndex({ page, columns = 3 }: { page: SanilaPageBlueprint; columns?: 2 | 3 | 4 }) {
  return (
    <div className={styles.capabilityIndex} style={{ '--cap-columns': columns } as CSSProperties}>
      {page.features.map((feature, index) => (
        <div key={feature} className={styles.capabilityIndexItem}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <strong>{feature}</strong>
        </div>
      ))}
    </div>
  )
}

export function SourceTruth({ page }: { page: SanilaPageBlueprint }) {
  return (
    <section className={styles.sourceTruth}>
      <div className={styles.sourceTruthCopy}>
        <span>PREUVE & VÉRITÉ PRODUIT</span>
        <h2>Montrer ce qui existe. Nommer clairement ce qui explique.</h2>
        <p>Cette page s’appuie sur des autorités physiques du produit récupéré. Les schémas éditoriaux expliquent les workflows ; ils ne sont jamais présentés comme des captures d’écran SANILA.</p>
      </div>
      <EvidenceLedger sources={page.evidenceSources} />
    </section>
  )
}

export function DomainNavigation({ current }: { current?: string }) {
  return (
    <nav className={styles.domainNavigation} aria-label="Explorer les domaines SANILA">
      <div className={styles.domainNavigationLead}>
        <span>ATLAS PRODUIT</span>
        <strong>Explorer SANILA par responsabilité.</strong>
      </div>
      <div className={styles.domainNavigationGrid}>
        {PRODUCT_DOMAINS.map((domain) => (
          <Link className={domain.slug === current ? styles.domainNavigationActive : ''} key={domain.slug} href={sanilaHref(domain.slug)}>
            <SanilaIcon name={iconBySlug[domain.slug] || 'layers'} size={17} />
            <span>{domain.nav}</span>
            <SanilaIcon name="arrow" size={13} />
          </Link>
        ))}
      </div>
    </nav>
  )
}

export function ClosingStatement({ page, title, body }: { page: SanilaPageBlueprint; title?: string; body?: string }) {
  return (
    <section className={styles.closingStatement}>
      <div className={styles.closingStatementRule} aria-hidden="true" />
      <div>
        <span>{page.statement}</span>
        <h2>{title || page.nextStep}</h2>
        {body ? <p>{body}</p> : null}
      </div>
      <Link href={page.nextHref}>{page.nextStep}<SanilaIcon name="arrow" size={17} /></Link>
    </section>
  )
}

export function RoleAccessDoors() {
  return (
    <div className={styles.roleDoors}>
      {CUSTOMER_ACCESS.map((entry, index) => (
        <Link href={entry.href} className={styles.roleDoor} key={entry.key}>
          <div className={styles.roleDoorIndex}>{String(index + 1).padStart(2, '0')}</div>
          <div className={styles.roleDoorVisual}>
            {entry.image ? <Image src={entry.image} alt="" fill sizes="(max-width: 900px) 88vw, 30vw" /> : null}
          </div>
          <div className={styles.roleDoorCopy}>
            <strong>{entry.title}</strong>
            <p>{entry.description}</p>
            <span>Ouvrir l’accès <SanilaIcon name="arrow" size={14} /></span>
          </div>
        </Link>
      ))}
    </div>
  )
}

export function ContextPhoto({ src, alt, label, ratio = 'wide' }: { src: string; alt: string; label?: string; ratio?: 'wide' | 'portrait' | 'square' }) {
  return (
    <figure className={`${styles.contextPhoto} ${styles[`contextPhoto_${ratio}`]}`}>
      <Image src={src} alt={alt} fill sizes="(max-width: 900px) 100vw, 48vw" />
      {label ? <figcaption>{label}</figcaption> : null}
    </figure>
  )
}

export function ProductSourcePanel({ page, title }: { page: SanilaPageBlueprint; title?: string }) {
  const first = page.evidenceSources[0]
  return (
    <ProductProofFrame title={title || first?.label || 'Autorité produit'} eyebrow="SOURCE PRODUIT" note="Preuve source — ce cadre documente une autorité réelle du produit. Ce n’est pas une capture d’écran fabriquée.">
      <div className={styles.sourcePanel}>
        <div className={styles.sourcePanelTop}><span>SANILA / {page.nav.toUpperCase()}</span><b>AUTHORITY</b></div>
        <div className={styles.sourcePanelBody}>
          <aside>
            {page.features.slice(0, 5).map((feature, index) => <span key={feature} className={index === 0 ? styles.sourcePanelActive : ''}>{feature}</span>)}
          </aside>
          <div className={styles.sourcePanelCanvas}>
            <header><span>{first?.label || page.nav}</span><small>{first?.type || 'component'}</small></header>
            <div className={styles.sourcePanelRows}>
              {page.workflow.slice(0, 4).map((step, index) => (
                <div key={step.label}><b>{String(index + 1).padStart(2, '0')}</b><strong>{step.label}</strong><span>{index === 0 ? 'Actif' : index === 1 ? 'En cours' : 'Traçable'}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ProductProofFrame>
  )
}

export function InstitutionalMap() {
  const nodes = [
    ['Direction', 'Décider'], ['Administration', 'Structurer'], ['Admissions', 'Convertir'], ['Pédagogie', 'Enseigner'],
    ['Finance', 'Encaisser'], ['Familles', 'Informer'], ['Personnel', 'Exécuter'], ['Transport', 'Coordonner'],
  ]
  return (
    <div className={styles.institutionMap}>
      <div className={styles.institutionMapCore}><span>SANILA</span><strong>Institution</strong><small>Une vérité opérationnelle partagée</small></div>
      {nodes.map(([name, verb], index) => (
        <div className={styles.institutionNode} data-node={index + 1} key={name}><span>{String(index + 1).padStart(2, '0')}</span><strong>{name}</strong><small>{verb}</small></div>
      ))}
      <svg className={styles.institutionLines} viewBox="0 0 1000 620" aria-hidden="true">
        {[80, 195, 310, 425, 575, 690, 805, 920].map((x, index) => <line key={x} x1="500" y1="310" x2={x} y2={index < 4 ? 120 : 500} />)}
      </svg>
    </div>
  )
}

export function DayTimeline() {
  const moments = [
    ['07:30', 'Administration', 'Ouvre les opérations'],
    ['07:55', 'Présences', 'Les premiers signaux remontent'],
    ['08:15', 'Direction', 'Lit la situation du jour'],
    ['09:30', 'Admissions', 'Une nouvelle famille entre dans le parcours'],
    ['11:00', 'Finance', 'Un paiement est enregistré et relié'],
    ['13:40', 'Pédagogie', 'Le travail académique progresse'],
    ['15:45', 'Transport', 'Les opérations de sortie se préparent'],
    ['17:10', 'Familles', 'Une demande reçoit son contexte'],
    ['18:00', 'Direction', 'La journée se ferme avec une lecture consolidée'],
  ]
  return (
    <div className={styles.dayTimeline}>
      {moments.map(([time, domain, action], index) => (
        <div className={styles.dayTimelineMoment} key={`${time}-${domain}`}>
          <time>{time}</time><i aria-hidden="true" /><div><strong>{domain}</strong><p>{action}</p></div><span>{String(index + 1).padStart(2, '0')}</span>
        </div>
      ))}
    </div>
  )
}

export function FragmentationModel() {
  const fragmented = ['WhatsApp', 'Excel', 'Papier', 'Mémoire', 'Apps isolées', 'Relances manuelles']
  return (
    <div className={styles.fragmentationModel}>
      <div className={styles.fragmentedSide}>
        <header><span>AVANT</span><strong>Le travail existe. Le système n’existe pas.</strong></header>
        <div className={styles.fragmentedCloud}>{fragmented.map((item, index) => <span key={item} style={{ '--fragment-i': index } as CSSProperties}>{item}</span>)}</div>
      </div>
      <div className={styles.fragmentationArrow}><SanilaIcon name="arrow" size={24} /></div>
      <div className={styles.unifiedSide}>
        <header><span>AVEC SANILA</span><strong>Une institution. Des rôles distincts. Une continuité opérationnelle.</strong></header>
        <InstitutionalMap />
      </div>
    </div>
  )
}

export function FinanceLedgerVisual() {
  const rows = [
    ['F-260912', 'Frais de scolarité', '2 400 Dh', 'Facturé'],
    ['P-260913', 'Paiement famille', '1 500 Dh', 'Reçu'],
    ['S-260913', 'Solde restant', '900 Dh', 'À suivre'],
    ['R-260915', 'Relance', '900 Dh', 'Planifiée'],
  ]
  return (
    <div className={styles.financeLedgerVisual}>
      <header><div><span>FINANCE / ÉTAT FAMILLE</span><strong>Chaîne financière</strong></div><b>Dh</b></header>
      <div className={styles.financeLedgerSummary}><div><small>Facturé</small><strong>2 400</strong></div><div><small>Encaissé</small><strong>1 500</strong></div><div><small>Solde</small><strong>900</strong></div></div>
      <div className={styles.financeLedgerRows}>{rows.map((row) => <div key={row[0]}>{row.map((cell, index) => index === 3 ? <span key={cell}>{cell}</span> : <strong key={cell}>{cell}</strong>)}</div>)}</div>
    </div>
  )
}

export function AdmissionsJourneyVisual() {
  const stages = ['Demande', 'Visite', 'Dossier', 'Décision', 'Inscription', 'Classe', 'Facturation']
  return (
    <div className={styles.admissionsJourneyVisual}>
      <div className={styles.admissionsJourneyLine} aria-hidden="true" />
      {stages.map((stage, index) => <div key={stage} className={styles.admissionsJourneyStage}><span>{String(index + 1).padStart(2, '0')}</span><i /><strong>{stage}</strong><small>{index < 3 ? 'Famille' : index < 5 ? 'Admissions' : 'Établissement'}</small></div>)}
    </div>
  )
}

export function AcademicGridVisual() {
  const days = ['LUN', 'MAR', 'MER', 'JEU', 'VEN']
  const subjects = ['Mathématiques', 'Français', 'Sciences', 'Anglais', 'Projet']
  return (
    <div className={styles.academicGridVisual}>
      <header><div><span>PÉDAGOGIE / SEMAINE</span><strong>Classe • Évaluation • Progression</strong></div><small>Vue éditoriale explicative</small></header>
      <div className={styles.academicGridDays}>{days.map((day) => <strong key={day}>{day}</strong>)}</div>
      <div className={styles.academicGridCells}>{subjects.map((subject, index) => <div key={subject} style={{ '--subject-span': index % 2 === 0 ? 2 : 1 } as CSSProperties}><span>{subject}</span><small>{index % 2 === 0 ? 'Cours + activité' : 'Évaluation'}</small></div>)}</div>
    </div>
  )
}

export function TransportTopologyVisual() {
  const stops = ['Campus', 'Hay Riad', 'Agdal', 'Centre', 'Campus']
  return (
    <div className={styles.transportTopologyVisual}>
      <header><span>TRANSPORT / CIRCUIT 04</span><strong>Structure d’un trajet scolaire</strong></header>
      <div className={styles.transportRoute}>
        {stops.map((stop, index) => <div className={styles.transportStop} key={`${stop}-${index}`}><i>{index + 1}</i><strong>{stop}</strong><small>{index === 0 ? 'Départ' : index === stops.length - 1 ? 'Retour' : `${7 + index}:2${index}`}</small></div>)}
      </div>
      <div className={styles.transportMeta}><span>Véhicule affecté</span><strong>Capacité contrôlée</strong><span>Responsabilités identifiées</span></div>
    </div>
  )
}

export function SecurityArchitectureVisual() {
  const layers = [
    ['IDENTITÉ', 'Qui êtes-vous ?'], ['RÔLE', 'Pourquoi accédez-vous ?'], ['PERMISSION', 'Que pouvez-vous faire ?'], ['CONTEXTE', 'Dans quel établissement ?'], ['TRACE', 'Que s’est-il passé ?'],
  ]
  return (
    <div className={styles.securityArchitectureVisual}>
      <div className={styles.securityArchitectureCore}><SanilaIcon name="shield" size={30} /><strong>Accès contrôlé</strong><small>Pas de promesse de certification inventée.</small></div>
      {layers.map(([name, question], index) => <div className={styles.securityArchitectureLayer} key={name}><b>{String(index + 1).padStart(2, '0')}</b><strong>{name}</strong><span>{question}</span></div>)}
    </div>
  )
}

export function ExecutiveSignalBoard() {
  const signals = [
    ['Présences', 'Journée', 'À lire'], ['Admissions', 'Pipeline', 'Suivre'], ['Finance', 'Soldes', 'Décider'], ['Transport', 'Circuits', 'Coordonner'],
  ]
  return (
    <div className={styles.executiveSignalBoard}>
      <header><div><span>DIRECTION / LECTURE INSTITUTIONNELLE</span><strong>Des signaux reliés aux responsabilités</strong></div><small>Schéma éditorial — pas un faux dashboard</small></header>
      <div className={styles.executiveSignalGrid}>{signals.map(([domain, object, action], index) => <div key={domain}><span>0{index + 1}</span><strong>{domain}</strong><p>{object}</p><em>{action}</em></div>)}</div>
      <footer><span>Descendre dans le détail</span><i /><span>Décider</span><i /><span>Revenir à la lecture consolidée</span></footer>
    </div>
  )
}

export function StructureTreeVisual() {
  const columns = [
    ['ÉTABLISSEMENT', ['Année scolaire', 'Périodes']],
    ['STRUCTURE', ['Classes', 'Sections', 'Matières']],
    ['RESPONSABILITÉS', ['Affectations', 'Rôles', 'Permissions']],
    ['GOUVERNANCE', ['Paramètres', 'Audit']],
  ]
  return <div className={styles.structureTreeVisual}>{columns.map(([title, items]) => <div key={title as string}><strong>{title}</strong>{(items as string[]).map((item) => <span key={item}>{item}</span>)}</div>)}</div>
}

export function ReportingCanvasVisual() {
  const reports = ['Direction', 'Finance', 'Présences', 'Pédagogie', 'Transport', 'Opérations']
  return <div className={styles.reportingCanvasVisual}><header><span>RAPPORTS</span><strong>La restitution ne vaut que si elle reste reliée à l’opération.</strong></header><div>{reports.map((item, index) => <section key={item}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item}</strong><i style={{ '--report-h': `${42 + index * 7}%` } as CSSProperties} /></section>)}</div></div>
}

export function InstitutionalContextBand({ title, items }: { title: string; items: string[] }) {
  return <div className={styles.institutionalContextBand}><strong>{title}</strong><div>{items.map((item) => <span key={item}>{item}</span>)}</div></div>
}

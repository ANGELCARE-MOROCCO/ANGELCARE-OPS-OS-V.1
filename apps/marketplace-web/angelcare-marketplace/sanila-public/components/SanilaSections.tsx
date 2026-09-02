import Image from 'next/image'
import Link from 'next/link'

import { CUSTOMER_ACCESS, PRODUCT_DOMAINS, sanilaHref } from '../content'
import { SanilaIcon } from '../SanilaIcon'
import type { SanilaPageBlueprint, SanilaVisualMode } from '../types'
import styles from '../SanilaPublic.module.css'

export function PageHero({ page }: { page: SanilaPageBlueprint }) {
  return (
    <section className={styles.hero} data-accent={page.accent} data-mode={page.mode}>
      <div className={styles.heroHalo} />
      <div className={styles.heroGrid}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>{page.eyebrow}</span>
          <h1>{page.title}</h1>
          <p className={styles.heroSubtitle}>{page.subtitle}</p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryButton} href={page.nextHref}>{page.nextStep} <SanilaIcon name="arrow" size={16} /></Link>
            {page.slug !== 'produit' && <Link className={styles.secondaryButton} href={sanilaHref('produit')}>Comprendre le produit</Link>}
          </div>
          <div className={styles.heroQuestion}><span>QUESTION D’ACHAT</span><strong>{page.buyerQuestion}</strong></div>
        </div>
        <div className={styles.heroStage}>
          <ModeVisual page={page} />
          {page.contextualImage && (
            <figure className={styles.heroPhoto}>
              <Image src={page.contextualImage} alt={page.contextualImageAlt || ''} fill sizes="(max-width: 900px) 90vw, 32vw" priority={page.slug === 'accueil'} />
            </figure>
          )}
        </div>
      </div>
      <div className={styles.heroFacts}>
        <div><span>PUBLIC</span><strong>29 pages commerciales SANILA</strong></div>
        <div><span>RÔLES</span><strong>6 autorités d’accès utilisateur distinctes</strong></div>
        <div><span>PRINCIPE</span><strong>Preuve réelle ou diagramme explicatif — jamais de faux dashboard</strong></div>
      </div>
    </section>
  )
}

function ModeVisual({ page }: { page: SanilaPageBlueprint }) {
  const mode = page.mode
  if (mode === 'ledger') return <FinanceVisual />
  if (mode === 'journey') return <JourneyVisual />
  if (mode === 'mobility') return <MobilityVisual />
  if (mode === 'academic') return <AcademicVisual />
  if (mode === 'structure') return <StructureVisual />
  if (mode === 'today') return <TodayVisual />
  if (mode === 'payroll') return <PayrollVisual />
  if (mode === 'trust') return <TrustVisual />
  if (mode === 'implementation') return <ImplementationVisual />
  if (mode === 'reporting') return <ReportingVisual />
  if (mode === 'relationship') return <RelationshipVisual />
  if (mode === 'inventory') return <InventoryVisual />
  if (mode === 'library') return <LibraryVisual />
  if (mode === 'resolution') return <ResolutionVisual />
  if (mode === 'access') return <AccessVisual />
  if (mode === 'pricing') return <PricingVisual />
  if (mode === 'conversion' || mode === 'contact' || mode === 'onboarding') return <ConversionVisual mode={mode} />
  if (mode === 'solutions' || mode === 'institution') return <InstitutionVisual />
  if (mode === 'capability-map') return <CapabilityVisual />
  return <SystemVisual />
}

function VisualFrame({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className={styles.visualFrame}><div className={styles.visualLabel}><span>DIAGRAMME EXPLICATIF</span><strong>{label}</strong></div>{children}</div>
}

function SystemVisual() {
  return <VisualFrame label="Architecture opérationnelle SANILA"><div className={styles.systemOrbit}><div className={styles.systemCore}><strong>SANILA</strong><small>Contexte établissement</small></div>{['Direction','Administration','Pédagogie','Finance','Familles','Opérations'].map((x)=><span key={x}>{x}</span>)}</div></VisualFrame>
}
function CapabilityVisual() {
  return <VisualFrame label="Capability map"><div className={styles.capabilityMini}>{['Piloter','Structurer','Accueillir','Enseigner','Encaisser','Transporter','Communiquer','Restituer'].map((x,i)=><div key={x}><b>{String(i+1).padStart(2,'0')}</b><span>{x}</span></div>)}</div></VisualFrame>
}
function FinanceVisual() {
  return <VisualFrame label="Chaîne financière"><div className={styles.financeFlow}>{['Frais','Facture','Paiement','Reçu','Solde','Relance'].map((x,i)=><div key={x}><span>{i+1}</span><strong>{x}</strong>{i<5&&<em>→</em>}</div>)}</div><div className={styles.financeLedger}><span>Famille / élève</span><strong>Contexte financier</strong><span>Dh • historique • audit</span></div></VisualFrame>
}
function JourneyVisual() {
  return <VisualFrame label="Parcours d’admission"><div className={styles.journeyFlow}>{['Demande','Qualification','Dossier','Documents','Décision','Inscription'].map((x,i)=><div key={x}><small>0{i+1}</small><strong>{x}</strong></div>)}</div></VisualFrame>
}
function MobilityVisual() {
  return <VisualFrame label="Opération transport"><div className={styles.routeMap}><div className={styles.routeLine}/>{['Établissement','Arrêt A','Arrêt B','Arrêt C'].map((x,i)=><div className={styles.routeStop} key={x} style={{left:`${8+i*27}%`}}><span>{i+1}</span><strong>{x}</strong></div>)}<div className={styles.routeVehicle}><SanilaIcon name="bus" size={26}/></div></div><div className={styles.routeMeta}><span>Circuits</span><span>Véhicules</span><span>Affectations</span><span>Sécurité</span></div></VisualFrame>
}
function AcademicVisual() {
  return <VisualFrame label="Continuité pédagogique"><div className={styles.academicStack}>{['Classe & cours','Devoirs & soumissions','Évaluations & examens','Notes & moyennes','Appréciations & bulletins'].map((x,i)=><div key={x} style={{transform:`translateX(${i*12}px)`}}><span>{i+1}</span><strong>{x}</strong></div>)}</div></VisualFrame>
}
function StructureVisual() {
  return <VisualFrame label="Structure établissement"><div className={styles.structureTree}><div className={styles.treeRoot}>Établissement</div><div className={styles.treeLine}/><div className={styles.treeLevel}>{['Année scolaire','Périodes','Classes & sections'].map(x=><span key={x}>{x}</span>)}</div><div className={styles.treeLevel}>{['Matières','Affectations','Rôles & permissions'].map(x=><span key={x}>{x}</span>)}</div></div></VisualFrame>
}
function TodayVisual() {
  return <VisualFrame label="Présences aujourd’hui"><div className={styles.todayBoard}>{['Classe','Présent','Absent','Retard','Justification'].map((x,i)=><div key={x}><span>{i===0?'08:00':'État'}</span><strong>{x}</strong></div>)}</div><p className={styles.visualFootnote}>La composition explique le workflow ; elle ne représente pas une capture écran du produit.</p></VisualFrame>
}
function PayrollVisual() {
  return <VisualFrame label="Cycle de paie"><div className={styles.payrollTrack}>{['Période','Dossiers','Variables','Validation','Paiement','Historique'].map((x,i)=><div key={x}><span>{String(i+1).padStart(2,'0')}</span><strong>{x}</strong></div>)}</div></VisualFrame>
}
function TrustVisual() {
  return <VisualFrame label="Architecture de confiance"><div className={styles.trustArchitecture}><div><strong>Établissement A</strong><span>Utilisateurs autorisés</span></div><div className={styles.trustCore}><SanilaIcon name="shield" size={36}/><strong>Rôles & permissions</strong><span>Contexte + traçabilité</span></div><div><strong>Établissement B</strong><span>Utilisateurs autorisés</span></div></div></VisualFrame>
}
function ImplementationVisual() {
  return <VisualFrame label="Mise en service"><div className={styles.implementationTrack}>{['Diagnostic','Périmètre','Préparation','Configuration','Formation','Validation','Lancement'].map((x,i)=><div key={x}><span>{i+1}</span><strong>{x}</strong></div>)}</div></VisualFrame>
}
function ReportingVisual() {
  return <VisualFrame label="Du travail au rapport"><div className={styles.reportingStack}><div className={styles.reportingSources}>{['Finance','Présences','Académique','Transport'].map(x=><span key={x}>{x}</span>)}</div><div className={styles.reportingArrow}>↓</div><div className={styles.reportingCore}><SanilaIcon name="chart" size={28}/><strong>Lecture consolidée</strong></div><div className={styles.reportingOutputs}>{['PDF A4','CSV/XLSX','Historique','Audit'].map(x=><span key={x}>{x}</span>)}</div></div></VisualFrame>
}
function RelationshipVisual() {
  return <VisualFrame label="Relation établissement-famille"><div className={styles.relationshipLoop}><div><SanilaIcon name="building" size={24}/><strong>Établissement</strong></div><span>Information contextualisée</span><div><SanilaIcon name="heart" size={24}/><strong>Famille</strong></div><span>Question / réclamation</span></div></VisualFrame>
}
function InventoryVisual() {
  return <VisualFrame label="Mouvement d’inventaire"><div className={styles.inventoryFlow}>{['Référencer','Localiser','Mouvementer','Contrôler','Auditer'].map((x,i)=><div key={x}><SanilaIcon name={i===0?'box':i===1?'building':i===2?'layers':i===3?'shield':'file'} size={24}/><strong>{x}</strong></div>)}</div></VisualFrame>
}
function LibraryVisual() {
  return <VisualFrame label="Circulation documentaire"><div className={styles.libraryCycle}>{['Catalogue','Disponible','Prêt','Retour','Historique'].map((x,i)=><div key={x}><span>{i+1}</span><strong>{x}</strong></div>)}</div></VisualFrame>
}
function ResolutionVisual() {
  return <VisualFrame label="Cycle de résolution"><div className={styles.resolutionLane}>{['Recevoir','Qualifier','Prioriser','Assigner','Résoudre','Clôturer'].map((x,i)=><div key={x}><span>{i+1}</span><strong>{x}</strong></div>)}</div></VisualFrame>
}
function AccessVisual() {
  return <VisualFrame label="Autorités d’accès"><div className={styles.accessMini}>{['Établissement','Portail','Enseignant','Personnel','Parent','Élève'].map((x,i)=><div key={x}><span>{i+1}</span><strong>{x}</strong></div>)}</div></VisualFrame>
}
function PricingVisual() {
  return <VisualFrame label="Construction d’une proposition"><div className={styles.pricingLogic}>{['Organisation','Périmètre','Sites & effectifs','Mise en service','Accompagnement'].map((x,i)=><div key={x}><span>0{i+1}</span><strong>{x}</strong></div>)}</div></VisualFrame>
}
function ConversionVisual({mode}:{mode:SanilaVisualMode}) {
  const items = mode === 'onboarding' ? ['Organisation','Profil','Périmètre','Calendrier','Revue AngelCare'] : mode === 'contact' ? ['Intention','Organisation','Contexte','Demande','Traitement'] : ['Établissement','Priorités','Processus actuels','Calendrier','Démonstration']
  return <VisualFrame label={mode === 'onboarding' ? 'Onboarding contrôlé' : mode === 'contact' ? 'Qualification du contact' : 'Qualification de la démonstration'}><div className={styles.conversionPath}>{items.map((x,i)=><div key={x}><span>{i+1}</span><strong>{x}</strong></div>)}</div></VisualFrame>
}
function InstitutionVisual() {
  return <VisualFrame label="Modèle institutionnel"><div className={styles.institutionCards}>{['Crèche & maternelle','École privée','Groupe scolaire'].map((x,i)=><div key={x}><SanilaIcon name={i===0?'heart':i===1?'building':'layers'} size={28}/><strong>{x}</strong><span>{i===0?'Confiance & routines':i===1?'Opérations complètes':'Gouvernance multi-sites'}</span></div>)}</div></VisualFrame>
}

export function RecognitionBand({ page }: { page: SanilaPageBlueprint }) {
  return (
    <section className={styles.recognitionBand}>
      <div><span>CE QUI SE CASSE AUJOURD’HUI</span><h2>{page.problem}</h2></div>
      <div><span>CE QUE SANILA CHERCHE À RÉTABLIR</span><h2>{page.outcome}</h2></div>
    </section>
  )
}

export function WorkflowSection({ page, title = 'Le workflow, pas seulement la fonctionnalité.' }: { page: SanilaPageBlueprint; title?: string }) {
  return (
    <section className={styles.section}>
      <SectionIntro eyebrow="PROCESSUS" title={title} body="Chaque étape garde le contexte nécessaire pour que l’équipe suivante n’ait pas à recommencer l’histoire." />
      <div className={styles.workflowRail}>{page.workflow.map((step, index) => <article key={step.label}><span>{String(index + 1).padStart(2,'0')}</span><div><strong>{step.label}</strong><p>{step.detail}</p></div></article>)}</div>
    </section>
  )
}

export function ProofSection({ page }: { page: SanilaPageBlueprint }) {
  return (
    <section className={`${styles.section} ${styles.proofSection}`}>
      <SectionIntro eyebrow="PREUVE & COHÉRENCE" title="Ce que la source produit permet d’affirmer honnêtement." body="Le public SANILA distingue les capacités physiquement présentes des captures qui nécessitent une session authentifiée autorisée." />
      <div className={styles.proofGrid}>{page.proofPoints.map((proof, index) => <article key={proof.title}><span>0{index+1}</span><SanilaIcon name={index===0?'check':index===1?'layers':'shield'} size={22}/><strong>{proof.title}</strong><p>{proof.detail}</p></article>)}</div>
      <div className={styles.sourceEvidence}>
        <div><span>SOURCE-DERIVED PRODUCT EVIDENCE</span><strong>Autorités retrouvées dans le recovery source</strong></div>
        <ul>{page.evidenceSources.map((source) => <li key={`${source.type}-${source.sourcePath}`}><SanilaIcon name="check" size={15}/><span>{source.label}</span><small>{source.type === 'route' ? 'Route produit vérifiée' : source.type === 'component' ? 'Composant produit vérifié' : 'Asset produit existant'}</small></li>)}</ul>
        <p>Les captures d’écrans authentifiées sont générées après application lorsqu’une session autorisée est disponible. Aucune interface fictive n’est utilisée pour combler ce manque.</p>
      </div>
    </section>
  )
}

export function CapabilitiesSection({ page }: { page: SanilaPageBlueprint }) {
  return (
    <section className={`${styles.section} ${styles.capabilitiesSection}`}>
      <SectionIntro eyebrow="CAPACITÉS" title="Un vocabulaire métier, pas une grille de fonctionnalités génériques." body={page.statement} />
      <div className={styles.capabilityGrid}>{page.features.map((feature, index) => <div key={feature}><span>{String(index + 1).padStart(2,'0')}</span><strong>{feature}</strong></div>)}</div>
    </section>
  )
}

export function ContextSection({ page }: { page: SanilaPageBlueprint }) {
  if (!page.contextualImage) return null
  return (
    <section className={`${styles.section} ${styles.contextSection}`}>
      <figure className={styles.contextPhoto}><Image src={page.contextualImage} alt={page.contextualImageAlt || ''} fill sizes="(max-width: 900px) 92vw, 48vw" /></figure>
      <div className={styles.contextCopy}><span className={styles.kicker}>CONTEXTE HUMAIN</span><h2>Le système reste invisible lorsqu’il fait correctement son travail.</h2><p>SANILA organise les opérations pour que les équipes puissent se concentrer sur l’établissement, l’enseignement et la relation avec les familles — sans transformer le quotidien en démonstration technologique.</p><blockquote>« Même institution, responsabilités différentes, expérience appropriée. »</blockquote></div>
    </section>
  )
}

export function RoleExperienceSection() {
  const roles = [
    {title:'Direction',body:'Décider avec une lecture consolidée des priorités.',href:'/angelcare-360-access/login',image:'/sanila/gateway/sanila-gateway-admin.webp'},
    {title:'Administration',body:'Structurer les dossiers, classes, périodes et opérations.',href:'/angelcare-360-access/login',image:'/sanila/gateway/sanila-gateway-admin.webp'},
    {title:'Enseignant',body:'Cours, devoirs, évaluations et suivi pédagogique.',href:'/angelcare-360-teacher/login',image:'/sanila/teacher-login/sanila-teacher-morocco-approved.webp'},
    {title:'Personnel',body:'Accéder aux actions correspondant au rôle opérationnel.',href:'/angelcare-360-staff/login',image:'/sanila/staff-login/sanila-staff-morocco-approved.webp'},
    {title:'Parent',body:'Retrouver les informations autorisées par l’établissement.',href:'/angelcare-360-parent/login',image:'/sanila/parent-login/sanila-parent-morocco-approved.webp'},
    {title:'Élève',body:'Accéder à une expérience contrôlée selon la politique établissement.',href:'/angelcare-360-student/login',image:'/sanila/student-login/sanila-student-morocco-approved.webp'},
  ]
  return (
    <section className={`${styles.section} ${styles.rolesSection}`}>
      <SectionIntro eyebrow="6 EXPÉRIENCES" title="Le même établissement. Une expérience adaptée à chacun." body="SANILA ne demande pas à un parent, un enseignant et une direction de travailler dans la même interface." />
      <div className={styles.roleMosaic}>{roles.map((role, i)=><article key={role.title} className={styles[`roleCard${i+1}` as keyof typeof styles]}><figure><Image src={role.image} alt="" fill sizes="(max-width: 760px) 90vw, 28vw" /></figure><div><span>RÔLE {String(i+1).padStart(2,'0')}</span><strong>{role.title}</strong><p>{role.body}</p><Link href={role.href}>Accéder à l’autorité réelle <SanilaIcon name="arrow" size={14}/></Link></div></article>)}</div>
    </section>
  )
}

export function DayWithSanilaSection({ page }: { page?: SanilaPageBlueprint }) {
  const steps = page?.slug === 'accueil' ? page.workflow : [
    {label:'07:30',detail:'Administration — ouverture de la journée'},
    {label:'07:55',detail:'Présences — classes et exceptions'},
    {label:'09:30',detail:'Admissions — nouvelle demande famille'},
    {label:'11:00',detail:'Finance — paiement, reçu et solde'},
    {label:'13:40',detail:'Pédagogie — devoir ou évaluation'},
    {label:'15:45',detail:'Transport — préparation des circuits'},
    {label:'18:00',detail:'Direction — lecture de clôture'},
  ]
  return (
    <section className={`${styles.section} ${styles.daySection}`}>
      <SectionIntro eyebrow="UNE JOURNÉE AVEC SANILA" title="Le système suit le rythme réel de l’établissement." body="Une journée scolaire traverse plusieurs métiers. SANILA donne une continuité à ces passages sans prétendre que tous les utilisateurs font le même travail." />
      <div className={styles.dayTimeline}>{steps.map((step,index)=><div key={`${step.label}-${index}`}><time>{step.label.includes('•')?step.label.split('•')[0].trim():step.label}</time><span><strong>{step.label.includes('•')?step.label.split('•').slice(1).join('•').trim():step.detail.split('—')[0].trim()}</strong><p>{step.label.includes('•')?step.detail:step.detail.split('—').slice(1).join('—').trim()}</p></span></div>)}</div>
    </section>
  )
}

export function BeforeAfterSection() {
  const rows = [
    ['Demande famille dans WhatsApp','Demande reliée à un parcours d’admission'],
    ['Fichier séparé pour les paiements','Facture, paiement, reçu, solde et relance reliés'],
    ['Présences reconstruites après coup','Routine quotidienne dans un espace dédié'],
    ['Informations pédagogiques dispersées','Cours, devoirs, évaluations et résultats dans la continuité académique'],
    ['Transport coordonné par messages','Circuits, arrêts, véhicules et affectations structurés'],
    ['Réclamation sans propriétaire clair','Priorité, assignation, résolution et audit'],
  ]
  return <section className={`${styles.section} ${styles.beforeAfter}`}><SectionIntro eyebrow="AVANT / AVEC SANILA" title="Réduire les ruptures entre les équipes." body="L’objectif n’est pas de remplacer un fichier par une autre interface. Il est de restaurer la continuité entre les moments qui composent la vie de l’établissement."/><div className={styles.compareTable}><div className={styles.compareHead}><span>Fragmentation</span><strong>Continuité SANILA</strong></div>{rows.map(row=><div className={styles.compareRow} key={row[0]}><span>{row[0]}</span><strong><SanilaIcon name="arrow" size={15}/>{row[1]}</strong></div>)}</div></section>
}

export function DomainExplorer({ currentSlug }: { currentSlug?: string }) {
  return <section className={`${styles.section} ${styles.domainExplorer}`}><SectionIntro eyebrow="EXPLORER LE SYSTÈME" title="Chaque domaine possède son propre travail." body="La cohérence vient du design system. La crédibilité vient de compositions et workflows adaptés à chaque métier."/><div className={styles.domainCards}>{PRODUCT_DOMAINS.map((domain,i)=><Link data-current={domain.slug===currentSlug?'true':'false'} href={sanilaHref(domain.slug)} key={domain.slug}><span>{String(i+1).padStart(2,'0')}</span><strong>{domain.nav}</strong><p>{domain.buyerQuestion}</p><em>Explorer <SanilaIcon name="arrow" size={14}/></em></Link>)}</div></section>
}

export function SolutionCards() {
  const items = [
    {slug:'solutions/creches-maternelles',title:'Crèches & maternelles',body:'Confiance familles, routines, équipes, paiements et sécurité.',icon:'heart' as const},
    {slug:'solutions/ecoles-privees',title:'Écoles privées',body:'Administration, pédagogie, finance, familles et opérations dans un même système.',icon:'building' as const},
    {slug:'solutions/groupes-scolaires',title:'Groupes scolaires',body:'Gouvernance multi-sites, standards communs et contexte local.',icon:'layers' as const},
  ]
  return <section className={`${styles.section} ${styles.solutionSection}`}><SectionIntro eyebrow="SELON VOTRE MODÈLE" title="Même plateforme. Priorités commerciales différentes." body="La conversation commence par votre institution, pas par notre menu."/><div className={styles.solutionCards}>{items.map((item,i)=><Link href={sanilaHref(item.slug)} key={item.slug}><span>0{i+1}</span><SanilaIcon name={item.icon} size={30}/><strong>{item.title}</strong><p>{item.body}</p><em>Voir la solution <SanilaIcon name="arrow" size={15}/></em></Link>)}</div></section>
}

export function AccessLobby() {
  return <section className={`${styles.section} ${styles.accessSection}`} id="acces"><SectionIntro eyebrow="ACCÈS AUTHENTIFIÉS" title="Choisissez l’espace qui correspond réellement à votre rôle." body="Ces cartes pointent vers les six autorités d’accès existantes. Les outils internes AngelCare ne sont pas exposés au public."/><div className={styles.accessGrid}>{CUSTOMER_ACCESS.map((entry,i)=><Link href={entry.href} key={entry.href}><figure>{entry.image&&<Image src={entry.image} alt="" fill sizes="(max-width: 760px) 90vw, 30vw" />}</figure><div><span>ACCÈS 0{i+1}</span><strong>{entry.title}</strong><p>{entry.description}</p><em>Continuer <SanilaIcon name="arrow" size={15}/></em></div></Link>)}</div></section>
}

export function FAQSection() {
  const questions = [
    ['À qui s’adresse SANILA ?', 'Aux établissements qui veulent relier administration, pédagogie, finance, opérations et relation familles dans une architecture cohérente. Le périmètre exact dépend de l’organisation et de la configuration retenue.'],
    ['Tous les utilisateurs ont-ils la même interface ?', 'Non. Direction, administration, enseignants, personnel, parents et élèves disposent d’expériences distinctes selon leur rôle et leurs autorisations.'],
    ['SANILA crée-t-il automatiquement un établissement depuis le site public ?', 'Non. “Créer mon établissement SANILA” est une demande d’onboarding guidée. La création d’un environnement production reste contrôlée et revue par AngelCare.'],
    ['Comment se déroule la mise en service ?', 'Le parcours couvre diagnostic, périmètre, préparation, configuration, accès, accompagnement, validation et lancement. La durée dépend de la réalité de l’établissement et du périmètre convenu.'],
    ['WhatsApp, SMS, GPS ou paiements externes sont-ils automatiquement actifs ?', 'Non. Les capacités dépendant d’un fournisseur, d’une infrastructure ou d’une configuration ne sont pas présentées comme actives avant que les conditions nécessaires soient réunies.'],
    ['Comment sont gouvernés les accès ?', 'Le produit contient des mécanismes d’authentification, rôles, permissions, contextes établissement et audits dans plusieurs domaines. Les détails de sécurité doivent être évalués sur le périmètre réellement déployé.'],
    ['SANILA convient-il à plusieurs sites ?', 'Le produit possède une logique de contexte établissement, de rôles et de gouvernance qui permet d’adresser les besoins multi-sites. La configuration exacte doit être qualifiée avec le groupe scolaire.'],
    ['Les tarifs sont-ils publics ?', 'Pas dans cette version du site, car aucune grille publique contractuelle ne doit être inventée. La proposition est construite sur l’organisation, les sites, les effectifs, le périmètre et la mise en service.'],
  ]
  return <section className={`${styles.section} ${styles.faqSection}`}><SectionIntro eyebrow="FAQ" title="Des réponses précises, sans promesse absolue." body="Lorsqu’une réponse dépend de votre contexte, SANILA le dit clairement au lieu d’inventer une certitude commerciale."/><div className={styles.faqList}>{questions.map(([q,a])=><details key={q}><summary>{q}<span>+</span></summary><p>{a}</p></details>)}</div></section>
}

export function ResourcesSection() {
  const items=[
    ['Comprendre le produit','Architecture SANILA, rôles et continuité opérationnelle','produit','layers' as const],
    ['Explorer les fonctionnalités','Capability map par domaine métier','fonctionnalites','chart' as const],
    ['Sécurité & confiance','Rôles, permissions, séparation et trace','securite','shield' as const],
    ['Mise en service','Du diagnostic au lancement','mise-en-service','calendar' as const],
    ['Questions fréquentes','Réponses aux objections d’achat','faq','message' as const],
    ['Demander une démonstration','Qualifier votre établissement et vos priorités','demonstration','spark' as const],
  ]
  return <section className={`${styles.section} ${styles.resourcesSection}`}><SectionIntro eyebrow="RESSOURCES RÉELLES" title="Approfondir sans cliquer sur des contenus qui n’existent pas." body="Chaque carte conduit vers une ressource ou une action réellement présente dans SANILA Public V2."/><div className={styles.resourceGrid}>{items.map(([title,body,slug,icon])=><Link key={String(slug)} href={sanilaHref(String(slug))}><SanilaIcon name={icon as any} size={27}/><strong>{title}</strong><p>{body}</p><em>Ouvrir <SanilaIcon name="arrow" size={14}/></em></Link>)}</div></section>
}

export function PricingSection() {
  const items=[['Organisation','Type d’établissement, sites, effectifs et profils utilisateurs.'],['Périmètre','Domaines SANILA réellement nécessaires à votre fonctionnement.'],['Mise en service','Préparation, configuration, accès, accompagnement et validation.'],['Exploitation','Contexte contractuel et capacités conditionnelles ou externes.']]
  return <section className={`${styles.section} ${styles.pricingSection}`}><SectionIntro eyebrow="CONSTRUCTION DE L’OFFRE" title="Une proposition alignée sur le périmètre réel." body="Aucun prix ou package n’est fabriqué pour remplir la page."/><div className={styles.pricingCards}>{items.map((x,i)=><article key={x[0]}><span>0{i+1}</span><strong>{x[0]}</strong><p>{x[1]}</p></article>)}</div><div className={styles.centerAction}><Link className={styles.primaryButton} href={sanilaHref('demonstration')}>Recevoir une proposition qualifiée <SanilaIcon name="arrow" size={16}/></Link></div></section>
}

export function ImplementationSection() {
  const steps=[['Diagnostic','Comprendre l’organisation actuelle, les priorités et les contraintes.'],['Périmètre','Définir les domaines et utilisateurs concernés.'],['Préparation','Rassembler structures, données et responsables nécessaires.'],['Configuration','Mettre en place le contexte, les rôles et paramètres convenus.'],['Accompagnement','Préparer les équipes à leurs expériences respectives.'],['Validation','Tester le périmètre avant ouverture.'],['Lancement','Ouvrir de manière contrôlée puis accompagner l’exploitation.']]
  return <section className={`${styles.section} ${styles.implementationSection}`}><SectionIntro eyebrow="MISE EN SERVICE" title="Un projet avec des étapes et des responsabilités visibles." body="SANILA n’invente pas une activation instantanée. Une institution mérite un lancement préparé."/><div className={styles.implementationList}>{steps.map((step,i)=><article key={step[0]}><span>{String(i+1).padStart(2,'0')}</span><div><strong>{step[0]}</strong><p>{step[1]}</p></div></article>)}</div><div className={styles.centerAction}><Link className={styles.secondaryButton} href={sanilaHref('creer-mon-etablissement')}>Préparer mon établissement</Link></div></section>
}

export function FinalCTA({ page }: { page: SanilaPageBlueprint }) {
  return <section className={styles.finalCta} data-accent={page.accent}><span>PROCHAINE ÉTAPE</span><h2>Ne choisissez pas SANILA sur une promesse. Évaluez-le sur votre réalité.</h2><p>Présentez-nous votre établissement, vos priorités et vos processus actuels. La démonstration doit ensuite se concentrer sur ce qui peut réellement changer votre fonctionnement.</p><div><Link className={styles.ctaLight} href={page.nextHref}>{page.nextStep} <SanilaIcon name="arrow" size={16}/></Link><Link className={styles.ctaGhost} href={sanilaHref('contact')}>Parler à l’équipe</Link></div></section>
}

export function SectionIntro({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return <div className={styles.sectionIntro}><span>{eyebrow}</span><h2>{title}</h2>{body && <p>{body}</p>}</div>
}

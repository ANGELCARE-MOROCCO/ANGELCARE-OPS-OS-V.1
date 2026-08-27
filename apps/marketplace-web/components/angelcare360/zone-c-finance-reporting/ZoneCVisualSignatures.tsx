'use client'

import type { ReactNode } from 'react'

import Link from 'next/link'
import ZoneCIcon, { type ZoneCIconName } from './ZoneCIcon'
import type { ZoneCSurfaceKey } from './zone-c-registry'
import styles from './ZoneCFrame.module.css'

type SignatureProps = { surface: ZoneCSurfaceKey; onOpenCommand: (id: string) => void }

type PillProps = { icon: ZoneCIconName; label: string; tone?: string }
function Pill({icon,label,tone='neutral'}:PillProps){return <span className={styles.signaturePill} data-tone={tone}><ZoneCIcon name={icon}/><span>{label}</span></span>}
function Stage({label,detail,active=false}: {label:string;detail:string;active?:boolean}){return <div className={styles.flowStage} data-active={active?'true':'false'}><span className={styles.flowDot}/><strong>{label}</strong><small>{detail}</small></div>}
function MiniCard({eyebrow,title,text,icon='finance'}:{eyebrow:string;title:string;text:string;icon?:ZoneCIconName}){return <div className={styles.miniCard}><span className={styles.miniIcon}><ZoneCIcon name={icon}/></span><div><span className={styles.miniEyebrow}>{eyebrow}</span><strong className={styles.miniTitle}>{title}</strong><p className={styles.miniText}>{text}</p></div></div>}
function Action({children,onClick}:{children:ReactNode;onClick:()=>void}){return <button type="button" className={styles.signatureAction} onClick={onClick}>{children}<ZoneCIcon name="arrow"/></button>}

function FinanceRoot({onOpenCommand}:{onOpenCommand:(id:string)=>void}){
  return <section className={`${styles.signature} ${styles.financeTower}`} data-zone-c-signature="finance-control-tower">
    <div className={styles.signatureHead}><div><span className={styles.signatureEyebrow}>FINANCE CONTROL TOWER</span><h2>Cash & Receivables Runway</h2><p>Une lecture opérationnelle du cycle financier — de la structure de frais jusqu’au solde expliqué — sans raccourci comptable.</p></div><div className={styles.signatureBadge}>VÉRITÉ FINANCIÈRE</div></div>
    <div className={styles.runwayGrid}>
      <div className={styles.runwayTrack}>
        <Stage label="Frais" detail="Définir" active/><Stage label="Affecter" detail="Appliquer"/><Stage label="Facturer" detail="Créer la créance"/><Stage label="Encaisser" detail="Recevoir"/><Stage label="Affecter paiement" detail="Régler précisément"/><Stage label="Expliquer solde" detail="Reconstruire"/>
      </div>
      <div className={styles.commandStack}>
        <MiniCard eyebrow="Créances" title="Factures ouvertes" text="Le dossier facture conserve montant, échéance, paiements et solde restant." icon="invoice"/>
        <MiniCard eyebrow="Encaissements" title="Affectation avant conclusion" text="Un paiement reste distinct de son allocation et de l’état final de la facture." icon="payment"/>
        <MiniCard eyebrow="Intégrité" title="Aucun solde orphelin" text="Chaque solde doit ouvrir ses écritures contributrices et son historique." icon="balance"/>
      </div>
    </div>
    <div className={styles.signatureFooter}><Pill icon="lock" label="PDF non activé" tone="locked"/><Pill icon="lock" label="Paiement en ligne non activé" tone="locked"/><Pill icon="shield" label="Audit préservé" tone="success"/><Action onClick={()=>onOpenCommand('finance-integrity')}>Ouvrir la chambre d’intégrité</Action></div>
  </section>
}

function Fees({onOpenCommand}:{onOpenCommand:(id:string)=>void}){
  return <section className={`${styles.signature} ${styles.feeStudio}`} data-zone-c-signature="fee-architecture-studio">
    <div className={styles.splitTitle}><div><span className={styles.signatureEyebrow}>FEE ARCHITECTURE STUDIO</span><h2>Construire le tarif avant de créer la créance</h2></div><Action onClick={()=>onOpenCommand('fee-builder')}>Préparer un frais</Action></div>
    <div className={styles.architectureCanvas}>
      <div className={styles.archLayer}><span>01</span><strong>Structure</strong><small>Nom · catégorie · montant · périodicité</small></div>
      <div className={styles.archConnector}>→</div>
      <div className={styles.archLayer}><span>02</span><strong>Portée</strong><small>Année · classe · programme · période</small></div>
      <div className={styles.archConnector}>→</div>
      <div className={styles.archLayer}><span>03</span><strong>Affectation</strong><small>Élève / classe réellement concerné</small></div>
      <div className={styles.archConnector}>→</div>
      <div className={styles.archLayer}><span>04</span><strong>Facturation</strong><small>Créance créée par le flux canonique</small></div>
    </div>
    <div className={styles.signatureFooter}><Pill icon="fee" label="Définition ≠ affectation"/><Pill icon="invoice" label="Affectation ≠ facture"/><Pill icon="history" label="Versions reconstructibles" tone="success"/></div>
  </section>
}

function FeeAssignments({onOpenCommand}:{onOpenCommand:(id:string)=>void}){
  return <section className={`${styles.signature} ${styles.assignmentCommand}`} data-zone-c-signature="fee-assignment-command">
    <div className={styles.signatureHead}><div><span className={styles.signatureEyebrow}>FEE ASSIGNMENT COMMAND</span><h2>La bonne règle, sur la bonne cible, pour la bonne période</h2><p>L’expérience sépare ce qui existe dans le catalogue de ce qui a réellement été appliqué à une scolarité.</p></div><span className={styles.signatureBadge}>IMPACT AVANT ACTION</span></div>
    <div className={styles.assignmentMap}>
      <MiniCard eyebrow="Source" title="Frais sélectionné" text="Structure tarifaire canonique et période d’effet." icon="fee"/>
      <div className={styles.assignmentArrow}><ZoneCIcon name="arrow"/></div>
      <MiniCard eyebrow="Cible" title="Élève ou classe" text="Contexte académique humain, sans identifiant technique visible." icon="shield"/>
      <div className={styles.assignmentArrow}><ZoneCIcon name="arrow"/></div>
      <MiniCard eyebrow="Conséquence" title="Affectation réelle" text="Le flux existant reste l’unique autorité de création." icon="check"/>
    </div>
    <div className={styles.signatureFooter}><Action onClick={()=>onOpenCommand('fee-assignment')}>Chambre d’affectation</Action><Pill icon="warning" label="Contrôle doublon" tone="warning"/><Pill icon="history" label="Portée & date visibles"/></div>
  </section>
}

function Invoices({onOpenCommand}:{onOpenCommand:(id:string)=>void}){
  return <section className={`${styles.signature} ${styles.invoiceBoard}`} data-zone-c-signature="invoice-operations-board">
    <div className={styles.splitTitle}><div><span className={styles.signatureEyebrow}>INVOICE OPERATIONS BOARD</span><h2>Créances lisibles par état financier réel</h2></div><Action onClick={()=>onOpenCommand('invoice-review')}>Chambre facture</Action></div>
    <div className={styles.laneBoard}>
      {[
        ['ÉMISES','Créance créée','azure'],['À ÉCHÉANCE','Date proche','amber'],['EN RETARD','Échéance dépassée','coral'],['PARTIELLES','Solde restant','violet'],['RÉGLÉES','Allocation complète','emerald'],['À VÉRIFIER','Cohérence','slate']
      ].map(([title,detail,tone])=><div key={title} className={styles.lane} data-tone={tone}><span className={styles.laneTop}/><strong>{title}</strong><small>{detail}</small><span className={styles.laneHint}>Ouvre les dossiers réels ci-dessous</span></div>)}
    </div>
    <div className={styles.signatureFooter}><Pill icon="invoice" label="Montant original"/><Pill icon="payment" label="Paiements affectés"/><Pill icon="balance" label="Solde restant"/><Pill icon="reminder" label="Échéance & suivi"/></div>
  </section>
}

function InvoiceDetail({onOpenCommand}:{onOpenCommand:(id:string)=>void}){
  return <section className={`${styles.signature} ${styles.invoiceDossier}`} data-zone-c-signature="invoice-control-dossier">
    <div className={styles.signatureHead}><div><span className={styles.signatureEyebrow}>INVOICE CONTROL DOSSIER</span><h2>Une facture, toutes ses preuves autour</h2></div><div className={styles.dossierTabs}><span>Résumé</span><span>Lignes</span><span>Paiements</span><span>Remises</span><span>Relances</span><span>Historique</span></div></div>
    <div className={styles.evidenceStack}>
      <div className={styles.evidencePrimary}><ZoneCIcon name="invoice"/><strong>Facture canonique</strong><small>Montant · émission · échéance · état</small></div>
      <div className={styles.evidenceBranch}><MiniCard eyebrow="Composition" title="Lignes" text="Origine du montant facturé." icon="fee"/><MiniCard eyebrow="Règlement" title="Affectations" text="Ce que chaque paiement a réellement réglé." icon="payment"/><MiniCard eyebrow="Exception" title="Remises" text="Décisions financières contextualisées." icon="discount"/></div>
    </div>
    <div className={styles.signatureFooter}><Action onClick={()=>onOpenCommand('invoice-line')}>Lire la ligne financière</Action><Action onClick={()=>onOpenCommand('payment-allocation')}>Préparer l’affectation</Action><Pill icon="history" label="Avant / après conservé" tone="success"/></div>
  </section>
}

function Payments({onOpenCommand}:{onOpenCommand:(id:string)=>void}){
  return <section className={`${styles.signature} ${styles.paymentLedger}`} data-zone-c-signature="payment-command-ledger">
    <div className={styles.signatureHead}><div><span className={styles.signatureEyebrow}>PAYMENT COMMAND LEDGER</span><h2>Encaissement reçu → allocation explicite → règlement réel</h2><p>Aucune somme reçue n’est silencieusement transformée en facture réglée.</p></div><Action onClick={()=>onOpenCommand('payment-capture')}>Préparer un paiement</Action></div>
    <div className={styles.allocationDiagram}>
      <div className={styles.paymentNode}><ZoneCIcon name="payment"/><span>PAIEMENT REÇU</span><strong>Montant réel sélectionné</strong></div>
      <div className={styles.allocationRail}><span/><span/><span/></div>
      <div className={styles.invoiceNodes}><div><strong>Facture A</strong><small>Solde disponible</small></div><div><strong>Facture B</strong><small>Solde disponible</small></div><div><strong>Non affecté</strong><small>Reste du paiement</small></div></div>
    </div>
    <div className={styles.signatureFooter}><Action onClick={()=>onOpenCommand('payment-allocation')}>Allocation Integrity Chamber</Action><Pill icon="warning" label="Partiel reste ouvert" tone="warning"/><Pill icon="check" label="Règlement seulement après allocation" tone="success"/></div>
  </section>
}

function PaymentDetail({onOpenCommand}:{onOpenCommand:(id:string)=>void}){
  return <section className={`${styles.signature} ${styles.paymentEvidence}`} data-zone-c-signature="payment-evidence-dossier">
    <div className={styles.splitTitle}><div><span className={styles.signatureEyebrow}>PAYMENT EVIDENCE DOSSIER</span><h2>Tracer le paiement depuis sa preuve jusqu’à ses factures</h2></div><Action onClick={()=>onOpenCommand('payment-evidence')}>Chambre de preuve</Action></div>
    <div className={styles.evidenceChain}>
      {[['Réception','Date · méthode · référence','payment'],['Vérification','Preuve & contexte','shield'],['Affectation','Facture(s) réellement réglée(s)','invoice'],['Reçu','Readiness documentaire','receipt'],['Historique','Corrections & acteurs','history']].map(([a,b,icon],i)=><div key={a} className={styles.chainItem}><span>{String(i+1).padStart(2,'0')}</span><ZoneCIcon name={icon as ZoneCIconName}/><strong>{a}</strong><small>{b}</small></div>)}
    </div>
    <div className={styles.signatureFooter}><Pill icon="payment" label="Paiement ≠ allocation"/><Pill icon="receipt" label="Reçu ≠ PDF"/><Pill icon="history" label="Correction traçable" tone="success"/></div>
  </section>
}

function Receipts({onOpenCommand}:{onOpenCommand:(id:string)=>void}){
  return <section className={`${styles.signature} ${styles.receiptDesk}`} data-zone-c-signature="receipt-control-desk">
    <div className={styles.receiptShield}><ZoneCIcon name="receipt"/><div><span>RECEIPT CONTROL DESK</span><h2>Traçabilité disponible. Document PDF non activé.</h2><p>Le registre de reçu reste consultable sans fabriquer un fichier que l’infrastructure ne sait pas encore produire.</p></div></div>
    <div className={styles.readinessColumns}><div data-state="ready"><strong>Registre</strong><span>Référence, paiement, montant, date</span></div><div data-state="ready"><strong>Contexte</strong><span>Facture(s) et affectations réelles</span></div><div data-state="locked"><strong>PDF</strong><span>Moteur documentaire non activé</span></div></div>
    <div className={styles.signatureFooter}><Action onClick={()=>onOpenCommand('receipt-readiness')}>Vérifier la readiness</Action><Pill icon="lock" label="Aucun faux téléchargement" tone="locked"/></div>
  </section>
}

function Discounts({onOpenCommand}:{onOpenCommand:(id:string)=>void}){
  return <section className={`${styles.signature} ${styles.discountAuthority}`} data-zone-c-signature="discount-authority">
    <div className={styles.splitTitle}><div><span className={styles.signatureEyebrow}>DISCOUNT & EXCEPTION AUTHORITY</span><h2>Décider avec l’impact financier sous les yeux</h2></div><Action onClick={()=>onOpenCommand('discount-decision')}>Décision de remise</Action></div>
    <div className={styles.beforeAfter}><div><span>AVANT</span><strong>Montant actuel</strong><small>Créance avant décision</small></div><div className={styles.impactArrow}><ZoneCIcon name="arrow"/><span>Motif · autorité · portée</span></div><div><span>APRÈS</span><strong>Montant résultant</strong><small>Impact uniquement si mutation acceptée</small></div></div>
    <div className={styles.signatureFooter}><Pill icon="discount" label="Demandée ≠ approuvée"/><Pill icon="shield" label="Autorité requise" tone="success"/><Pill icon="history" label="Décision historisée"/></div>
  </section>
}

function Reminders({onOpenCommand}:{onOpenCommand:(id:string)=>void}){
  return <section className={`${styles.signature} ${styles.collectionsCommand}`} data-zone-c-signature="collections-command">
    <div className={styles.signatureHead}><div><span className={styles.signatureEyebrow}>COLLECTIONS & FOLLOW-UP COMMAND</span><h2>Suivre la créance sans transformer le suivi en pression opaque</h2><p>La Finance explique le montant. Relation Parents porte la continuité de communication. Le moteur de communication confirme la livraison.</p></div><Action onClick={()=>onOpenCommand('collections-followup')}>Préparer le suivi</Action></div>
    <div className={styles.followupTimeline}><Stage label="Échéance" detail="Date réelle" active/><Stage label="Constat" detail="Solde restant"/><Stage label="Préparation" detail="Contexte famille"/><Stage label="Handoff" detail="Relation Parents"/><Stage label="Livraison" detail="Moteur communication"/><Stage label="Résultat" detail="Retour dans Finance"/></div>
    <div className={styles.signatureFooter}><Pill icon="lock" label="Préparée ≠ livrée" tone="locked"/><Pill icon="reminder" label="Suivi factuel"/><Pill icon="shield" label="Aucun score mauvais payeur" tone="success"/></div>
  </section>
}

function Balances({onOpenCommand}:{onOpenCommand:(id:string)=>void}){
  return <section className={`${styles.signature} ${styles.balanceCommand}`} data-zone-c-signature="balance-command">
    <div className={styles.balanceQuestion}><span>POURQUOI CE SOLDE ?</span><h2>Chaque montant doit pouvoir s’expliquer en un clic.</h2></div>
    <div className={styles.balanceEquation}><div><ZoneCIcon name="invoice"/><strong>Factures</strong><small>Charges réelles</small></div><span>−</span><div><ZoneCIcon name="payment"/><strong>Paiements</strong><small>Affectations réelles</small></div><span>−</span><div><ZoneCIcon name="discount"/><strong>Remises</strong><small>Décisions appliquées</small></div><span>=</span><div className={styles.balanceResult}><ZoneCIcon name="balance"/><strong>Solde</strong><small>Reste explicable</small></div></div>
    <div className={styles.signatureFooter}><Action onClick={()=>onOpenCommand('balance-explanation')}>Ouvrir Pourquoi ce solde ?</Action><Action onClick={()=>onOpenCommand('family-financial-quickpeek')}>Contexte famille</Action><Pill icon="shield" label="Zéro solde orphelin" tone="success"/></div>
  </section>
}

function Statements({onOpenCommand}:{onOpenCommand:(id:string)=>void}){
  return <section className={`${styles.signature} ${styles.statementAtelier}`} data-zone-c-signature="statement-atelier">
    <div className={styles.splitTitle}><div><span className={styles.signatureEyebrow}>ACCOUNT STATEMENT ATELIER</span><h2>Une chronologie financière, pas un simple total</h2></div><Action onClick={()=>onOpenCommand('statement-review')}>Revue du relevé</Action></div>
    <div className={styles.statementTimeline}><div className={styles.statementLine}/>{[['Facture','Charge institutionnelle','invoice'],['Paiement','Encaissement','payment'],['Remise','Exception appliquée','discount'],['Affectation','Lien paiement ↔ facture','check'],['Solde courant','Résultat explicable','balance']].map(([a,b,icon],i)=><div className={styles.statementEvent} key={a}><span>{i+1}</span><ZoneCIcon name={icon as ZoneCIconName}/><div><strong>{a}</strong><small>{b}</small></div></div>)}</div>
    <div className={styles.signatureFooter}><Pill icon="statement" label="Prévisualisation écran"/><Pill icon="lock" label="PDF non activé" tone="locked"/><Pill icon="history" label="Historique conservé" tone="success"/></div>
  </section>
}

function Expenses({onOpenCommand}:{onOpenCommand:(id:string)=>void}){
  return <section className={`${styles.signature} ${styles.expenseBoard}`} data-zone-c-signature="expense-control-board">
    <div className={styles.signatureHead}><div><span className={styles.signatureEyebrow}>EXPENSE CONTROL BOARD</span><h2>Dépense, preuve, état et historique — sans prétendre être la comptabilité générale</h2></div><Action onClick={()=>onOpenCommand('expense-entry')}>Préparer une dépense</Action></div>
    <div className={styles.expenseMatrix}>{[['Nature','Ce qui a été acheté / engagé'],['Montant','Somme enregistrée'],['Preuve','Document ou référence disponible'],['État','Statut réellement porté par le backend'],['Historique','Acteurs et changements']].map(([a,b],i)=><div key={a} data-index={i}><span>{String(i+1).padStart(2,'0')}</span><strong>{a}</strong><small>{b}</small></div>)}</div>
    <div className={styles.signatureFooter}><Action onClick={()=>onOpenCommand('expense-evidence')}>Chambre de preuve</Action><Pill icon="warning" label="Saisie ≠ validation" tone="warning"/><Pill icon="lock" label="Validation ≠ virement bancaire" tone="locked"/></div>
  </section>
}

function FinanceAudit({onOpenCommand}:{onOpenCommand:(id:string)=>void}){
  return <section className={`${styles.signature} ${styles.integrityLens}`} data-zone-c-signature="financial-integrity-lens">
    <div className={styles.integrityCore}><ZoneCIcon name="audit"/><div><span>FINANCIAL INTEGRITY LENS</span><h2>Avant → action → après → preuve</h2><p>La correction financière enrichit l’histoire ; elle ne fait jamais disparaître l’état précédent.</p></div></div>
    <div className={styles.integrityTimeline}>{[['AVANT','État financier original'],['ACTION','Mutation ou correction canonique'],['APRÈS','Nouvel état effectif'],['PREUVE','Acteur · date · raison · référence']].map(([a,b])=><div key={a}><span>{a}</span><strong>{b}</strong></div>)}</div>
    <div className={styles.signatureFooter}><Action onClick={()=>onOpenCommand('finance-integrity')}>Investigation d’intégrité</Action><Action onClick={()=>onOpenCommand('finance-history')}>Historique ciblé</Action><Pill icon="shield" label="Original préservé" tone="success"/></div>
  </section>
}

function ReportsRoot({onOpenCommand}:{onOpenCommand:(id:string)=>void}){
  return <section className={`${styles.signature} ${styles.reportingRoom}`} data-zone-c-signature="reporting-command-room">
    <div className={styles.signatureHead}><div><span className={styles.signatureEyebrow}>REPORTING INTELLIGENCE STUDIO</span><h2>Report Truth Runway</h2><p>Une chaîne de vérité qui sépare la définition, la demande, la readiness et le résultat réellement produit.</p></div><div className={styles.signatureBadge}>NO FAKE OUTPUT</div></div>
    <div className={styles.reportRunway}><Stage label="Définition" detail="Ce que le rapport répond" active/><Stage label="Paramètres" detail="Période & portée"/><Stage label="Demande" detail="Requête enregistrée"/><Stage label="Readiness" detail="Capacité réelle"/><Stage label="Résultat" detail="Seulement si produit"/><Stage label="Historique" detail="Preuve durable"/></div>
    <div className={styles.signatureFooter}><Pill icon="lock" label="Aucun faux PDF" tone="locked"/><Pill icon="lock" label="Aucun faux % de traitement" tone="locked"/><Action onClick={()=>onOpenCommand('generation-readiness')}>Vérifier la readiness</Action></div>
  </section>
}

function ReportCatalogue({onOpenCommand}:{onOpenCommand:(id:string)=>void}){
  return <section className={`${styles.signature} ${styles.catalogueGallery}`} data-zone-c-signature="report-catalogue-gallery">
    <div className={styles.splitTitle}><div><span className={styles.signatureEyebrow}>REPORT CATALOGUE GALLERY</span><h2>Choisir un rapport par la question qu’il permet de résoudre</h2></div><Action onClick={()=>onOpenCommand('report-definition')}>Lire une définition</Action></div>
    <div className={styles.catalogueCards}><MiniCard eyebrow="Question" title="Ce que le rapport répond" text="Objectif de pilotage avant format de sortie." icon="report"/><MiniCard eyebrow="Sources" title="Données nécessaires" text="Modules et périodes réellement disponibles." icon="shield"/><MiniCard eyebrow="Readiness" title="Capacité de production" text="Prêt, bloqué ou non configuré selon le backend." icon="lock"/></div>
    <div className={styles.signatureFooter}><Pill icon="report" label="Définition ≠ résultat"/><Pill icon="request" label="Demande explicite"/><Pill icon="lock" label="Export jamais simulé" tone="locked"/></div>
  </section>
}

function Templates({onOpenCommand}:{onOpenCommand:(id:string)=>void}){
  return <section className={`${styles.signature} ${styles.templateAtelier}`} data-zone-c-signature="template-atelier">
    <div className={styles.signatureHead}><div><span className={styles.signatureEyebrow}>TEMPLATE ATELIER</span><h2>Gouverner la définition sans inventer un éditeur documentaire</h2></div><Action onClick={()=>onOpenCommand('template-studio')}>Studio de modèle</Action></div>
    <div className={styles.versionStack}><div data-level="3"><span>VERSION HISTORIQUE</span></div><div data-level="2"><span>VERSION PRÉCÉDENTE</span></div><div data-level="1"><strong>VERSION ACTUELLE</strong><small>Identité · paramètres · visibilité · portée</small></div></div>
    <div className={styles.signatureFooter}><Pill icon="template" label="Modèle ≠ rapport"/><Pill icon="history" label="Version actuelle identifiable" tone="success"/><Pill icon="lock" label="Aucun WYSIWYG fictif" tone="locked"/></div>
  </section>
}

function ReportRequests({onOpenCommand}:{onOpenCommand:(id:string)=>void}){
  return <section className={`${styles.signature} ${styles.requestOps}`} data-zone-c-signature="report-request-operations">
    <div className={styles.splitTitle}><div><span className={styles.signatureEyebrow}>REPORT REQUEST OPERATIONS</span><h2>Chaque demande suit l’état réel du moteur</h2></div><Action onClick={()=>onOpenCommand('report-request-builder')}>Préparer une demande</Action></div>
    <div className={styles.requestLanes}>{[['DEMANDÉ','Requête enregistrée','azure'],['TRAITEMENT','Seulement si réel','indigo'],['BLOQUÉ','Capacité indisponible','amber'],['PRÊT','Résultat confirmé','emerald'],['ÉCHEC','Cause conservée','coral'],['ANNULÉ','Décision tracée','slate']].map(([a,b,t])=><div key={a} className={styles.requestLane} data-tone={t}><span/><strong>{a}</strong><small>{b}</small></div>)}</div>
    <div className={styles.signatureFooter}><Action onClick={()=>onOpenCommand('generation-readiness')}>Readiness Preview</Action><Pill icon="lock" label="Pas de progression inventée" tone="locked"/><Pill icon="history" label="Échec conservé"/></div>
  </section>
}

function ReportHistory({onOpenCommand}:{onOpenCommand:(id:string)=>void}){
  return <section className={`${styles.signature} ${styles.historyVault}`} data-zone-c-signature="reporting-history-vault">
    <div className={styles.vaultDoor}><ZoneCIcon name="history"/><div><span>REPORTING HISTORY VAULT</span><h2>L’historique garde aussi les blocages et les échecs</h2><p>Une demande passée sans fichier généré reste un fait historique complet, pas un vide à maquiller.</p></div></div>
    <div className={styles.vaultRows}><div><strong>Demande</strong><span>Paramètres et demandeur</span></div><div><strong>État</strong><span>Prêt · bloqué · échec · annulé</span></div><div><strong>Résultat</strong><span>Référence réelle uniquement</span></div><div><strong>Preuve</strong><span>Chronologie & audit</span></div></div>
    <div className={styles.signatureFooter}><Action onClick={()=>onOpenCommand('report-result')}>Examiner un résultat</Action><Action onClick={()=>onOpenCommand('report-evidence')}>Chambre de preuve</Action></div>
  </section>
}

function ReportsAudit({onOpenCommand}:{onOpenCommand:(id:string)=>void}){
  return <section className={`${styles.signature} ${styles.reportAudit}`} data-zone-c-signature="reporting-evidence-lens">
    <div className={styles.signatureHead}><div><span className={styles.signatureEyebrow}>REPORTING EVIDENCE LENS</span><h2>De la demande jusqu’à la preuve — sans trou narratif</h2></div><Action onClick={()=>onOpenCommand('report-evidence')}>Preuve de reporting</Action></div>
    <div className={styles.evidenceGraph}><div><ZoneCIcon name="request"/><strong>Qui a demandé ?</strong></div><span>→</span><div><ZoneCIcon name="template"/><strong>Avec quels paramètres ?</strong></div><span>→</span><div><ZoneCIcon name="report"/><strong>Quel état réel ?</strong></div><span>→</span><div><ZoneCIcon name="history"/><strong>Quel résultat / blocage ?</strong></div></div>
    <div className={styles.signatureFooter}><Pill icon="shield" label="Paramètres reconstructibles" tone="success"/><Pill icon="lock" label="Blocage = fait d’audit valide" tone="locked"/></div>
  </section>
}

export default function ZoneCVisualSignature({ surface, onOpenCommand }: SignatureProps) {
  if (surface === 'finance-root') return <FinanceRoot onOpenCommand={onOpenCommand}/>
  if (surface === 'finance-fees') return <Fees onOpenCommand={onOpenCommand}/>
  if (surface === 'finance-fee-assignments') return <FeeAssignments onOpenCommand={onOpenCommand}/>
  if (surface === 'finance-invoices') return <Invoices onOpenCommand={onOpenCommand}/>
  if (surface === 'finance-invoice-detail') return <InvoiceDetail onOpenCommand={onOpenCommand}/>
  if (surface === 'finance-payments') return <Payments onOpenCommand={onOpenCommand}/>
  if (surface === 'finance-payment-detail') return <PaymentDetail onOpenCommand={onOpenCommand}/>
  if (surface === 'finance-receipts') return <Receipts onOpenCommand={onOpenCommand}/>
  if (surface === 'finance-discounts') return <Discounts onOpenCommand={onOpenCommand}/>
  if (surface === 'finance-reminders') return <Reminders onOpenCommand={onOpenCommand}/>
  if (surface === 'finance-balances') return <Balances onOpenCommand={onOpenCommand}/>
  if (surface === 'finance-statements') return <Statements onOpenCommand={onOpenCommand}/>
  if (surface === 'finance-expenses') return <Expenses onOpenCommand={onOpenCommand}/>
  if (surface === 'finance-audit') return <FinanceAudit onOpenCommand={onOpenCommand}/>
  if (surface === 'reports-root') return <ReportsRoot onOpenCommand={onOpenCommand}/>
  if (surface === 'reports-catalogue') return <ReportCatalogue onOpenCommand={onOpenCommand}/>
  if (surface === 'reports-templates') return <Templates onOpenCommand={onOpenCommand}/>
  if (surface === 'reports-requests') return <ReportRequests onOpenCommand={onOpenCommand}/>
  if (surface === 'reports-history') return <ReportHistory onOpenCommand={onOpenCommand}/>
  if (surface === 'reports-audit') return <ReportsAudit onOpenCommand={onOpenCommand}/>
  return <FinanceRoot onOpenCommand={onOpenCommand}/>
}

export function ZoneCCrossDomainBridge({ domain }: { domain: 'finance' | 'reports' }) {
  return <div className={styles.crossDomainBridge}>
    <div><span>{domain === 'finance' ? 'REPORTING BRIDGE' : 'FINANCE BRIDGE'}</span><strong>{domain === 'finance' ? 'Besoin d’un rapport lié aux écritures ?' : 'Besoin de revenir aux écritures financières ?'}</strong></div>
    <Link href={domain === 'finance' ? '/angelcare-360-command-center/rapports' : '/angelcare-360-command-center/finance'}>{domain === 'finance' ? 'Ouvrir Reporting Studio' : 'Ouvrir Finance Control Tower'}<ZoneCIcon name="arrow"/></Link>
  </div>
}

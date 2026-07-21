export type UltraVerticalDoctrine = {
  key: string
  label: string
  aliases: string[]
  opportunitySignals: string[]
  qualificationQuestions: string[]
  buyingRoles: string[]
  programs: string[]
  pricingModels: string[]
  proofRequirements: string[]
  risks: string[]
  objections: string[]
  entryRoutes: string[]
  operationalReadiness: string[]
}

export const ULTRA_VERTICAL_DOCTRINES: UltraVerticalDoctrine[] = [
  {
    key: 'hospitality', label: 'Hôtellerie & Hospitality', aliases: ['hotel','hôtel','resort','riad','hospitality','tourisme'],
    opportunitySignals: ['offre family-friendly visible','kids club ou animation enfants','événements familiaux','saisonnalité forte','multi-site ou groupe hôtelier'],
    qualificationQuestions: ['Quel volume de familles est accueilli par période ?','Quels services enfants sont déjà opérés ?','Quels incidents ou plaintes famille doivent être réduits ?','Qui porte le P&L et qui valide les risques ?','Quel site peut servir de pilote ?'],
    buyingRoles: ['economic_buyer','commercial_sponsor','operational_owner','financial_approver','procurement','legal_risk','champion'],
    programs: ['Hospitality Kids Friendly','Kids Club externalisé','Animation événementielle enfants','Garde premium en chambre','Formation staff family experience'],
    pricingModels: ['forfait mensuel par site','prix par activation/événement','minimum garanti + variable volume','contrat saisonnier multi-site'],
    proofRequirements: ['capacité site','horaires et saisonnalité','assurances et protocoles sécurité','volume familles','responsable opérationnel nommé'],
    risks: ['pics de capacité','attentes premium élevées','coordination housekeeping/front office','responsabilité enfant','marge érodée par horaires étendus'],
    objections: ['Nous avons déjà un kids club','Le service est saisonnier','La responsabilité est trop élevée','Le budget doit rester variable'],
    entryRoutes: ['direction générale','direction commerciale','guest experience','operations manager','responsable événements'],
    operationalReadiness: ['site validé','SOP sécurité accepté','planning partagé','point de contact opérationnel','facturation configurée'],
  },
  {
    key: 'schools_nurseries', label: 'Écoles, crèches & préscolaire', aliases: ['school','école','ecole','crèche','creche','nursery','kindergarten','préscolaire','prescolaire'],
    opportunitySignals: ['besoin de remplacement ou renfort','activité périscolaire','excursions et événements','formation éducateurs','capacité ou ouverture de site'],
    qualificationQuestions: ['Quels niveaux et effectifs sont concernés ?','Quel besoin est récurrent versus ponctuel ?','Qui décide pédagogie, budget et sécurité ?','Quelles exigences parentales et réglementaires s’appliquent ?','Quel calendrier scolaire contraint le déploiement ?'],
    buyingRoles: ['economic_buyer','commercial_sponsor','operational_owner','financial_approver','legal_risk','influencer','champion'],
    programs: ['Renfort éducatif','Remplacement encadré','Montessori & activités','Excursions sécurisées','Formation Academy','Service parent entreprise'],
    pricingModels: ['abonnement mensuel par classe/site','crédits d’intervention','prix par journée/mission','contrat annuel avec minimum de volume'],
    proofRequirements: ['effectifs','planning','ratio encadrement','protocoles remise enfant','validation pédagogique','budget annuel'],
    risks: ['calendrier scolaire','exigences parents','ratio enfant/adulte','remplacements urgents','procurement lent'],
    objections: ['Nous recrutons en interne','Les parents sont sensibles au changement','Le budget est annuel','Nous avons besoin de flexibilité totale'],
    entryRoutes: ['direction établissement','direction pédagogique','fondateur','responsable RH','responsable opérations'],
    operationalReadiness: ['classes et horaires confirmés','liste exigences site','référent établissement','protocole parent','facturation/bon de commande'],
  },
  {
    key: 'corporate_employers', label: 'Entreprises & employeurs', aliases: ['corporate','entreprise','employer','employeur','rh','ressources humaines','siège','siege'],
    opportunitySignals: ['politique QVT','forte population de parents','absentéisme lié à la garde','family day','marque employeur','multi-site'],
    qualificationQuestions: ['Combien de collaborateurs parents sont concernés ?','Quel problème RH doit être mesuré ?','Le financement est-il employeur, salarié ou partagé ?','Quels sites et horaires sont prioritaires ?','Quels KPI valideront le pilote ?'],
    buyingRoles: ['economic_buyer','commercial_sponsor','operational_owner','financial_approver','procurement','legal_risk','influencer','champion'],
    programs: ['Corporate Family Care','Back-up childcare','Family Day','Conciergerie garde enfants','Ateliers parentalité','Avantage salarié cofinancé'],
    pricingModels: ['abonnement employeur','crédits prépayés','cofinancement employeur-salarié','forfait événement','contrat cadre multi-site'],
    proofRequirements: ['population éligible','politique avantage','budget RH','règles confidentialité','sites prioritaires','process procurement'],
    risks: ['faible adoption sans communication','cycle procurement','données salariés sensibles','demande irrégulière','engagement multi-départements'],
    objections: ['La demande n’est pas prouvée','Ce n’est pas notre cœur de métier','Le procurement sera long','Les salariés doivent payer'],
    entryRoutes: ['DRH','direction générale','QVT/engagement','CSE/relations sociales','procurement'],
    operationalReadiness: ['population et règles d’éligibilité','canal réservation','SLA','process incidents','reporting employeur','facturation'],
  },
  {
    key: 'clinics_pediatrics', label: 'Cliniques & professionnels pédiatriques', aliases: ['clinic','clinique','pediatric','pédiatre','pediatre','orthophoniste','hôpital','hopital','health','santé','sante'],
    opportunitySignals: ['flux familles/enfants','attente prolongée','besoin d’accompagnement non médical','partenariat prescription','programme développement enfant'],
    qualificationQuestions: ['Quel parcours patient/famille est concerné ?','Quelles limites cliniques doivent être explicitement séparées ?','Qui valide risque, éthique et conformité ?','Quel besoin peut être piloté sans acte médical ?','Comment mesurer satisfaction et sécurité ?'],
    buyingRoles: ['economic_buyer','operational_owner','financial_approver','legal_risk','influencer','champion'],
    programs: ['Accueil enfant non médical','Ateliers développement','Orientation familles','Partenariat post-consultation','Formation relation famille'],
    pricingModels: ['forfait site','prix par session','programme sponsorisé','convention de référencement non exclusive'],
    proofRequirements: ['frontière non médicale','consentement famille','protocole incident','référent clinique','assurance','message public validé'],
    risks: ['confusion avec soin médical','confidentialité','promesse thérapeutique interdite','responsabilité clinique','réputation'],
    objections: ['Nous ne pouvons pas recommander un prestataire','Le risque médical est trop élevé','Les familles doivent choisir seules','Le budget clinique est réservé aux soins'],
    entryRoutes: ['direction clinique','responsable expérience patient','pédiatre référent','direction qualité','partenariats'],
    operationalReadiness: ['scope non médical signé','consentement et confidentialité','référent qualité','parcours d’escalade','communication approuvée'],
  },
  {
    key: 'events_venues', label: 'Événements & lieux', aliases: ['event','événement','evenement','venue','mall','centre commercial','festival','conference','conférence','mariage'],
    opportunitySignals: ['événement avec familles','zone enfants','besoin de différenciation','fort trafic ponctuel','sponsor family-friendly'],
    qualificationQuestions: ['Quel volume et quelles tranches d’âge ?','Quelles dates, amplitudes et contraintes d’accès ?','Qui est responsable du site et du budget ?','Quel dispositif d’identification/remise enfant ?','Quel plan B capacité/météo existe ?'],
    buyingRoles: ['economic_buyer','commercial_sponsor','operational_owner','financial_approver','legal_risk','champion'],
    programs: ['Kids Zone','Garde événementielle','Ateliers créatifs','Accueil premium familles','Pack sponsor family-friendly'],
    pricingModels: ['forfait événement','prix par heure/capacité','sponsoring + activation','contrat calendrier annuel'],
    proofRequirements: ['plan site','capacité','dates/horaires','accès sécurité','flux remise enfant','responsable événement'],
    risks: ['surcapacité','annulation','sécurité du lieu','remise enfant','marge logistique'],
    objections: ['Le besoin est ponctuel','Le sponsor doit financer','Nous avons des animateurs','La capacité est incertaine'],
    entryRoutes: ['event director','direction commerciale','site operations','sponsoring','agence organisatrice'],
    operationalReadiness: ['plan de zone','capacité et roster','badges/remise enfant','SOP incident','brief organisateur','conditions annulation'],
  },
  {
    key: 'institutional', label: 'Institutions & partenaires stratégiques', aliases: ['institution','ministère','ministere','commune','association','fondation','ong','public','chambre','fédération','federation'],
    opportunitySignals: ['programme public famille/enfance','appel à projets','couverture territoriale','besoin de reporting','partenaires multiples','financement fléché'],
    qualificationQuestions: ['Quel mandat et quelle population cible ?','Quel mécanisme de financement et de passation ?','Quels résultats et preuves sont exigés ?','Qui valide technique, juridique et financier ?','Quel territoire et calendrier sont réalistes ?'],
    buyingRoles: ['economic_buyer','commercial_sponsor','operational_owner','financial_approver','procurement','legal_risk','influencer'],
    programs: ['Programme territorial enfance','Formation et professionnalisation','Activation communautaire','Étude/pilote family services','Convention institutionnelle'],
    pricingModels: ['marché/bon de commande','convention annuelle','budget programme par lot','pilot funded then scale'],
    proofRequirements: ['cahier des charges','éligibilité','budget/lot','KPI et reporting','gouvernance','preuves de capacité'],
    risks: ['cycle long','procurement formel','dépendance budget','reporting lourd','changement sponsor'],
    objections: ['Un appel d’offres est obligatoire','Le budget n’est pas disponible','Le pilote doit être gratuit','La couverture nationale est requise immédiatement'],
    entryRoutes: ['direction programme','partenariats','procurement','cabinet/présidence','responsable territorial'],
    operationalReadiness: ['cadre contractuel','gouvernance comité','territoire pilote','reporting convenu','validation financière','plan de déploiement'],
  },
]

export function doctrineFor(input: unknown) {
  const text = String(input || '').toLowerCase()
  return ULTRA_VERTICAL_DOCTRINES.find((row) => row.key === text || row.aliases.some((alias) => text.includes(alias))) || ULTRA_VERTICAL_DOCTRINES[2]
}

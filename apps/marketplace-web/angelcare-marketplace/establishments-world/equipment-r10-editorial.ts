import type {EquipmentFamilyId} from "./equipment-r8-data";

export type ExperienceEntry="spaces"|"goals"|"domains";
export type SchoolSituation="opening"|"modernize"|"team"|"enrolment"|"event";
export const R10_THEMES:Record<EquipmentFamilyId,{
 color:string;ink:string;label:string;tagline:string;story:string;outcome:string;art:string;icon:string;badge:string;
}> = {
 welcome:{color:"#ffe3ca",ink:"#9a4315",label:"L'accueil",tagline:"Votre école se raconte dès la première rencontre.",story:"De la rue à la salle de classe : imaginez un parcours accueillant, rassurant et reconnaissable.",outcome:"Une première impression qui donne envie de découvrir.",art:"welcome",icon:"building-2",badge:"VISITE & ADMISSIONS"},
 learning:{color:"#d5f5e8",ink:"#126f5b",label:"L'apprentissage",tagline:"Un environnement pensé pour apprendre en explorant.",story:"Espaces, outils et supports dialoguent avec les besoins des enfants et le travail des éducatrices.",outcome:"Des expériences pédagogiques stimulantes et organisées.",art:"classroom",icon:"shapes",badge:"PÉDAGOGIE ACTIVE"},
 parents:{color:"#eae0ff",ink:"#6045a0",label:"Les familles",tagline:"Une relation de confiance qui continue chaque jour.",story:"De l'inscription aux premiers progrès, les supports de communication racontent la vie de l'école.",outcome:"Des familles informées, impliquées et rassurées.",art:"parents",icon:"heart-handshake",badge:"RELATION PARENTS"},
 operations:{color:"#d9ebff",ink:"#195b9b",label:"L'équipe",tagline:"Plus de clarté dans chaque geste professionnel.",story:"Les bons outils au bon moment pour organiser les salles, les transmissions et la préparation.",outcome:"Une organisation visible et plus facile à partager.",art:"os-team",icon:"clipboard-list",badge:"ORGANISATION"},
 routines:{color:"#fff0ba",ink:"#9b6608",label:"Le quotidien",tagline:"Des routines simples qui font une grande différence.",story:"Les petits moments de la journée deviennent mieux préparés, plus lisibles et plus sereins.",outcome:"Des repères et des activités qui facilitent la vie.",art:"activities",icon:"sun",badge:"ROUTINES & ACTIVITÉS"},
 identity:{color:"#ffdce9",ink:"#ad245a",label:"L'identité",tagline:"Une école que les familles n'oublient pas.",story:"Cérémonies, souvenirs, branding et décors prennent la forme d'une signature cohérente.",outcome:"Une identité vivante qui traverse tous les temps forts.",art:"uniforms",icon:"party-popper",badge:"BRANDING & ÉVÉNEMENTS"}
};
export const R10_STORIES = [
 {id:"school-opening",eyebrow:"CAS RÉEL D'USAGE · OUVERTURE",title:"Vous ouvrez une nouvelle école ?",sub:"Avant les premiers enfants, tout doit déjà inspirer confiance.",theme:"welcome" as EquipmentFamilyId,art:"welcome",badge:"CRÉER UNE PREMIÈRE IMPRESSION",domains:["reception","open-day","large-format","parent-communication"],benefit:"Un accueil fluide, des espaces lisibles et une communication professionnelle.",caption:"Du portail aux premiers échanges avec les familles"},
 {id:"new-class",eyebrow:"INSPIRATION · NOUVELLE CLASSE",title:"Et si chaque coin de classe donnait envie d'apprendre ?",sub:"Créez un environnement où l'affichage, les activités et le rangement se répondent.",theme:"learning" as EquipmentFamilyId,art:"classroom",badge:"APPRENDRE AUTREMENT",domains:["class-visuals","montessori","flashcards","printables"],benefit:"Des repères cohérents pour favoriser manipulation et découverte.",caption:"Une classe pensée par usages, pas par achats isolés"},
 {id:"team-rhythm",eyebrow:"SOLUTION MÉTIER · ORGANISATION",title:"Une équipe organisée, même quand la journée s'accélère.",sub:"Transmissions, plannings, rangement : donnez des repères partagés aux professionnels.",theme:"operations" as EquipmentFamilyId,art:"os-team",badge:"SIMPLIFIER LE QUOTIDIEN",domains:["staff-tools","labelling","technical","safety"],benefit:"Moins de recherches et des informations faciles à retrouver.",caption:"Les bons supports là où ils sont utiles"},
 {id:"school-moments",eyebrow:"IDÉES & AMBIANCES · ÉVÉNEMENT",title:"Des moments importants qui ressemblent vraiment à votre école.",sub:"De la scénographie aux diplômes, coordonnez les détails qui rendent une cérémonie mémorable.",theme:"identity" as EquipmentFamilyId,art:"uniforms",badge:"CRÉER DES SOUVENIRS",domains:["graduation","photo-booth","event-branding","certificates"],benefit:"Une signature cohérente de l'invitation au souvenir.",caption:"Une histoire à vivre et à partager"}
] as const;
export const R10_GOALS:ReadonlyArray<{
 id:SchoolSituation;title:string;subtitle:string;icon:string;domains:readonly string[];family:EquipmentFamilyId
}>=[
 {id:"opening",title:"J'ouvre un établissement",subtitle:"L'accueil, les premières classes et les outils essentiels",icon:"school",domains:["reception","open-day","class-visuals","parent-communication"],family:"welcome"},
 {id:"modernize",title:"Je modernise mes espaces",subtitle:"Ambiances, aménagements, visuels et repères",icon:"paintbrush",domains:["class-visuals","montessori","labelling","large-format"],family:"learning"},
 {id:"team",title:"J'organise mieux mon équipe",subtitle:"Plannings, transmission, routines et rangement",icon:"clipboard-check",domains:["staff-tools","labelling","technical","safety"],family:"operations"},
 {id:"enrolment",title:"Je prépare les inscriptions",subtitle:"Une visite fluide, des supports clairs et un meilleur suivi",icon:"users",domains:["open-day","reception","parent-communication","large-format"],family:"parents"},
 {id:"event",title:"Je prépare un temps fort",subtitle:"Scénographie, souvenirs et identité de l'école",icon:"party-popper",domains:["graduation","photo-booth","event-branding","seasonal"],family:"identity"}
];
export const R10_SCHOOL_HOTSPOTS=[
 {id:"reception",label:"L'entrée",family:"welcome" as EquipmentFamilyId,top:54,left:14,summary:"Donnez le ton dès l'arrivée."},
 {id:"class-visuals",label:"La classe",family:"learning" as EquipmentFamilyId,top:28,left:42,summary:"Une salle qui inspire la découverte."},
 {id:"parent-communication",label:"Les familles",family:"parents" as EquipmentFamilyId,top:69,left:38,summary:"Des échanges qui créent la confiance."},
 {id:"staff-tools",label:"L'équipe",family:"operations" as EquipmentFamilyId,top:30,left:77,summary:"Une organisation qui tient sur le terrain."},
 {id:"activity-boxes",label:"Les activités",family:"routines" as EquipmentFamilyId,top:70,left:72,summary:"Préparer les petits moments."},
 {id:"graduation",label:"Les moments forts",family:"identity" as EquipmentFamilyId,top:49,left:89,summary:"Une identité qui dure."}
] as const;
export const R10_DOMAIN_LABELS:Record<string,{headline:string;reassurance:string;application:string}> = {
 "welcome-guide":{headline:"Des réponses claires avant de choisir.",reassurance:"Repérez les familles, formats et étapes de préparation.",application:"Se repérer dans le catalogue"},
 "photo-booth":{headline:"Transformez un moment en souvenir.",reassurance:"Imaginez vos espaces photo par occasion et ambiance.",application:"Un corner photo lors des fêtes scolaires"},
 "large-format":{headline:"Rendez votre école visible.",reassurance:"Repérez où les messages grand format prennent tout leur sens.",application:"Une façade lisible au premier regard"},
 "event-branding":{headline:"Un événement, une seule identité.",reassurance:"Coordonnez les supports du premier message au décor.",application:"Une journée de fête aux couleurs de l’école"},
 "class-visuals":{headline:"Chaque mur peut devenir un repère.",reassurance:"Projetez des visuels en contexte de classe.",application:"Un coin langage plus vivant"},
 "printables":{headline:"Des activités plus simples à préparer.",reassurance:"Liez les supports à une compétence et un âge.",application:"Un atelier de pré-écriture cohérent"},
 "flashcards":{headline:"Apprendre par la découverte visuelle.",reassurance:"Explorez les collections et leurs usages pédagogiques.",application:"Une routine quotidienne de vocabulaire"},
 "parent-communication":{headline:"Une relation qui rassure.",reassurance:"Découvrez des moments utiles pour informer et valoriser.",application:"Un suivi clair pour les familles"},
 "reception":{headline:"Une entrée qui donne confiance.",reassurance:"Visualisez le parcours du portail à la classe.",application:"Une visite d’inscription fluide"},
 "staff-tools":{headline:"Une équipe qui partage les mêmes repères.",reassurance:"Explorez des supports d’organisation à l’usage.",application:"Des transmissions d’équipe structurées"},
 "child-identity":{headline:"Une place pour chaque enfant.",reassurance:"Découvrez des repères personnalisés au quotidien.",application:"Des casiers faciles à identifier"},
 "graduation":{headline:"Une cérémonie inoubliable.",reassurance:"Imaginez l’événement comme une expérience complète.",application:"Une fin d’année coordonnée"},
 "seasonal":{headline:"Faites vivre les saisons à l’école.",reassurance:"Créez des ambiances à partir de moments pédagogiques.",application:"Une classe accueillante à chaque saison"},
 "safety":{headline:"Les bons gestes ont besoin de repères.",reassurance:"Découvrez comment les visuels soutiennent les routines.",application:"Des rappels d’hygiène visibles"},
 "montessori":{headline:"Découvrir par le geste.",reassurance:"Explorez des activités de manipulation adaptées.",application:"Un atelier d’autonomie sensorielle"},
 "labelling":{headline:"Ranger devient plus facile à apprendre.",reassurance:"Visualisez l’organisation des zones et des objets.",application:"Un système de rangement partagé"},
 "open-day":{headline:"Une visite qui donne envie de revenir.",reassurance:"Racontez l’établissement dès le premier contact.",application:"Une journée portes ouvertes préparée"},
 "certificates":{headline:"Valoriser les progrès et les efforts.",reassurance:"Découvrez des formes de reconnaissance adaptées.",application:"Des certificats pour célébrer les réalisations"},
 "activity-boxes":{headline:"Une activité prête à prendre vie.",reassurance:"Explorez les composants d’un atelier cohérent.",application:"Une boîte de découverte pour une journée à thème"},
 "partner-branding":{headline:"Une identité reconnaissable partout.",reassurance:"Projetez la même signature sur différents supports.",application:"Des objets et tenues coordonnés"},
 "personalization":{headline:"Les détails font la différence.",reassurance:"Clarifiez vos intentions avant toute production.",application:"Une préparation de personnalisation maîtrisée"},
 "technical":{headline:"Mieux comparer pour mieux choisir.",reassurance:"Comprenez les termes et les contraintes utiles.",application:"Un choix de formats et finitions éclairé"}
};

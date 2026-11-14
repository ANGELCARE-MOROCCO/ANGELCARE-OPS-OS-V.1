import type { View } from "./content";

export interface Campaign {
  id: string;
  label: string;
  title: string;
  lead: string;
  solution: string;
  image: string;
  tone: "green" | "pink" | "teal" | "navy" | "coral" | "purple";
  benefits: [string, string][];
  detailTitle: string;
  detail: string;
  question: string;
  family?: "edup" | "academy" | "parents";
  modules?: string[];
  chapter?: number;
}

export const COMMERCIAL = {
  conseil: {
    eyebrow: "Diagnostic partenariat gratuit",
    title: "Votre qualité mérite de se voir.",
    lead: "Des enfants engagés. Une équipe solide. Des parents confiants. Donnez une forme concrète à ce qui fait la valeur de votre établissement.",
    contact: "Parlons de votre établissement",
    intro: "Vous faites beaucoup. Est-ce que cela se voit vraiment ?",
    introduction:
      "Une journée remplie ne dit pas toujours ce que les enfants ont découvert. Une équipe mobilisée ne partage pas nécessairement les mêmes repères. Et des parents satisfaits ont parfois besoin de mieux comprendre votre travail. Partons de votre réalité pour relier ces trois dimensions : l’expérience enfant, les pratiques d’équipe et la relation avec les familles.",
    priorities: [
      "Engagement des enfants",
      "Pratiques d’équipe",
      "Relation avec les parents",
    ],
    closing: "Votre prochain progrès commence par une conversation.",
  },
  "partner-os": {
    eyebrow: "Votre organisation mérite un fil conducteur",
    title: "Vous dirigez un établissement. Pas une pile de fichiers.",
    lead: "Admissions, familles, équipes et opérations : redonnez un fil à votre quotidien. Présentez vos usages pour préparer un environnement adapté à votre établissement.",
    contact: "Parlons de votre organisation",
    intro: "Quand tout est dispersé, c’est vous qui faites le lien.",
    introduction:
      "Un contact dans un téléphone, une échéance dans un tableau, une consigne dans un message : chaque outil peut rendre service, mais la continuité repose souvent sur la mémoire de la direction. Partner OS présente un écosystème de capacités à étudier selon votre organisation. L’objectif du premier échange est de comprendre ce qui doit être relié, avec quelles responsabilités et dans quel périmètre.",
    priorities: [
      "Admissions & familles",
      "Équipes & opérations",
      "Pilotage & suivi",
    ],
    closing: "Dites-nous où votre organisation vous fait perdre le fil.",
  },
  produits: {
    eyebrow: "L’accueil, la classe, les outils, l’équipe",
    title: "Votre établissement parle avant même que vous preniez la parole.",
    lead: "Faites vivre une même exigence dans vos espaces, vos supports et vos pratiques. Des solutions à choisir selon vos usages, votre identité et votre projet.",
    contact: "Parlons de votre projet",
    intro: "Les détails se voient. Leur cohérence se ressent.",
    introduction:
      "Une signalétique claire, un rangement accessible, des supports compréhensibles et une équipe identifiable racontent déjà votre manière d’accueillir. Les seize univers ci-dessous donnent des pistes pour relier ces détails. Les produits réellement proposés, leurs prix et leurs disponibilités restent ceux du catalogue : votre projet permet ensuite de préciser les formats, les quantités et les options pertinentes.",
    priorities: [
      "Accueil & identité",
      "Espaces & pédagogie",
      "Quotidien & équipe",
    ],
    closing: "Racontez-nous ce que vous voulez faire ressentir.",
  },
} satisfies Record<
  View,
  {
    eyebrow: string;
    title: string;
    lead: string;
    contact: string;
    intro: string;
    introduction: string;
    priorities: string[];
    closing: string;
  }
>;

export const CAMPAIGNS: Record<View, Campaign[]> = {
  conseil: [
    {
      id: "enfants",
      label: "EduPlay · expérience enfant",
      tone: "green",
      image: "edupplay",
      family: "edup",
      title: "Des enfants occupés… ou vraiment engagés ?",
      lead: "Vous préparez des activités, vous mobilisez l’équipe, la journée est pleine. Pourtant, une question reste essentielle : quel fil relie ce que les enfants vivent, ce que vous souhaitez travailler et ce que les parents peuvent en comprendre ?",
      solution:
        "EduPlay propose des ateliers organisés autour de thèmes, d’objectifs et d’une cadence identifiable. La formule choisie sert de point de départ pour préciser les interventions, les supports et les traces utiles. Votre projet commence par les âges concernés, les habitudes de votre structure et la place disponible dans votre organisation.",
      benefits: [
        [
          "Un rythme lisible",
          "Préparer les interventions avec une cadence connue de l’équipe.",
        ],
        [
          "Des expériences structurées",
          "Relier les manipulations et activités aux objectifs retenus.",
        ],
        [
          "Des traces à partager",
          "Rendre les actions compréhensibles avec les supports prévus dans la formule.",
        ],
      ],
      detailTitle: "Quel rythme pour votre établissement ?",
      detail:
        "Start présente un atelier par semaine, Growth deux, Signature trois. Ces cadences correspondent respectivement à quatre, huit et douze interventions par mois dans les références de la brochure. Le diagnostic sert à vérifier leur pertinence pour votre contexte et à préciser le calendrier, les groupes, les espaces et les conditions de la proposition. Il ne remplace pas une offre publiée ni ses disponibilités.",
      question: "Préparons un programme adapté à vos enfants.",
    },
    {
      id: "equipe",
      label: "Academy Pro · pratiques partagées",
      tone: "pink",
      image: "academy",
      family: "academy",
      title:
        "Les bonnes pratiques ne devraient pas dépendre de la personne présente.",
      lead: "Un accueil peut changer selon l’interlocuteur. Une consigne peut être comprise différemment. Une situation délicate peut laisser l’équipe hésitante. La qualité gagne à être travaillée autour de repères que chacun peut comprendre et mettre en pratique.",
      solution:
        "Academy Pro relie formation, mises en situation et recommandations de terrain. Présentez la compétence à travailler, l’expérience des personnes concernées et les difficultés rencontrées. Nous pouvons alors étudier le format de référence le plus pertinent : une session ciblée, un programme d’équipe ou un parcours plus approfondi.",
      benefits: [
        [
          "Une compétence ciblée",
          "Choisir le sujet utile avant de multiplier les contenus.",
        ],
        [
          "Des situations concrètes",
          "Relier les échanges aux gestes, à la posture et aux réalités du terrain.",
        ],
        [
          "Des repères de suivi",
          "Identifier les supports, outils d’encadrement et synthèses prévus.",
        ],
      ],
      detailTitle: "Une session, un programme ou un parcours ?",
      detail:
        "Academy Start présente une session ciblée. Team prévoit trois sessions avec des exercices terrain et une synthèse direction. Excellence présente six sessions, un diagnostic équipe et du coaching selon le périmètre retenu. Les modalités, les personnes concernées et les livrables doivent être précisés ensemble. Une attestation de participation annoncée pour une formule n’est pas une promesse de certification professionnelle pour tous les parcours.",
      question: "Parlons des pratiques que votre équipe veut renforcer.",
    },
    {
      id: "parents",
      label: "ParentTrust · relation famille-école",
      tone: "teal",
      image: "parents",
      family: "parents",
      title:
        "Les parents voient-ils tout ce que vous faites pour leur enfant ?",
      lead: "Les échanges du matin sont courts. Les messages s’accumulent. Une activité réussie peut rester invisible et un doute prendre plus de place que les actions réalisées. La relation avec les familles mérite une continuité au-delà des moments de tension.",
      solution:
        "ParentTrust présente des actions pour rendre l’accueil, la communication et le suivi plus lisibles. La démarche part de votre parcours actuel : comment une famille découvre l’établissement, comprend vos pratiques, reçoit les informations et exprime ses questions. Les supports et temps d’échange sont ensuite étudiés selon la formule choisie.",
      benefits: [
        [
          "Un accueil cohérent",
          "Clarifier ce qui est expliqué aux familles et à quel moment.",
        ],
        [
          "Une communication utile",
          "Donner du sens aux actions plutôt que publier pour remplir un calendrier.",
        ],
        [
          "Un suivi structuré",
          "Identifier les temps de retour, supports et reporting pertinents.",
        ],
      ],
      detailTitle:
        "Que peut-on travailler dans la relation avec les familles ?",
      detail:
        "Visibility présente un atelier parents mensuel et des supports de communication. Performance met l’accent sur deux actions parentales par mois, un audit simple de l’expérience parent et un suivi de satisfaction. Le parcours 360 présente un pilotage plus global avec un calendrier annuel et un accompagnement stratégique direction. Le choix dépend du besoin réel ; ces formules ne garantissent pas mécaniquement un taux de fidélisation ou d’inscription.",
      question: "Renforçons la relation avec vos familles.",
    },
    {
      id: "valeur",
      label: "Votre différence · une qualité compréhensible",
      tone: "navy",
      image: "child-experience",
      title: "Votre différence ne doit pas rester dans les coulisses.",
      lead: "Une activité, une formation et un échange parents peuvent être de qualité sans former un récit clair. Si chaque action reste isolée, il devient difficile pour la direction de montrer ce qui se construit et pour les familles d’en comprendre la continuité.",
      solution:
        "Travaillez les liens entre les actions retenues : ce qui est proposé aux enfants, ce qui est partagé dans l’équipe et ce qui est expliqué aux parents. Un calendrier, un support de communication et un reporting peuvent servir le même objectif, avec des formats adaptés à leurs destinataires. La proposition précise les livrables réellement prévus.",
      benefits: [
        [
          "Un fil conducteur",
          "Associer chaque action à une priorité identifiable.",
        ],
        [
          "Des supports cohérents",
          "Relier les messages aux pratiques et aux activités présentées.",
        ],
        [
          "Une lecture pour la direction",
          "Distinguer ce qui a été réalisé, ce qui reste à préciser et la suite.",
        ],
      ],
      detailTitle: "Exemple de continuité à étudier ensemble",
      detail:
        "Pour une priorité autour de l’autonomie, le projet peut décrire un thème d’atelier, les repères à partager avec l’équipe et la manière d’en parler aux parents. Cet exemple illustre une articulation, pas un forfait déjà constitué. Les interventions, les supports et le temps de coordination doivent être identifiés dans la proposition afin que chacun sache ce qui est attendu.",
      question: "Rendons votre projet pédagogique plus lisible.",
    },
    {
      id: "direction",
      label: "Direction · des priorités réalistes",
      tone: "coral",
      image: "parent-direction",
      title: "Vous n’avez pas besoin de tout lancer en même temps.",
      lead: "Quand plusieurs sujets sont importants, commencer peut devenir difficile. Engagement des enfants, pratiques d’équipe et communication parents se répondent, mais votre temps, votre organisation et vos priorités ne sont pas illimités.",
      solution:
        "Le premier échange sert à hiérarchiser. Présentez ce qui fonctionne déjà, le point de friction le plus fréquent et le changement que vous souhaitez voir en premier. Nous étudions ensuite les formules de référence et les conditions d’une proposition adaptée. Vous conservez une lecture claire des sujets retenus et de ceux qui pourront être abordés plus tard.",
      benefits: [
        [
          "Une priorité explicite",
          "Commencer par le besoin qui mérite une réponse maintenant.",
        ],
        [
          "Un périmètre compréhensible",
          "Identifier les personnes, les espaces et les actions concernés.",
        ],
        [
          "Une suite préparée",
          "Relier le premier choix à vos autres objectifs sans les confondre.",
        ],
      ],
      detailTitle: "Que préparer pour le diagnostic partenariat ?",
      detail:
        "Quelques éléments suffisent pour commencer : le type d’établissement, la ville, les âges ou capacités concernés, les pratiques existantes et une situation concrète à améliorer. Vous pouvez joindre votre sélection de formules au projet. La demande prépare un échange ; elle ne réserve pas un créneau ni ne crée un engagement financier automatique.",
      question: "Trouvons votre point de départ.",
    },
    {
      id: "outils",
      label: "Livrables · du concret pour le terrain",
      tone: "purple",
      image: "consulting-deliverables",
      title:
        "Un programme doit laisser des repères, pas seulement une impression.",
      lead: "Après un atelier ou une formation, la question est simple : qu’est-ce que l’équipe peut reprendre, expliquer ou suivre ? Des contenus nombreux n’ont de valeur que si leurs usages et leurs destinataires sont clairement identifiés.",
      solution:
        "Les formules de référence présentent différents types de livrables : calendriers, supports de formation, outils de communication et reporting. Le travail de préparation consiste à préciser lesquels sont inclus, à qui ils sont destinés et comment ils s’inscrivent dans vos pratiques. Les aperçus présentés ici expliquent les formats ; ils ne remplacent pas les documents définis dans votre proposition.",
      benefits: [
        [
          "Des usages identifiés",
          "Savoir si un support sert à préparer, transmettre ou suivre.",
        ],
        [
          "Des destinataires clairs",
          "Distinguer les besoins de l’équipe, de la direction et des familles.",
        ],
        [
          "Des modalités précisées",
          "Définir les livrables et le niveau d’accompagnement retenus.",
        ],
      ],
      detailTitle:
        "Du calendrier au reporting : quel rôle pour chaque support ?",
      detail:
        "Le calendrier aide à organiser la cadence. Un support de formation rassemble les repères travaillés. Une communication parents explique une action et son sens. Le reporting partage une synthèse selon la formule. Demandez-nous les livrables pertinents pour votre projet : leur existence, leur format et leur fréquence doivent être explicités avant le déploiement.",
      question: "Parlons des outils utiles à votre établissement.",
    },
  ],
  "partner-os": [
    {
      id: "admissions",
      label: "Accueillir · la continuité avec les familles",
      tone: "teal",
      image: "os-admissions",
      modules: ["admissions", "crm", "experience", "communication"],
      title: "Une demande oubliée peut devenir une famille perdue.",
      lead: "Une famille pose une question, une autre attend un retour et un rendez-vous se prépare. Lorsque les échanges sont répartis entre plusieurs supports, retrouver le dernier contexte et la prochaine action peut demander plus d’effort que la réponse elle-même.",
      solution:
        "Les capacités Admissions, CRM parents, Expérience parent et Communication sont présentées pour donner une continuité à ce parcours. L’échange de préparation sert à comprendre vos étapes, les personnes qui interviennent et les informations à retrouver. Le périmètre réellement disponible dépend du plan et de la configuration choisis.",
      benefits: [
        [
          "Un contexte retrouvable",
          "Savoir où en est une demande avant de reprendre contact.",
        ],
        [
          "Une prochaine étape lisible",
          "Clarifier les actions et la responsabilité de leur suivi.",
        ],
        [
          "Des échanges reliés",
          "Étudier la continuité entre informations, messages et dossier.",
        ],
      ],
      detailTitle: "Concrètement, quels usages souhaitez-vous relier ?",
      detail:
        "Décrivez une demande récente : son point d’entrée, les personnes concernées, les informations recueillies et le moment où le suivi devient difficile. Cette situation nous aide à préciser les besoins d’admission, de relation commerciale et de communication. Les illustrations montrent une logique d’usage ; elles ne constituent pas une démonstration d’un compte déjà configuré.",
      question: "Parlons de votre parcours admissions et familles.",
    },
    {
      id: "operations",
      label: "Organiser · un cadre commun pour l’équipe",
      tone: "pink",
      image: "os-people-team",
      modules: ["rh", "formation", "operations", "calendrier"],
      title: "Votre équipe sait-elle quoi faire, quand et avec qui ?",
      lead: "La bonne volonté ne remplace pas toujours une responsabilité claire. Une mission transmise oralement, un changement de planning ou un besoin de formation peuvent se disperser lorsque chacun dispose d’une partie de l’information.",
      solution:
        "RH, formation, missions et calendrier sont quatre domaines à étudier ensemble. Le projet doit préciser les usages : les personnes et profils concernés, les affectations, les activités à coordonner et les parcours de montée en compétences. L’objectif de la configuration est de donner un cadre compréhensible à ce qui doit être préparé et suivi.",
      benefits: [
        [
          "Des responsabilités nommées",
          "Relier les tâches aux personnes concernées.",
        ],
        [
          "Une organisation partagée",
          "Étudier les plannings, événements et engagements à coordonner.",
        ],
        [
          "Une progression préparée",
          "Situer les besoins de formation dans les pratiques de l’équipe.",
        ],
      ],
      detailTitle: "Quel est le premier point de friction de votre équipe ?",
      detail:
        "Un remplacement, une activité particulière ou une nouvelle personne dans l’équipe constituent de bons exemples pour décrire vos besoins. Précisez ce qui doit être transmis, par qui et à quel moment. Les possibilités de planification, d’affectation et de suivi sont à confirmer selon le plan retenu ; aucune automatisation de recrutement ou de certification n’est promise par cette présentation.",
      question: "Donnons un cadre plus clair à vos équipes.",
    },
    {
      id: "commerce",
      label: "Commercialiser · relier votre offre et vos propositions",
      tone: "coral",
      image: "os-people-commerce",
      modules: ["services", "marketplace", "devis", "facturation"],
      title:
        "Une proposition ne devrait pas perdre son contexte en devenant une facture.",
      lead: "Un besoin est exprimé, une solution est envisagée, des conditions sont précisées. Si les informations circulent de document en document sans continuité, il devient difficile de comprendre ce qui a été proposé et ce qui reste à clarifier.",
      solution:
        "Services, Marketplace, devis et facturation sont présentés comme des domaines complémentaires. Décrivez vos offres, vos étapes de proposition et les pièces qui accompagnent la relation commerciale. Le projet sert à identifier les usages nécessaires et la configuration adaptée, avec une attention particulière à la lisibilité des conditions et du suivi.",
      benefits: [
        [
          "Des besoins reliés aux offres",
          "Présenter les services pertinents pour le contexte de l’établissement.",
        ],
        [
          "Des propositions compréhensibles",
          "Retrouver les éléments qui ont conduit au choix du périmètre.",
        ],
        [
          "Un suivi documentaire",
          "Étudier les devis, contrats, échéances et documents utiles.",
        ],
      ],
      detailTitle:
        "De la demande à la proposition : que souhaitez-vous retrouver ?",
      detail:
        "Partagez le chemin actuel d’une demande : informations nécessaires, offre envisagée, validation des conditions et documents produits. Les domaines présentés ne signifient pas que tous les circuits sont activés sur chaque plan. Nous précisons les besoins et les options avant de présenter un périmètre, sans confondre la présentation commerciale et l’activation d’un abonnement.",
      question: "Relions vos propositions à votre organisation.",
    },
    {
      id: "pilotage",
      label: "Piloter · une lecture pour la direction",
      tone: "navy",
      image: "os-people-direction",
      modules: ["direction", "multi", "reporting", "roles"],
      title: "Vous avez besoin de voir clair, pas de tout ouvrir.",
      lead: "Le suivi devient fatigant quand chaque réponse exige de rechercher un fichier, appeler une personne ou reconstituer l’historique. Avec plusieurs équipes ou plusieurs sites, la lecture commune demande des repères explicites.",
      solution:
        "Direction, multi-établissements, reporting et rôles sont les capacités présentées pour étudier cette organisation. Quels éléments la direction doit-elle lire ? Quelles responsabilités doivent rester propres à un site ? Qui doit accéder à quoi ? Ces questions guident le choix du plan, le périmètre et les modalités de configuration.",
      benefits: [
        [
          "Une lecture orientée décision",
          "Identifier les informations utiles à votre direction.",
        ],
        [
          "Des sites situés dans leur contexte",
          "Étudier les besoins propres et les besoins de coordination.",
        ],
        [
          "Des accès définis",
          "Préciser les responsabilités et les usages autorisés.",
        ],
      ],
      detailTitle:
        "Des indicateurs utiles commencent par des questions précises",
      detail:
        "Avant de multiplier les tableaux, identifiez les décisions à prendre et les informations nécessaires. Les aperçus graphiques de cette page sont illustratifs et ne contiennent pas de résultats réels de votre établissement. La disponibilité des vues, du reporting et des règles d’accès doit être vérifiée selon le plan et la configuration retenus.",
      question: "Parlons de ce que votre direction doit mieux voir.",
    },
    {
      id: "suivi",
      label: "Suivre · paiements, qualité et pièces utiles",
      tone: "purple",
      image: "os-people-followup",
      modules: ["paiements", "qualite", "support", "documents"],
      title: "Une facture, un dossier, une décision : retrouvez le fil.",
      lead: "Un règlement attendu, une pièce à retrouver, une observation qualité ou une demande de support : ce sont souvent les détails qui interrompent la journée lorsqu’ils n’ont pas une place et un suivi compréhensibles.",
      solution:
        "Les capacités Paiements, Qualité, Support et Documents permettent d’étudier les usages à rassembler. Le projet doit distinguer les informations à suivre, les documents utiles et les personnes responsables de la prochaine action. Les règles de traitement, les accès et les possibilités d’automatisation restent à préciser dans le périmètre de configuration.",
      benefits: [
        [
          "Des demandes identifiables",
          "Comprendre le contexte et les éléments nécessaires au traitement.",
        ],
        [
          "Des pièces organisées",
          "Étudier le classement et l’accès aux documents opérationnels.",
        ],
        [
          "Une continuité de suivi",
          "Identifier les échéances, actions et responsabilités à retrouver.",
        ],
      ],
      detailTitle:
        "Que voulez-vous pouvoir retrouver sans reconstituer l’histoire ?",
      detail:
        "Vous pouvez partir d’une situation concrète : une facture attendue, un dossier incomplet ou une demande restée sans suite. Nous étudions les informations, pièces et responsabilités nécessaires. La présence d’un domaine qualité ne constitue pas une certification de conformité ; les exigences applicables à votre établissement restent à traiter dans leur contexte.",
      question: "Simplifions le suivi de vos opérations.",
    },
    {
      id: "annee",
      label: "Votre point de départ · une année sur le plan gratuit",
      tone: "green",
      image: "os-people-year",
      title: "Une année pour préparer une autre façon de travailler.",
      lead: "Vous souhaitez comprendre si l’environnement répond à vos usages avant d’envisager une évolution. L’offre présentée porte sur douze mois sur le plan gratuit, avec un périmètre et des conditions à confirmer.",
      solution:
        "Présentez votre établissement, les difficultés à traiter en priorité et les capacités qui vous intéressent. L’échange sert à distinguer le plan gratuit, les modules ou options éventuels et l’accompagnement utile. Une demande de mise en route ne vaut pas activation automatique et ne demande pas à votre place des modules payants.",
      benefits: [
        [
          "Votre contexte d’abord",
          "Partir de votre organisation et de vos priorités.",
        ],
        [
          "Un périmètre à comprendre",
          "Identifier les capacités et conditions du plan envisagé.",
        ],
        [
          "Une mise en route préparée",
          "Préciser les prochaines étapes avant l’activation.",
        ],
      ],
      detailTitle:
        "Les vingt capacités sont-elles toutes incluses dans le plan gratuit ?",
      detail:
        "Les vingt capacités présentent les domaines de la brochure. Leur disponibilité dépend du plan et de la configuration. La proposition doit préciser ce qui est inclus, ce qui relève d’une option et ce qui nécessite un accompagnement. Les douze mois mis en avant concernent le plan gratuit ; cette page ne promet pas que tous les domaines ou toutes leurs fonctions sont gratuits.",
      question: "Préparons votre demande d’année gratuite.",
    },
  ],
  produits: [
    {
      id: "accueil",
      label: "Identité & accueil · votre première impression",
      tone: "navy",
      image: "welcome",
      chapter: 0,
      title: "La première impression se joue avant la première question.",
      lead: "Une famille découvre l’entrée, cherche où aller et observe les premiers détails. Un accueil agréable dépend autant de la lisibilité des repères que du soin apporté aux supports et à l’espace.",
      solution:
        "Les univers identité, souvenirs, signalétique et événements donnent des pistes pour préparer une présence cohérente. Décrivez les lieux, les moments importants et les supports dont vous avez besoin. Les formats, options de personnalisation et conditions doivent ensuite être vérifiés dans les offres publiées ou la proposition.",
      benefits: [
        [
          "Une présence reconnaissable",
          "Relier les supports à votre identité et à vos usages.",
        ],
        [
          "Des espaces lisibles",
          "Aider les visiteurs à comprendre l’accueil et les circulations.",
        ],
        [
          "Des temps forts préparés",
          "Donner une cohérence aux supports d’événements et de rencontre.",
        ],
      ],
      detailTitle: "Ce que nous pouvons préparer avec vous",
      detail:
        "Partagez les supports déjà présents, ceux qui manquent et les dimensions disponibles. Une entrée, une réception et un événement n’ont pas les mêmes contraintes. Les visuels d’ambiance servent à illustrer les univers ; seules les photographies et caractéristiques de l’offre choisie définissent le produit proposé. Une personnalisation éventuelle doit être précisée avant commande.",
      question: "Votre accueil mérite-t-il une nouvelle signature ?",
    },
    {
      id: "classe",
      label: "Espaces & pédagogie · des usages avant les objets",
      tone: "teal",
      image: "classroom",
      chapter: 1,
      title:
        "Une belle classe ne suffit pas. Elle doit aider chaque enfant à agir.",
      lead: "Un meuble peut être élégant sans être pratique à l’endroit prévu. Un support peut être attrayant sans correspondre aux âges ou aux habitudes du groupe. Le choix commence par les usages, les contraintes et les personnes concernées.",
      solution:
        "Visuels, activités, mobilier et outils d’inclusion donnent des pistes pour organiser un environnement compréhensible. Décrivez ce que vous souhaitez permettre : manipuler, ranger, se repérer ou communiquer. Les offres publiées et leurs caractéristiques aident ensuite à étudier les formats adaptés à votre projet.",
      benefits: [
        [
          "Des repères visibles",
          "Étudier les routines et supports utiles aux activités.",
        ],
        [
          "Un aménagement cohérent",
          "Mettre en relation les meubles, rangements et circulations.",
        ],
        [
          "Des besoins pris en compte",
          "Préciser les âges, les usages et les besoins spécifiques concernés.",
        ],
      ],
      detailTitle: "Comment décrire votre espace sans tout choisir seul ?",
      detail:
        "Indiquez les dimensions disponibles, les activités prévues et les éléments que vous souhaitez conserver. Les besoins spécifiques doivent être décrits avec les professionnels concernés. Un visuel de classe n’est pas une garantie que tous les objets photographiés sont vendus ensemble ; les références et conditions retenues dans la proposition restent la base du projet.",
      question: "Imaginons des espaces adaptés à vos usages.",
    },
    {
      id: "quotidien",
      label: "Quotidien & familles · des repères partagés",
      tone: "coral",
      image: "administration",
      chapter: 2,
      title: "Les petits désordres du quotidien finissent par peser.",
      lead: "Une information difficile à retrouver, une consigne répétée ou un support différent selon la personne : ces frictions occupent du temps et fragilisent la continuité des pratiques. Des outils compréhensibles peuvent donner une place plus claire à l’information.",
      solution:
        "Administration, hygiène, départs et communication parents forment quatre univers complémentaires. Le projet sert à préciser ce qui doit être expliqué, renseigné ou retrouvé. Les supports sont à choisir selon vos procédures, vos destinataires et les caractéristiques de chaque offre, avec un contenu adapté à votre établissement.",
      benefits: [
        [
          "Une information située",
          "Distinguer ce qui sert à inscrire, transmettre ou suivre.",
        ],
        [
          "Des routines compréhensibles",
          "Relier les consignes aux supports réellement utilisés.",
        ],
        [
          "Une continuité avec les familles",
          "Préparer les outils de communication et de suivi pertinents.",
        ],
      ],
      detailTitle: "Quels supports doivent accompagner vos procédures ?",
      detail:
        "Commencez par une situation récurrente : une inscription, une routine d’hygiène, une autorisation de départ ou un retour aux parents. Décrivez la personne qui renseigne le support et celle qui doit le consulter. Le choix d’un outil ne remplace pas la définition de vos procédures, des responsabilités et des règles applicables.",
      question: "Simplifions votre quotidien avec les bons supports.",
    },
    {
      id: "identite-equipe",
      label: "Équipe & organisation · une même exigence",
      tone: "purple",
      image: "uniforms",
      chapter: 3,
      title: "Votre équipe porte votre image, jusque dans les détails.",
      lead: "Les tenues, les outils et les supports de travail participent à la manière dont votre établissement est perçu. Leur cohérence doit rester utile aux personnes qui les portent ou les utilisent au quotidien.",
      solution:
        "Uniformes, outils d’équipe, préparation aux audits et traçabilité donnent des pistes pour structurer un ensemble. Précisez les personnes concernées, les usages, les formats et les contraintes. Une proposition peut alors distinguer les références retenues, les options éventuelles et les éléments restant à confirmer.",
      benefits: [
        [
          "Une identité lisible",
          "Étudier les tenues, badges et supports cohérents avec votre projet.",
        ],
        [
          "Des outils de travail",
          "Préciser les planners, grilles et documents utiles à l’équipe.",
        ],
        [
          "Des pièces retrouvables",
          "Organiser les supports de suivi et de préparation aux contrôles.",
        ],
      ],
      detailTitle: "Quels détails doivent être précisés avant le choix ?",
      detail:
        "Pour une tenue, les tailles, matières, usages et possibilités de marquage comptent. Pour un support documentaire, le format, les destinataires et les informations à suivre sont essentiels. Les visuels d’ambiance sont illustratifs. Une préparation aux audits ne constitue ni une certification ni une validation réglementaire de votre établissement.",
      question: "Parlons de votre identité et de votre organisation.",
    },
    {
      id: "personnalisation",
      label: "Personnalisation · un choix qui doit servir l’usage",
      tone: "pink",
      image: "products-hero",
      title:
        "Personnaliser, c’est rendre utile autant que rendre reconnaissable.",
      lead: "Un logo apposé sur un support ne suffit pas à le rendre pertinent. La bonne personnalisation tient compte du lieu, de la personne qui utilise l’objet, de l’information à transmettre et des contraintes de format.",
      solution:
        "Présentez votre identité, vos supports existants et le résultat recherché. Les options disponibles dépendent de chaque offre : les matières, formats, couleurs, marquages ou contenus doivent être confirmés. Nous vous aidons à structurer une demande pour que le périmètre envisagé soit compréhensible avant le choix des références.",
      benefits: [
        [
          "Votre identité comme repère",
          "Préciser les éléments graphiques à reprendre et leur usage.",
        ],
        [
          "Le bon format",
          "Relier la taille et le support au contexte d’utilisation.",
        ],
        [
          "Des options vérifiées",
          "Confirmer les possibilités annoncées par l’offre concernée.",
        ],
      ],
      detailTitle: "Que joindre à votre demande de personnalisation ?",
      detail:
        "Vous pouvez décrire vos couleurs, le type de marquage attendu et les supports concernés dans votre message. Le premier échange permet de préciser les éléments nécessaires à l’étude du projet. La disponibilité d’une option ne doit pas être déduite d’une image d’ambiance ; elle doit être indiquée dans les caractéristiques de l’offre ou confirmée dans la proposition.",
      question: "Préparons une personnalisation qui a du sens.",
    },
    {
      id: "coherence",
      label: "Votre projet · un ensemble à construire",
      tone: "green",
      image: "furniture",
      title: "Vous n’avez pas besoin de tout choisir seul.",
      lead: "Un accueil, une classe et une équipe ne se composent pas comme une simple liste d’objets. Les références doivent répondre à des usages et rester cohérentes avec ce que vous possédez déjà et ce que vous souhaitez faire évoluer.",
      solution:
        "Utilisez le catalogue pour repérer et comparer les offres réelles, puis réunissez les éléments utiles dans votre projet. Votre demande peut aussi partir d’un besoin sans référence choisie. La proposition sert à préciser les quantités, les caractéristiques, la personnalisation et les conditions applicables, selon les offres disponibles.",
      benefits: [
        [
          "Des priorités situées",
          "Distinguer ce qui doit évoluer maintenant et ce qui peut attendre.",
        ],
        [
          "Une sélection compréhensible",
          "Relier les références à vos besoins et à vos contraintes.",
        ],
        [
          "Une proposition à étudier",
          "Clarifier les options et conditions avant tout engagement.",
        ],
      ],
      detailTitle: "Comment préparer un projet avec plusieurs univers ?",
      detail:
        "Décrivez les espaces ou personnes concernés, les supports déjà présents et votre ordre de priorité. Les favoris et la comparaison servent à examiner les offres ; le projet prépare un échange commercial. Les prix, disponibilités et parcours natifs de chaque offre restent les références. L’envoi de la demande ne vaut pas commande ni confirmation de livraison.",
      question: "Construisons une demande à la hauteur de votre projet.",
    },
  ],
};

export const SCENARIOS: Record<
  View,
  { title: string; text: string; subject: string }[]
> = {
  conseil: [
    {
      title: "Nous voulons enrichir les activités.",
      text: "Partez des âges, des groupes et de votre rythme actuel. La demande peut situer la place des ateliers, le travail de l’équipe et la manière de partager les actions avec les familles. Les formules EduPlay donnent des cadences de référence à étudier.",
      subject: "Programme d’activités et engagement des enfants",
    },
    {
      title: "Notre équipe a besoin de repères communs.",
      text: "Décrivez une compétence ou une situation récurrente. Une session ciblée et un parcours d’équipe ne répondent pas au même besoin. Le contexte permet de préciser les personnes concernées, les mises en situation et les livrables utiles.",
      subject: "Formation et pratiques partagées de l’équipe",
    },
    {
      title: "Nous souhaitons mieux communiquer notre valeur.",
      text: "Présentez le parcours des familles et les supports déjà utilisés. L’objectif est d’identifier ce qui mérite d’être expliqué, les moments pertinents et les actions de suivi à structurer avec ParentTrust.",
      subject: "Accueil et communication avec les familles",
    },
  ],
  "partner-os": [
    {
      title: "Nous suivons les demandes sur plusieurs supports.",
      text: "Reconstituez une seule demande récente : contact, rendez-vous, documents, prochaine action. Cet exemple permet d’étudier la continuité recherchée sans vous demander de définir vous-même une configuration technique.",
      subject: "Continuité des admissions et des demandes familles",
    },
    {
      title: "Nous devons mieux coordonner notre équipe.",
      text: "Un changement de planning, une mission et un besoin de formation peuvent illustrer les informations à relier. Précisez les personnes concernées et les responsabilités que vous souhaitez rendre plus lisibles.",
      subject: "Coordination des équipes et des opérations",
    },
    {
      title: "Nous voulons une lecture plus claire de notre activité.",
      text: "Partagez les questions auxquelles la direction doit répondre : demandes en cours, organisation des sites ou éléments de suivi. Le plan et la configuration doivent être étudiés à partir de ces usages.",
      subject: "Direction, reporting et organisation des sites",
    },
  ],
  produits: [
    {
      title: "Nous ouvrons ou repensons un espace.",
      text: "Décrivez les dimensions, les âges accueillis et les usages envisagés. Le catalogue sert à identifier des références ; le projet permet de relier mobilier, supports et organisation sans supposer que tout doit être remplacé.",
      subject: "Aménagement et équipement d’un espace",
    },
    {
      title: "Nous voulons harmoniser notre identité.",
      text: "Précisez les lieux et supports concernés : accueil, signalétique, événements ou équipe. Les options de formats et de personnalisation doivent être vérifiées pour chaque offre avant de constituer un ensemble.",
      subject: "Identité visuelle, accueil et supports personnalisés",
    },
    {
      title: "Nous cherchons des outils pour le quotidien.",
      text: "Partez des situations à simplifier : inscription, routine, communication ou suivi. Les outils doivent correspondre aux destinataires, aux informations nécessaires et à la manière dont votre établissement travaille.",
      subject: "Supports d’organisation et de communication",
    },
  ],
};

export const QUESTIONS: Record<View, [string, string][]> = {
  conseil: [
    [
      "Comment choisir sans connaître toutes les formules ?",
      "Commencez par une situation concrète : une activité à structurer, une pratique à partager ou une relation famille-école à améliorer. Le diagnostic partenariat sert à clarifier la priorité avant de comparer les formules. Vous pouvez présenter votre besoin sans avoir déjà sélectionné une offre.",
    ],
    [
      "Peut-on relier les trois programmes ?",
      "Votre projet peut réunir des besoins d’activités, de formation et de communication. Il faut ensuite distinguer les interventions et livrables de chaque formule, leur cadence et leur périmètre. La sélection prépare cette discussion ; elle ne crée pas automatiquement un forfait combiné.",
    ],
    [
      "Les tarifs de référence sont-ils les prix des offres publiées ?",
      "Les neuf formules reprennent les montants et unités de la brochure. Une offre publiée peut avoir son propre prix, sa disponibilité et ses conditions. Le catalogue conserve cette autorité et la proposition précise le périmètre applicable. Les unités mois, session, programme et parcours restent distinctes.",
    ],
    [
      "Quels éléments préparer avant le premier échange ?",
      "Le nom de l’établissement, la ville, votre priorité et une description de la situation permettent de commencer. Précisez les groupes ou personnes concernés, les pratiques existantes et l’horizon envisagé. Les coordonnées servent à vous répondre au sujet de cette demande.",
    ],
    [
      "Comment rendre les livrables utiles à l’équipe ?",
      "Chaque support doit avoir un destinataire et un usage : préparer une intervention, partager un repère, communiquer une action ou suivre une priorité. Demandez à préciser les livrables et leur fréquence selon la formule. Les aperçus de cette page expliquent les formats sans remplacer la proposition.",
    ],
    [
      "Que se passe-t-il après l’envoi ?",
      "Une confirmation avec une référence apparaît lorsque l’enregistrement est confirmé. La demande sert à préparer un échange et une proposition ; elle ne réserve pas automatiquement un créneau et ne constitue pas un achat. Conservez la référence pour situer votre projet.",
    ],
  ],
  "partner-os": [
    [
      "Que comprend le plan gratuit pendant douze mois ?",
      "L’offre mise en avant concerne douze mois sur le plan gratuit. Le périmètre, les conditions et l’activation doivent être précisés avec vous. Les vingt domaines présentés décrivent l’écosystème ; ils ne signifient pas que toutes les fonctions et options sont incluses gratuitement.",
    ],
    [
      "Faut-il choisir tous les modules dès le départ ?",
      "La demande peut partir d’un seul point de friction. Nous étudions les capacités pertinentes pour ce besoin, puis le plan et la configuration. Le projet doit permettre de comprendre ce qui est proposé maintenant et ce qui relève d’une évolution ou d’une option.",
    ],
    [
      "Peut-on parler de plusieurs établissements ?",
      "Le domaine Multi-établissements figure parmi les capacités présentées. Décrivez les sites, les besoins propres à chacun et les informations à coordonner. La disponibilité et les conditions de cet usage doivent être confirmées dans le plan et le périmètre retenus.",
    ],
    [
      "Les aperçus montrent-ils notre futur compte ?",
      "Les visuels et séquences sont des illustrations de logique d’usage. Ils ne montrent pas un compte actif, des résultats clients ou une configuration déjà livrée. Les possibilités réelles sont à confirmer selon le plan, les capacités disponibles et votre projet.",
    ],
    [
      "Comment préparer la mise en route ?",
      "Décrivez le contexte, les personnes concernées et une situation que vous souhaitez mieux suivre. La préparation sert à préciser les capacités, les responsabilités et les prochaines étapes. Les données à reprendre et les modalités d’accompagnement doivent être discutées avant l’activation.",
    ],
    [
      "L’envoi active-t-il un abonnement ?",
      "Non. La demande prépare un échange commercial. Elle ne crée pas automatiquement un abonnement et ne sélectionne pas de modules payants à votre place. La référence de confirmation indique que la demande a été enregistrée ; le plan et ses conditions restent à préciser.",
    ],
  ],
  produits: [
    [
      "Comment commencer si nous ne savons pas quelles références choisir ?",
      "Décrivez l’espace, les personnes ou les situations concernés. Vous pouvez préciser ce que vous possédez déjà et le résultat recherché. Les seize univers donnent des pistes ; le catalogue présente les offres réellement publiées et leurs caractéristiques.",
    ],
    [
      "Les images d’ambiance correspondent-elles aux produits vendus ?",
      "Les campagnes illustrent des usages et des univers. Pour un produit précis, sa photographie, sa description et ses caractéristiques publiées restent la référence. Un décor photographié ne constitue pas un lot vendu ni une garantie de disponibilité de tous les objets représentés.",
    ],
    [
      "Peut-on personnaliser les supports et les tenues ?",
      "Cela dépend de chaque offre. Les formats, matières, couleurs, contenus ou marquages doivent être vérifiés dans les caractéristiques et la proposition. Décrivez les besoins dans votre demande ; une option ne doit pas être déduite de la seule image d’ambiance.",
    ],
    [
      "Comment connaître le prix et la disponibilité ?",
      "Chaque offre affiche son prix publié ou la mention Sur devis et son statut de disponibilité. Les filtres et la comparaison permettent d’examiner ces éléments. Les quantités, options et conditions propres à votre projet sont à préciser dans la proposition.",
    ],
    [
      "La sélection constitue-t-elle une commande ?",
      "La sélection de projet prépare un échange. Elle ne vaut pas commande et ne confirme pas une disponibilité ou une livraison. Le parcours natif de l’offre conserve ses propres étapes de conversion. Les coordonnées et le contexte permettent de vous répondre sur les besoins transmis.",
    ],
    [
      "Peut-on combiner plusieurs univers ?",
      "Vous pouvez réunir des besoins d’accueil, d’espace, de quotidien et d’équipe dans une même demande. Situez vos priorités pour permettre une proposition cohérente. Les caractéristiques, quantités et conditions doivent rester identifiables pour chaque référence retenue.",
    ],
  ],
};

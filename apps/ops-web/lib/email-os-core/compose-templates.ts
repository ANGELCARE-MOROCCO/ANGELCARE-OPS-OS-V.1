export type EmailOSTemplate = {
  key: string
  category: string
  title: string
  subject: string
  body: string
}

export const emailOSComposeTemplates: EmailOSTemplate[] = [
  {
    key: "b2b-proposition-collaboration",
    category: "Commercial B2B",
    title: "Proposition de collaboration",
    subject: "Proposition de collaboration professionnelle",
    body: `Bonjour,

Suite à notre échange concernant [SERVICE À MODIFIER], nous souhaitons vous proposer une collaboration structurée et adaptée aux besoins de [NOM ENTREPRISE].

Axes proposés :
- [AXE 1 À MODIFIER]
- [AXE 2 À MODIFIER]
- [AXE 3 À MODIFIER]

Merci de nous confirmer vos disponibilités pour une réunion durant [PÉRIODE À MODIFIER].

Cordialement,
AngelCare`
  },
  {
    key: "b2c-suivi-demande",
    category: "Service Client",
    title: "Suivi de demande client",
    subject: "Suivi de votre demande",
    body: `Bonjour,

Nous revenons vers vous concernant votre demande liée à [SERVICE À MODIFIER].

Merci de nous transmettre les éléments suivants :
- [INFORMATION 1 À MODIFIER]
- [INFORMATION 2 À MODIFIER]

Dès réception, nous pourrons poursuivre rapidement le traitement de votre demande.

Cordialement,
AngelCare`
  },
  {
    key: "rh-convocation-entretien",
    category: "RH",
    title: "Convocation entretien",
    subject: "Convocation à un entretien",
    body: `Bonjour,

Suite à votre candidature pour le poste de [POSTE À MODIFIER], nous vous proposons un entretien.

Détails :
- Date : [DATE À MODIFIER]
- Heure : [HEURE À MODIFIER]
- Format : [VISIO / PRÉSENTIEL À MODIFIER]

Cordialement,
Département RH — AngelCare`
  },
  {
    key: "ambassadeur-activation-mission",
    category: "Ambassadeurs",
    title: "Activation mission ambassadeur",
    subject: "Activation de votre mission ambassadeur",
    body: `Bonjour,

Votre mission ambassadeur concernant la zone [ZONE À MODIFIER] est désormais activée.

Objectifs opérationnels :
- [OBJECTIF 1 À MODIFIER]
- [OBJECTIF 2 À MODIFIER]
- [OBJECTIF 3 À MODIFIER]

Merci de transmettre votre rapport avant [DATE LIMITE À MODIFIER].

Cordialement,
Direction Développement — AngelCare`
  },
  {
    key: "interne-escalade-operationnelle",
    category: "Coordination Interne",
    title: "Escalade opérationnelle",
    subject: "Escalade opérationnelle prioritaire",
    body: `Bonjour,

Une intervention rapide est demandée concernant le sujet suivant :
[SUJET À MODIFIER]

Impact identifié :
- [IMPACT 1 À MODIFIER]
- [IMPACT 2 À MODIFIER]

Merci de confirmer la prise en charge, le responsable désigné et le délai estimé de résolution.

Cordialement,
Direction des Opérations — AngelCare`
  }
]

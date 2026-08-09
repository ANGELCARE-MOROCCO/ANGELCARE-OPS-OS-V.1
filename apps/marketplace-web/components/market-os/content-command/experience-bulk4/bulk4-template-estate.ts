import type { TemplateDNA } from "./bulk4-types"

export const BULK4_TEMPLATE_ESTATE: TemplateDNA[] = [
  {
    "id": "ac-digital-01",
    "code": "AC-TPL-DIG-001",
    "name": "Premium social campaign post",
    "family": "digital",
    "category": "Instagram",
    "purpose": "Acquisition premium",
    "businessObjective": "Acquisition premium",
    "services": [
      "Home Service",
      "Academy",
      "Kindergarten & Preschool",
      "Hospitality",
      "Corporates"
    ],
    "audiences": [
      "Parents",
      "Partenaires",
      "Professionnels"
    ],
    "channels": [
      "Instagram"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Rabat",
      "Casablanca",
      "Kénitra",
      "National"
    ],
    "anatomy": [
      "Carré hiérarchisé",
      "Promesse",
      "Preuve",
      "CTA"
    ],
    "slots": [
      {
        "id": "headline",
        "label": "Titre principal",
        "kind": "headline",
        "required": true,
        "limit": "8–70 caractères"
      },
      {
        "id": "visual",
        "label": "Visuel principal",
        "kind": "image",
        "required": true
      },
      {
        "id": "proof",
        "label": "Preuve ou bénéfice",
        "kind": "proof",
        "required": true
      },
      {
        "id": "cta",
        "label": "Appel à l’action",
        "kind": "cta",
        "required": true
      },
      {
        "id": "logo",
        "label": "Signature AngelCare",
        "kind": "logo",
        "required": true,
        "locked": true
      },
      {
        "id": "disclaimer",
        "label": "Mention gouvernée",
        "kind": "footer",
        "required": false,
        "locked": true
      }
    ],
    "outputProfiles": [
      {
        "id": "dig-1-1",
        "label": "Instagram 1",
        "dimensions": "1080×1080",
        "orientation": "square",
        "channel": "Instagram",
        "safeZone": "Logo, texte et CTA hors zones d’interface"
      }
    ],
    "lockedZones": [
      "Logo AngelCare",
      "Zone légale",
      "Identité du service"
    ],
    "variableZones": [
      "Promesse",
      "Preuve",
      "CTA"
    ],
    "rules": [
      "Respecter la hiérarchie du message",
      "Une seule promesse principale",
      "CTA cohérent avec le brief",
      "Aucune promesse médicale non autorisée"
    ],
    "evidence": [
      "Aperçu final",
      "Vérification du CTA",
      "Référence de source visuelle"
    ],
    "accessibility": [
      "Contraste lisible",
      "Texte essentiel hors image lorsque requis",
      "Alternative textuelle documentée"
    ],
    "allowedAdaptations": [
      "Langue",
      "Ville",
      "Canal",
      "Audience",
      "Partenaire autorisé"
    ],
    "prohibitedAdaptations": [
      "Déplacer le logo hors zone",
      "Supprimer la mention obligatoire",
      "Modifier une offre sans nouveau brief"
    ],
    "owner": "Creative Production",
    "authority": "Brand Manager",
    "version": "v1.0",
    "status": "Active",
    "tone": "violet"
  },
  {
    "id": "ac-digital-02",
    "code": "AC-TPL-DIG-002",
    "name": "Instagram Story",
    "family": "digital",
    "category": "Instagram Story",
    "purpose": "Activation immédiate",
    "businessObjective": "Activation immédiate",
    "services": [
      "Home Service",
      "Academy",
      "Kindergarten & Preschool",
      "Hospitality",
      "Corporates"
    ],
    "audiences": [
      "Parents",
      "Partenaires",
      "Professionnels"
    ],
    "channels": [
      "Instagram Story"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Rabat",
      "Casablanca",
      "Kénitra",
      "National"
    ],
    "anatomy": [
      "Séquence verticale",
      "Hook",
      "Preuve",
      "Swipe/CTA"
    ],
    "slots": [
      {
        "id": "headline",
        "label": "Titre principal",
        "kind": "headline",
        "required": true,
        "limit": "8–70 caractères"
      },
      {
        "id": "visual",
        "label": "Visuel principal",
        "kind": "image",
        "required": true
      },
      {
        "id": "proof",
        "label": "Preuve ou bénéfice",
        "kind": "proof",
        "required": true
      },
      {
        "id": "cta",
        "label": "Appel à l’action",
        "kind": "cta",
        "required": true
      },
      {
        "id": "logo",
        "label": "Signature AngelCare",
        "kind": "logo",
        "required": true,
        "locked": true
      },
      {
        "id": "disclaimer",
        "label": "Mention gouvernée",
        "kind": "footer",
        "required": false,
        "locked": true
      }
    ],
    "outputProfiles": [
      {
        "id": "dig-2-1",
        "label": "Instagram Story 1",
        "dimensions": "1080×1920",
        "orientation": "portrait",
        "channel": "Instagram Story",
        "safeZone": "Logo, texte et CTA hors zones d’interface"
      }
    ],
    "lockedZones": [
      "Logo AngelCare",
      "Zone légale",
      "Identité du service"
    ],
    "variableZones": [
      "Hook",
      "Preuve",
      "Swipe/CTA"
    ],
    "rules": [
      "Respecter la hiérarchie du message",
      "Une seule promesse principale",
      "CTA cohérent avec le brief",
      "Aucune promesse médicale non autorisée"
    ],
    "evidence": [
      "Aperçu final",
      "Vérification du CTA",
      "Référence de source visuelle"
    ],
    "accessibility": [
      "Contraste lisible",
      "Texte essentiel hors image lorsque requis",
      "Alternative textuelle documentée"
    ],
    "allowedAdaptations": [
      "Langue",
      "Ville",
      "Canal",
      "Audience",
      "Partenaire autorisé"
    ],
    "prohibitedAdaptations": [
      "Déplacer le logo hors zone",
      "Supprimer la mention obligatoire",
      "Modifier une offre sans nouveau brief"
    ],
    "owner": "Creative Production",
    "authority": "Brand Manager",
    "version": "v1.0",
    "status": "Active",
    "tone": "violet"
  },
  {
    "id": "ac-digital-03",
    "code": "AC-TPL-DIG-003",
    "name": "Multi-slide carousel",
    "family": "digital",
    "category": "Instagram Carousel",
    "purpose": "Éducation structurée",
    "businessObjective": "Éducation structurée",
    "services": [
      "Home Service",
      "Academy",
      "Kindergarten & Preschool",
      "Hospitality",
      "Corporates"
    ],
    "audiences": [
      "Parents",
      "Partenaires",
      "Professionnels"
    ],
    "channels": [
      "Instagram Carousel"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Rabat",
      "Casablanca",
      "Kénitra",
      "National"
    ],
    "anatomy": [
      "Narration par étapes",
      "Couverture",
      "Étapes",
      "Conclusion CTA"
    ],
    "slots": [
      {
        "id": "headline",
        "label": "Titre principal",
        "kind": "headline",
        "required": true,
        "limit": "8–70 caractères"
      },
      {
        "id": "visual",
        "label": "Visuel principal",
        "kind": "image",
        "required": true
      },
      {
        "id": "proof",
        "label": "Preuve ou bénéfice",
        "kind": "proof",
        "required": true
      },
      {
        "id": "cta",
        "label": "Appel à l’action",
        "kind": "cta",
        "required": true
      },
      {
        "id": "logo",
        "label": "Signature AngelCare",
        "kind": "logo",
        "required": true,
        "locked": true
      },
      {
        "id": "disclaimer",
        "label": "Mention gouvernée",
        "kind": "footer",
        "required": false,
        "locked": true
      }
    ],
    "outputProfiles": [
      {
        "id": "dig-3-1",
        "label": "Instagram Carousel 1",
        "dimensions": "1080×1350 × 6",
        "orientation": "portrait",
        "channel": "Instagram Carousel",
        "safeZone": "Logo, texte et CTA hors zones d’interface"
      }
    ],
    "lockedZones": [
      "Logo AngelCare",
      "Zone légale",
      "Identité du service"
    ],
    "variableZones": [
      "Couverture",
      "Étapes",
      "Conclusion CTA"
    ],
    "rules": [
      "Respecter la hiérarchie du message",
      "Une seule promesse principale",
      "CTA cohérent avec le brief",
      "Aucune promesse médicale non autorisée"
    ],
    "evidence": [
      "Aperçu final",
      "Vérification du CTA",
      "Référence de source visuelle"
    ],
    "accessibility": [
      "Contraste lisible",
      "Texte essentiel hors image lorsque requis",
      "Alternative textuelle documentée"
    ],
    "allowedAdaptations": [
      "Langue",
      "Ville",
      "Canal",
      "Audience",
      "Partenaire autorisé"
    ],
    "prohibitedAdaptations": [
      "Déplacer le logo hors zone",
      "Supprimer la mention obligatoire",
      "Modifier une offre sans nouveau brief"
    ],
    "owner": "Creative Production",
    "authority": "Brand Manager",
    "version": "v1.0",
    "status": "Active",
    "tone": "violet"
  },
  {
    "id": "ac-digital-04",
    "code": "AC-TPL-DIG-004",
    "name": "Reels or video cover",
    "family": "digital",
    "category": "Instagram Reels",
    "purpose": "Reconnaissance vidéo",
    "businessObjective": "Reconnaissance vidéo",
    "services": [
      "Home Service",
      "Academy",
      "Kindergarten & Preschool",
      "Hospitality",
      "Corporates"
    ],
    "audiences": [
      "Parents",
      "Partenaires",
      "Professionnels"
    ],
    "channels": [
      "Instagram Reels"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Rabat",
      "Casablanca",
      "Kénitra",
      "National"
    ],
    "anatomy": [
      "Couverture à impact",
      "Sujet central",
      "Titre court",
      "Marque"
    ],
    "slots": [
      {
        "id": "headline",
        "label": "Titre principal",
        "kind": "headline",
        "required": true,
        "limit": "8–70 caractères"
      },
      {
        "id": "visual",
        "label": "Visuel principal",
        "kind": "image",
        "required": true
      },
      {
        "id": "proof",
        "label": "Preuve ou bénéfice",
        "kind": "proof",
        "required": true
      },
      {
        "id": "cta",
        "label": "Appel à l’action",
        "kind": "cta",
        "required": true
      },
      {
        "id": "logo",
        "label": "Signature AngelCare",
        "kind": "logo",
        "required": true,
        "locked": true
      },
      {
        "id": "disclaimer",
        "label": "Mention gouvernée",
        "kind": "footer",
        "required": false,
        "locked": true
      }
    ],
    "outputProfiles": [
      {
        "id": "dig-4-1",
        "label": "Instagram Reels 1",
        "dimensions": "1080×1920",
        "orientation": "portrait",
        "channel": "Instagram Reels",
        "safeZone": "Logo, texte et CTA hors zones d’interface"
      }
    ],
    "lockedZones": [
      "Logo AngelCare",
      "Zone légale",
      "Identité du service"
    ],
    "variableZones": [
      "Sujet central",
      "Titre court",
      "Marque"
    ],
    "rules": [
      "Respecter la hiérarchie du message",
      "Une seule promesse principale",
      "CTA cohérent avec le brief",
      "Aucune promesse médicale non autorisée"
    ],
    "evidence": [
      "Aperçu final",
      "Vérification du CTA",
      "Référence de source visuelle"
    ],
    "accessibility": [
      "Contraste lisible",
      "Texte essentiel hors image lorsque requis",
      "Alternative textuelle documentée"
    ],
    "allowedAdaptations": [
      "Langue",
      "Ville",
      "Canal",
      "Audience",
      "Partenaire autorisé"
    ],
    "prohibitedAdaptations": [
      "Déplacer le logo hors zone",
      "Supprimer la mention obligatoire",
      "Modifier une offre sans nouveau brief"
    ],
    "owner": "Creative Production",
    "authority": "Brand Manager",
    "version": "v1.0",
    "status": "Active",
    "tone": "violet"
  },
  {
    "id": "ac-digital-05",
    "code": "AC-TPL-DIG-005",
    "name": "LinkedIn executive communication",
    "family": "digital",
    "category": "LinkedIn",
    "purpose": "Autorité institutionnelle",
    "businessObjective": "Autorité institutionnelle",
    "services": [
      "Home Service",
      "Academy",
      "Kindergarten & Preschool",
      "Hospitality",
      "Corporates"
    ],
    "audiences": [
      "Parents",
      "Partenaires",
      "Professionnels"
    ],
    "channels": [
      "LinkedIn"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Rabat",
      "Casablanca",
      "Kénitra",
      "National"
    ],
    "anatomy": [
      "Éditorial direction",
      "Thèse",
      "Point de vue",
      "Signature"
    ],
    "slots": [
      {
        "id": "headline",
        "label": "Titre principal",
        "kind": "headline",
        "required": true,
        "limit": "8–70 caractères"
      },
      {
        "id": "visual",
        "label": "Visuel principal",
        "kind": "image",
        "required": true
      },
      {
        "id": "proof",
        "label": "Preuve ou bénéfice",
        "kind": "proof",
        "required": true
      },
      {
        "id": "cta",
        "label": "Appel à l’action",
        "kind": "cta",
        "required": true
      },
      {
        "id": "logo",
        "label": "Signature AngelCare",
        "kind": "logo",
        "required": true,
        "locked": true
      },
      {
        "id": "disclaimer",
        "label": "Mention gouvernée",
        "kind": "footer",
        "required": false,
        "locked": true
      }
    ],
    "outputProfiles": [
      {
        "id": "dig-5-1",
        "label": "LinkedIn 1",
        "dimensions": "1200×627",
        "orientation": "landscape",
        "channel": "LinkedIn",
        "safeZone": "Logo, texte et CTA hors zones d’interface"
      }
    ],
    "lockedZones": [
      "Logo AngelCare",
      "Zone légale",
      "Identité du service"
    ],
    "variableZones": [
      "Thèse",
      "Point de vue",
      "Signature"
    ],
    "rules": [
      "Respecter la hiérarchie du message",
      "Une seule promesse principale",
      "CTA cohérent avec le brief",
      "Aucune promesse médicale non autorisée"
    ],
    "evidence": [
      "Aperçu final",
      "Vérification du CTA",
      "Référence de source visuelle"
    ],
    "accessibility": [
      "Contraste lisible",
      "Texte essentiel hors image lorsque requis",
      "Alternative textuelle documentée"
    ],
    "allowedAdaptations": [
      "Langue",
      "Ville",
      "Canal",
      "Audience",
      "Partenaire autorisé"
    ],
    "prohibitedAdaptations": [
      "Déplacer le logo hors zone",
      "Supprimer la mention obligatoire",
      "Modifier une offre sans nouveau brief"
    ],
    "owner": "Creative Production",
    "authority": "Brand Manager",
    "version": "v1.0",
    "status": "Active",
    "tone": "violet"
  },
  {
    "id": "ac-digital-06",
    "code": "AC-TPL-DIG-006",
    "name": "WhatsApp campaign card",
    "family": "digital",
    "category": "WhatsApp",
    "purpose": "Conversion directe",
    "businessObjective": "Conversion directe",
    "services": [
      "Home Service",
      "Academy",
      "Kindergarten & Preschool",
      "Hospitality",
      "Corporates"
    ],
    "audiences": [
      "Parents",
      "Partenaires",
      "Professionnels"
    ],
    "channels": [
      "WhatsApp"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Rabat",
      "Casablanca",
      "Kénitra",
      "National"
    ],
    "anatomy": [
      "Lecture instantanée",
      "Bénéfice",
      "Offre",
      "Contact"
    ],
    "slots": [
      {
        "id": "headline",
        "label": "Titre principal",
        "kind": "headline",
        "required": true,
        "limit": "8–70 caractères"
      },
      {
        "id": "visual",
        "label": "Visuel principal",
        "kind": "image",
        "required": true
      },
      {
        "id": "proof",
        "label": "Preuve ou bénéfice",
        "kind": "proof",
        "required": true
      },
      {
        "id": "cta",
        "label": "Appel à l’action",
        "kind": "cta",
        "required": true
      },
      {
        "id": "logo",
        "label": "Signature AngelCare",
        "kind": "logo",
        "required": true,
        "locked": true
      },
      {
        "id": "disclaimer",
        "label": "Mention gouvernée",
        "kind": "footer",
        "required": false,
        "locked": true
      }
    ],
    "outputProfiles": [
      {
        "id": "dig-6-1",
        "label": "WhatsApp 1",
        "dimensions": "1080×1350",
        "orientation": "portrait",
        "channel": "WhatsApp",
        "safeZone": "Logo, texte et CTA hors zones d’interface"
      }
    ],
    "lockedZones": [
      "Logo AngelCare",
      "Zone légale",
      "Identité du service"
    ],
    "variableZones": [
      "Bénéfice",
      "Offre",
      "Contact"
    ],
    "rules": [
      "Respecter la hiérarchie du message",
      "Une seule promesse principale",
      "CTA cohérent avec le brief",
      "Aucune promesse médicale non autorisée"
    ],
    "evidence": [
      "Aperçu final",
      "Vérification du CTA",
      "Référence de source visuelle"
    ],
    "accessibility": [
      "Contraste lisible",
      "Texte essentiel hors image lorsque requis",
      "Alternative textuelle documentée"
    ],
    "allowedAdaptations": [
      "Langue",
      "Ville",
      "Canal",
      "Audience",
      "Partenaire autorisé"
    ],
    "prohibitedAdaptations": [
      "Déplacer le logo hors zone",
      "Supprimer la mention obligatoire",
      "Modifier une offre sans nouveau brief"
    ],
    "owner": "Creative Production",
    "authority": "Brand Manager",
    "version": "v1.0",
    "status": "Active",
    "tone": "violet"
  },
  {
    "id": "ac-digital-07",
    "code": "AC-TPL-DIG-007",
    "name": "Email campaign hero",
    "family": "digital",
    "category": "Email",
    "purpose": "Ouverture email",
    "businessObjective": "Ouverture email",
    "services": [
      "Home Service",
      "Academy",
      "Kindergarten & Preschool",
      "Hospitality",
      "Corporates"
    ],
    "audiences": [
      "Parents",
      "Partenaires",
      "Professionnels"
    ],
    "channels": [
      "Email"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Rabat",
      "Casablanca",
      "Kénitra",
      "National"
    ],
    "anatomy": [
      "Hero de campagne",
      "Headline",
      "Preuve visuelle",
      "CTA"
    ],
    "slots": [
      {
        "id": "headline",
        "label": "Titre principal",
        "kind": "headline",
        "required": true,
        "limit": "8–70 caractères"
      },
      {
        "id": "visual",
        "label": "Visuel principal",
        "kind": "image",
        "required": true
      },
      {
        "id": "proof",
        "label": "Preuve ou bénéfice",
        "kind": "proof",
        "required": true
      },
      {
        "id": "cta",
        "label": "Appel à l’action",
        "kind": "cta",
        "required": true
      },
      {
        "id": "logo",
        "label": "Signature AngelCare",
        "kind": "logo",
        "required": true,
        "locked": true
      },
      {
        "id": "disclaimer",
        "label": "Mention gouvernée",
        "kind": "footer",
        "required": false,
        "locked": true
      }
    ],
    "outputProfiles": [
      {
        "id": "dig-7-1",
        "label": "Email 1",
        "dimensions": "1200×600",
        "orientation": "landscape",
        "channel": "Email",
        "safeZone": "Logo, texte et CTA hors zones d’interface"
      }
    ],
    "lockedZones": [
      "Logo AngelCare",
      "Zone légale",
      "Identité du service"
    ],
    "variableZones": [
      "Headline",
      "Preuve visuelle",
      "CTA"
    ],
    "rules": [
      "Respecter la hiérarchie du message",
      "Une seule promesse principale",
      "CTA cohérent avec le brief",
      "Aucune promesse médicale non autorisée"
    ],
    "evidence": [
      "Aperçu final",
      "Vérification du CTA",
      "Référence de source visuelle"
    ],
    "accessibility": [
      "Contraste lisible",
      "Texte essentiel hors image lorsque requis",
      "Alternative textuelle documentée"
    ],
    "allowedAdaptations": [
      "Langue",
      "Ville",
      "Canal",
      "Audience",
      "Partenaire autorisé"
    ],
    "prohibitedAdaptations": [
      "Déplacer le logo hors zone",
      "Supprimer la mention obligatoire",
      "Modifier une offre sans nouveau brief"
    ],
    "owner": "Creative Production",
    "authority": "Brand Manager",
    "version": "v1.0",
    "status": "Active",
    "tone": "violet"
  },
  {
    "id": "ac-digital-08",
    "code": "AC-TPL-DIG-008",
    "name": "Website hero banner",
    "family": "digital",
    "category": "Website",
    "purpose": "Positionnement digital",
    "businessObjective": "Positionnement digital",
    "services": [
      "Home Service",
      "Academy",
      "Kindergarten & Preschool",
      "Hospitality",
      "Corporates"
    ],
    "audiences": [
      "Parents",
      "Partenaires",
      "Professionnels"
    ],
    "channels": [
      "Website"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Rabat",
      "Casablanca",
      "Kénitra",
      "National"
    ],
    "anatomy": [
      "Hero responsive",
      "Promesse",
      "Sous-titre",
      "CTA"
    ],
    "slots": [
      {
        "id": "headline",
        "label": "Titre principal",
        "kind": "headline",
        "required": true,
        "limit": "8–70 caractères"
      },
      {
        "id": "visual",
        "label": "Visuel principal",
        "kind": "image",
        "required": true
      },
      {
        "id": "proof",
        "label": "Preuve ou bénéfice",
        "kind": "proof",
        "required": true
      },
      {
        "id": "cta",
        "label": "Appel à l’action",
        "kind": "cta",
        "required": true
      },
      {
        "id": "logo",
        "label": "Signature AngelCare",
        "kind": "logo",
        "required": true,
        "locked": true
      },
      {
        "id": "disclaimer",
        "label": "Mention gouvernée",
        "kind": "footer",
        "required": false,
        "locked": true
      }
    ],
    "outputProfiles": [
      {
        "id": "dig-8-1",
        "label": "Website 1",
        "dimensions": "1920×900",
        "orientation": "portrait",
        "channel": "Website",
        "safeZone": "Logo, texte et CTA hors zones d’interface"
      },
      {
        "id": "dig-8-2",
        "label": "Website 2",
        "dimensions": "1440×700",
        "orientation": "landscape",
        "channel": "Website",
        "safeZone": "Logo, texte et CTA hors zones d’interface"
      },
      {
        "id": "dig-8-3",
        "label": "Website 3",
        "dimensions": "768×900",
        "orientation": "square",
        "channel": "Website",
        "safeZone": "Logo, texte et CTA hors zones d’interface"
      }
    ],
    "lockedZones": [
      "Logo AngelCare",
      "Zone légale",
      "Identité du service"
    ],
    "variableZones": [
      "Promesse",
      "Sous-titre",
      "CTA"
    ],
    "rules": [
      "Respecter la hiérarchie du message",
      "Une seule promesse principale",
      "CTA cohérent avec le brief",
      "Aucune promesse médicale non autorisée"
    ],
    "evidence": [
      "Aperçu final",
      "Vérification du CTA",
      "Référence de source visuelle"
    ],
    "accessibility": [
      "Contraste lisible",
      "Texte essentiel hors image lorsque requis",
      "Alternative textuelle documentée"
    ],
    "allowedAdaptations": [
      "Langue",
      "Ville",
      "Canal",
      "Audience",
      "Partenaire autorisé"
    ],
    "prohibitedAdaptations": [
      "Déplacer le logo hors zone",
      "Supprimer la mention obligatoire",
      "Modifier une offre sans nouveau brief"
    ],
    "owner": "Creative Production",
    "authority": "Brand Manager",
    "version": "v1.0",
    "status": "Active",
    "tone": "violet"
  },
  {
    "id": "ac-digital-09",
    "code": "AC-TPL-DIG-009",
    "name": "Landing-page campaign section",
    "family": "digital",
    "category": "Landing Page",
    "purpose": "Conversion détaillée",
    "businessObjective": "Conversion détaillée",
    "services": [
      "Home Service",
      "Academy",
      "Kindergarten & Preschool",
      "Hospitality",
      "Corporates"
    ],
    "audiences": [
      "Parents",
      "Partenaires",
      "Professionnels"
    ],
    "channels": [
      "Landing Page"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Rabat",
      "Casablanca",
      "Kénitra",
      "National"
    ],
    "anatomy": [
      "Section preuve",
      "Problème",
      "Solution",
      "Preuves",
      "CTA"
    ],
    "slots": [
      {
        "id": "headline",
        "label": "Titre principal",
        "kind": "headline",
        "required": true,
        "limit": "8–70 caractères"
      },
      {
        "id": "visual",
        "label": "Visuel principal",
        "kind": "image",
        "required": true
      },
      {
        "id": "proof",
        "label": "Preuve ou bénéfice",
        "kind": "proof",
        "required": true
      },
      {
        "id": "cta",
        "label": "Appel à l’action",
        "kind": "cta",
        "required": true
      },
      {
        "id": "logo",
        "label": "Signature AngelCare",
        "kind": "logo",
        "required": true,
        "locked": true
      },
      {
        "id": "disclaimer",
        "label": "Mention gouvernée",
        "kind": "footer",
        "required": false,
        "locked": true
      }
    ],
    "outputProfiles": [
      {
        "id": "dig-9-1",
        "label": "Landing Page 1",
        "dimensions": "1440×960",
        "orientation": "landscape",
        "channel": "Landing Page",
        "safeZone": "Logo, texte et CTA hors zones d’interface"
      }
    ],
    "lockedZones": [
      "Logo AngelCare",
      "Zone légale",
      "Identité du service"
    ],
    "variableZones": [
      "Problème",
      "Solution",
      "Preuves",
      "CTA"
    ],
    "rules": [
      "Respecter la hiérarchie du message",
      "Une seule promesse principale",
      "CTA cohérent avec le brief",
      "Aucune promesse médicale non autorisée"
    ],
    "evidence": [
      "Aperçu final",
      "Vérification du CTA",
      "Référence de source visuelle"
    ],
    "accessibility": [
      "Contraste lisible",
      "Texte essentiel hors image lorsque requis",
      "Alternative textuelle documentée"
    ],
    "allowedAdaptations": [
      "Langue",
      "Ville",
      "Canal",
      "Audience",
      "Partenaire autorisé"
    ],
    "prohibitedAdaptations": [
      "Déplacer le logo hors zone",
      "Supprimer la mention obligatoire",
      "Modifier une offre sans nouveau brief"
    ],
    "owner": "Creative Production",
    "authority": "Brand Manager",
    "version": "v1.0",
    "status": "Active",
    "tone": "violet"
  },
  {
    "id": "ac-digital-10",
    "code": "AC-TPL-DIG-010",
    "name": "Paid-ad creative",
    "family": "digital",
    "category": "Paid Media",
    "purpose": "Acquisition payante",
    "businessObjective": "Acquisition payante",
    "services": [
      "Home Service",
      "Academy",
      "Kindergarten & Preschool",
      "Hospitality",
      "Corporates"
    ],
    "audiences": [
      "Parents",
      "Partenaires",
      "Professionnels"
    ],
    "channels": [
      "Paid Media"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Rabat",
      "Casablanca",
      "Kénitra",
      "National"
    ],
    "anatomy": [
      "Réponse directe",
      "Hook",
      "Bénéfice",
      "CTA"
    ],
    "slots": [
      {
        "id": "headline",
        "label": "Titre principal",
        "kind": "headline",
        "required": true,
        "limit": "8–70 caractères"
      },
      {
        "id": "visual",
        "label": "Visuel principal",
        "kind": "image",
        "required": true
      },
      {
        "id": "proof",
        "label": "Preuve ou bénéfice",
        "kind": "proof",
        "required": true
      },
      {
        "id": "cta",
        "label": "Appel à l’action",
        "kind": "cta",
        "required": true
      },
      {
        "id": "logo",
        "label": "Signature AngelCare",
        "kind": "logo",
        "required": true,
        "locked": true
      },
      {
        "id": "disclaimer",
        "label": "Mention gouvernée",
        "kind": "footer",
        "required": false,
        "locked": true
      }
    ],
    "outputProfiles": [
      {
        "id": "dig-10-1",
        "label": "Paid Media 1",
        "dimensions": "1080×1080",
        "orientation": "square",
        "channel": "Paid Media",
        "safeZone": "Logo, texte et CTA hors zones d’interface"
      },
      {
        "id": "dig-10-2",
        "label": "Paid Media 2",
        "dimensions": "1080×1920",
        "orientation": "portrait",
        "channel": "Paid Media",
        "safeZone": "Logo, texte et CTA hors zones d’interface"
      }
    ],
    "lockedZones": [
      "Logo AngelCare",
      "Zone légale",
      "Identité du service"
    ],
    "variableZones": [
      "Hook",
      "Bénéfice",
      "CTA"
    ],
    "rules": [
      "Respecter la hiérarchie du message",
      "Une seule promesse principale",
      "CTA cohérent avec le brief",
      "Aucune promesse médicale non autorisée"
    ],
    "evidence": [
      "Aperçu final",
      "Vérification du CTA",
      "Référence de source visuelle"
    ],
    "accessibility": [
      "Contraste lisible",
      "Texte essentiel hors image lorsque requis",
      "Alternative textuelle documentée"
    ],
    "allowedAdaptations": [
      "Langue",
      "Ville",
      "Canal",
      "Audience",
      "Partenaire autorisé"
    ],
    "prohibitedAdaptations": [
      "Déplacer le logo hors zone",
      "Supprimer la mention obligatoire",
      "Modifier une offre sans nouveau brief"
    ],
    "owner": "Creative Production",
    "authority": "Brand Manager",
    "version": "v1.0",
    "status": "Active",
    "tone": "violet"
  },
  {
    "id": "ac-digital-11",
    "code": "AC-TPL-DIG-011",
    "name": "Service explainer",
    "family": "digital",
    "category": "Multi-channel",
    "purpose": "Compréhension service",
    "businessObjective": "Compréhension service",
    "services": [
      "Home Service",
      "Academy",
      "Kindergarten & Preschool",
      "Hospitality",
      "Corporates"
    ],
    "audiences": [
      "Parents",
      "Partenaires",
      "Professionnels"
    ],
    "channels": [
      "Multi-channel"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Rabat",
      "Casablanca",
      "Kénitra",
      "National"
    ],
    "anatomy": [
      "Architecture explicative",
      "Contexte",
      "Service",
      "Processus",
      "Résultat"
    ],
    "slots": [
      {
        "id": "headline",
        "label": "Titre principal",
        "kind": "headline",
        "required": true,
        "limit": "8–70 caractères"
      },
      {
        "id": "visual",
        "label": "Visuel principal",
        "kind": "image",
        "required": true
      },
      {
        "id": "proof",
        "label": "Preuve ou bénéfice",
        "kind": "proof",
        "required": true
      },
      {
        "id": "cta",
        "label": "Appel à l’action",
        "kind": "cta",
        "required": true
      },
      {
        "id": "logo",
        "label": "Signature AngelCare",
        "kind": "logo",
        "required": true,
        "locked": true
      },
      {
        "id": "disclaimer",
        "label": "Mention gouvernée",
        "kind": "footer",
        "required": false,
        "locked": true
      }
    ],
    "outputProfiles": [
      {
        "id": "dig-11-1",
        "label": "Multi-channel 1",
        "dimensions": "1080×1350",
        "orientation": "portrait",
        "channel": "Multi-channel",
        "safeZone": "Logo, texte et CTA hors zones d’interface"
      }
    ],
    "lockedZones": [
      "Logo AngelCare",
      "Zone légale",
      "Identité du service"
    ],
    "variableZones": [
      "Contexte",
      "Service",
      "Processus",
      "Résultat"
    ],
    "rules": [
      "Respecter la hiérarchie du message",
      "Une seule promesse principale",
      "CTA cohérent avec le brief",
      "Aucune promesse médicale non autorisée"
    ],
    "evidence": [
      "Aperçu final",
      "Vérification du CTA",
      "Référence de source visuelle"
    ],
    "accessibility": [
      "Contraste lisible",
      "Texte essentiel hors image lorsque requis",
      "Alternative textuelle documentée"
    ],
    "allowedAdaptations": [
      "Langue",
      "Ville",
      "Canal",
      "Audience",
      "Partenaire autorisé"
    ],
    "prohibitedAdaptations": [
      "Déplacer le logo hors zone",
      "Supprimer la mention obligatoire",
      "Modifier une offre sans nouveau brief"
    ],
    "owner": "Creative Production",
    "authority": "Brand Manager",
    "version": "v1.0",
    "status": "Active",
    "tone": "violet"
  },
  {
    "id": "ac-digital-12",
    "code": "AC-TPL-DIG-012",
    "name": "Premium family reassurance campaign",
    "family": "digital",
    "category": "Instagram",
    "purpose": "Réassurance parents",
    "businessObjective": "Réassurance parents",
    "services": [
      "Home Service",
      "Academy",
      "Kindergarten & Preschool",
      "Hospitality",
      "Corporates"
    ],
    "audiences": [
      "Parents",
      "Partenaires",
      "Professionnels"
    ],
    "channels": [
      "Instagram"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Rabat",
      "Casablanca",
      "Kénitra",
      "National"
    ],
    "anatomy": [
      "Émotion + preuve",
      "Situation famille",
      "Réassurance",
      "Preuve",
      "CTA"
    ],
    "slots": [
      {
        "id": "headline",
        "label": "Titre principal",
        "kind": "headline",
        "required": true,
        "limit": "8–70 caractères"
      },
      {
        "id": "visual",
        "label": "Visuel principal",
        "kind": "image",
        "required": true
      },
      {
        "id": "proof",
        "label": "Preuve ou bénéfice",
        "kind": "proof",
        "required": true
      },
      {
        "id": "cta",
        "label": "Appel à l’action",
        "kind": "cta",
        "required": true
      },
      {
        "id": "logo",
        "label": "Signature AngelCare",
        "kind": "logo",
        "required": true,
        "locked": true
      },
      {
        "id": "disclaimer",
        "label": "Mention gouvernée",
        "kind": "footer",
        "required": false,
        "locked": true
      }
    ],
    "outputProfiles": [
      {
        "id": "dig-12-1",
        "label": "Instagram 1",
        "dimensions": "1080×1350",
        "orientation": "portrait",
        "channel": "Instagram",
        "safeZone": "Logo, texte et CTA hors zones d’interface"
      }
    ],
    "lockedZones": [
      "Logo AngelCare",
      "Zone légale",
      "Identité du service"
    ],
    "variableZones": [
      "Situation famille",
      "Réassurance",
      "Preuve",
      "CTA"
    ],
    "rules": [
      "Respecter la hiérarchie du message",
      "Une seule promesse principale",
      "CTA cohérent avec le brief",
      "Aucune promesse médicale non autorisée"
    ],
    "evidence": [
      "Aperçu final",
      "Vérification du CTA",
      "Référence de source visuelle"
    ],
    "accessibility": [
      "Contraste lisible",
      "Texte essentiel hors image lorsque requis",
      "Alternative textuelle documentée"
    ],
    "allowedAdaptations": [
      "Langue",
      "Ville",
      "Canal",
      "Audience",
      "Partenaire autorisé"
    ],
    "prohibitedAdaptations": [
      "Déplacer le logo hors zone",
      "Supprimer la mention obligatoire",
      "Modifier une offre sans nouveau brief"
    ],
    "owner": "Creative Production",
    "authority": "Brand Manager",
    "version": "v1.0",
    "status": "Active",
    "tone": "violet"
  },
  {
    "id": "ac-digital-13",
    "code": "AC-TPL-DIG-013",
    "name": "Testimonial and social proof",
    "family": "digital",
    "category": "Instagram",
    "purpose": "Preuve sociale",
    "businessObjective": "Preuve sociale",
    "services": [
      "Home Service",
      "Academy",
      "Kindergarten & Preschool",
      "Hospitality",
      "Corporates"
    ],
    "audiences": [
      "Parents",
      "Partenaires",
      "Professionnels"
    ],
    "channels": [
      "Instagram"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Rabat",
      "Casablanca",
      "Kénitra",
      "National"
    ],
    "anatomy": [
      "Témoignage gouverné",
      "Citation",
      "Identité autorisée",
      "Contexte",
      "CTA"
    ],
    "slots": [
      {
        "id": "headline",
        "label": "Titre principal",
        "kind": "headline",
        "required": true,
        "limit": "8–70 caractères"
      },
      {
        "id": "visual",
        "label": "Visuel principal",
        "kind": "image",
        "required": true
      },
      {
        "id": "proof",
        "label": "Preuve ou bénéfice",
        "kind": "proof",
        "required": true
      },
      {
        "id": "cta",
        "label": "Appel à l’action",
        "kind": "cta",
        "required": true
      },
      {
        "id": "logo",
        "label": "Signature AngelCare",
        "kind": "logo",
        "required": true,
        "locked": true
      },
      {
        "id": "disclaimer",
        "label": "Mention gouvernée",
        "kind": "footer",
        "required": false,
        "locked": true
      }
    ],
    "outputProfiles": [
      {
        "id": "dig-13-1",
        "label": "Instagram 1",
        "dimensions": "1080×1080",
        "orientation": "square",
        "channel": "Instagram",
        "safeZone": "Logo, texte et CTA hors zones d’interface"
      }
    ],
    "lockedZones": [
      "Logo AngelCare",
      "Zone légale",
      "Identité du service"
    ],
    "variableZones": [
      "Citation",
      "Identité autorisée",
      "Contexte",
      "CTA"
    ],
    "rules": [
      "Respecter la hiérarchie du message",
      "Une seule promesse principale",
      "CTA cohérent avec le brief",
      "Aucune promesse médicale non autorisée"
    ],
    "evidence": [
      "Aperçu final",
      "Vérification du CTA",
      "Référence de source visuelle"
    ],
    "accessibility": [
      "Contraste lisible",
      "Texte essentiel hors image lorsque requis",
      "Alternative textuelle documentée"
    ],
    "allowedAdaptations": [
      "Langue",
      "Ville",
      "Canal",
      "Audience",
      "Partenaire autorisé"
    ],
    "prohibitedAdaptations": [
      "Déplacer le logo hors zone",
      "Supprimer la mention obligatoire",
      "Modifier une offre sans nouveau brief"
    ],
    "owner": "Creative Production",
    "authority": "Brand Manager",
    "version": "v1.0",
    "status": "Active",
    "tone": "violet"
  },
  {
    "id": "ac-digital-14",
    "code": "AC-TPL-DIG-014",
    "name": "Event announcement",
    "family": "digital",
    "category": "Multi-channel",
    "purpose": "Activation événement",
    "businessObjective": "Activation événement",
    "services": [
      "Home Service",
      "Academy",
      "Kindergarten & Preschool",
      "Hospitality",
      "Corporates"
    ],
    "audiences": [
      "Parents",
      "Partenaires",
      "Professionnels"
    ],
    "channels": [
      "Multi-channel"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Rabat",
      "Casablanca",
      "Kénitra",
      "National"
    ],
    "anatomy": [
      "Annonce temporelle",
      "Événement",
      "Date",
      "Lieu",
      "Inscription"
    ],
    "slots": [
      {
        "id": "headline",
        "label": "Titre principal",
        "kind": "headline",
        "required": true,
        "limit": "8–70 caractères"
      },
      {
        "id": "visual",
        "label": "Visuel principal",
        "kind": "image",
        "required": true
      },
      {
        "id": "proof",
        "label": "Preuve ou bénéfice",
        "kind": "proof",
        "required": true
      },
      {
        "id": "cta",
        "label": "Appel à l’action",
        "kind": "cta",
        "required": true
      },
      {
        "id": "logo",
        "label": "Signature AngelCare",
        "kind": "logo",
        "required": true,
        "locked": true
      },
      {
        "id": "disclaimer",
        "label": "Mention gouvernée",
        "kind": "footer",
        "required": false,
        "locked": true
      }
    ],
    "outputProfiles": [
      {
        "id": "dig-14-1",
        "label": "Multi-channel 1",
        "dimensions": "1080×1350",
        "orientation": "portrait",
        "channel": "Multi-channel",
        "safeZone": "Logo, texte et CTA hors zones d’interface"
      }
    ],
    "lockedZones": [
      "Logo AngelCare",
      "Zone légale",
      "Identité du service"
    ],
    "variableZones": [
      "Événement",
      "Date",
      "Lieu",
      "Inscription"
    ],
    "rules": [
      "Respecter la hiérarchie du message",
      "Une seule promesse principale",
      "CTA cohérent avec le brief",
      "Aucune promesse médicale non autorisée"
    ],
    "evidence": [
      "Aperçu final",
      "Vérification du CTA",
      "Référence de source visuelle"
    ],
    "accessibility": [
      "Contraste lisible",
      "Texte essentiel hors image lorsque requis",
      "Alternative textuelle documentée"
    ],
    "allowedAdaptations": [
      "Langue",
      "Ville",
      "Canal",
      "Audience",
      "Partenaire autorisé"
    ],
    "prohibitedAdaptations": [
      "Déplacer le logo hors zone",
      "Supprimer la mention obligatoire",
      "Modifier une offre sans nouveau brief"
    ],
    "owner": "Creative Production",
    "authority": "Brand Manager",
    "version": "v1.0",
    "status": "Active",
    "tone": "violet"
  },
  {
    "id": "ac-digital-15",
    "code": "AC-TPL-DIG-015",
    "name": "Recruitment communication",
    "family": "digital",
    "category": "LinkedIn",
    "purpose": "Attraction talents",
    "businessObjective": "Attraction talents",
    "services": [
      "Home Service",
      "Academy",
      "Kindergarten & Preschool",
      "Hospitality",
      "Corporates"
    ],
    "audiences": [
      "Parents",
      "Partenaires",
      "Professionnels"
    ],
    "channels": [
      "LinkedIn"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Rabat",
      "Casablanca",
      "Kénitra",
      "National"
    ],
    "anatomy": [
      "Emploi premium",
      "Mission",
      "Profil",
      "Avantages",
      "Candidature"
    ],
    "slots": [
      {
        "id": "headline",
        "label": "Titre principal",
        "kind": "headline",
        "required": true,
        "limit": "8–70 caractères"
      },
      {
        "id": "visual",
        "label": "Visuel principal",
        "kind": "image",
        "required": true
      },
      {
        "id": "proof",
        "label": "Preuve ou bénéfice",
        "kind": "proof",
        "required": true
      },
      {
        "id": "cta",
        "label": "Appel à l’action",
        "kind": "cta",
        "required": true
      },
      {
        "id": "logo",
        "label": "Signature AngelCare",
        "kind": "logo",
        "required": true,
        "locked": true
      },
      {
        "id": "disclaimer",
        "label": "Mention gouvernée",
        "kind": "footer",
        "required": false,
        "locked": true
      }
    ],
    "outputProfiles": [
      {
        "id": "dig-15-1",
        "label": "LinkedIn 1",
        "dimensions": "1200×1500",
        "orientation": "portrait",
        "channel": "LinkedIn",
        "safeZone": "Logo, texte et CTA hors zones d’interface"
      }
    ],
    "lockedZones": [
      "Logo AngelCare",
      "Zone légale",
      "Identité du service"
    ],
    "variableZones": [
      "Mission",
      "Profil",
      "Avantages",
      "Candidature"
    ],
    "rules": [
      "Respecter la hiérarchie du message",
      "Une seule promesse principale",
      "CTA cohérent avec le brief",
      "Aucune promesse médicale non autorisée"
    ],
    "evidence": [
      "Aperçu final",
      "Vérification du CTA",
      "Référence de source visuelle"
    ],
    "accessibility": [
      "Contraste lisible",
      "Texte essentiel hors image lorsque requis",
      "Alternative textuelle documentée"
    ],
    "allowedAdaptations": [
      "Langue",
      "Ville",
      "Canal",
      "Audience",
      "Partenaire autorisé"
    ],
    "prohibitedAdaptations": [
      "Déplacer le logo hors zone",
      "Supprimer la mention obligatoire",
      "Modifier une offre sans nouveau brief"
    ],
    "owner": "Creative Production",
    "authority": "Brand Manager",
    "version": "v1.0",
    "status": "Active",
    "tone": "violet"
  },
  {
    "id": "ac-digital-16",
    "code": "AC-TPL-DIG-016",
    "name": "Emergency or service notice",
    "family": "digital",
    "category": "Multi-channel",
    "purpose": "Information critique",
    "businessObjective": "Information critique",
    "services": [
      "Home Service",
      "Academy",
      "Kindergarten & Preschool",
      "Hospitality",
      "Corporates"
    ],
    "audiences": [
      "Parents",
      "Partenaires",
      "Professionnels"
    ],
    "channels": [
      "Multi-channel"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Rabat",
      "Casablanca",
      "Kénitra",
      "National"
    ],
    "anatomy": [
      "Alerte claire",
      "Statut",
      "Impact",
      "Instruction",
      "Contact"
    ],
    "slots": [
      {
        "id": "headline",
        "label": "Titre principal",
        "kind": "headline",
        "required": true,
        "limit": "8–70 caractères"
      },
      {
        "id": "visual",
        "label": "Visuel principal",
        "kind": "image",
        "required": true
      },
      {
        "id": "proof",
        "label": "Preuve ou bénéfice",
        "kind": "proof",
        "required": true
      },
      {
        "id": "cta",
        "label": "Appel à l’action",
        "kind": "cta",
        "required": true
      },
      {
        "id": "logo",
        "label": "Signature AngelCare",
        "kind": "logo",
        "required": true,
        "locked": true
      },
      {
        "id": "disclaimer",
        "label": "Mention gouvernée",
        "kind": "footer",
        "required": false,
        "locked": true
      }
    ],
    "outputProfiles": [
      {
        "id": "dig-16-1",
        "label": "Multi-channel 1",
        "dimensions": "1080×1350",
        "orientation": "portrait",
        "channel": "Multi-channel",
        "safeZone": "Logo, texte et CTA hors zones d’interface"
      }
    ],
    "lockedZones": [
      "Logo AngelCare",
      "Zone légale",
      "Identité du service"
    ],
    "variableZones": [
      "Statut",
      "Impact",
      "Instruction",
      "Contact"
    ],
    "rules": [
      "Respecter la hiérarchie du message",
      "Une seule promesse principale",
      "CTA cohérent avec le brief",
      "Aucune promesse médicale non autorisée"
    ],
    "evidence": [
      "Aperçu final",
      "Vérification du CTA",
      "Référence de source visuelle"
    ],
    "accessibility": [
      "Contraste lisible",
      "Texte essentiel hors image lorsque requis",
      "Alternative textuelle documentée"
    ],
    "allowedAdaptations": [
      "Langue",
      "Ville",
      "Canal",
      "Audience",
      "Partenaire autorisé"
    ],
    "prohibitedAdaptations": [
      "Déplacer le logo hors zone",
      "Supprimer la mention obligatoire",
      "Modifier une offre sans nouveau brief"
    ],
    "owner": "Creative Production",
    "authority": "Brand Manager",
    "version": "v1.0",
    "status": "Active",
    "tone": "violet"
  },
  {
    "id": "ac-digital-17",
    "code": "AC-TPL-DIG-017",
    "name": "City-specific activation",
    "family": "digital",
    "category": "Instagram",
    "purpose": "Déploiement local",
    "businessObjective": "Déploiement local",
    "services": [
      "Home Service",
      "Academy",
      "Kindergarten & Preschool",
      "Hospitality",
      "Corporates"
    ],
    "audiences": [
      "Parents",
      "Partenaires",
      "Professionnels"
    ],
    "channels": [
      "Instagram"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Rabat",
      "Casablanca",
      "Kénitra",
      "National"
    ],
    "anatomy": [
      "Activation géographique",
      "Ville",
      "Service",
      "Disponibilité",
      "CTA"
    ],
    "slots": [
      {
        "id": "headline",
        "label": "Titre principal",
        "kind": "headline",
        "required": true,
        "limit": "8–70 caractères"
      },
      {
        "id": "visual",
        "label": "Visuel principal",
        "kind": "image",
        "required": true
      },
      {
        "id": "proof",
        "label": "Preuve ou bénéfice",
        "kind": "proof",
        "required": true
      },
      {
        "id": "cta",
        "label": "Appel à l’action",
        "kind": "cta",
        "required": true
      },
      {
        "id": "logo",
        "label": "Signature AngelCare",
        "kind": "logo",
        "required": true,
        "locked": true
      },
      {
        "id": "disclaimer",
        "label": "Mention gouvernée",
        "kind": "footer",
        "required": false,
        "locked": true
      }
    ],
    "outputProfiles": [
      {
        "id": "dig-17-1",
        "label": "Instagram 1",
        "dimensions": "1080×1350",
        "orientation": "portrait",
        "channel": "Instagram",
        "safeZone": "Logo, texte et CTA hors zones d’interface"
      }
    ],
    "lockedZones": [
      "Logo AngelCare",
      "Zone légale",
      "Identité du service"
    ],
    "variableZones": [
      "Ville",
      "Service",
      "Disponibilité",
      "CTA"
    ],
    "rules": [
      "Respecter la hiérarchie du message",
      "Une seule promesse principale",
      "CTA cohérent avec le brief",
      "Aucune promesse médicale non autorisée"
    ],
    "evidence": [
      "Aperçu final",
      "Vérification du CTA",
      "Référence de source visuelle"
    ],
    "accessibility": [
      "Contraste lisible",
      "Texte essentiel hors image lorsque requis",
      "Alternative textuelle documentée"
    ],
    "allowedAdaptations": [
      "Langue",
      "Ville",
      "Canal",
      "Audience",
      "Partenaire autorisé"
    ],
    "prohibitedAdaptations": [
      "Déplacer le logo hors zone",
      "Supprimer la mention obligatoire",
      "Modifier une offre sans nouveau brief"
    ],
    "owner": "Creative Production",
    "authority": "Brand Manager",
    "version": "v1.0",
    "status": "Active",
    "tone": "violet"
  },
  {
    "id": "ac-digital-18",
    "code": "AC-TPL-DIG-018",
    "name": "Partner co-branded campaign",
    "family": "digital",
    "category": "Multi-channel",
    "purpose": "Activation partenaire",
    "businessObjective": "Activation partenaire",
    "services": [
      "Home Service",
      "Academy",
      "Kindergarten & Preschool",
      "Hospitality",
      "Corporates"
    ],
    "audiences": [
      "Parents",
      "Partenaires",
      "Professionnels"
    ],
    "channels": [
      "Multi-channel"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Rabat",
      "Casablanca",
      "Kénitra",
      "National"
    ],
    "anatomy": [
      "Co-brand équilibré",
      "Bénéfice commun",
      "Logos",
      "Offre",
      "CTA"
    ],
    "slots": [
      {
        "id": "headline",
        "label": "Titre principal",
        "kind": "headline",
        "required": true,
        "limit": "8–70 caractères"
      },
      {
        "id": "visual",
        "label": "Visuel principal",
        "kind": "image",
        "required": true
      },
      {
        "id": "proof",
        "label": "Preuve ou bénéfice",
        "kind": "proof",
        "required": true
      },
      {
        "id": "cta",
        "label": "Appel à l’action",
        "kind": "cta",
        "required": true
      },
      {
        "id": "logo",
        "label": "Signature AngelCare",
        "kind": "logo",
        "required": true,
        "locked": true
      },
      {
        "id": "disclaimer",
        "label": "Mention gouvernée",
        "kind": "footer",
        "required": false,
        "locked": true
      }
    ],
    "outputProfiles": [
      {
        "id": "dig-18-1",
        "label": "Multi-channel 1",
        "dimensions": "1200×1200",
        "orientation": "square",
        "channel": "Multi-channel",
        "safeZone": "Logo, texte et CTA hors zones d’interface"
      }
    ],
    "lockedZones": [
      "Logo AngelCare",
      "Zone légale",
      "Identité du service"
    ],
    "variableZones": [
      "Bénéfice commun",
      "Logos",
      "Offre",
      "CTA"
    ],
    "rules": [
      "Respecter la hiérarchie du message",
      "Une seule promesse principale",
      "CTA cohérent avec le brief",
      "Aucune promesse médicale non autorisée"
    ],
    "evidence": [
      "Aperçu final",
      "Vérification du CTA",
      "Référence de source visuelle"
    ],
    "accessibility": [
      "Contraste lisible",
      "Texte essentiel hors image lorsque requis",
      "Alternative textuelle documentée"
    ],
    "allowedAdaptations": [
      "Langue",
      "Ville",
      "Canal",
      "Audience",
      "Partenaire autorisé"
    ],
    "prohibitedAdaptations": [
      "Déplacer le logo hors zone",
      "Supprimer la mention obligatoire",
      "Modifier une offre sans nouveau brief"
    ],
    "owner": "Creative Production",
    "authority": "Brand Manager",
    "version": "v1.0",
    "status": "Active",
    "tone": "violet"
  },
  {
    "id": "ac-digital-19",
    "code": "AC-TPL-DIG-019",
    "name": "Seasonal or school-period campaign",
    "family": "digital",
    "category": "Multi-channel",
    "purpose": "Saisonnalité",
    "businessObjective": "Saisonnalité",
    "services": [
      "Home Service",
      "Academy",
      "Kindergarten & Preschool",
      "Hospitality",
      "Corporates"
    ],
    "audiences": [
      "Parents",
      "Partenaires",
      "Professionnels"
    ],
    "channels": [
      "Multi-channel"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Rabat",
      "Casablanca",
      "Kénitra",
      "National"
    ],
    "anatomy": [
      "Fenêtre temporelle",
      "Période",
      "Besoin",
      "Solution",
      "CTA"
    ],
    "slots": [
      {
        "id": "headline",
        "label": "Titre principal",
        "kind": "headline",
        "required": true,
        "limit": "8–70 caractères"
      },
      {
        "id": "visual",
        "label": "Visuel principal",
        "kind": "image",
        "required": true
      },
      {
        "id": "proof",
        "label": "Preuve ou bénéfice",
        "kind": "proof",
        "required": true
      },
      {
        "id": "cta",
        "label": "Appel à l’action",
        "kind": "cta",
        "required": true
      },
      {
        "id": "logo",
        "label": "Signature AngelCare",
        "kind": "logo",
        "required": true,
        "locked": true
      },
      {
        "id": "disclaimer",
        "label": "Mention gouvernée",
        "kind": "footer",
        "required": false,
        "locked": true
      }
    ],
    "outputProfiles": [
      {
        "id": "dig-19-1",
        "label": "Multi-channel 1",
        "dimensions": "1080×1350",
        "orientation": "portrait",
        "channel": "Multi-channel",
        "safeZone": "Logo, texte et CTA hors zones d’interface"
      }
    ],
    "lockedZones": [
      "Logo AngelCare",
      "Zone légale",
      "Identité du service"
    ],
    "variableZones": [
      "Période",
      "Besoin",
      "Solution",
      "CTA"
    ],
    "rules": [
      "Respecter la hiérarchie du message",
      "Une seule promesse principale",
      "CTA cohérent avec le brief",
      "Aucune promesse médicale non autorisée"
    ],
    "evidence": [
      "Aperçu final",
      "Vérification du CTA",
      "Référence de source visuelle"
    ],
    "accessibility": [
      "Contraste lisible",
      "Texte essentiel hors image lorsque requis",
      "Alternative textuelle documentée"
    ],
    "allowedAdaptations": [
      "Langue",
      "Ville",
      "Canal",
      "Audience",
      "Partenaire autorisé"
    ],
    "prohibitedAdaptations": [
      "Déplacer le logo hors zone",
      "Supprimer la mention obligatoire",
      "Modifier une offre sans nouveau brief"
    ],
    "owner": "Creative Production",
    "authority": "Brand Manager",
    "version": "v1.0",
    "status": "Active",
    "tone": "violet"
  },
  {
    "id": "ac-digital-20",
    "code": "AC-TPL-DIG-020",
    "name": "Multi-service institutional campaign",
    "family": "digital",
    "category": "LinkedIn",
    "purpose": "Positionnement groupe",
    "businessObjective": "Positionnement groupe",
    "services": [
      "Home Service",
      "Academy",
      "Kindergarten & Preschool",
      "Hospitality",
      "Corporates"
    ],
    "audiences": [
      "Parents",
      "Partenaires",
      "Professionnels"
    ],
    "channels": [
      "LinkedIn"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Rabat",
      "Casablanca",
      "Kénitra",
      "National"
    ],
    "anatomy": [
      "Portfolio institutionnel",
      "Vision",
      "Services",
      "Différenciation",
      "Contact"
    ],
    "slots": [
      {
        "id": "headline",
        "label": "Titre principal",
        "kind": "headline",
        "required": true,
        "limit": "8–70 caractères"
      },
      {
        "id": "visual",
        "label": "Visuel principal",
        "kind": "image",
        "required": true
      },
      {
        "id": "proof",
        "label": "Preuve ou bénéfice",
        "kind": "proof",
        "required": true
      },
      {
        "id": "cta",
        "label": "Appel à l’action",
        "kind": "cta",
        "required": true
      },
      {
        "id": "logo",
        "label": "Signature AngelCare",
        "kind": "logo",
        "required": true,
        "locked": true
      },
      {
        "id": "disclaimer",
        "label": "Mention gouvernée",
        "kind": "footer",
        "required": false,
        "locked": true
      }
    ],
    "outputProfiles": [
      {
        "id": "dig-20-1",
        "label": "LinkedIn 1",
        "dimensions": "1200×1500",
        "orientation": "portrait",
        "channel": "LinkedIn",
        "safeZone": "Logo, texte et CTA hors zones d’interface"
      }
    ],
    "lockedZones": [
      "Logo AngelCare",
      "Zone légale",
      "Identité du service"
    ],
    "variableZones": [
      "Vision",
      "Services",
      "Différenciation",
      "Contact"
    ],
    "rules": [
      "Respecter la hiérarchie du message",
      "Une seule promesse principale",
      "CTA cohérent avec le brief",
      "Aucune promesse médicale non autorisée"
    ],
    "evidence": [
      "Aperçu final",
      "Vérification du CTA",
      "Référence de source visuelle"
    ],
    "accessibility": [
      "Contraste lisible",
      "Texte essentiel hors image lorsque requis",
      "Alternative textuelle documentée"
    ],
    "allowedAdaptations": [
      "Langue",
      "Ville",
      "Canal",
      "Audience",
      "Partenaire autorisé"
    ],
    "prohibitedAdaptations": [
      "Déplacer le logo hors zone",
      "Supprimer la mention obligatoire",
      "Modifier une offre sans nouveau brief"
    ],
    "owner": "Creative Production",
    "authority": "Brand Manager",
    "version": "v1.0",
    "status": "Active",
    "tone": "violet"
  },
  {
    "id": "ac-print-01",
    "code": "AC-TPL-PRT-001",
    "name": "A4 premium flyer",
    "family": "print",
    "category": "Print & Field",
    "purpose": "Flyer institutionnel recto/verso",
    "businessObjective": "Flyer institutionnel recto/verso",
    "services": [
      "Home Service",
      "Academy",
      "Hospitality",
      "Corporates"
    ],
    "audiences": [
      "Public",
      "Partenaires",
      "Personnel terrain"
    ],
    "channels": [
      "Print",
      "Field"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Rabat",
      "Casablanca",
      "Kénitra",
      "National"
    ],
    "anatomy": [
      "Recto / verso",
      "Spécification physique",
      "Preuve terrain"
    ],
    "slots": [
      {
        "id": "front",
        "label": "Face principale",
        "kind": "section",
        "required": true
      },
      {
        "id": "back",
        "label": "Face secondaire",
        "kind": "section",
        "required": true
      },
      {
        "id": "headline",
        "label": "Accroche",
        "kind": "headline",
        "required": true
      },
      {
        "id": "visual",
        "label": "Visuel",
        "kind": "image",
        "required": true
      },
      {
        "id": "cta",
        "label": "Contact / CTA",
        "kind": "cta",
        "required": true
      },
      {
        "id": "qr",
        "label": "QR ou contact",
        "kind": "qr",
        "required": false
      },
      {
        "id": "logo",
        "label": "Logo AngelCare",
        "kind": "logo",
        "required": true,
        "locked": true
      },
      {
        "id": "footer",
        "label": "Pied institutionnel",
        "kind": "footer",
        "required": true,
        "locked": true
      }
    ],
    "outputProfiles": [
      {
        "id": "prt-1",
        "label": "Production physique",
        "dimensions": "A4 210×297 mm",
        "orientation": "physical",
        "channel": "Print & Field",
        "safeZone": "Fond perdu 3 mm; zone sûre 5–10 mm selon format"
      }
    ],
    "lockedZones": [
      "Logo",
      "Coordonnées",
      "Code document",
      "Zone de sécurité"
    ],
    "variableZones": [
      "Visuel",
      "Offre",
      "Ville",
      "Partenaire",
      "Quantité"
    ],
    "rules": [
      "Fond perdu documenté",
      "Résolution adaptée à l’impression",
      "Coordonnées vérifiées",
      "BAT requis avant production"
    ],
    "evidence": [
      "BAT final",
      "Fiche technique",
      "Test QR lorsque présent",
      "Accord partenaire si co-branding"
    ],
    "accessibility": [
      "Taille minimale lisible",
      "Contraste physique",
      "QR accompagné d’une URL courte"
    ],
    "allowedAdaptations": [
      "Format physique approuvé",
      "Ville",
      "Partenaire",
      "Langue"
    ],
    "prohibitedAdaptations": [
      "Suppression des repères obligatoires",
      "Déformation du logo",
      "Production sans BAT"
    ],
    "owner": "Print Production",
    "authority": "Operations & Brand",
    "version": "v1.0",
    "status": "Active",
    "tone": "info"
  },
  {
    "id": "ac-print-02",
    "code": "AC-TPL-PRT-002",
    "name": "A5 field flyer",
    "family": "print",
    "category": "Print & Field",
    "purpose": "Distribution terrain compacte",
    "businessObjective": "Distribution terrain compacte",
    "services": [
      "Home Service",
      "Academy",
      "Hospitality",
      "Corporates"
    ],
    "audiences": [
      "Public",
      "Partenaires",
      "Personnel terrain"
    ],
    "channels": [
      "Print",
      "Field"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Rabat",
      "Casablanca",
      "Kénitra",
      "National"
    ],
    "anatomy": [
      "Lecture main",
      "Spécification physique",
      "Preuve terrain"
    ],
    "slots": [
      {
        "id": "front",
        "label": "Face principale",
        "kind": "section",
        "required": true
      },
      {
        "id": "back",
        "label": "Face secondaire",
        "kind": "section",
        "required": true
      },
      {
        "id": "headline",
        "label": "Accroche",
        "kind": "headline",
        "required": true
      },
      {
        "id": "visual",
        "label": "Visuel",
        "kind": "image",
        "required": true
      },
      {
        "id": "cta",
        "label": "Contact / CTA",
        "kind": "cta",
        "required": true
      },
      {
        "id": "qr",
        "label": "QR ou contact",
        "kind": "qr",
        "required": false
      },
      {
        "id": "logo",
        "label": "Logo AngelCare",
        "kind": "logo",
        "required": true,
        "locked": true
      },
      {
        "id": "footer",
        "label": "Pied institutionnel",
        "kind": "footer",
        "required": true,
        "locked": true
      }
    ],
    "outputProfiles": [
      {
        "id": "prt-2",
        "label": "Production physique",
        "dimensions": "A5 148×210 mm",
        "orientation": "physical",
        "channel": "Print & Field",
        "safeZone": "Fond perdu 3 mm; zone sûre 5–10 mm selon format"
      }
    ],
    "lockedZones": [
      "Logo",
      "Coordonnées",
      "Code document",
      "Zone de sécurité"
    ],
    "variableZones": [
      "Visuel",
      "Offre",
      "Ville",
      "Partenaire",
      "Quantité"
    ],
    "rules": [
      "Fond perdu documenté",
      "Résolution adaptée à l’impression",
      "Coordonnées vérifiées",
      "BAT requis avant production"
    ],
    "evidence": [
      "BAT final",
      "Fiche technique",
      "Test QR lorsque présent",
      "Accord partenaire si co-branding"
    ],
    "accessibility": [
      "Taille minimale lisible",
      "Contraste physique",
      "QR accompagné d’une URL courte"
    ],
    "allowedAdaptations": [
      "Format physique approuvé",
      "Ville",
      "Partenaire",
      "Langue"
    ],
    "prohibitedAdaptations": [
      "Suppression des repères obligatoires",
      "Déformation du logo",
      "Production sans BAT"
    ],
    "owner": "Print Production",
    "authority": "Operations & Brand",
    "version": "v1.0",
    "status": "Active",
    "tone": "info"
  },
  {
    "id": "ac-print-03",
    "code": "AC-TPL-PRT-003",
    "name": "Tri-fold brochure",
    "family": "print",
    "category": "Print & Field",
    "purpose": "Présentation dépliable",
    "businessObjective": "Présentation dépliable",
    "services": [
      "Home Service",
      "Academy",
      "Hospitality",
      "Corporates"
    ],
    "audiences": [
      "Public",
      "Partenaires",
      "Personnel terrain"
    ],
    "channels": [
      "Print",
      "Field"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Rabat",
      "Casablanca",
      "Kénitra",
      "National"
    ],
    "anatomy": [
      "6 panneaux",
      "Spécification physique",
      "Preuve terrain"
    ],
    "slots": [
      {
        "id": "front",
        "label": "Face principale",
        "kind": "section",
        "required": true
      },
      {
        "id": "back",
        "label": "Face secondaire",
        "kind": "section",
        "required": true
      },
      {
        "id": "headline",
        "label": "Accroche",
        "kind": "headline",
        "required": true
      },
      {
        "id": "visual",
        "label": "Visuel",
        "kind": "image",
        "required": true
      },
      {
        "id": "cta",
        "label": "Contact / CTA",
        "kind": "cta",
        "required": true
      },
      {
        "id": "qr",
        "label": "QR ou contact",
        "kind": "qr",
        "required": false
      },
      {
        "id": "logo",
        "label": "Logo AngelCare",
        "kind": "logo",
        "required": true,
        "locked": true
      },
      {
        "id": "footer",
        "label": "Pied institutionnel",
        "kind": "footer",
        "required": true,
        "locked": true
      }
    ],
    "outputProfiles": [
      {
        "id": "prt-3",
        "label": "Production physique",
        "dimensions": "A4 pli roulé",
        "orientation": "physical",
        "channel": "Print & Field",
        "safeZone": "Fond perdu 3 mm; zone sûre 5–10 mm selon format"
      }
    ],
    "lockedZones": [
      "Logo",
      "Coordonnées",
      "Code document",
      "Zone de sécurité"
    ],
    "variableZones": [
      "Visuel",
      "Offre",
      "Ville",
      "Partenaire",
      "Quantité"
    ],
    "rules": [
      "Fond perdu documenté",
      "Résolution adaptée à l’impression",
      "Coordonnées vérifiées",
      "BAT requis avant production"
    ],
    "evidence": [
      "BAT final",
      "Fiche technique",
      "Test QR lorsque présent",
      "Accord partenaire si co-branding"
    ],
    "accessibility": [
      "Taille minimale lisible",
      "Contraste physique",
      "QR accompagné d’une URL courte"
    ],
    "allowedAdaptations": [
      "Format physique approuvé",
      "Ville",
      "Partenaire",
      "Langue"
    ],
    "prohibitedAdaptations": [
      "Suppression des repères obligatoires",
      "Déformation du logo",
      "Production sans BAT"
    ],
    "owner": "Print Production",
    "authority": "Operations & Brand",
    "version": "v1.0",
    "status": "Active",
    "tone": "info"
  },
  {
    "id": "ac-print-04",
    "code": "AC-TPL-PRT-004",
    "name": "Corporate partnership folder",
    "family": "print",
    "category": "Print & Field",
    "purpose": "Dossier partenariat",
    "businessObjective": "Dossier partenariat",
    "services": [
      "Home Service",
      "Academy",
      "Hospitality",
      "Corporates"
    ],
    "audiences": [
      "Public",
      "Partenaires",
      "Personnel terrain"
    ],
    "channels": [
      "Print",
      "Field"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Rabat",
      "Casablanca",
      "Kénitra",
      "National"
    ],
    "anatomy": [
      "Couverture + inserts",
      "Spécification physique",
      "Preuve terrain"
    ],
    "slots": [
      {
        "id": "front",
        "label": "Face principale",
        "kind": "section",
        "required": true
      },
      {
        "id": "back",
        "label": "Face secondaire",
        "kind": "section",
        "required": true
      },
      {
        "id": "headline",
        "label": "Accroche",
        "kind": "headline",
        "required": true
      },
      {
        "id": "visual",
        "label": "Visuel",
        "kind": "image",
        "required": true
      },
      {
        "id": "cta",
        "label": "Contact / CTA",
        "kind": "cta",
        "required": true
      },
      {
        "id": "qr",
        "label": "QR ou contact",
        "kind": "qr",
        "required": false
      },
      {
        "id": "logo",
        "label": "Logo AngelCare",
        "kind": "logo",
        "required": true,
        "locked": true
      },
      {
        "id": "footer",
        "label": "Pied institutionnel",
        "kind": "footer",
        "required": true,
        "locked": true
      }
    ],
    "outputProfiles": [
      {
        "id": "prt-4",
        "label": "Production physique",
        "dimensions": "A4 pochette",
        "orientation": "physical",
        "channel": "Print & Field",
        "safeZone": "Fond perdu 3 mm; zone sûre 5–10 mm selon format"
      }
    ],
    "lockedZones": [
      "Logo",
      "Coordonnées",
      "Code document",
      "Zone de sécurité"
    ],
    "variableZones": [
      "Visuel",
      "Offre",
      "Ville",
      "Partenaire",
      "Quantité"
    ],
    "rules": [
      "Fond perdu documenté",
      "Résolution adaptée à l’impression",
      "Coordonnées vérifiées",
      "BAT requis avant production"
    ],
    "evidence": [
      "BAT final",
      "Fiche technique",
      "Test QR lorsque présent",
      "Accord partenaire si co-branding"
    ],
    "accessibility": [
      "Taille minimale lisible",
      "Contraste physique",
      "QR accompagné d’une URL courte"
    ],
    "allowedAdaptations": [
      "Format physique approuvé",
      "Ville",
      "Partenaire",
      "Langue"
    ],
    "prohibitedAdaptations": [
      "Suppression des repères obligatoires",
      "Déformation du logo",
      "Production sans BAT"
    ],
    "owner": "Print Production",
    "authority": "Operations & Brand",
    "version": "v1.0",
    "status": "Active",
    "tone": "info"
  },
  {
    "id": "ac-print-05",
    "code": "AC-TPL-PRT-005",
    "name": "Roll-up banner",
    "family": "print",
    "category": "Print & Field",
    "purpose": "Visibilité événement",
    "businessObjective": "Visibilité événement",
    "services": [
      "Home Service",
      "Academy",
      "Hospitality",
      "Corporates"
    ],
    "audiences": [
      "Public",
      "Partenaires",
      "Personnel terrain"
    ],
    "channels": [
      "Print",
      "Field"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Rabat",
      "Casablanca",
      "Kénitra",
      "National"
    ],
    "anatomy": [
      "Distance moyenne",
      "Spécification physique",
      "Preuve terrain"
    ],
    "slots": [
      {
        "id": "front",
        "label": "Face principale",
        "kind": "section",
        "required": true
      },
      {
        "id": "back",
        "label": "Face secondaire",
        "kind": "section",
        "required": false
      },
      {
        "id": "headline",
        "label": "Accroche",
        "kind": "headline",
        "required": true
      },
      {
        "id": "visual",
        "label": "Visuel",
        "kind": "image",
        "required": true
      },
      {
        "id": "cta",
        "label": "Contact / CTA",
        "kind": "cta",
        "required": true
      },
      {
        "id": "qr",
        "label": "QR ou contact",
        "kind": "qr",
        "required": false
      },
      {
        "id": "logo",
        "label": "Logo AngelCare",
        "kind": "logo",
        "required": true,
        "locked": true
      },
      {
        "id": "footer",
        "label": "Pied institutionnel",
        "kind": "footer",
        "required": true,
        "locked": true
      }
    ],
    "outputProfiles": [
      {
        "id": "prt-5",
        "label": "Production physique",
        "dimensions": "850×2000 mm",
        "orientation": "physical",
        "channel": "Print & Field",
        "safeZone": "Fond perdu 3 mm; zone sûre 5–10 mm selon format"
      }
    ],
    "lockedZones": [
      "Logo",
      "Coordonnées",
      "Code document",
      "Zone de sécurité"
    ],
    "variableZones": [
      "Visuel",
      "Offre",
      "Ville",
      "Partenaire",
      "Quantité"
    ],
    "rules": [
      "Fond perdu documenté",
      "Résolution adaptée à l’impression",
      "Coordonnées vérifiées",
      "BAT requis avant production"
    ],
    "evidence": [
      "BAT final",
      "Fiche technique",
      "Test QR lorsque présent",
      "Accord partenaire si co-branding"
    ],
    "accessibility": [
      "Taille minimale lisible",
      "Contraste physique",
      "QR accompagné d’une URL courte"
    ],
    "allowedAdaptations": [
      "Format physique approuvé",
      "Ville",
      "Partenaire",
      "Langue"
    ],
    "prohibitedAdaptations": [
      "Suppression des repères obligatoires",
      "Déformation du logo",
      "Production sans BAT"
    ],
    "owner": "Print Production",
    "authority": "Operations & Brand",
    "version": "v1.0",
    "status": "Active",
    "tone": "info"
  },
  {
    "id": "ac-print-06",
    "code": "AC-TPL-PRT-006",
    "name": "A3 or A2 poster",
    "family": "print",
    "category": "Print & Field",
    "purpose": "Affichage public",
    "businessObjective": "Affichage public",
    "services": [
      "Home Service",
      "Academy",
      "Hospitality",
      "Corporates"
    ],
    "audiences": [
      "Public",
      "Partenaires",
      "Personnel terrain"
    ],
    "channels": [
      "Print",
      "Field"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Rabat",
      "Casablanca",
      "Kénitra",
      "National"
    ],
    "anatomy": [
      "Lecture distance",
      "Spécification physique",
      "Preuve terrain"
    ],
    "slots": [
      {
        "id": "front",
        "label": "Face principale",
        "kind": "section",
        "required": true
      },
      {
        "id": "back",
        "label": "Face secondaire",
        "kind": "section",
        "required": false
      },
      {
        "id": "headline",
        "label": "Accroche",
        "kind": "headline",
        "required": true
      },
      {
        "id": "visual",
        "label": "Visuel",
        "kind": "image",
        "required": true
      },
      {
        "id": "cta",
        "label": "Contact / CTA",
        "kind": "cta",
        "required": true
      },
      {
        "id": "qr",
        "label": "QR ou contact",
        "kind": "qr",
        "required": false
      },
      {
        "id": "logo",
        "label": "Logo AngelCare",
        "kind": "logo",
        "required": true,
        "locked": true
      },
      {
        "id": "footer",
        "label": "Pied institutionnel",
        "kind": "footer",
        "required": true,
        "locked": true
      }
    ],
    "outputProfiles": [
      {
        "id": "prt-6",
        "label": "Production physique",
        "dimensions": "A3 / A2",
        "orientation": "physical",
        "channel": "Print & Field",
        "safeZone": "Fond perdu 3 mm; zone sûre 5–10 mm selon format"
      }
    ],
    "lockedZones": [
      "Logo",
      "Coordonnées",
      "Code document",
      "Zone de sécurité"
    ],
    "variableZones": [
      "Visuel",
      "Offre",
      "Ville",
      "Partenaire",
      "Quantité"
    ],
    "rules": [
      "Fond perdu documenté",
      "Résolution adaptée à l’impression",
      "Coordonnées vérifiées",
      "BAT requis avant production"
    ],
    "evidence": [
      "BAT final",
      "Fiche technique",
      "Test QR lorsque présent",
      "Accord partenaire si co-branding"
    ],
    "accessibility": [
      "Taille minimale lisible",
      "Contraste physique",
      "QR accompagné d’une URL courte"
    ],
    "allowedAdaptations": [
      "Format physique approuvé",
      "Ville",
      "Partenaire",
      "Langue"
    ],
    "prohibitedAdaptations": [
      "Suppression des repères obligatoires",
      "Déformation du logo",
      "Production sans BAT"
    ],
    "owner": "Print Production",
    "authority": "Operations & Brand",
    "version": "v1.0",
    "status": "Active",
    "tone": "info"
  },
  {
    "id": "ac-print-07",
    "code": "AC-TPL-PRT-007",
    "name": "Event booth panel",
    "family": "print",
    "category": "Print & Field",
    "purpose": "Stand et exposition",
    "businessObjective": "Stand et exposition",
    "services": [
      "Home Service",
      "Academy",
      "Hospitality",
      "Corporates"
    ],
    "audiences": [
      "Public",
      "Partenaires",
      "Personnel terrain"
    ],
    "channels": [
      "Print",
      "Field"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Rabat",
      "Casablanca",
      "Kénitra",
      "National"
    ],
    "anatomy": [
      "Signalétique",
      "Spécification physique",
      "Preuve terrain"
    ],
    "slots": [
      {
        "id": "front",
        "label": "Face principale",
        "kind": "section",
        "required": true
      },
      {
        "id": "back",
        "label": "Face secondaire",
        "kind": "section",
        "required": false
      },
      {
        "id": "headline",
        "label": "Accroche",
        "kind": "headline",
        "required": true
      },
      {
        "id": "visual",
        "label": "Visuel",
        "kind": "image",
        "required": true
      },
      {
        "id": "cta",
        "label": "Contact / CTA",
        "kind": "cta",
        "required": true
      },
      {
        "id": "qr",
        "label": "QR ou contact",
        "kind": "qr",
        "required": false
      },
      {
        "id": "logo",
        "label": "Logo AngelCare",
        "kind": "logo",
        "required": true,
        "locked": true
      },
      {
        "id": "footer",
        "label": "Pied institutionnel",
        "kind": "footer",
        "required": true,
        "locked": true
      }
    ],
    "outputProfiles": [
      {
        "id": "prt-7",
        "label": "Production physique",
        "dimensions": "1000×2200 mm",
        "orientation": "physical",
        "channel": "Print & Field",
        "safeZone": "Fond perdu 3 mm; zone sûre 5–10 mm selon format"
      }
    ],
    "lockedZones": [
      "Logo",
      "Coordonnées",
      "Code document",
      "Zone de sécurité"
    ],
    "variableZones": [
      "Visuel",
      "Offre",
      "Ville",
      "Partenaire",
      "Quantité"
    ],
    "rules": [
      "Fond perdu documenté",
      "Résolution adaptée à l’impression",
      "Coordonnées vérifiées",
      "BAT requis avant production"
    ],
    "evidence": [
      "BAT final",
      "Fiche technique",
      "Test QR lorsque présent",
      "Accord partenaire si co-branding"
    ],
    "accessibility": [
      "Taille minimale lisible",
      "Contraste physique",
      "QR accompagné d’une URL courte"
    ],
    "allowedAdaptations": [
      "Format physique approuvé",
      "Ville",
      "Partenaire",
      "Langue"
    ],
    "prohibitedAdaptations": [
      "Suppression des repères obligatoires",
      "Déformation du logo",
      "Production sans BAT"
    ],
    "owner": "Print Production",
    "authority": "Operations & Brand",
    "version": "v1.0",
    "status": "Active",
    "tone": "info"
  },
  {
    "id": "ac-print-08",
    "code": "AC-TPL-PRT-008",
    "name": "Field-agent information card",
    "family": "print",
    "category": "Print & Field",
    "purpose": "Support agent terrain",
    "businessObjective": "Support agent terrain",
    "services": [
      "Home Service",
      "Academy",
      "Hospitality",
      "Corporates"
    ],
    "audiences": [
      "Public",
      "Partenaires",
      "Personnel terrain"
    ],
    "channels": [
      "Print",
      "Field"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Rabat",
      "Casablanca",
      "Kénitra",
      "National"
    ],
    "anatomy": [
      "Recto / verso",
      "Spécification physique",
      "Preuve terrain"
    ],
    "slots": [
      {
        "id": "front",
        "label": "Face principale",
        "kind": "section",
        "required": true
      },
      {
        "id": "back",
        "label": "Face secondaire",
        "kind": "section",
        "required": true
      },
      {
        "id": "headline",
        "label": "Accroche",
        "kind": "headline",
        "required": true
      },
      {
        "id": "visual",
        "label": "Visuel",
        "kind": "image",
        "required": true
      },
      {
        "id": "cta",
        "label": "Contact / CTA",
        "kind": "cta",
        "required": true
      },
      {
        "id": "qr",
        "label": "QR ou contact",
        "kind": "qr",
        "required": true
      },
      {
        "id": "logo",
        "label": "Logo AngelCare",
        "kind": "logo",
        "required": true,
        "locked": true
      },
      {
        "id": "footer",
        "label": "Pied institutionnel",
        "kind": "footer",
        "required": true,
        "locked": true
      }
    ],
    "outputProfiles": [
      {
        "id": "prt-8",
        "label": "Production physique",
        "dimensions": "A6",
        "orientation": "physical",
        "channel": "Print & Field",
        "safeZone": "Fond perdu 3 mm; zone sûre 5–10 mm selon format"
      }
    ],
    "lockedZones": [
      "Logo",
      "Coordonnées",
      "Code document",
      "Zone de sécurité"
    ],
    "variableZones": [
      "Visuel",
      "Offre",
      "Ville",
      "Partenaire",
      "Quantité"
    ],
    "rules": [
      "Fond perdu documenté",
      "Résolution adaptée à l’impression",
      "Coordonnées vérifiées",
      "BAT requis avant production"
    ],
    "evidence": [
      "BAT final",
      "Fiche technique",
      "Test QR lorsque présent",
      "Accord partenaire si co-branding"
    ],
    "accessibility": [
      "Taille minimale lisible",
      "Contraste physique",
      "QR accompagné d’une URL courte"
    ],
    "allowedAdaptations": [
      "Format physique approuvé",
      "Ville",
      "Partenaire",
      "Langue"
    ],
    "prohibitedAdaptations": [
      "Suppression des repères obligatoires",
      "Déformation du logo",
      "Production sans BAT"
    ],
    "owner": "Print Production",
    "authority": "Operations & Brand",
    "version": "v1.0",
    "status": "Active",
    "tone": "info"
  },
  {
    "id": "ac-print-09",
    "code": "AC-TPL-PRT-009",
    "name": "QR activation card",
    "family": "print",
    "category": "Print & Field",
    "purpose": "Conversion physique",
    "businessObjective": "Conversion physique",
    "services": [
      "Home Service",
      "Academy",
      "Hospitality",
      "Corporates"
    ],
    "audiences": [
      "Public",
      "Partenaires",
      "Personnel terrain"
    ],
    "channels": [
      "Print",
      "Field"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Rabat",
      "Casablanca",
      "Kénitra",
      "National"
    ],
    "anatomy": [
      "QR prioritaire",
      "Spécification physique",
      "Preuve terrain"
    ],
    "slots": [
      {
        "id": "front",
        "label": "Face principale",
        "kind": "section",
        "required": true
      },
      {
        "id": "back",
        "label": "Face secondaire",
        "kind": "section",
        "required": true
      },
      {
        "id": "headline",
        "label": "Accroche",
        "kind": "headline",
        "required": true
      },
      {
        "id": "visual",
        "label": "Visuel",
        "kind": "image",
        "required": true
      },
      {
        "id": "cta",
        "label": "Contact / CTA",
        "kind": "cta",
        "required": true
      },
      {
        "id": "qr",
        "label": "QR ou contact",
        "kind": "qr",
        "required": true
      },
      {
        "id": "logo",
        "label": "Logo AngelCare",
        "kind": "logo",
        "required": true,
        "locked": true
      },
      {
        "id": "footer",
        "label": "Pied institutionnel",
        "kind": "footer",
        "required": true,
        "locked": true
      }
    ],
    "outputProfiles": [
      {
        "id": "prt-9",
        "label": "Production physique",
        "dimensions": "85×55 mm",
        "orientation": "physical",
        "channel": "Print & Field",
        "safeZone": "Fond perdu 3 mm; zone sûre 5–10 mm selon format"
      }
    ],
    "lockedZones": [
      "Logo",
      "Coordonnées",
      "Code document",
      "Zone de sécurité"
    ],
    "variableZones": [
      "Visuel",
      "Offre",
      "Ville",
      "Partenaire",
      "Quantité"
    ],
    "rules": [
      "Fond perdu documenté",
      "Résolution adaptée à l’impression",
      "Coordonnées vérifiées",
      "BAT requis avant production"
    ],
    "evidence": [
      "BAT final",
      "Fiche technique",
      "Test QR lorsque présent",
      "Accord partenaire si co-branding"
    ],
    "accessibility": [
      "Taille minimale lisible",
      "Contraste physique",
      "QR accompagné d’une URL courte"
    ],
    "allowedAdaptations": [
      "Format physique approuvé",
      "Ville",
      "Partenaire",
      "Langue"
    ],
    "prohibitedAdaptations": [
      "Suppression des repères obligatoires",
      "Déformation du logo",
      "Production sans BAT"
    ],
    "owner": "Print Production",
    "authority": "Operations & Brand",
    "version": "v1.0",
    "status": "Active",
    "tone": "info"
  },
  {
    "id": "ac-print-10",
    "code": "AC-TPL-PRT-010",
    "name": "Staff identification badge",
    "family": "print",
    "category": "Print & Field",
    "purpose": "Identification institutionnelle",
    "businessObjective": "Identification institutionnelle",
    "services": [
      "Home Service",
      "Academy",
      "Hospitality",
      "Corporates"
    ],
    "audiences": [
      "Public",
      "Partenaires",
      "Personnel terrain"
    ],
    "channels": [
      "Print",
      "Field"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Rabat",
      "Casablanca",
      "Kénitra",
      "National"
    ],
    "anatomy": [
      "Photo + fonction",
      "Spécification physique",
      "Preuve terrain"
    ],
    "slots": [
      {
        "id": "front",
        "label": "Face principale",
        "kind": "section",
        "required": true
      },
      {
        "id": "back",
        "label": "Face secondaire",
        "kind": "section",
        "required": true
      },
      {
        "id": "headline",
        "label": "Accroche",
        "kind": "headline",
        "required": true
      },
      {
        "id": "visual",
        "label": "Visuel",
        "kind": "image",
        "required": true
      },
      {
        "id": "cta",
        "label": "Contact / CTA",
        "kind": "cta",
        "required": true
      },
      {
        "id": "qr",
        "label": "QR ou contact",
        "kind": "qr",
        "required": false
      },
      {
        "id": "logo",
        "label": "Logo AngelCare",
        "kind": "logo",
        "required": true,
        "locked": true
      },
      {
        "id": "footer",
        "label": "Pied institutionnel",
        "kind": "footer",
        "required": true,
        "locked": true
      }
    ],
    "outputProfiles": [
      {
        "id": "prt-10",
        "label": "Production physique",
        "dimensions": "86×54 mm",
        "orientation": "physical",
        "channel": "Print & Field",
        "safeZone": "Fond perdu 3 mm; zone sûre 5–10 mm selon format"
      }
    ],
    "lockedZones": [
      "Logo",
      "Coordonnées",
      "Code document",
      "Zone de sécurité"
    ],
    "variableZones": [
      "Visuel",
      "Offre",
      "Ville",
      "Partenaire",
      "Quantité"
    ],
    "rules": [
      "Fond perdu documenté",
      "Résolution adaptée à l’impression",
      "Coordonnées vérifiées",
      "BAT requis avant production"
    ],
    "evidence": [
      "BAT final",
      "Fiche technique",
      "Test QR lorsque présent",
      "Accord partenaire si co-branding"
    ],
    "accessibility": [
      "Taille minimale lisible",
      "Contraste physique",
      "QR accompagné d’une URL courte"
    ],
    "allowedAdaptations": [
      "Format physique approuvé",
      "Ville",
      "Partenaire",
      "Langue"
    ],
    "prohibitedAdaptations": [
      "Suppression des repères obligatoires",
      "Déformation du logo",
      "Production sans BAT"
    ],
    "owner": "Print Production",
    "authority": "Operations & Brand",
    "version": "v1.0",
    "status": "Active",
    "tone": "info"
  },
  {
    "id": "ac-print-11",
    "code": "AC-TPL-PRT-011",
    "name": "Certificate layout",
    "family": "print",
    "category": "Print & Field",
    "purpose": "Attestation officielle",
    "businessObjective": "Attestation officielle",
    "services": [
      "Home Service",
      "Academy",
      "Hospitality",
      "Corporates"
    ],
    "audiences": [
      "Public",
      "Partenaires",
      "Personnel terrain"
    ],
    "channels": [
      "Print",
      "Field"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Rabat",
      "Casablanca",
      "Kénitra",
      "National"
    ],
    "anatomy": [
      "Autorité + identité",
      "Spécification physique",
      "Preuve terrain"
    ],
    "slots": [
      {
        "id": "front",
        "label": "Face principale",
        "kind": "section",
        "required": true
      },
      {
        "id": "back",
        "label": "Face secondaire",
        "kind": "section",
        "required": true
      },
      {
        "id": "headline",
        "label": "Accroche",
        "kind": "headline",
        "required": true
      },
      {
        "id": "visual",
        "label": "Visuel",
        "kind": "image",
        "required": true
      },
      {
        "id": "cta",
        "label": "Contact / CTA",
        "kind": "cta",
        "required": true
      },
      {
        "id": "qr",
        "label": "QR ou contact",
        "kind": "qr",
        "required": false
      },
      {
        "id": "logo",
        "label": "Logo AngelCare",
        "kind": "logo",
        "required": true,
        "locked": true
      },
      {
        "id": "footer",
        "label": "Pied institutionnel",
        "kind": "footer",
        "required": true,
        "locked": true
      }
    ],
    "outputProfiles": [
      {
        "id": "prt-11",
        "label": "Production physique",
        "dimensions": "A4 paysage",
        "orientation": "physical",
        "channel": "Print & Field",
        "safeZone": "Fond perdu 3 mm; zone sûre 5–10 mm selon format"
      }
    ],
    "lockedZones": [
      "Logo",
      "Coordonnées",
      "Code document",
      "Zone de sécurité"
    ],
    "variableZones": [
      "Visuel",
      "Offre",
      "Ville",
      "Partenaire",
      "Quantité"
    ],
    "rules": [
      "Fond perdu documenté",
      "Résolution adaptée à l’impression",
      "Coordonnées vérifiées",
      "BAT requis avant production"
    ],
    "evidence": [
      "BAT final",
      "Fiche technique",
      "Test QR lorsque présent",
      "Accord partenaire si co-branding"
    ],
    "accessibility": [
      "Taille minimale lisible",
      "Contraste physique",
      "QR accompagné d’une URL courte"
    ],
    "allowedAdaptations": [
      "Format physique approuvé",
      "Ville",
      "Partenaire",
      "Langue"
    ],
    "prohibitedAdaptations": [
      "Suppression des repères obligatoires",
      "Déformation du logo",
      "Production sans BAT"
    ],
    "owner": "Print Production",
    "authority": "Operations & Brand",
    "version": "v1.0",
    "status": "Active",
    "tone": "info"
  },
  {
    "id": "ac-print-12",
    "code": "AC-TPL-PRT-012",
    "name": "Vehicle-branding specification board",
    "family": "print",
    "category": "Print & Field",
    "purpose": "Habillage véhicule",
    "businessObjective": "Habillage véhicule",
    "services": [
      "Home Service",
      "Academy",
      "Hospitality",
      "Corporates"
    ],
    "audiences": [
      "Public",
      "Partenaires",
      "Personnel terrain"
    ],
    "channels": [
      "Print",
      "Field"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Rabat",
      "Casablanca",
      "Kénitra",
      "National"
    ],
    "anatomy": [
      "Vues techniques",
      "Spécification physique",
      "Preuve terrain"
    ],
    "slots": [
      {
        "id": "front",
        "label": "Face principale",
        "kind": "section",
        "required": true
      },
      {
        "id": "back",
        "label": "Face secondaire",
        "kind": "section",
        "required": true
      },
      {
        "id": "headline",
        "label": "Accroche",
        "kind": "headline",
        "required": true
      },
      {
        "id": "visual",
        "label": "Visuel",
        "kind": "image",
        "required": true
      },
      {
        "id": "cta",
        "label": "Contact / CTA",
        "kind": "cta",
        "required": true
      },
      {
        "id": "qr",
        "label": "QR ou contact",
        "kind": "qr",
        "required": false
      },
      {
        "id": "logo",
        "label": "Logo AngelCare",
        "kind": "logo",
        "required": true,
        "locked": true
      },
      {
        "id": "footer",
        "label": "Pied institutionnel",
        "kind": "footer",
        "required": true,
        "locked": true
      }
    ],
    "outputProfiles": [
      {
        "id": "prt-12",
        "label": "Production physique",
        "dimensions": "Gabarit véhicule",
        "orientation": "physical",
        "channel": "Print & Field",
        "safeZone": "Fond perdu 3 mm; zone sûre 5–10 mm selon format"
      }
    ],
    "lockedZones": [
      "Logo",
      "Coordonnées",
      "Code document",
      "Zone de sécurité"
    ],
    "variableZones": [
      "Visuel",
      "Offre",
      "Ville",
      "Partenaire",
      "Quantité"
    ],
    "rules": [
      "Fond perdu documenté",
      "Résolution adaptée à l’impression",
      "Coordonnées vérifiées",
      "BAT requis avant production"
    ],
    "evidence": [
      "BAT final",
      "Fiche technique",
      "Test QR lorsque présent",
      "Accord partenaire si co-branding"
    ],
    "accessibility": [
      "Taille minimale lisible",
      "Contraste physique",
      "QR accompagné d’une URL courte"
    ],
    "allowedAdaptations": [
      "Format physique approuvé",
      "Ville",
      "Partenaire",
      "Langue"
    ],
    "prohibitedAdaptations": [
      "Suppression des repères obligatoires",
      "Déformation du logo",
      "Production sans BAT"
    ],
    "owner": "Print Production",
    "authority": "Operations & Brand",
    "version": "v1.0",
    "status": "Active",
    "tone": "info"
  },
  {
    "id": "ac-print-13",
    "code": "AC-TPL-PRT-013",
    "name": "Uniform-logo placement board",
    "family": "print",
    "category": "Print & Field",
    "purpose": "Placement uniforme",
    "businessObjective": "Placement uniforme",
    "services": [
      "Home Service",
      "Academy",
      "Hospitality",
      "Corporates"
    ],
    "audiences": [
      "Public",
      "Partenaires",
      "Personnel terrain"
    ],
    "channels": [
      "Print",
      "Field"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Rabat",
      "Casablanca",
      "Kénitra",
      "National"
    ],
    "anatomy": [
      "Face / dos",
      "Spécification physique",
      "Preuve terrain"
    ],
    "slots": [
      {
        "id": "front",
        "label": "Face principale",
        "kind": "section",
        "required": true
      },
      {
        "id": "back",
        "label": "Face secondaire",
        "kind": "section",
        "required": true
      },
      {
        "id": "headline",
        "label": "Accroche",
        "kind": "headline",
        "required": true
      },
      {
        "id": "visual",
        "label": "Visuel",
        "kind": "image",
        "required": true
      },
      {
        "id": "cta",
        "label": "Contact / CTA",
        "kind": "cta",
        "required": true
      },
      {
        "id": "qr",
        "label": "QR ou contact",
        "kind": "qr",
        "required": false
      },
      {
        "id": "logo",
        "label": "Logo AngelCare",
        "kind": "logo",
        "required": true,
        "locked": true
      },
      {
        "id": "footer",
        "label": "Pied institutionnel",
        "kind": "footer",
        "required": true,
        "locked": true
      }
    ],
    "outputProfiles": [
      {
        "id": "prt-13",
        "label": "Production physique",
        "dimensions": "Planche technique",
        "orientation": "physical",
        "channel": "Print & Field",
        "safeZone": "Fond perdu 3 mm; zone sûre 5–10 mm selon format"
      }
    ],
    "lockedZones": [
      "Logo",
      "Coordonnées",
      "Code document",
      "Zone de sécurité"
    ],
    "variableZones": [
      "Visuel",
      "Offre",
      "Ville",
      "Partenaire",
      "Quantité"
    ],
    "rules": [
      "Fond perdu documenté",
      "Résolution adaptée à l’impression",
      "Coordonnées vérifiées",
      "BAT requis avant production"
    ],
    "evidence": [
      "BAT final",
      "Fiche technique",
      "Test QR lorsque présent",
      "Accord partenaire si co-branding"
    ],
    "accessibility": [
      "Taille minimale lisible",
      "Contraste physique",
      "QR accompagné d’une URL courte"
    ],
    "allowedAdaptations": [
      "Format physique approuvé",
      "Ville",
      "Partenaire",
      "Langue"
    ],
    "prohibitedAdaptations": [
      "Suppression des repères obligatoires",
      "Déformation du logo",
      "Production sans BAT"
    ],
    "owner": "Print Production",
    "authority": "Operations & Brand",
    "version": "v1.0",
    "status": "Active",
    "tone": "info"
  },
  {
    "id": "ac-print-14",
    "code": "AC-TPL-PRT-014",
    "name": "School or hotel partnership pack",
    "family": "print",
    "category": "Print & Field",
    "purpose": "Activation B2B",
    "businessObjective": "Activation B2B",
    "services": [
      "Home Service",
      "Academy",
      "Hospitality",
      "Corporates"
    ],
    "audiences": [
      "Public",
      "Partenaires",
      "Personnel terrain"
    ],
    "channels": [
      "Print",
      "Field"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Rabat",
      "Casablanca",
      "Kénitra",
      "National"
    ],
    "anatomy": [
      "Dossier + fiches",
      "Spécification physique",
      "Preuve terrain"
    ],
    "slots": [
      {
        "id": "front",
        "label": "Face principale",
        "kind": "section",
        "required": true
      },
      {
        "id": "back",
        "label": "Face secondaire",
        "kind": "section",
        "required": true
      },
      {
        "id": "headline",
        "label": "Accroche",
        "kind": "headline",
        "required": true
      },
      {
        "id": "visual",
        "label": "Visuel",
        "kind": "image",
        "required": true
      },
      {
        "id": "cta",
        "label": "Contact / CTA",
        "kind": "cta",
        "required": true
      },
      {
        "id": "qr",
        "label": "QR ou contact",
        "kind": "qr",
        "required": true
      },
      {
        "id": "logo",
        "label": "Logo AngelCare",
        "kind": "logo",
        "required": true,
        "locked": true
      },
      {
        "id": "footer",
        "label": "Pied institutionnel",
        "kind": "footer",
        "required": true,
        "locked": true
      }
    ],
    "outputProfiles": [
      {
        "id": "prt-14",
        "label": "Production physique",
        "dimensions": "Kit multi-format",
        "orientation": "physical",
        "channel": "Print & Field",
        "safeZone": "Fond perdu 3 mm; zone sûre 5–10 mm selon format"
      }
    ],
    "lockedZones": [
      "Logo",
      "Coordonnées",
      "Code document",
      "Zone de sécurité"
    ],
    "variableZones": [
      "Visuel",
      "Offre",
      "Ville",
      "Partenaire",
      "Quantité"
    ],
    "rules": [
      "Fond perdu documenté",
      "Résolution adaptée à l’impression",
      "Coordonnées vérifiées",
      "BAT requis avant production"
    ],
    "evidence": [
      "BAT final",
      "Fiche technique",
      "Test QR lorsque présent",
      "Accord partenaire si co-branding"
    ],
    "accessibility": [
      "Taille minimale lisible",
      "Contraste physique",
      "QR accompagné d’une URL courte"
    ],
    "allowedAdaptations": [
      "Format physique approuvé",
      "Ville",
      "Partenaire",
      "Langue"
    ],
    "prohibitedAdaptations": [
      "Suppression des repères obligatoires",
      "Déformation du logo",
      "Production sans BAT"
    ],
    "owner": "Print Production",
    "authority": "Operations & Brand",
    "version": "v1.0",
    "status": "Active",
    "tone": "info"
  },
  {
    "id": "ac-print-15",
    "code": "AC-TPL-PRT-015",
    "name": "Invitation or event card",
    "family": "print",
    "category": "Print & Field",
    "purpose": "Invitation premium",
    "businessObjective": "Invitation premium",
    "services": [
      "Home Service",
      "Academy",
      "Hospitality",
      "Corporates"
    ],
    "audiences": [
      "Public",
      "Partenaires",
      "Personnel terrain"
    ],
    "channels": [
      "Print",
      "Field"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Rabat",
      "Casablanca",
      "Kénitra",
      "National"
    ],
    "anatomy": [
      "RSVP",
      "Spécification physique",
      "Preuve terrain"
    ],
    "slots": [
      {
        "id": "front",
        "label": "Face principale",
        "kind": "section",
        "required": true
      },
      {
        "id": "back",
        "label": "Face secondaire",
        "kind": "section",
        "required": true
      },
      {
        "id": "headline",
        "label": "Accroche",
        "kind": "headline",
        "required": true
      },
      {
        "id": "visual",
        "label": "Visuel",
        "kind": "image",
        "required": true
      },
      {
        "id": "cta",
        "label": "Contact / CTA",
        "kind": "cta",
        "required": true
      },
      {
        "id": "qr",
        "label": "QR ou contact",
        "kind": "qr",
        "required": true
      },
      {
        "id": "logo",
        "label": "Logo AngelCare",
        "kind": "logo",
        "required": true,
        "locked": true
      },
      {
        "id": "footer",
        "label": "Pied institutionnel",
        "kind": "footer",
        "required": true,
        "locked": true
      }
    ],
    "outputProfiles": [
      {
        "id": "prt-15",
        "label": "Production physique",
        "dimensions": "A5 / carré",
        "orientation": "physical",
        "channel": "Print & Field",
        "safeZone": "Fond perdu 3 mm; zone sûre 5–10 mm selon format"
      }
    ],
    "lockedZones": [
      "Logo",
      "Coordonnées",
      "Code document",
      "Zone de sécurité"
    ],
    "variableZones": [
      "Visuel",
      "Offre",
      "Ville",
      "Partenaire",
      "Quantité"
    ],
    "rules": [
      "Fond perdu documenté",
      "Résolution adaptée à l’impression",
      "Coordonnées vérifiées",
      "BAT requis avant production"
    ],
    "evidence": [
      "BAT final",
      "Fiche technique",
      "Test QR lorsque présent",
      "Accord partenaire si co-branding"
    ],
    "accessibility": [
      "Taille minimale lisible",
      "Contraste physique",
      "QR accompagné d’une URL courte"
    ],
    "allowedAdaptations": [
      "Format physique approuvé",
      "Ville",
      "Partenaire",
      "Langue"
    ],
    "prohibitedAdaptations": [
      "Suppression des repères obligatoires",
      "Déformation du logo",
      "Production sans BAT"
    ],
    "owner": "Print Production",
    "authority": "Operations & Brand",
    "version": "v1.0",
    "status": "Active",
    "tone": "info"
  },
  {
    "id": "ac-print-16",
    "code": "AC-TPL-PRT-016",
    "name": "Field activation toolkit",
    "family": "print",
    "category": "Print & Field",
    "purpose": "Kit terrain complet",
    "businessObjective": "Kit terrain complet",
    "services": [
      "Home Service",
      "Academy",
      "Hospitality",
      "Corporates"
    ],
    "audiences": [
      "Public",
      "Partenaires",
      "Personnel terrain"
    ],
    "channels": [
      "Print",
      "Field"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Rabat",
      "Casablanca",
      "Kénitra",
      "National"
    ],
    "anatomy": [
      "Inventaire opérationnel",
      "Spécification physique",
      "Preuve terrain"
    ],
    "slots": [
      {
        "id": "front",
        "label": "Face principale",
        "kind": "section",
        "required": true
      },
      {
        "id": "back",
        "label": "Face secondaire",
        "kind": "section",
        "required": true
      },
      {
        "id": "headline",
        "label": "Accroche",
        "kind": "headline",
        "required": true
      },
      {
        "id": "visual",
        "label": "Visuel",
        "kind": "image",
        "required": true
      },
      {
        "id": "cta",
        "label": "Contact / CTA",
        "kind": "cta",
        "required": true
      },
      {
        "id": "qr",
        "label": "QR ou contact",
        "kind": "qr",
        "required": true
      },
      {
        "id": "logo",
        "label": "Logo AngelCare",
        "kind": "logo",
        "required": true,
        "locked": true
      },
      {
        "id": "footer",
        "label": "Pied institutionnel",
        "kind": "footer",
        "required": true,
        "locked": true
      }
    ],
    "outputProfiles": [
      {
        "id": "prt-16",
        "label": "Production physique",
        "dimensions": "Kit multi-pièces",
        "orientation": "physical",
        "channel": "Print & Field",
        "safeZone": "Fond perdu 3 mm; zone sûre 5–10 mm selon format"
      }
    ],
    "lockedZones": [
      "Logo",
      "Coordonnées",
      "Code document",
      "Zone de sécurité"
    ],
    "variableZones": [
      "Visuel",
      "Offre",
      "Ville",
      "Partenaire",
      "Quantité"
    ],
    "rules": [
      "Fond perdu documenté",
      "Résolution adaptée à l’impression",
      "Coordonnées vérifiées",
      "BAT requis avant production"
    ],
    "evidence": [
      "BAT final",
      "Fiche technique",
      "Test QR lorsque présent",
      "Accord partenaire si co-branding"
    ],
    "accessibility": [
      "Taille minimale lisible",
      "Contraste physique",
      "QR accompagné d’une URL courte"
    ],
    "allowedAdaptations": [
      "Format physique approuvé",
      "Ville",
      "Partenaire",
      "Langue"
    ],
    "prohibitedAdaptations": [
      "Suppression des repères obligatoires",
      "Déformation du logo",
      "Production sans BAT"
    ],
    "owner": "Print Production",
    "authority": "Operations & Brand",
    "version": "v1.0",
    "status": "Active",
    "tone": "info"
  },
  {
    "id": "ac-document-01",
    "code": "AC-TPL-DOC-001",
    "name": "Executive report",
    "family": "document",
    "category": "Rapport",
    "purpose": "Rapport décisionnel",
    "businessObjective": "Rapport décisionnel",
    "services": [
      "Corporate",
      "Operations",
      "Academy",
      "Partnerships"
    ],
    "audiences": [
      "Direction",
      "Personnel",
      "Partenaires",
      "Investisseurs"
    ],
    "channels": [
      "A4 PDF",
      "Internal Workspace"
    ],
    "languages": [
      "fr",
      "en",
      "ar"
    ],
    "cities": [
      "National"
    ],
    "anatomy": [
      "Couverture",
      "Contrôle documentaire",
      "Résumé exécutif",
      "Corps structuré",
      "Décision / responsabilité",
      "Annexes",
      "Approbation"
    ],
    "slots": [
      {
        "id": "cover",
        "label": "Couverture",
        "kind": "section",
        "required": true
      },
      {
        "id": "summary",
        "label": "Résumé exécutif",
        "kind": "section",
        "required": true
      },
      {
        "id": "body",
        "label": "Corps structuré",
        "kind": "section",
        "required": true
      },
      {
        "id": "tables",
        "label": "Tables / matrices",
        "kind": "table",
        "required": false
      },
      {
        "id": "authority",
        "label": "Autorité",
        "kind": "signature",
        "required": true,
        "locked": true
      },
      {
        "id": "footer",
        "label": "Pied de page",
        "kind": "footer",
        "required": true,
        "locked": true
      },
      {
        "id": "revision",
        "label": "Historique de révision",
        "kind": "metadata",
        "required": true
      }
    ],
    "outputProfiles": [
      {
        "id": "doc-1",
        "label": "Document A4",
        "dimensions": "210×297 mm",
        "orientation": "document",
        "channel": "Corporate Documentation",
        "safeZone": "Marges, pied et pagination gouvernés"
      }
    ],
    "lockedZones": [
      "Code document",
      "Version",
      "Autorité",
      "Pied institutionnel"
    ],
    "variableZones": [
      "Sections",
      "Tables",
      "Annexes",
      "Langue"
    ],
    "rules": [
      "Hiérarchie de titres cohérente",
      "Pagination contrôlée",
      "Historique de version",
      "Autorité identifiée"
    ],
    "evidence": [
      "Aperçu PDF",
      "Contrôle pagination",
      "Validation du propriétaire",
      "Références sources"
    ],
    "accessibility": [
      "Structure sémantique",
      "Tables avec en-têtes",
      "Contraste imprimable",
      "Lecture mobile disponible"
    ],
    "allowedAdaptations": [
      "Sections autorisées",
      "Langue",
      "Annexes",
      "Audience"
    ],
    "prohibitedAdaptations": [
      "Suppression du contrôle documentaire",
      "Signature préchargée non autorisée",
      "Version silencieusement écrasée"
    ],
    "owner": "Corporate Documentation",
    "authority": "Managing Director / Document Owner",
    "version": "v1.0",
    "status": "Active",
    "tone": "success"
  },
  {
    "id": "ac-document-02",
    "code": "AC-TPL-DOC-002",
    "name": "Strategic memorandum",
    "family": "document",
    "category": "Mémo",
    "purpose": "Note stratégique",
    "businessObjective": "Note stratégique",
    "services": [
      "Corporate",
      "Operations",
      "Academy",
      "Partnerships"
    ],
    "audiences": [
      "Direction",
      "Personnel",
      "Partenaires",
      "Investisseurs"
    ],
    "channels": [
      "A4 PDF",
      "Internal Workspace"
    ],
    "languages": [
      "fr",
      "en",
      "ar"
    ],
    "cities": [
      "National"
    ],
    "anatomy": [
      "Couverture",
      "Contrôle documentaire",
      "Résumé exécutif",
      "Corps structuré",
      "Décision / responsabilité",
      "Annexes",
      "Approbation"
    ],
    "slots": [
      {
        "id": "cover",
        "label": "Couverture",
        "kind": "section",
        "required": true
      },
      {
        "id": "summary",
        "label": "Résumé exécutif",
        "kind": "section",
        "required": true
      },
      {
        "id": "body",
        "label": "Corps structuré",
        "kind": "section",
        "required": true
      },
      {
        "id": "tables",
        "label": "Tables / matrices",
        "kind": "table",
        "required": false
      },
      {
        "id": "authority",
        "label": "Autorité",
        "kind": "signature",
        "required": true,
        "locked": true
      },
      {
        "id": "footer",
        "label": "Pied de page",
        "kind": "footer",
        "required": true,
        "locked": true
      },
      {
        "id": "revision",
        "label": "Historique de révision",
        "kind": "metadata",
        "required": true
      }
    ],
    "outputProfiles": [
      {
        "id": "doc-2",
        "label": "Document A4",
        "dimensions": "210×297 mm",
        "orientation": "document",
        "channel": "Corporate Documentation",
        "safeZone": "Marges, pied et pagination gouvernés"
      }
    ],
    "lockedZones": [
      "Code document",
      "Version",
      "Autorité",
      "Pied institutionnel"
    ],
    "variableZones": [
      "Sections",
      "Tables",
      "Annexes",
      "Langue"
    ],
    "rules": [
      "Hiérarchie de titres cohérente",
      "Pagination contrôlée",
      "Historique de version",
      "Autorité identifiée"
    ],
    "evidence": [
      "Aperçu PDF",
      "Contrôle pagination",
      "Validation du propriétaire",
      "Références sources"
    ],
    "accessibility": [
      "Structure sémantique",
      "Tables avec en-têtes",
      "Contraste imprimable",
      "Lecture mobile disponible"
    ],
    "allowedAdaptations": [
      "Sections autorisées",
      "Langue",
      "Annexes",
      "Audience"
    ],
    "prohibitedAdaptations": [
      "Suppression du contrôle documentaire",
      "Signature préchargée non autorisée",
      "Version silencieusement écrasée"
    ],
    "owner": "Corporate Documentation",
    "authority": "Managing Director / Document Owner",
    "version": "v1.0",
    "status": "Active",
    "tone": "success"
  },
  {
    "id": "ac-document-03",
    "code": "AC-TPL-DOC-003",
    "name": "Operational SOP",
    "family": "document",
    "category": "SOP",
    "purpose": "Procédure opératoire",
    "businessObjective": "Procédure opératoire",
    "services": [
      "Corporate",
      "Operations",
      "Academy",
      "Partnerships"
    ],
    "audiences": [
      "Direction",
      "Personnel",
      "Partenaires",
      "Investisseurs"
    ],
    "channels": [
      "A4 PDF",
      "Internal Workspace"
    ],
    "languages": [
      "fr",
      "en",
      "ar"
    ],
    "cities": [
      "National"
    ],
    "anatomy": [
      "Objet",
      "Champ",
      "Rôles",
      "Prérequis",
      "Étapes",
      "Contrôles",
      "Escalade",
      "Preuves",
      "Révision"
    ],
    "slots": [
      {
        "id": "cover",
        "label": "Couverture",
        "kind": "section",
        "required": true
      },
      {
        "id": "summary",
        "label": "Résumé exécutif",
        "kind": "section",
        "required": true
      },
      {
        "id": "body",
        "label": "Corps structuré",
        "kind": "section",
        "required": true
      },
      {
        "id": "tables",
        "label": "Tables / matrices",
        "kind": "table",
        "required": false
      },
      {
        "id": "authority",
        "label": "Autorité",
        "kind": "signature",
        "required": true,
        "locked": true
      },
      {
        "id": "footer",
        "label": "Pied de page",
        "kind": "footer",
        "required": true,
        "locked": true
      },
      {
        "id": "revision",
        "label": "Historique de révision",
        "kind": "metadata",
        "required": true
      }
    ],
    "outputProfiles": [
      {
        "id": "doc-3",
        "label": "Document A4",
        "dimensions": "210×297 mm",
        "orientation": "document",
        "channel": "Corporate Documentation",
        "safeZone": "Marges, pied et pagination gouvernés"
      }
    ],
    "lockedZones": [
      "Code document",
      "Version",
      "Autorité",
      "Pied institutionnel"
    ],
    "variableZones": [
      "Sections",
      "Tables",
      "Annexes",
      "Langue"
    ],
    "rules": [
      "Hiérarchie de titres cohérente",
      "Pagination contrôlée",
      "Historique de version",
      "Autorité identifiée"
    ],
    "evidence": [
      "Aperçu PDF",
      "Contrôle pagination",
      "Validation du propriétaire",
      "Références sources"
    ],
    "accessibility": [
      "Structure sémantique",
      "Tables avec en-têtes",
      "Contraste imprimable",
      "Lecture mobile disponible"
    ],
    "allowedAdaptations": [
      "Sections autorisées",
      "Langue",
      "Annexes",
      "Audience"
    ],
    "prohibitedAdaptations": [
      "Suppression du contrôle documentaire",
      "Signature préchargée non autorisée",
      "Version silencieusement écrasée"
    ],
    "owner": "Corporate Documentation",
    "authority": "Managing Director / Document Owner",
    "version": "v1.0",
    "status": "Active",
    "tone": "success"
  },
  {
    "id": "ac-document-04",
    "code": "AC-TPL-DOC-004",
    "name": "Mission order",
    "family": "document",
    "category": "Mission",
    "purpose": "Ordre de mission",
    "businessObjective": "Ordre de mission",
    "services": [
      "Corporate",
      "Operations",
      "Academy",
      "Partnerships"
    ],
    "audiences": [
      "Direction",
      "Personnel",
      "Partenaires",
      "Investisseurs"
    ],
    "channels": [
      "A4 PDF",
      "Internal Workspace"
    ],
    "languages": [
      "fr",
      "en",
      "ar"
    ],
    "cities": [
      "National"
    ],
    "anatomy": [
      "Couverture",
      "Contrôle documentaire",
      "Résumé exécutif",
      "Corps structuré",
      "Décision / responsabilité",
      "Annexes",
      "Approbation"
    ],
    "slots": [
      {
        "id": "cover",
        "label": "Couverture",
        "kind": "section",
        "required": true
      },
      {
        "id": "summary",
        "label": "Résumé exécutif",
        "kind": "section",
        "required": true
      },
      {
        "id": "body",
        "label": "Corps structuré",
        "kind": "section",
        "required": true
      },
      {
        "id": "tables",
        "label": "Tables / matrices",
        "kind": "table",
        "required": false
      },
      {
        "id": "authority",
        "label": "Autorité",
        "kind": "signature",
        "required": true,
        "locked": true
      },
      {
        "id": "footer",
        "label": "Pied de page",
        "kind": "footer",
        "required": true,
        "locked": true
      },
      {
        "id": "revision",
        "label": "Historique de révision",
        "kind": "metadata",
        "required": true
      }
    ],
    "outputProfiles": [
      {
        "id": "doc-4",
        "label": "Document A4",
        "dimensions": "210×297 mm",
        "orientation": "document",
        "channel": "Corporate Documentation",
        "safeZone": "Marges, pied et pagination gouvernés"
      }
    ],
    "lockedZones": [
      "Code document",
      "Version",
      "Autorité",
      "Pied institutionnel"
    ],
    "variableZones": [
      "Sections",
      "Tables",
      "Annexes",
      "Langue"
    ],
    "rules": [
      "Hiérarchie de titres cohérente",
      "Pagination contrôlée",
      "Historique de version",
      "Autorité identifiée"
    ],
    "evidence": [
      "Aperçu PDF",
      "Contrôle pagination",
      "Validation du propriétaire",
      "Références sources"
    ],
    "accessibility": [
      "Structure sémantique",
      "Tables avec en-têtes",
      "Contraste imprimable",
      "Lecture mobile disponible"
    ],
    "allowedAdaptations": [
      "Sections autorisées",
      "Langue",
      "Annexes",
      "Audience"
    ],
    "prohibitedAdaptations": [
      "Suppression du contrôle documentaire",
      "Signature préchargée non autorisée",
      "Version silencieusement écrasée"
    ],
    "owner": "Corporate Documentation",
    "authority": "Managing Director / Document Owner",
    "version": "v1.0",
    "status": "Active",
    "tone": "success"
  },
  {
    "id": "ac-document-05",
    "code": "AC-TPL-DOC-005",
    "name": "Corporate policy",
    "family": "document",
    "category": "Policy",
    "purpose": "Politique institutionnelle",
    "businessObjective": "Politique institutionnelle",
    "services": [
      "Corporate",
      "Operations",
      "Academy",
      "Partnerships"
    ],
    "audiences": [
      "Direction",
      "Personnel",
      "Partenaires",
      "Investisseurs"
    ],
    "channels": [
      "A4 PDF",
      "Internal Workspace"
    ],
    "languages": [
      "fr",
      "en",
      "ar"
    ],
    "cities": [
      "National"
    ],
    "anatomy": [
      "Couverture",
      "Contrôle documentaire",
      "Résumé exécutif",
      "Corps structuré",
      "Décision / responsabilité",
      "Annexes",
      "Approbation"
    ],
    "slots": [
      {
        "id": "cover",
        "label": "Couverture",
        "kind": "section",
        "required": true
      },
      {
        "id": "summary",
        "label": "Résumé exécutif",
        "kind": "section",
        "required": true
      },
      {
        "id": "body",
        "label": "Corps structuré",
        "kind": "section",
        "required": true
      },
      {
        "id": "tables",
        "label": "Tables / matrices",
        "kind": "table",
        "required": false
      },
      {
        "id": "authority",
        "label": "Autorité",
        "kind": "signature",
        "required": true,
        "locked": true
      },
      {
        "id": "footer",
        "label": "Pied de page",
        "kind": "footer",
        "required": true,
        "locked": true
      },
      {
        "id": "revision",
        "label": "Historique de révision",
        "kind": "metadata",
        "required": true
      }
    ],
    "outputProfiles": [
      {
        "id": "doc-5",
        "label": "Document A4",
        "dimensions": "210×297 mm",
        "orientation": "document",
        "channel": "Corporate Documentation",
        "safeZone": "Marges, pied et pagination gouvernés"
      }
    ],
    "lockedZones": [
      "Code document",
      "Version",
      "Autorité",
      "Pied institutionnel"
    ],
    "variableZones": [
      "Sections",
      "Tables",
      "Annexes",
      "Langue"
    ],
    "rules": [
      "Hiérarchie de titres cohérente",
      "Pagination contrôlée",
      "Historique de version",
      "Autorité identifiée"
    ],
    "evidence": [
      "Aperçu PDF",
      "Contrôle pagination",
      "Validation du propriétaire",
      "Références sources"
    ],
    "accessibility": [
      "Structure sémantique",
      "Tables avec en-têtes",
      "Contraste imprimable",
      "Lecture mobile disponible"
    ],
    "allowedAdaptations": [
      "Sections autorisées",
      "Langue",
      "Annexes",
      "Audience"
    ],
    "prohibitedAdaptations": [
      "Suppression du contrôle documentaire",
      "Signature préchargée non autorisée",
      "Version silencieusement écrasée"
    ],
    "owner": "Corporate Documentation",
    "authority": "Managing Director / Document Owner",
    "version": "v1.0",
    "status": "Active",
    "tone": "success"
  },
  {
    "id": "ac-document-06",
    "code": "AC-TPL-DOC-006",
    "name": "Internal manual",
    "family": "document",
    "category": "Manual",
    "purpose": "Manuel interne",
    "businessObjective": "Manuel interne",
    "services": [
      "Corporate",
      "Operations",
      "Academy",
      "Partnerships"
    ],
    "audiences": [
      "Direction",
      "Personnel",
      "Partenaires",
      "Investisseurs"
    ],
    "channels": [
      "A4 PDF",
      "Internal Workspace"
    ],
    "languages": [
      "fr",
      "en",
      "ar"
    ],
    "cities": [
      "National"
    ],
    "anatomy": [
      "Couverture",
      "Contrôle documentaire",
      "Résumé exécutif",
      "Corps structuré",
      "Décision / responsabilité",
      "Annexes",
      "Approbation"
    ],
    "slots": [
      {
        "id": "cover",
        "label": "Couverture",
        "kind": "section",
        "required": true
      },
      {
        "id": "summary",
        "label": "Résumé exécutif",
        "kind": "section",
        "required": true
      },
      {
        "id": "body",
        "label": "Corps structuré",
        "kind": "section",
        "required": true
      },
      {
        "id": "tables",
        "label": "Tables / matrices",
        "kind": "table",
        "required": false
      },
      {
        "id": "authority",
        "label": "Autorité",
        "kind": "signature",
        "required": true,
        "locked": true
      },
      {
        "id": "footer",
        "label": "Pied de page",
        "kind": "footer",
        "required": true,
        "locked": true
      },
      {
        "id": "revision",
        "label": "Historique de révision",
        "kind": "metadata",
        "required": true
      }
    ],
    "outputProfiles": [
      {
        "id": "doc-6",
        "label": "Document A4",
        "dimensions": "210×297 mm",
        "orientation": "document",
        "channel": "Corporate Documentation",
        "safeZone": "Marges, pied et pagination gouvernés"
      }
    ],
    "lockedZones": [
      "Code document",
      "Version",
      "Autorité",
      "Pied institutionnel"
    ],
    "variableZones": [
      "Sections",
      "Tables",
      "Annexes",
      "Langue"
    ],
    "rules": [
      "Hiérarchie de titres cohérente",
      "Pagination contrôlée",
      "Historique de version",
      "Autorité identifiée"
    ],
    "evidence": [
      "Aperçu PDF",
      "Contrôle pagination",
      "Validation du propriétaire",
      "Références sources"
    ],
    "accessibility": [
      "Structure sémantique",
      "Tables avec en-têtes",
      "Contraste imprimable",
      "Lecture mobile disponible"
    ],
    "allowedAdaptations": [
      "Sections autorisées",
      "Langue",
      "Annexes",
      "Audience"
    ],
    "prohibitedAdaptations": [
      "Suppression du contrôle documentaire",
      "Signature préchargée non autorisée",
      "Version silencieusement écrasée"
    ],
    "owner": "Corporate Documentation",
    "authority": "Managing Director / Document Owner",
    "version": "v1.0",
    "status": "Active",
    "tone": "success"
  },
  {
    "id": "ac-document-07",
    "code": "AC-TPL-DOC-007",
    "name": "Staff handbook",
    "family": "document",
    "category": "Handbook",
    "purpose": "Guide du personnel",
    "businessObjective": "Guide du personnel",
    "services": [
      "Corporate",
      "Operations",
      "Academy",
      "Partnerships"
    ],
    "audiences": [
      "Direction",
      "Personnel",
      "Partenaires",
      "Investisseurs"
    ],
    "channels": [
      "A4 PDF",
      "Internal Workspace"
    ],
    "languages": [
      "fr",
      "en",
      "ar"
    ],
    "cities": [
      "National"
    ],
    "anatomy": [
      "Couverture",
      "Contrôle documentaire",
      "Résumé exécutif",
      "Corps structuré",
      "Décision / responsabilité",
      "Annexes",
      "Approbation"
    ],
    "slots": [
      {
        "id": "cover",
        "label": "Couverture",
        "kind": "section",
        "required": true
      },
      {
        "id": "summary",
        "label": "Résumé exécutif",
        "kind": "section",
        "required": true
      },
      {
        "id": "body",
        "label": "Corps structuré",
        "kind": "section",
        "required": true
      },
      {
        "id": "tables",
        "label": "Tables / matrices",
        "kind": "table",
        "required": false
      },
      {
        "id": "authority",
        "label": "Autorité",
        "kind": "signature",
        "required": true,
        "locked": true
      },
      {
        "id": "footer",
        "label": "Pied de page",
        "kind": "footer",
        "required": true,
        "locked": true
      },
      {
        "id": "revision",
        "label": "Historique de révision",
        "kind": "metadata",
        "required": true
      }
    ],
    "outputProfiles": [
      {
        "id": "doc-7",
        "label": "Document A4",
        "dimensions": "210×297 mm",
        "orientation": "document",
        "channel": "Corporate Documentation",
        "safeZone": "Marges, pied et pagination gouvernés"
      }
    ],
    "lockedZones": [
      "Code document",
      "Version",
      "Autorité",
      "Pied institutionnel"
    ],
    "variableZones": [
      "Sections",
      "Tables",
      "Annexes",
      "Langue"
    ],
    "rules": [
      "Hiérarchie de titres cohérente",
      "Pagination contrôlée",
      "Historique de version",
      "Autorité identifiée"
    ],
    "evidence": [
      "Aperçu PDF",
      "Contrôle pagination",
      "Validation du propriétaire",
      "Références sources"
    ],
    "accessibility": [
      "Structure sémantique",
      "Tables avec en-têtes",
      "Contraste imprimable",
      "Lecture mobile disponible"
    ],
    "allowedAdaptations": [
      "Sections autorisées",
      "Langue",
      "Annexes",
      "Audience"
    ],
    "prohibitedAdaptations": [
      "Suppression du contrôle documentaire",
      "Signature préchargée non autorisée",
      "Version silencieusement écrasée"
    ],
    "owner": "Corporate Documentation",
    "authority": "Managing Director / Document Owner",
    "version": "v1.0",
    "status": "Active",
    "tone": "success"
  },
  {
    "id": "ac-document-08",
    "code": "AC-TPL-DOC-008",
    "name": "Commercial proposal",
    "family": "document",
    "category": "Proposal",
    "purpose": "Proposition commerciale",
    "businessObjective": "Proposition commerciale",
    "services": [
      "Corporate",
      "Operations",
      "Academy",
      "Partnerships"
    ],
    "audiences": [
      "Direction",
      "Personnel",
      "Partenaires",
      "Investisseurs"
    ],
    "channels": [
      "A4 PDF",
      "Internal Workspace"
    ],
    "languages": [
      "fr",
      "en",
      "ar"
    ],
    "cities": [
      "National"
    ],
    "anatomy": [
      "Couverture",
      "Contrôle documentaire",
      "Résumé exécutif",
      "Corps structuré",
      "Décision / responsabilité",
      "Annexes",
      "Approbation"
    ],
    "slots": [
      {
        "id": "cover",
        "label": "Couverture",
        "kind": "section",
        "required": true
      },
      {
        "id": "summary",
        "label": "Résumé exécutif",
        "kind": "section",
        "required": true
      },
      {
        "id": "body",
        "label": "Corps structuré",
        "kind": "section",
        "required": true
      },
      {
        "id": "tables",
        "label": "Tables / matrices",
        "kind": "table",
        "required": false
      },
      {
        "id": "authority",
        "label": "Autorité",
        "kind": "signature",
        "required": true,
        "locked": true
      },
      {
        "id": "footer",
        "label": "Pied de page",
        "kind": "footer",
        "required": true,
        "locked": true
      },
      {
        "id": "revision",
        "label": "Historique de révision",
        "kind": "metadata",
        "required": true
      }
    ],
    "outputProfiles": [
      {
        "id": "doc-8",
        "label": "Document A4",
        "dimensions": "210×297 mm",
        "orientation": "document",
        "channel": "Corporate Documentation",
        "safeZone": "Marges, pied et pagination gouvernés"
      }
    ],
    "lockedZones": [
      "Code document",
      "Version",
      "Autorité",
      "Pied institutionnel"
    ],
    "variableZones": [
      "Sections",
      "Tables",
      "Annexes",
      "Langue"
    ],
    "rules": [
      "Hiérarchie de titres cohérente",
      "Pagination contrôlée",
      "Historique de version",
      "Autorité identifiée"
    ],
    "evidence": [
      "Aperçu PDF",
      "Contrôle pagination",
      "Validation du propriétaire",
      "Références sources"
    ],
    "accessibility": [
      "Structure sémantique",
      "Tables avec en-têtes",
      "Contraste imprimable",
      "Lecture mobile disponible"
    ],
    "allowedAdaptations": [
      "Sections autorisées",
      "Langue",
      "Annexes",
      "Audience"
    ],
    "prohibitedAdaptations": [
      "Suppression du contrôle documentaire",
      "Signature préchargée non autorisée",
      "Version silencieusement écrasée"
    ],
    "owner": "Corporate Documentation",
    "authority": "Managing Director / Document Owner",
    "version": "v1.0",
    "status": "Active",
    "tone": "success"
  },
  {
    "id": "ac-document-09",
    "code": "AC-TPL-DOC-009",
    "name": "Partner dossier",
    "family": "document",
    "category": "Partnership",
    "purpose": "Dossier partenaire",
    "businessObjective": "Dossier partenaire",
    "services": [
      "Corporate",
      "Operations",
      "Academy",
      "Partnerships"
    ],
    "audiences": [
      "Direction",
      "Personnel",
      "Partenaires",
      "Investisseurs"
    ],
    "channels": [
      "A4 PDF",
      "Internal Workspace"
    ],
    "languages": [
      "fr",
      "en",
      "ar"
    ],
    "cities": [
      "National"
    ],
    "anatomy": [
      "Couverture",
      "Contrôle documentaire",
      "Résumé exécutif",
      "Corps structuré",
      "Décision / responsabilité",
      "Annexes",
      "Approbation"
    ],
    "slots": [
      {
        "id": "cover",
        "label": "Couverture",
        "kind": "section",
        "required": true
      },
      {
        "id": "summary",
        "label": "Résumé exécutif",
        "kind": "section",
        "required": true
      },
      {
        "id": "body",
        "label": "Corps structuré",
        "kind": "section",
        "required": true
      },
      {
        "id": "tables",
        "label": "Tables / matrices",
        "kind": "table",
        "required": false
      },
      {
        "id": "authority",
        "label": "Autorité",
        "kind": "signature",
        "required": true,
        "locked": true
      },
      {
        "id": "footer",
        "label": "Pied de page",
        "kind": "footer",
        "required": true,
        "locked": true
      },
      {
        "id": "revision",
        "label": "Historique de révision",
        "kind": "metadata",
        "required": true
      }
    ],
    "outputProfiles": [
      {
        "id": "doc-9",
        "label": "Document A4",
        "dimensions": "210×297 mm",
        "orientation": "document",
        "channel": "Corporate Documentation",
        "safeZone": "Marges, pied et pagination gouvernés"
      }
    ],
    "lockedZones": [
      "Code document",
      "Version",
      "Autorité",
      "Pied institutionnel"
    ],
    "variableZones": [
      "Sections",
      "Tables",
      "Annexes",
      "Langue"
    ],
    "rules": [
      "Hiérarchie de titres cohérente",
      "Pagination contrôlée",
      "Historique de version",
      "Autorité identifiée"
    ],
    "evidence": [
      "Aperçu PDF",
      "Contrôle pagination",
      "Validation du propriétaire",
      "Références sources"
    ],
    "accessibility": [
      "Structure sémantique",
      "Tables avec en-têtes",
      "Contraste imprimable",
      "Lecture mobile disponible"
    ],
    "allowedAdaptations": [
      "Sections autorisées",
      "Langue",
      "Annexes",
      "Audience"
    ],
    "prohibitedAdaptations": [
      "Suppression du contrôle documentaire",
      "Signature préchargée non autorisée",
      "Version silencieusement écrasée"
    ],
    "owner": "Corporate Documentation",
    "authority": "Managing Director / Document Owner",
    "version": "v1.0",
    "status": "Active",
    "tone": "success"
  },
  {
    "id": "ac-document-10",
    "code": "AC-TPL-DOC-010",
    "name": "Training manual",
    "family": "document",
    "category": "Training",
    "purpose": "Manuel de formation",
    "businessObjective": "Manuel de formation",
    "services": [
      "Corporate",
      "Operations",
      "Academy",
      "Partnerships"
    ],
    "audiences": [
      "Direction",
      "Personnel",
      "Partenaires",
      "Investisseurs"
    ],
    "channels": [
      "A4 PDF",
      "Internal Workspace"
    ],
    "languages": [
      "fr",
      "en",
      "ar"
    ],
    "cities": [
      "National"
    ],
    "anatomy": [
      "Couverture",
      "Contrôle documentaire",
      "Résumé exécutif",
      "Corps structuré",
      "Décision / responsabilité",
      "Annexes",
      "Approbation"
    ],
    "slots": [
      {
        "id": "cover",
        "label": "Couverture",
        "kind": "section",
        "required": true
      },
      {
        "id": "summary",
        "label": "Résumé exécutif",
        "kind": "section",
        "required": true
      },
      {
        "id": "body",
        "label": "Corps structuré",
        "kind": "section",
        "required": true
      },
      {
        "id": "tables",
        "label": "Tables / matrices",
        "kind": "table",
        "required": false
      },
      {
        "id": "authority",
        "label": "Autorité",
        "kind": "signature",
        "required": true,
        "locked": true
      },
      {
        "id": "footer",
        "label": "Pied de page",
        "kind": "footer",
        "required": true,
        "locked": true
      },
      {
        "id": "revision",
        "label": "Historique de révision",
        "kind": "metadata",
        "required": true
      }
    ],
    "outputProfiles": [
      {
        "id": "doc-10",
        "label": "Document A4",
        "dimensions": "210×297 mm",
        "orientation": "document",
        "channel": "Corporate Documentation",
        "safeZone": "Marges, pied et pagination gouvernés"
      }
    ],
    "lockedZones": [
      "Code document",
      "Version",
      "Autorité",
      "Pied institutionnel"
    ],
    "variableZones": [
      "Sections",
      "Tables",
      "Annexes",
      "Langue"
    ],
    "rules": [
      "Hiérarchie de titres cohérente",
      "Pagination contrôlée",
      "Historique de version",
      "Autorité identifiée"
    ],
    "evidence": [
      "Aperçu PDF",
      "Contrôle pagination",
      "Validation du propriétaire",
      "Références sources"
    ],
    "accessibility": [
      "Structure sémantique",
      "Tables avec en-têtes",
      "Contraste imprimable",
      "Lecture mobile disponible"
    ],
    "allowedAdaptations": [
      "Sections autorisées",
      "Langue",
      "Annexes",
      "Audience"
    ],
    "prohibitedAdaptations": [
      "Suppression du contrôle documentaire",
      "Signature préchargée non autorisée",
      "Version silencieusement écrasée"
    ],
    "owner": "Corporate Documentation",
    "authority": "Managing Director / Document Owner",
    "version": "v1.0",
    "status": "Active",
    "tone": "success"
  },
  {
    "id": "ac-document-11",
    "code": "AC-TPL-DOC-011",
    "name": "Audit report",
    "family": "document",
    "category": "Audit",
    "purpose": "Rapport d’audit",
    "businessObjective": "Rapport d’audit",
    "services": [
      "Corporate",
      "Operations",
      "Academy",
      "Partnerships"
    ],
    "audiences": [
      "Direction",
      "Personnel",
      "Partenaires",
      "Investisseurs"
    ],
    "channels": [
      "A4 PDF",
      "Internal Workspace"
    ],
    "languages": [
      "fr",
      "en",
      "ar"
    ],
    "cities": [
      "National"
    ],
    "anatomy": [
      "Couverture",
      "Contrôle documentaire",
      "Résumé exécutif",
      "Corps structuré",
      "Décision / responsabilité",
      "Annexes",
      "Approbation"
    ],
    "slots": [
      {
        "id": "cover",
        "label": "Couverture",
        "kind": "section",
        "required": true
      },
      {
        "id": "summary",
        "label": "Résumé exécutif",
        "kind": "section",
        "required": true
      },
      {
        "id": "body",
        "label": "Corps structuré",
        "kind": "section",
        "required": true
      },
      {
        "id": "tables",
        "label": "Tables / matrices",
        "kind": "table",
        "required": false
      },
      {
        "id": "authority",
        "label": "Autorité",
        "kind": "signature",
        "required": true,
        "locked": true
      },
      {
        "id": "footer",
        "label": "Pied de page",
        "kind": "footer",
        "required": true,
        "locked": true
      },
      {
        "id": "revision",
        "label": "Historique de révision",
        "kind": "metadata",
        "required": true
      }
    ],
    "outputProfiles": [
      {
        "id": "doc-11",
        "label": "Document A4",
        "dimensions": "210×297 mm",
        "orientation": "document",
        "channel": "Corporate Documentation",
        "safeZone": "Marges, pied et pagination gouvernés"
      }
    ],
    "lockedZones": [
      "Code document",
      "Version",
      "Autorité",
      "Pied institutionnel"
    ],
    "variableZones": [
      "Sections",
      "Tables",
      "Annexes",
      "Langue"
    ],
    "rules": [
      "Hiérarchie de titres cohérente",
      "Pagination contrôlée",
      "Historique de version",
      "Autorité identifiée"
    ],
    "evidence": [
      "Aperçu PDF",
      "Contrôle pagination",
      "Validation du propriétaire",
      "Références sources"
    ],
    "accessibility": [
      "Structure sémantique",
      "Tables avec en-têtes",
      "Contraste imprimable",
      "Lecture mobile disponible"
    ],
    "allowedAdaptations": [
      "Sections autorisées",
      "Langue",
      "Annexes",
      "Audience"
    ],
    "prohibitedAdaptations": [
      "Suppression du contrôle documentaire",
      "Signature préchargée non autorisée",
      "Version silencieusement écrasée"
    ],
    "owner": "Corporate Documentation",
    "authority": "Managing Director / Document Owner",
    "version": "v1.0",
    "status": "Active",
    "tone": "success"
  },
  {
    "id": "ac-document-12",
    "code": "AC-TPL-DOC-012",
    "name": "Monthly performance report",
    "family": "document",
    "category": "Performance",
    "purpose": "Performance mensuelle",
    "businessObjective": "Performance mensuelle",
    "services": [
      "Corporate",
      "Operations",
      "Academy",
      "Partnerships"
    ],
    "audiences": [
      "Direction",
      "Personnel",
      "Partenaires",
      "Investisseurs"
    ],
    "channels": [
      "A4 PDF",
      "Internal Workspace"
    ],
    "languages": [
      "fr",
      "en",
      "ar"
    ],
    "cities": [
      "National"
    ],
    "anatomy": [
      "Couverture",
      "Contrôle documentaire",
      "Résumé exécutif",
      "Corps structuré",
      "Décision / responsabilité",
      "Annexes",
      "Approbation"
    ],
    "slots": [
      {
        "id": "cover",
        "label": "Couverture",
        "kind": "section",
        "required": true
      },
      {
        "id": "summary",
        "label": "Résumé exécutif",
        "kind": "section",
        "required": true
      },
      {
        "id": "body",
        "label": "Corps structuré",
        "kind": "section",
        "required": true
      },
      {
        "id": "tables",
        "label": "Tables / matrices",
        "kind": "table",
        "required": false
      },
      {
        "id": "authority",
        "label": "Autorité",
        "kind": "signature",
        "required": true,
        "locked": true
      },
      {
        "id": "footer",
        "label": "Pied de page",
        "kind": "footer",
        "required": true,
        "locked": true
      },
      {
        "id": "revision",
        "label": "Historique de révision",
        "kind": "metadata",
        "required": true
      }
    ],
    "outputProfiles": [
      {
        "id": "doc-12",
        "label": "Document A4",
        "dimensions": "210×297 mm",
        "orientation": "document",
        "channel": "Corporate Documentation",
        "safeZone": "Marges, pied et pagination gouvernés"
      }
    ],
    "lockedZones": [
      "Code document",
      "Version",
      "Autorité",
      "Pied institutionnel"
    ],
    "variableZones": [
      "Sections",
      "Tables",
      "Annexes",
      "Langue"
    ],
    "rules": [
      "Hiérarchie de titres cohérente",
      "Pagination contrôlée",
      "Historique de version",
      "Autorité identifiée"
    ],
    "evidence": [
      "Aperçu PDF",
      "Contrôle pagination",
      "Validation du propriétaire",
      "Références sources"
    ],
    "accessibility": [
      "Structure sémantique",
      "Tables avec en-têtes",
      "Contraste imprimable",
      "Lecture mobile disponible"
    ],
    "allowedAdaptations": [
      "Sections autorisées",
      "Langue",
      "Annexes",
      "Audience"
    ],
    "prohibitedAdaptations": [
      "Suppression du contrôle documentaire",
      "Signature préchargée non autorisée",
      "Version silencieusement écrasée"
    ],
    "owner": "Corporate Documentation",
    "authority": "Managing Director / Document Owner",
    "version": "v1.0",
    "status": "Active",
    "tone": "success"
  },
  {
    "id": "ac-document-13",
    "code": "AC-TPL-DOC-013",
    "name": "Meeting decision pack",
    "family": "document",
    "category": "Decision",
    "purpose": "Pack de décision",
    "businessObjective": "Pack de décision",
    "services": [
      "Corporate",
      "Operations",
      "Academy",
      "Partnerships"
    ],
    "audiences": [
      "Direction",
      "Personnel",
      "Partenaires",
      "Investisseurs"
    ],
    "channels": [
      "A4 PDF",
      "Internal Workspace"
    ],
    "languages": [
      "fr",
      "en",
      "ar"
    ],
    "cities": [
      "National"
    ],
    "anatomy": [
      "Couverture",
      "Contrôle documentaire",
      "Résumé exécutif",
      "Corps structuré",
      "Décision / responsabilité",
      "Annexes",
      "Approbation"
    ],
    "slots": [
      {
        "id": "cover",
        "label": "Couverture",
        "kind": "section",
        "required": true
      },
      {
        "id": "summary",
        "label": "Résumé exécutif",
        "kind": "section",
        "required": true
      },
      {
        "id": "body",
        "label": "Corps structuré",
        "kind": "section",
        "required": true
      },
      {
        "id": "tables",
        "label": "Tables / matrices",
        "kind": "table",
        "required": false
      },
      {
        "id": "authority",
        "label": "Autorité",
        "kind": "signature",
        "required": true,
        "locked": true
      },
      {
        "id": "footer",
        "label": "Pied de page",
        "kind": "footer",
        "required": true,
        "locked": true
      },
      {
        "id": "revision",
        "label": "Historique de révision",
        "kind": "metadata",
        "required": true
      }
    ],
    "outputProfiles": [
      {
        "id": "doc-13",
        "label": "Document A4",
        "dimensions": "210×297 mm",
        "orientation": "document",
        "channel": "Corporate Documentation",
        "safeZone": "Marges, pied et pagination gouvernés"
      }
    ],
    "lockedZones": [
      "Code document",
      "Version",
      "Autorité",
      "Pied institutionnel"
    ],
    "variableZones": [
      "Sections",
      "Tables",
      "Annexes",
      "Langue"
    ],
    "rules": [
      "Hiérarchie de titres cohérente",
      "Pagination contrôlée",
      "Historique de version",
      "Autorité identifiée"
    ],
    "evidence": [
      "Aperçu PDF",
      "Contrôle pagination",
      "Validation du propriétaire",
      "Références sources"
    ],
    "accessibility": [
      "Structure sémantique",
      "Tables avec en-têtes",
      "Contraste imprimable",
      "Lecture mobile disponible"
    ],
    "allowedAdaptations": [
      "Sections autorisées",
      "Langue",
      "Annexes",
      "Audience"
    ],
    "prohibitedAdaptations": [
      "Suppression du contrôle documentaire",
      "Signature préchargée non autorisée",
      "Version silencieusement écrasée"
    ],
    "owner": "Corporate Documentation",
    "authority": "Managing Director / Document Owner",
    "version": "v1.0",
    "status": "Active",
    "tone": "success"
  },
  {
    "id": "ac-document-14",
    "code": "AC-TPL-DOC-014",
    "name": "Investor or financing brief",
    "family": "document",
    "category": "Finance",
    "purpose": "Dossier financement",
    "businessObjective": "Dossier financement",
    "services": [
      "Corporate",
      "Operations",
      "Academy",
      "Partnerships"
    ],
    "audiences": [
      "Direction",
      "Personnel",
      "Partenaires",
      "Investisseurs"
    ],
    "channels": [
      "A4 PDF",
      "Internal Workspace"
    ],
    "languages": [
      "fr",
      "en",
      "ar"
    ],
    "cities": [
      "National"
    ],
    "anatomy": [
      "Couverture",
      "Contrôle documentaire",
      "Résumé exécutif",
      "Corps structuré",
      "Décision / responsabilité",
      "Annexes",
      "Approbation"
    ],
    "slots": [
      {
        "id": "cover",
        "label": "Couverture",
        "kind": "section",
        "required": true
      },
      {
        "id": "summary",
        "label": "Résumé exécutif",
        "kind": "section",
        "required": true
      },
      {
        "id": "body",
        "label": "Corps structuré",
        "kind": "section",
        "required": true
      },
      {
        "id": "tables",
        "label": "Tables / matrices",
        "kind": "table",
        "required": false
      },
      {
        "id": "authority",
        "label": "Autorité",
        "kind": "signature",
        "required": true,
        "locked": true
      },
      {
        "id": "footer",
        "label": "Pied de page",
        "kind": "footer",
        "required": true,
        "locked": true
      },
      {
        "id": "revision",
        "label": "Historique de révision",
        "kind": "metadata",
        "required": true
      }
    ],
    "outputProfiles": [
      {
        "id": "doc-14",
        "label": "Document A4",
        "dimensions": "210×297 mm",
        "orientation": "document",
        "channel": "Corporate Documentation",
        "safeZone": "Marges, pied et pagination gouvernés"
      }
    ],
    "lockedZones": [
      "Code document",
      "Version",
      "Autorité",
      "Pied institutionnel"
    ],
    "variableZones": [
      "Sections",
      "Tables",
      "Annexes",
      "Langue"
    ],
    "rules": [
      "Hiérarchie de titres cohérente",
      "Pagination contrôlée",
      "Historique de version",
      "Autorité identifiée"
    ],
    "evidence": [
      "Aperçu PDF",
      "Contrôle pagination",
      "Validation du propriétaire",
      "Références sources"
    ],
    "accessibility": [
      "Structure sémantique",
      "Tables avec en-têtes",
      "Contraste imprimable",
      "Lecture mobile disponible"
    ],
    "allowedAdaptations": [
      "Sections autorisées",
      "Langue",
      "Annexes",
      "Audience"
    ],
    "prohibitedAdaptations": [
      "Suppression du contrôle documentaire",
      "Signature préchargée non autorisée",
      "Version silencieusement écrasée"
    ],
    "owner": "Corporate Documentation",
    "authority": "Managing Director / Document Owner",
    "version": "v1.0",
    "status": "Active",
    "tone": "success"
  },
  {
    "id": "ac-document-15",
    "code": "AC-TPL-DOC-015",
    "name": "Service presentation",
    "family": "document",
    "category": "Presentation",
    "purpose": "Présentation de service",
    "businessObjective": "Présentation de service",
    "services": [
      "Corporate",
      "Operations",
      "Academy",
      "Partnerships"
    ],
    "audiences": [
      "Direction",
      "Personnel",
      "Partenaires",
      "Investisseurs"
    ],
    "channels": [
      "A4 PDF",
      "Internal Workspace"
    ],
    "languages": [
      "fr",
      "en",
      "ar"
    ],
    "cities": [
      "National"
    ],
    "anatomy": [
      "Couverture",
      "Contrôle documentaire",
      "Résumé exécutif",
      "Corps structuré",
      "Décision / responsabilité",
      "Annexes",
      "Approbation"
    ],
    "slots": [
      {
        "id": "cover",
        "label": "Couverture",
        "kind": "section",
        "required": true
      },
      {
        "id": "summary",
        "label": "Résumé exécutif",
        "kind": "section",
        "required": true
      },
      {
        "id": "body",
        "label": "Corps structuré",
        "kind": "section",
        "required": true
      },
      {
        "id": "tables",
        "label": "Tables / matrices",
        "kind": "table",
        "required": false
      },
      {
        "id": "authority",
        "label": "Autorité",
        "kind": "signature",
        "required": true,
        "locked": true
      },
      {
        "id": "footer",
        "label": "Pied de page",
        "kind": "footer",
        "required": true,
        "locked": true
      },
      {
        "id": "revision",
        "label": "Historique de révision",
        "kind": "metadata",
        "required": true
      }
    ],
    "outputProfiles": [
      {
        "id": "doc-15",
        "label": "Document A4",
        "dimensions": "210×297 mm",
        "orientation": "document",
        "channel": "Corporate Documentation",
        "safeZone": "Marges, pied et pagination gouvernés"
      }
    ],
    "lockedZones": [
      "Code document",
      "Version",
      "Autorité",
      "Pied institutionnel"
    ],
    "variableZones": [
      "Sections",
      "Tables",
      "Annexes",
      "Langue"
    ],
    "rules": [
      "Hiérarchie de titres cohérente",
      "Pagination contrôlée",
      "Historique de version",
      "Autorité identifiée"
    ],
    "evidence": [
      "Aperçu PDF",
      "Contrôle pagination",
      "Validation du propriétaire",
      "Références sources"
    ],
    "accessibility": [
      "Structure sémantique",
      "Tables avec en-têtes",
      "Contraste imprimable",
      "Lecture mobile disponible"
    ],
    "allowedAdaptations": [
      "Sections autorisées",
      "Langue",
      "Annexes",
      "Audience"
    ],
    "prohibitedAdaptations": [
      "Suppression du contrôle documentaire",
      "Signature préchargée non autorisée",
      "Version silencieusement écrasée"
    ],
    "owner": "Corporate Documentation",
    "authority": "Managing Director / Document Owner",
    "version": "v1.0",
    "status": "Active",
    "tone": "success"
  },
  {
    "id": "ac-document-16",
    "code": "AC-TPL-DOC-016",
    "name": "Formal institutional certificate or attestation",
    "family": "document",
    "category": "Certificate",
    "purpose": "Certificat institutionnel",
    "businessObjective": "Certificat institutionnel",
    "services": [
      "Corporate",
      "Operations",
      "Academy",
      "Partnerships"
    ],
    "audiences": [
      "Direction",
      "Personnel",
      "Partenaires",
      "Investisseurs"
    ],
    "channels": [
      "A4 PDF",
      "Internal Workspace"
    ],
    "languages": [
      "fr",
      "en",
      "ar"
    ],
    "cities": [
      "National"
    ],
    "anatomy": [
      "Identité du bénéficiaire",
      "Motif",
      "Champ CIN / passeport",
      "Autorités",
      "Date",
      "Pied institutionnel"
    ],
    "slots": [
      {
        "id": "cover",
        "label": "Couverture",
        "kind": "section",
        "required": true
      },
      {
        "id": "summary",
        "label": "Résumé exécutif",
        "kind": "section",
        "required": false
      },
      {
        "id": "body",
        "label": "Corps structuré",
        "kind": "section",
        "required": true
      },
      {
        "id": "tables",
        "label": "Tables / matrices",
        "kind": "table",
        "required": false
      },
      {
        "id": "authority",
        "label": "Autorité",
        "kind": "signature",
        "required": true,
        "locked": true
      },
      {
        "id": "footer",
        "label": "Pied de page",
        "kind": "footer",
        "required": true,
        "locked": true
      },
      {
        "id": "revision",
        "label": "Historique de révision",
        "kind": "metadata",
        "required": false
      }
    ],
    "outputProfiles": [
      {
        "id": "doc-16",
        "label": "Document A4",
        "dimensions": "210×297 mm",
        "orientation": "document",
        "channel": "Corporate Documentation",
        "safeZone": "Marges, pied et pagination gouvernés"
      }
    ],
    "lockedZones": [
      "Code document",
      "Version",
      "Autorité",
      "Pied institutionnel"
    ],
    "variableZones": [
      "Sections",
      "Tables",
      "Annexes",
      "Langue"
    ],
    "rules": [
      "Hiérarchie de titres cohérente",
      "Pagination contrôlée",
      "Historique de version",
      "Autorité identifiée"
    ],
    "evidence": [
      "Aperçu PDF",
      "Contrôle pagination",
      "Validation du propriétaire",
      "Références sources"
    ],
    "accessibility": [
      "Structure sémantique",
      "Tables avec en-têtes",
      "Contraste imprimable",
      "Lecture mobile disponible"
    ],
    "allowedAdaptations": [
      "Sections autorisées",
      "Langue",
      "Annexes",
      "Audience"
    ],
    "prohibitedAdaptations": [
      "Suppression du contrôle documentaire",
      "Signature préchargée non autorisée",
      "Version silencieusement écrasée"
    ],
    "owner": "Corporate Documentation",
    "authority": "Managing Director / Document Owner",
    "version": "v1.0",
    "status": "Active",
    "tone": "success"
  },
  {
    "id": "ac-accelerator-01",
    "code": "AC-TPL-ACC-001",
    "name": "Create from approved brief",
    "family": "accelerator",
    "category": "Quick Create",
    "purpose": "Brief approuvé",
    "businessObjective": "Brief approuvé",
    "services": [
      "All"
    ],
    "audiences": [
      "Internal production"
    ],
    "channels": [
      "Contextual"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Contextual"
    ],
    "anatomy": [
      "Origine",
      "Objectif",
      "Famille de sortie",
      "Contexte requis",
      "Studio destination"
    ],
    "slots": [
      {
        "id": "origin",
        "label": "Origine",
        "kind": "metadata",
        "required": true
      },
      {
        "id": "objective",
        "label": "Objectif",
        "kind": "body",
        "required": true
      },
      {
        "id": "output",
        "label": "Famille de sortie",
        "kind": "section",
        "required": true
      },
      {
        "id": "owner",
        "label": "Propriétaire",
        "kind": "metadata",
        "required": true
      },
      {
        "id": "reviewer",
        "label": "Réviseur",
        "kind": "metadata",
        "required": true
      }
    ],
    "outputProfiles": [
      {
        "id": "acc-1",
        "label": "Création gouvernée",
        "dimensions": "Contextuel",
        "orientation": "document",
        "channel": "Quick Create",
        "safeZone": "Conserve le dossier et le retour"
      }
    ],
    "lockedZones": [
      "Origine",
      "Dossier",
      "Autorité"
    ],
    "variableZones": [
      "Studio",
      "Famille",
      "Canal",
      "Langue"
    ],
    "rules": [
      "Ne jamais créer sans origine",
      "Conserver le contexte",
      "Choisir un studio spécialisé"
    ],
    "evidence": [
      "Objet créé",
      "Lien vers le dossier",
      "Mandat transmis au studio"
    ],
    "accessibility": [
      "Parcours clavier complet",
      "Résumé avant lancement"
    ],
    "allowedAdaptations": [
      "Studio",
      "Famille",
      "Canal",
      "Langue"
    ],
    "prohibitedAdaptations": [
      "Création orpheline",
      "Validation automatique"
    ],
    "owner": "Content Operations",
    "authority": "Content Lead",
    "version": "v1.0",
    "status": "Active",
    "tone": "warning"
  },
  {
    "id": "ac-accelerator-02",
    "code": "AC-TPL-ACC-002",
    "name": "Create from Dossier 360",
    "family": "accelerator",
    "category": "Quick Create",
    "purpose": "Dossier actif",
    "businessObjective": "Dossier actif",
    "services": [
      "All"
    ],
    "audiences": [
      "Internal production"
    ],
    "channels": [
      "Contextual"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Contextual"
    ],
    "anatomy": [
      "Origine",
      "Objectif",
      "Famille de sortie",
      "Contexte requis",
      "Studio destination"
    ],
    "slots": [
      {
        "id": "origin",
        "label": "Origine",
        "kind": "metadata",
        "required": true
      },
      {
        "id": "objective",
        "label": "Objectif",
        "kind": "body",
        "required": true
      },
      {
        "id": "output",
        "label": "Famille de sortie",
        "kind": "section",
        "required": true
      },
      {
        "id": "owner",
        "label": "Propriétaire",
        "kind": "metadata",
        "required": true
      },
      {
        "id": "reviewer",
        "label": "Réviseur",
        "kind": "metadata",
        "required": true
      }
    ],
    "outputProfiles": [
      {
        "id": "acc-2",
        "label": "Création gouvernée",
        "dimensions": "Contextuel",
        "orientation": "document",
        "channel": "Quick Create",
        "safeZone": "Conserve le dossier et le retour"
      }
    ],
    "lockedZones": [
      "Origine",
      "Dossier",
      "Autorité"
    ],
    "variableZones": [
      "Studio",
      "Famille",
      "Canal",
      "Langue"
    ],
    "rules": [
      "Ne jamais créer sans origine",
      "Conserver le contexte",
      "Choisir un studio spécialisé"
    ],
    "evidence": [
      "Objet créé",
      "Lien vers le dossier",
      "Mandat transmis au studio"
    ],
    "accessibility": [
      "Parcours clavier complet",
      "Résumé avant lancement"
    ],
    "allowedAdaptations": [
      "Studio",
      "Famille",
      "Canal",
      "Langue"
    ],
    "prohibitedAdaptations": [
      "Création orpheline",
      "Validation automatique"
    ],
    "owner": "Content Operations",
    "authority": "Content Lead",
    "version": "v1.0",
    "status": "Active",
    "tone": "warning"
  },
  {
    "id": "ac-accelerator-03",
    "code": "AC-TPL-ACC-003",
    "name": "Create from mission deliverable",
    "family": "accelerator",
    "category": "Quick Create",
    "purpose": "Livrable mission",
    "businessObjective": "Livrable mission",
    "services": [
      "All"
    ],
    "audiences": [
      "Internal production"
    ],
    "channels": [
      "Contextual"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Contextual"
    ],
    "anatomy": [
      "Origine",
      "Objectif",
      "Famille de sortie",
      "Contexte requis",
      "Studio destination"
    ],
    "slots": [
      {
        "id": "origin",
        "label": "Origine",
        "kind": "metadata",
        "required": true
      },
      {
        "id": "objective",
        "label": "Objectif",
        "kind": "body",
        "required": true
      },
      {
        "id": "output",
        "label": "Famille de sortie",
        "kind": "section",
        "required": true
      },
      {
        "id": "owner",
        "label": "Propriétaire",
        "kind": "metadata",
        "required": true
      },
      {
        "id": "reviewer",
        "label": "Réviseur",
        "kind": "metadata",
        "required": true
      }
    ],
    "outputProfiles": [
      {
        "id": "acc-3",
        "label": "Création gouvernée",
        "dimensions": "Contextuel",
        "orientation": "document",
        "channel": "Quick Create",
        "safeZone": "Conserve le dossier et le retour"
      }
    ],
    "lockedZones": [
      "Origine",
      "Dossier",
      "Autorité"
    ],
    "variableZones": [
      "Studio",
      "Famille",
      "Canal",
      "Langue"
    ],
    "rules": [
      "Ne jamais créer sans origine",
      "Conserver le contexte",
      "Choisir un studio spécialisé"
    ],
    "evidence": [
      "Objet créé",
      "Lien vers le dossier",
      "Mandat transmis au studio"
    ],
    "accessibility": [
      "Parcours clavier complet",
      "Résumé avant lancement"
    ],
    "allowedAdaptations": [
      "Studio",
      "Famille",
      "Canal",
      "Langue"
    ],
    "prohibitedAdaptations": [
      "Création orpheline",
      "Validation automatique"
    ],
    "owner": "Content Operations",
    "authority": "Content Lead",
    "version": "v1.0",
    "status": "Active",
    "tone": "warning"
  },
  {
    "id": "ac-accelerator-04",
    "code": "AC-TPL-ACC-004",
    "name": "Create from existing asset",
    "family": "accelerator",
    "category": "Quick Create",
    "purpose": "Actif existant",
    "businessObjective": "Actif existant",
    "services": [
      "All"
    ],
    "audiences": [
      "Internal production"
    ],
    "channels": [
      "Contextual"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Contextual"
    ],
    "anatomy": [
      "Origine",
      "Objectif",
      "Famille de sortie",
      "Contexte requis",
      "Studio destination"
    ],
    "slots": [
      {
        "id": "origin",
        "label": "Origine",
        "kind": "metadata",
        "required": true
      },
      {
        "id": "objective",
        "label": "Objectif",
        "kind": "body",
        "required": true
      },
      {
        "id": "output",
        "label": "Famille de sortie",
        "kind": "section",
        "required": true
      },
      {
        "id": "owner",
        "label": "Propriétaire",
        "kind": "metadata",
        "required": true
      },
      {
        "id": "reviewer",
        "label": "Réviseur",
        "kind": "metadata",
        "required": true
      }
    ],
    "outputProfiles": [
      {
        "id": "acc-4",
        "label": "Création gouvernée",
        "dimensions": "Contextuel",
        "orientation": "document",
        "channel": "Quick Create",
        "safeZone": "Conserve le dossier et le retour"
      }
    ],
    "lockedZones": [
      "Origine",
      "Dossier",
      "Autorité"
    ],
    "variableZones": [
      "Studio",
      "Famille",
      "Canal",
      "Langue"
    ],
    "rules": [
      "Ne jamais créer sans origine",
      "Conserver le contexte",
      "Choisir un studio spécialisé"
    ],
    "evidence": [
      "Objet créé",
      "Lien vers le dossier",
      "Mandat transmis au studio"
    ],
    "accessibility": [
      "Parcours clavier complet",
      "Résumé avant lancement"
    ],
    "allowedAdaptations": [
      "Studio",
      "Famille",
      "Canal",
      "Langue"
    ],
    "prohibitedAdaptations": [
      "Création orpheline",
      "Validation automatique"
    ],
    "owner": "Content Operations",
    "authority": "Content Lead",
    "version": "v1.0",
    "status": "Active",
    "tone": "warning"
  },
  {
    "id": "ac-accelerator-05",
    "code": "AC-TPL-ACC-005",
    "name": "Create a channel variant",
    "family": "accelerator",
    "category": "Quick Create",
    "purpose": "Variante canal",
    "businessObjective": "Variante canal",
    "services": [
      "All"
    ],
    "audiences": [
      "Internal production"
    ],
    "channels": [
      "Contextual"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Contextual"
    ],
    "anatomy": [
      "Origine",
      "Objectif",
      "Famille de sortie",
      "Contexte requis",
      "Studio destination"
    ],
    "slots": [
      {
        "id": "origin",
        "label": "Origine",
        "kind": "metadata",
        "required": true
      },
      {
        "id": "objective",
        "label": "Objectif",
        "kind": "body",
        "required": true
      },
      {
        "id": "output",
        "label": "Famille de sortie",
        "kind": "section",
        "required": true
      },
      {
        "id": "owner",
        "label": "Propriétaire",
        "kind": "metadata",
        "required": true
      },
      {
        "id": "reviewer",
        "label": "Réviseur",
        "kind": "metadata",
        "required": true
      }
    ],
    "outputProfiles": [
      {
        "id": "acc-5",
        "label": "Création gouvernée",
        "dimensions": "Contextuel",
        "orientation": "document",
        "channel": "Quick Create",
        "safeZone": "Conserve le dossier et le retour"
      }
    ],
    "lockedZones": [
      "Origine",
      "Dossier",
      "Autorité"
    ],
    "variableZones": [
      "Studio",
      "Famille",
      "Canal",
      "Langue"
    ],
    "rules": [
      "Ne jamais créer sans origine",
      "Conserver le contexte",
      "Choisir un studio spécialisé"
    ],
    "evidence": [
      "Objet créé",
      "Lien vers le dossier",
      "Mandat transmis au studio"
    ],
    "accessibility": [
      "Parcours clavier complet",
      "Résumé avant lancement"
    ],
    "allowedAdaptations": [
      "Studio",
      "Famille",
      "Canal",
      "Langue"
    ],
    "prohibitedAdaptations": [
      "Création orpheline",
      "Validation automatique"
    ],
    "owner": "Content Operations",
    "authority": "Content Lead",
    "version": "v1.0",
    "status": "Active",
    "tone": "warning"
  },
  {
    "id": "ac-accelerator-06",
    "code": "AC-TPL-ACC-006",
    "name": "Create a language or city adaptation",
    "family": "accelerator",
    "category": "Quick Create",
    "purpose": "Adaptation locale",
    "businessObjective": "Adaptation locale",
    "services": [
      "All"
    ],
    "audiences": [
      "Internal production"
    ],
    "channels": [
      "Contextual"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Contextual"
    ],
    "anatomy": [
      "Origine",
      "Objectif",
      "Famille de sortie",
      "Contexte requis",
      "Studio destination"
    ],
    "slots": [
      {
        "id": "origin",
        "label": "Origine",
        "kind": "metadata",
        "required": true
      },
      {
        "id": "objective",
        "label": "Objectif",
        "kind": "body",
        "required": true
      },
      {
        "id": "output",
        "label": "Famille de sortie",
        "kind": "section",
        "required": true
      },
      {
        "id": "owner",
        "label": "Propriétaire",
        "kind": "metadata",
        "required": true
      },
      {
        "id": "reviewer",
        "label": "Réviseur",
        "kind": "metadata",
        "required": true
      }
    ],
    "outputProfiles": [
      {
        "id": "acc-6",
        "label": "Création gouvernée",
        "dimensions": "Contextuel",
        "orientation": "document",
        "channel": "Quick Create",
        "safeZone": "Conserve le dossier et le retour"
      }
    ],
    "lockedZones": [
      "Origine",
      "Dossier",
      "Autorité"
    ],
    "variableZones": [
      "Studio",
      "Famille",
      "Canal",
      "Langue"
    ],
    "rules": [
      "Ne jamais créer sans origine",
      "Conserver le contexte",
      "Choisir un studio spécialisé"
    ],
    "evidence": [
      "Objet créé",
      "Lien vers le dossier",
      "Mandat transmis au studio"
    ],
    "accessibility": [
      "Parcours clavier complet",
      "Résumé avant lancement"
    ],
    "allowedAdaptations": [
      "Studio",
      "Famille",
      "Canal",
      "Langue"
    ],
    "prohibitedAdaptations": [
      "Création orpheline",
      "Validation automatique"
    ],
    "owner": "Content Operations",
    "authority": "Content Lead",
    "version": "v1.0",
    "status": "Active",
    "tone": "warning"
  },
  {
    "id": "ac-accelerator-07",
    "code": "AC-TPL-ACC-007",
    "name": "Create a partner co-branded adaptation",
    "family": "accelerator",
    "category": "Quick Create",
    "purpose": "Co-branding",
    "businessObjective": "Co-branding",
    "services": [
      "All"
    ],
    "audiences": [
      "Internal production"
    ],
    "channels": [
      "Contextual"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Contextual"
    ],
    "anatomy": [
      "Origine",
      "Objectif",
      "Famille de sortie",
      "Contexte requis",
      "Studio destination"
    ],
    "slots": [
      {
        "id": "origin",
        "label": "Origine",
        "kind": "metadata",
        "required": true
      },
      {
        "id": "objective",
        "label": "Objectif",
        "kind": "body",
        "required": true
      },
      {
        "id": "output",
        "label": "Famille de sortie",
        "kind": "section",
        "required": true
      },
      {
        "id": "owner",
        "label": "Propriétaire",
        "kind": "metadata",
        "required": true
      },
      {
        "id": "reviewer",
        "label": "Réviseur",
        "kind": "metadata",
        "required": true
      }
    ],
    "outputProfiles": [
      {
        "id": "acc-7",
        "label": "Création gouvernée",
        "dimensions": "Contextuel",
        "orientation": "document",
        "channel": "Quick Create",
        "safeZone": "Conserve le dossier et le retour"
      }
    ],
    "lockedZones": [
      "Origine",
      "Dossier",
      "Autorité"
    ],
    "variableZones": [
      "Studio",
      "Famille",
      "Canal",
      "Langue"
    ],
    "rules": [
      "Ne jamais créer sans origine",
      "Conserver le contexte",
      "Choisir un studio spécialisé"
    ],
    "evidence": [
      "Objet créé",
      "Lien vers le dossier",
      "Mandat transmis au studio"
    ],
    "accessibility": [
      "Parcours clavier complet",
      "Résumé avant lancement"
    ],
    "allowedAdaptations": [
      "Studio",
      "Famille",
      "Canal",
      "Langue"
    ],
    "prohibitedAdaptations": [
      "Création orpheline",
      "Validation automatique"
    ],
    "owner": "Content Operations",
    "authority": "Content Lead",
    "version": "v1.0",
    "status": "Active",
    "tone": "warning"
  },
  {
    "id": "ac-accelerator-08",
    "code": "AC-TPL-ACC-008",
    "name": "Create an urgent controlled communication",
    "family": "accelerator",
    "category": "Quick Create",
    "purpose": "Communication urgente",
    "businessObjective": "Communication urgente",
    "services": [
      "All"
    ],
    "audiences": [
      "Internal production"
    ],
    "channels": [
      "Contextual"
    ],
    "languages": [
      "fr",
      "ar",
      "en"
    ],
    "cities": [
      "Contextual"
    ],
    "anatomy": [
      "Origine",
      "Objectif",
      "Famille de sortie",
      "Contexte requis",
      "Studio destination"
    ],
    "slots": [
      {
        "id": "origin",
        "label": "Origine",
        "kind": "metadata",
        "required": true
      },
      {
        "id": "objective",
        "label": "Objectif",
        "kind": "body",
        "required": true
      },
      {
        "id": "output",
        "label": "Famille de sortie",
        "kind": "section",
        "required": true
      },
      {
        "id": "owner",
        "label": "Propriétaire",
        "kind": "metadata",
        "required": true
      },
      {
        "id": "reviewer",
        "label": "Réviseur",
        "kind": "metadata",
        "required": true
      }
    ],
    "outputProfiles": [
      {
        "id": "acc-8",
        "label": "Création gouvernée",
        "dimensions": "Contextuel",
        "orientation": "document",
        "channel": "Quick Create",
        "safeZone": "Conserve le dossier et le retour"
      }
    ],
    "lockedZones": [
      "Origine",
      "Dossier",
      "Autorité"
    ],
    "variableZones": [
      "Studio",
      "Famille",
      "Canal",
      "Langue"
    ],
    "rules": [
      "Ne jamais créer sans origine",
      "Conserver le contexte",
      "Choisir un studio spécialisé"
    ],
    "evidence": [
      "Objet créé",
      "Lien vers le dossier",
      "Mandat transmis au studio"
    ],
    "accessibility": [
      "Parcours clavier complet",
      "Résumé avant lancement"
    ],
    "allowedAdaptations": [
      "Studio",
      "Famille",
      "Canal",
      "Langue"
    ],
    "prohibitedAdaptations": [
      "Création orpheline",
      "Validation automatique"
    ],
    "owner": "Content Operations",
    "authority": "Content Lead",
    "version": "v1.0",
    "status": "Active",
    "tone": "warning"
  }
] as TemplateDNA[]

export const BULK4_TEMPLATE_COUNTS = { digital: 20, print: 16, document: 16, accelerator: 8, total: 60 } as const

export function templateById(id?: string | null) { return BULK4_TEMPLATE_ESTATE.find((template) => template.id === id) || null }
export function templatesByFamily(family: TemplateDNA["family"]) { return BULK4_TEMPLATE_ESTATE.filter((template) => template.family === family) }

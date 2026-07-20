import type {
  RevenueBrandRequirement,
  RevenueCampaignPattern,
  RevenueCaseStudy,
  RevenueDoctrine,
  RevenueKnowledgeApproval,
  RevenueKnowledgeAsset,
  RevenueKnowledgeConflict,
  RevenueKnowledgeIndexJob,
  RevenueKnowledgeRelationship,
  RevenueKnowledgeValidationIssue,
  RevenueKnowledgeVersion,
  RevenueObjectionPattern,
  RevenuePartnerBenefit,
  RevenuePlaybook,
  RevenuePolicyRestriction,
  RevenueSalesScript,
  RevenueKnowledgeReadiness,
} from '../types'

export const REVENUE_KNOWLEDGE_SEED_DOCTRINES: RevenueDoctrine[] = [
  {
    "id": "doc-001",
    "code": "REV-DOC-001",
    "title": "Doctrine de vérité commerciale",
    "summary": "Aucune stratégie ne peut utiliser une donnée commerciale non sourcée comme un fait.",
    "knowledgeType": "commercial-doctrine",
    "ownerRole": "Direction Revenue",
    "department": "Revenue Strategy",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "FLASHCARDS",
      "CORPORATES"
    ],
    "status": "effective",
    "confidentiality": "internal",
    "version": "1.0",
    "effectiveFrom": "2026-07-20",
    "nextReviewAt": "2026-10-20",
    "reviewCycleDays": 90,
    "applicableCommandFamilies": [
      "market-sensing",
      "strategy-assembly"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "commercial-doctrine",
      "revenue-strategy",
      "market-sensing",
      "strategy-assembly"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "Aucune stratégie ne peut utiliser une donnée commerciale non sourcée comme un fait.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Doctrine de vérité commerciale » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-DOC-001-R1",
        "name": "La donnée la plus récente et approuvée prévaut.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "La donnée la plus récente et approuvée prévaut.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Direction Revenue",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-DOC-001-R2",
        "name": "Une hypothèse doit être marquée comme hypothèse et associée à une méthode de validation.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Une hypothèse doit être marquée comme hypothèse et associée à une méthode de validation.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Direction Revenue",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-001",
      "KNW-ASSET-002"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-002",
    "code": "REV-DOC-002",
    "title": "Doctrine de revenu responsable",
    "summary": "La maximisation du revenu reste subordonnée à la capacité réelle de livraison, à la qualité et aux engagements autorisés.",
    "knowledgeType": "commercial-doctrine",
    "ownerRole": "Managing Director",
    "department": "Executive Revenue",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "HOSPITALITY",
      "CORPORATES"
    ],
    "status": "effective",
    "confidentiality": "internal",
    "version": "1.0",
    "effectiveFrom": "2026-07-20",
    "nextReviewAt": "2026-10-20",
    "reviewCycleDays": 90,
    "applicableCommandFamilies": [
      "offer-architecture",
      "closing"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "commercial-doctrine",
      "executive-revenue",
      "offer-architecture",
      "closing"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "La maximisation du revenu reste subordonnée à la capacité réelle de livraison, à la qualité et aux engagements autorisés.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Doctrine de revenu responsable » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-DOC-002-R1",
        "name": "Ne jamais vendre une capacité non confirmée.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Ne jamais vendre une capacité non confirmée.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Managing Director",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-DOC-002-R2",
        "name": "Toute promesse exceptionnelle exige une autorité explicite.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Toute promesse exceptionnelle exige une autorité explicite.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Managing Director",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-001",
      "KNW-ASSET-002"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-003",
    "code": "REV-DOC-003",
    "title": "Doctrine de priorité marché",
    "summary": "Prioriser les opportunités par valeur stratégique, probabilité, urgence, capacité et coût du retard.",
    "knowledgeType": "commercial-doctrine",
    "ownerRole": "Chief Revenue Officer",
    "department": "Revenue Strategy",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "FLASHCARDS",
      "KINDERGARTEN",
      "HOSPITALITY",
      "CORPORATES",
      "EVENTS",
      "REFFERQ"
    ],
    "status": "effective",
    "confidentiality": "internal",
    "version": "1.0",
    "effectiveFrom": "2026-07-20",
    "nextReviewAt": "2026-09-20",
    "reviewCycleDays": 60,
    "applicableCommandFamilies": [
      "segmentation",
      "account-prioritization"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "commercial-doctrine",
      "revenue-strategy",
      "segmentation",
      "account-prioritization"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "Prioriser les opportunités par valeur stratégique, probabilité, urgence, capacité et coût du retard.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Doctrine de priorité marché » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-DOC-003-R1",
        "name": "Le score doit rester explicable.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Le score doit rester explicable.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Chief Revenue Officer",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-DOC-003-R2",
        "name": "Une priorité ne peut pas être fondée uniquement sur la valeur faciale.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Une priorité ne peut pas être fondée uniquement sur la valeur faciale.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Chief Revenue Officer",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-001",
      "KNW-ASSET-002"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-004",
    "code": "REV-POL-001",
    "title": "Politique de prix vérifié",
    "summary": "Aucun prix, remise ou avantage financier ne peut être annoncé sans livre de prix actif et niveau d’autorité compatible.",
    "knowledgeType": "pricing-rule",
    "ownerRole": "Direction Administrative & Financière",
    "department": "Finance",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "FLASHCARDS",
      "KINDERGARTEN",
      "HOSPITALITY",
      "CORPORATES",
      "EVENTS",
      "REFFERQ"
    ],
    "status": "effective",
    "confidentiality": "confidential",
    "version": "1.0",
    "effectiveFrom": "2026-07-20",
    "nextReviewAt": "2026-10-20",
    "reviewCycleDays": 90,
    "applicableCommandFamilies": [
      "pricing",
      "proposal"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "pricing-rule",
      "finance",
      "pricing",
      "proposal"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "Aucun prix, remise ou avantage financier ne peut être annoncé sans livre de prix actif et niveau d’autorité compatible.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Politique de prix vérifié » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-POL-001-R1",
        "name": "Le prix public et le prix partenaire doivent être distingués.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Le prix public et le prix partenaire doivent être distingués.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Direction Administrative & Financière",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-POL-001-R2",
        "name": "Les coûts et marges ne sont jamais exposés au prospect.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Les coûts et marges ne sont jamais exposés au prospect.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Direction Administrative & Financière",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-001",
      "KNW-ASSET-002"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-005",
    "code": "REV-POL-002",
    "title": "Politique de remise protégée",
    "summary": "Les remises sont des décisions gouvernées, conditionnelles, horodatées et rattachées à un motif commercial.",
    "knowledgeType": "pricing-rule",
    "ownerRole": "Managing Director",
    "department": "Finance",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "FLASHCARDS",
      "KINDERGARTEN",
      "HOSPITALITY",
      "CORPORATES",
      "EVENTS",
      "REFFERQ"
    ],
    "status": "effective",
    "confidentiality": "confidential",
    "version": "1.1",
    "effectiveFrom": "2026-07-20",
    "nextReviewAt": "2026-10-20",
    "reviewCycleDays": 90,
    "applicableCommandFamilies": [
      "discounting",
      "negotiation"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "pricing-rule",
      "finance",
      "discounting",
      "negotiation"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "Les remises sont des décisions gouvernées, conditionnelles, horodatées et rattachées à un motif commercial.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Politique de remise protégée » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-POL-002-R1",
        "name": "Aucune remise automatique en Phase 3.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Aucune remise automatique en Phase 3.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Managing Director",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-POL-002-R2",
        "name": "Une remise ne peut pas contourner le prix minimum protégé.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Une remise ne peut pas contourner le prix minimum protégé.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Managing Director",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-001",
      "KNW-ASSET-002"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-006",
    "code": "REV-POL-003",
    "title": "Politique de preuve de valeur",
    "summary": "Toute promesse commerciale doit pouvoir être reliée à une preuve approuvée, un cas documenté ou une capacité vérifiable.",
    "knowledgeType": "policy",
    "ownerRole": "Brand & Revenue Governance",
    "department": "Marketing",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "FLASHCARDS",
      "KINDERGARTEN",
      "HOSPITALITY",
      "CORPORATES",
      "EVENTS",
      "REFFERQ"
    ],
    "status": "effective",
    "confidentiality": "internal",
    "version": "1.0",
    "effectiveFrom": "2026-07-20",
    "nextReviewAt": "2026-09-20",
    "reviewCycleDays": 60,
    "applicableCommandFamilies": [
      "messaging",
      "proposal"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "policy",
      "marketing",
      "messaging",
      "proposal"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "Toute promesse commerciale doit pouvoir être reliée à une preuve approuvée, un cas documenté ou une capacité vérifiable.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Politique de preuve de valeur » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-POL-003-R1",
        "name": "Les superlatifs non prouvés sont interdits.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Les superlatifs non prouvés sont interdits.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Brand & Revenue Governance",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-POL-003-R2",
        "name": "Les résultats historiques ne constituent pas une garantie.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Les résultats historiques ne constituent pas une garantie.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Brand & Revenue Governance",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-001",
      "KNW-ASSET-002"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-007",
    "code": "REV-SVC-001",
    "title": "Définition gouvernée des formations Academy",
    "summary": "Cadre officiel des formations professionnelles, de la montée en compétences et des formats de livraison Academy.",
    "knowledgeType": "service-definition",
    "ownerRole": "Academy Director",
    "department": "Academy",
    "businessUnitCodes": [
      "ACADEMY"
    ],
    "status": "effective",
    "confidentiality": "internal",
    "version": "1.0",
    "effectiveFrom": "2026-07-20",
    "nextReviewAt": "2026-10-20",
    "reviewCycleDays": 90,
    "applicableCommandFamilies": [
      "offer-selection",
      "academy-sales"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "service-definition",
      "academy",
      "offer-selection",
      "academy-sales"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "Cadre officiel des formations professionnelles, de la montée en compétences et des formats de livraison Academy.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Définition gouvernée des formations Academy » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-SVC-001-R1",
        "name": "Chaque parcours indique objectifs, public, durée, format et exigences.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Chaque parcours indique objectifs, public, durée, format et exigences.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Academy Director",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-SVC-001-R2",
        "name": "La disponibilité du formateur est un gate de livraison.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "La disponibilité du formateur est un gate de livraison.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Academy Director",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-001",
      "KNW-ASSET-002"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-008",
    "code": "REV-SVC-002",
    "title": "Définition gouvernée Home Service",
    "summary": "Cadre commercial des prestations de garde, accompagnement et animation à domicile selon couverture et disponibilité.",
    "knowledgeType": "service-definition",
    "ownerRole": "Operations Manager",
    "department": "Operations",
    "businessUnitCodes": [
      "HOME_SERVICE"
    ],
    "status": "effective",
    "confidentiality": "internal",
    "version": "1.0",
    "effectiveFrom": "2026-07-20",
    "nextReviewAt": "2026-10-20",
    "reviewCycleDays": 90,
    "applicableCommandFamilies": [
      "home-service-sales",
      "capacity-monetization"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "service-definition",
      "operations",
      "home-service-sales",
      "capacity-monetization"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "Cadre commercial des prestations de garde, accompagnement et animation à domicile selon couverture et disponibilité.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Définition gouvernée Home Service » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-SVC-002-R1",
        "name": "La mission est confirmée après validation opérationnelle.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "La mission est confirmée après validation opérationnelle.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Operations Manager",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-SVC-002-R2",
        "name": "Le niveau de qualification requis dépend du service.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Le niveau de qualification requis dépend du service.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Operations Manager",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-001",
      "KNW-ASSET-002"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-009",
    "code": "REV-SVC-003",
    "title": "Définition gouvernée Flashcards PLV",
    "summary": "Cadre du programme partenaires Flashcards, de la PLV, du catalogue et du réassort.",
    "knowledgeType": "service-definition",
    "ownerRole": "B2B Partnerships Director",
    "department": "B2B Partnerships",
    "businessUnitCodes": [
      "FLASHCARDS"
    ],
    "status": "effective",
    "confidentiality": "internal",
    "version": "1.0",
    "effectiveFrom": "2026-07-20",
    "nextReviewAt": "2026-09-20",
    "reviewCycleDays": 60,
    "applicableCommandFamilies": [
      "partner-activation",
      "retail-partnership"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "service-definition",
      "b2b-partnerships",
      "partner-activation",
      "retail-partnership"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "Cadre du programme partenaires Flashcards, de la PLV, du catalogue et du réassort.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Définition gouvernée Flashcards PLV » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-SVC-003-R1",
        "name": "La disponibilité de la PLV et des collections doit être vérifiée.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "La disponibilité de la PLV et des collections doit être vérifiée.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "B2B Partnerships Director",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-SVC-003-R2",
        "name": "Le partenaire reçoit uniquement les avantages officiellement actifs.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Le partenaire reçoit uniquement les avantages officiellement actifs.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "B2B Partnerships Director",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-001",
      "KNW-ASSET-002"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-010",
    "code": "REV-POS-001",
    "title": "Positionnement Academy pour établissements préscolaires",
    "summary": "Positionner Academy comme un dispositif structuré de montée en compétences, d’outillage et de préparation opérationnelle.",
    "knowledgeType": "market-positioning",
    "ownerRole": "Strategic Marketing Executive",
    "department": "Marketing",
    "businessUnitCodes": [
      "ACADEMY",
      "KINDERGARTEN"
    ],
    "status": "effective",
    "confidentiality": "internal",
    "version": "1.1",
    "effectiveFrom": "2026-07-20",
    "nextReviewAt": "2026-10-20",
    "reviewCycleDays": 90,
    "applicableCommandFamilies": [
      "market-positioning",
      "campaign-design"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "market-positioning",
      "marketing",
      "market-positioning",
      "campaign-design"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "Positionner Academy comme un dispositif structuré de montée en compétences, d’outillage et de préparation opérationnelle.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Positionnement Academy pour établissements préscolaires » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-POS-001-R1",
        "name": "Parler de transformation opérationnelle concrète.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Parler de transformation opérationnelle concrète.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Strategic Marketing Executive",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-POS-001-R2",
        "name": "Éviter les promesses abstraites sans parcours ni preuve.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Éviter les promesses abstraites sans parcours ni preuve.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Strategic Marketing Executive",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-001",
      "KNW-ASSET-002"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-011",
    "code": "REV-POS-002",
    "title": "Positionnement Kids-Friendly Hospitality",
    "summary": "Positionner l’offre comme un renforcement de l’expérience familiale, de la confiance et de la différenciation hôtelière.",
    "knowledgeType": "market-positioning",
    "ownerRole": "Strategic Partnerships Director",
    "department": "Partnerships",
    "businessUnitCodes": [
      "HOSPITALITY"
    ],
    "status": "effective",
    "confidentiality": "internal",
    "version": "1.0",
    "effectiveFrom": "2026-07-20",
    "nextReviewAt": "2026-10-20",
    "reviewCycleDays": 90,
    "applicableCommandFamilies": [
      "hospitality-entry",
      "premium-positioning"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "market-positioning",
      "partnerships",
      "hospitality-entry",
      "premium-positioning"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "Positionner l’offre comme un renforcement de l’expérience familiale, de la confiance et de la différenciation hôtelière.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Positionnement Kids-Friendly Hospitality » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-POS-002-R1",
        "name": "Relier l’offre à l’expérience client et aux standards de service.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Relier l’offre à l’expérience client et aux standards de service.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Strategic Partnerships Director",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-POS-002-R2",
        "name": "Ne jamais présenter un dispositif non validé comme déjà disponible.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Ne jamais présenter un dispositif non validé comme déjà disponible.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Strategic Partnerships Director",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-003"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-012",
    "code": "REV-POS-003",
    "title": "Positionnement Corporate Care",
    "summary": "Positionner les solutions comme un levier d’expérience collaborateur, de continuité et de marque employeur.",
    "knowledgeType": "market-positioning",
    "ownerRole": "Strategic Partnerships Director",
    "department": "Partnerships",
    "businessUnitCodes": [
      "CORPORATES"
    ],
    "status": "effective",
    "confidentiality": "internal",
    "version": "1.0",
    "effectiveFrom": "2026-07-20",
    "nextReviewAt": "2026-09-20",
    "reviewCycleDays": 60,
    "applicableCommandFamilies": [
      "corporate-entry",
      "enterprise-selling"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "market-positioning",
      "partnerships",
      "corporate-entry",
      "enterprise-selling"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "Positionner les solutions comme un levier d’expérience collaborateur, de continuité et de marque employeur.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Positionnement Corporate Care » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-POS-003-R1",
        "name": "Identifier les parties prenantes RH, direction et finance.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Identifier les parties prenantes RH, direction et finance.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Strategic Partnerships Director",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-POS-003-R2",
        "name": "Adapter la preuve aux enjeux de l’entreprise.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Adapter la preuve aux enjeux de l’entreprise.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Strategic Partnerships Director",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-003"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-013",
    "code": "REV-CUS-001",
    "title": "Profil direction de crèche privée",
    "summary": "Profil de décision, douleurs, attentes de preuve et objections d’une direction de crèche ou maternelle privée.",
    "knowledgeType": "customer-profile",
    "ownerRole": "B2B Intelligence Lead",
    "department": "B2B Partnerships",
    "businessUnitCodes": [
      "ACADEMY",
      "FLASHCARDS",
      "KINDERGARTEN"
    ],
    "status": "effective",
    "confidentiality": "internal",
    "version": "1.0",
    "effectiveFrom": "2026-07-20",
    "nextReviewAt": "2026-10-20",
    "reviewCycleDays": 90,
    "applicableCommandFamilies": [
      "account-research",
      "persona-strategy"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "customer-profile",
      "b2b-partnerships",
      "account-research",
      "persona-strategy"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "Profil de décision, douleurs, attentes de preuve et objections d’une direction de crèche ou maternelle privée.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Profil direction de crèche privée » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-CUS-001-R1",
        "name": "La confiance, la rentrée et la compétence d’équipe sont des déclencheurs fréquents.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "La confiance, la rentrée et la compétence d’équipe sont des déclencheurs fréquents.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "B2B Intelligence Lead",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-CUS-001-R2",
        "name": "Le budget et le calendrier doivent être qualifiés, jamais présumés.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Le budget et le calendrier doivent être qualifiés, jamais présumés.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "B2B Intelligence Lead",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-003"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-014",
    "code": "REV-CUS-002",
    "title": "Profil direction de clinique maternité",
    "summary": "Profil des parties prenantes d’une maternité pour offres éducatives, partenaires et expérience familles.",
    "knowledgeType": "customer-profile",
    "ownerRole": "B2B Intelligence Lead",
    "department": "B2B Partnerships",
    "businessUnitCodes": [
      "FLASHCARDS",
      "HOSPITALITY"
    ],
    "status": "effective",
    "confidentiality": "internal",
    "version": "1.0",
    "effectiveFrom": "2026-07-20",
    "nextReviewAt": "2026-10-20",
    "reviewCycleDays": 90,
    "applicableCommandFamilies": [
      "account-research",
      "clinical-partnership"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "customer-profile",
      "b2b-partnerships",
      "account-research",
      "clinical-partnership"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "Profil des parties prenantes d’une maternité pour offres éducatives, partenaires et expérience familles.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Profil direction de clinique maternité » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-CUS-002-R1",
        "name": "Le circuit de validation peut être médical, administratif et achats.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Le circuit de validation peut être médical, administratif et achats.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "B2B Intelligence Lead",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-CUS-002-R2",
        "name": "Les exigences d’hygiène et de marque doivent être vérifiées.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Les exigences d’hygiène et de marque doivent être vérifiées.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "B2B Intelligence Lead",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-003"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-015",
    "code": "REV-CUS-003",
    "title": "Profil décisionnaire corporate RH",
    "summary": "Profil de décideur RH ou avantages collaborateurs pour solutions childcare et Academy.",
    "knowledgeType": "customer-profile",
    "ownerRole": "Corporate Sales Lead",
    "department": "Corporate Sales",
    "businessUnitCodes": [
      "CORPORATES",
      "ACADEMY"
    ],
    "status": "effective",
    "confidentiality": "internal",
    "version": "1.1",
    "effectiveFrom": "2026-07-20",
    "nextReviewAt": "2026-09-20",
    "reviewCycleDays": 60,
    "applicableCommandFamilies": [
      "account-research",
      "enterprise-selling"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "customer-profile",
      "corporate-sales",
      "account-research",
      "enterprise-selling"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "Profil de décideur RH ou avantages collaborateurs pour solutions childcare et Academy.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Profil décisionnaire corporate RH » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-CUS-003-R1",
        "name": "Le business case doit être relié à un problème organisationnel réel.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Le business case doit être relié à un problème organisationnel réel.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Corporate Sales Lead",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-CUS-003-R2",
        "name": "La confidentialité des collaborateurs doit rester protégée.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "La confidentialité des collaborateurs doit rester protégée.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Corporate Sales Lead",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-003"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-016",
    "code": "REV-BEN-001",
    "title": "Cadre des avantages nouveaux partenaires",
    "summary": "Les avantages partenaires sont conditionnels, versionnés, limités dans le temps et ne peuvent être promis hors registre actif.",
    "knowledgeType": "partner-benefit",
    "ownerRole": "Partnerships Director",
    "department": "B2B Partnerships",
    "businessUnitCodes": [
      "ACADEMY",
      "FLASHCARDS",
      "HOSPITALITY"
    ],
    "status": "effective",
    "confidentiality": "internal",
    "version": "1.0",
    "effectiveFrom": "2026-07-20",
    "nextReviewAt": "2026-10-20",
    "reviewCycleDays": 90,
    "applicableCommandFamilies": [
      "partner-offer",
      "scarcity"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "partner-benefit",
      "b2b-partnerships",
      "partner-offer",
      "scarcity"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "Les avantages partenaires sont conditionnels, versionnés, limités dans le temps et ne peuvent être promis hors registre actif.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Cadre des avantages nouveaux partenaires » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-BEN-001-R1",
        "name": "Toujours préciser conditions et validité.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Toujours préciser conditions et validité.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Partnerships Director",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-BEN-001-R2",
        "name": "Ne jamais inventer une surprise ou un avantage non enregistré.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Ne jamais inventer une surprise ou un avantage non enregistré.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Partnerships Director",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-003"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-017",
    "code": "REV-BEN-002",
    "title": "Cadre de priorité de planification",
    "summary": "La priorité de planification dépend de l’accord, du paiement, de la capacité et du calendrier validé.",
    "knowledgeType": "partner-benefit",
    "ownerRole": "Operations Manager",
    "department": "Operations",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE"
    ],
    "status": "effective",
    "confidentiality": "internal",
    "version": "1.0",
    "effectiveFrom": "2026-07-20",
    "nextReviewAt": "2026-10-20",
    "reviewCycleDays": 90,
    "applicableCommandFamilies": [
      "capacity-reservation",
      "closing"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "partner-benefit",
      "operations",
      "capacity-reservation",
      "closing"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "La priorité de planification dépend de l’accord, du paiement, de la capacité et du calendrier validé.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Cadre de priorité de planification » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-BEN-002-R1",
        "name": "Une priorité commerciale ne bloque pas une capacité sans validation.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Une priorité commerciale ne bloque pas une capacité sans validation.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Operations Manager",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-BEN-002-R2",
        "name": "Les créneaux provisoires expirent selon politique.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Les créneaux provisoires expirent selon politique.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Operations Manager",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-003"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-018",
    "code": "REV-BEN-003",
    "title": "Cadre de supports et accès",
    "summary": "Les supports PDF, booklets, kits et accès e-learning sont délivrés selon l’offre contractée et la version approuvée.",
    "knowledgeType": "partner-benefit",
    "ownerRole": "Academy Director",
    "department": "Academy",
    "businessUnitCodes": [
      "ACADEMY"
    ],
    "status": "effective",
    "confidentiality": "internal",
    "version": "1.0",
    "effectiveFrom": "2026-07-20",
    "nextReviewAt": "2026-09-20",
    "reviewCycleDays": 60,
    "applicableCommandFamilies": [
      "academy-offer",
      "delivery-handoff"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "partner-benefit",
      "academy",
      "academy-offer",
      "delivery-handoff"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "Les supports PDF, booklets, kits et accès e-learning sont délivrés selon l’offre contractée et la version approuvée.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Cadre de supports et accès » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-BEN-003-R1",
        "name": "Le contenu inclus doit être listé dans l’offre.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Le contenu inclus doit être listé dans l’offre.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Academy Director",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-BEN-003-R2",
        "name": "Les droits d’accès ont une durée et un périmètre.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Les droits d’accès ont une durée et un périmètre.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Academy Director",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-003"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-019",
    "code": "REV-BRD-001",
    "title": "Standard de marque ANGELCARE",
    "summary": "Toute communication commerciale conserve le logo officiel, la terminologie approuvée et un niveau visuel premium cohérent.",
    "knowledgeType": "brand-standard",
    "ownerRole": "Brand Governance Lead",
    "department": "Marketing",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "FLASHCARDS",
      "KINDERGARTEN",
      "HOSPITALITY",
      "CORPORATES",
      "EVENTS",
      "REFFERQ"
    ],
    "status": "effective",
    "confidentiality": "internal",
    "version": "1.0",
    "effectiveFrom": "2026-07-20",
    "nextReviewAt": "2026-10-20",
    "reviewCycleDays": 90,
    "applicableCommandFamilies": [
      "messaging",
      "campaign-design"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "brand-standard",
      "marketing",
      "messaging",
      "campaign-design"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "Toute communication commerciale conserve le logo officiel, la terminologie approuvée et un niveau visuel premium cohérent.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Standard de marque ANGELCARE » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-BRD-001-R1",
        "name": "Le logo ne doit pas être redessiné ou déformé.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Le logo ne doit pas être redessiné ou déformé.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Brand Governance Lead",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-BRD-001-R2",
        "name": "Les unités commerciales utilisent les descripteurs approuvés.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Les unités commerciales utilisent les descripteurs approuvés.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Brand Governance Lead",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-003"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-020",
    "code": "REV-BRD-002",
    "title": "Standard de message de rareté",
    "summary": "La rareté doit être factuelle, liée à une capacité, une date ou une condition réelle.",
    "knowledgeType": "brand-standard",
    "ownerRole": "Brand Governance Lead",
    "department": "Marketing",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "FLASHCARDS",
      "KINDERGARTEN",
      "HOSPITALITY",
      "CORPORATES",
      "EVENTS",
      "REFFERQ"
    ],
    "status": "effective",
    "confidentiality": "internal",
    "version": "1.1",
    "effectiveFrom": "2026-07-20",
    "nextReviewAt": "2026-10-20",
    "reviewCycleDays": 90,
    "applicableCommandFamilies": [
      "scarcity",
      "outreach"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "brand-standard",
      "marketing",
      "scarcity",
      "outreach"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "La rareté doit être factuelle, liée à une capacité, une date ou une condition réelle.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Standard de message de rareté » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-BRD-002-R1",
        "name": "Interdire la fausse urgence.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Interdire la fausse urgence.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Brand Governance Lead",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-BRD-002-R2",
        "name": "Indiquer une date ou une raison vérifiable quand la rareté est utilisée.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Indiquer une date ou une raison vérifiable quand la rareté est utilisée.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Brand Governance Lead",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-003"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-021",
    "code": "REV-BRD-003",
    "title": "Standard de ton B2B",
    "summary": "Le ton B2B doit être direct, confiant, professionnel et orienté résultat sans agressivité trompeuse.",
    "knowledgeType": "brand-standard",
    "ownerRole": "Brand Governance Lead",
    "department": "Marketing",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "FLASHCARDS",
      "KINDERGARTEN",
      "HOSPITALITY",
      "CORPORATES",
      "EVENTS",
      "REFFERQ"
    ],
    "status": "effective",
    "confidentiality": "internal",
    "version": "1.0",
    "effectiveFrom": "2026-07-20",
    "nextReviewAt": "2026-09-20",
    "reviewCycleDays": 60,
    "applicableCommandFamilies": [
      "outreach",
      "meeting-generation"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "brand-standard",
      "marketing",
      "outreach",
      "meeting-generation"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "Le ton B2B doit être direct, confiant, professionnel et orienté résultat sans agressivité trompeuse.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Standard de ton B2B » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-BRD-003-R1",
        "name": "Le CTA doit être clair.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Le CTA doit être clair.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Brand Governance Lead",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-BRD-003-R2",
        "name": "Éviter la culpabilisation abusive ou les garanties.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Éviter la culpabilisation abusive ou les garanties.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Brand Governance Lead",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-003"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-022",
    "code": "REV-LEG-001",
    "title": "Restriction données enfants et familles",
    "summary": "Les données personnelles d’enfants et familles ne sont jamais utilisées pour la prospection ou la stratégie sans base et autorisation appropriées.",
    "knowledgeType": "legal-restriction",
    "ownerRole": "Data Protection Owner",
    "department": "Compliance",
    "businessUnitCodes": [
      "HOME_SERVICE",
      "KINDERGARTEN",
      "EVENTS"
    ],
    "status": "effective",
    "confidentiality": "confidential",
    "version": "1.0",
    "effectiveFrom": "2026-07-20",
    "nextReviewAt": "2026-10-20",
    "reviewCycleDays": 90,
    "applicableCommandFamilies": [
      "data-access",
      "personalization"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "legal-restriction",
      "compliance",
      "data-access",
      "personalization"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "Les données personnelles d’enfants et familles ne sont jamais utilisées pour la prospection ou la stratégie sans base et autorisation appropriées.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Restriction données enfants et familles » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-LEG-001-R1",
        "name": "Minimiser les données.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Minimiser les données.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Data Protection Owner",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-LEG-001-R2",
        "name": "Utiliser des identifiants internes lorsque possible.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Utiliser des identifiants internes lorsque possible.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Data Protection Owner",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-003"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-023",
    "code": "REV-LEG-002",
    "title": "Restriction engagement contractuel",
    "summary": "Aucun agent ou système ne signe, accepte ou modifie un engagement contractuel sans autorité désignée.",
    "knowledgeType": "legal-restriction",
    "ownerRole": "Managing Director",
    "department": "Legal",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "FLASHCARDS",
      "KINDERGARTEN",
      "HOSPITALITY",
      "CORPORATES",
      "EVENTS",
      "REFFERQ"
    ],
    "status": "effective",
    "confidentiality": "confidential",
    "version": "1.0",
    "effectiveFrom": "2026-07-20",
    "nextReviewAt": "2026-10-20",
    "reviewCycleDays": 90,
    "applicableCommandFamilies": [
      "proposal",
      "closing"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "legal-restriction",
      "legal",
      "proposal",
      "closing"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "Aucun agent ou système ne signe, accepte ou modifie un engagement contractuel sans autorité désignée.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Restriction engagement contractuel » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-LEG-002-R1",
        "name": "Les brouillons sont clairement marqués.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Les brouillons sont clairement marqués.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Managing Director",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-LEG-002-R2",
        "name": "La signature reste humaine et autorisée.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "La signature reste humaine et autorisée.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Managing Director",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-003"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-024",
    "code": "REV-LEG-003",
    "title": "Restriction communication externe automatisée",
    "summary": "Toute communication externe automatisée reste désactivée tant que le mode d’exécution n’est pas explicitement autorisé.",
    "knowledgeType": "legal-restriction",
    "ownerRole": "Managing Director",
    "department": "Governance",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "FLASHCARDS",
      "KINDERGARTEN",
      "HOSPITALITY",
      "CORPORATES",
      "EVENTS",
      "REFFERQ"
    ],
    "status": "effective",
    "confidentiality": "confidential",
    "version": "1.0",
    "effectiveFrom": "2026-07-20",
    "nextReviewAt": "2026-09-20",
    "reviewCycleDays": 60,
    "applicableCommandFamilies": [
      "outreach",
      "automation"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "legal-restriction",
      "governance",
      "outreach",
      "automation"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "Toute communication externe automatisée reste désactivée tant que le mode d’exécution n’est pas explicitement autorisé.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Restriction communication externe automatisée » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-LEG-003-R1",
        "name": "Phase 3 reste Shadow.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Phase 3 reste Shadow.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Managing Director",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-LEG-003-R2",
        "name": "Une action externe nécessite le contrôle défini par la politique.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Une action externe nécessite le contrôle défini par la politique.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Managing Director",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-003"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-025",
    "code": "REV-SOP-001",
    "title": "SOP qualification d’un partenaire Academy",
    "summary": "Processus de qualification d’un établissement, du contexte initial jusqu’au prochain résultat commercial vérifiable.",
    "knowledgeType": "sop",
    "ownerRole": "B2B Sales Manager",
    "department": "B2B Partnerships",
    "businessUnitCodes": [
      "ACADEMY"
    ],
    "status": "effective",
    "confidentiality": "internal",
    "version": "1.1",
    "effectiveFrom": "2026-07-20",
    "nextReviewAt": "2026-10-20",
    "reviewCycleDays": 90,
    "applicableCommandFamilies": [
      "qualification",
      "meeting-generation"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "sop",
      "b2b-partnerships",
      "qualification",
      "meeting-generation"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "Processus de qualification d’un établissement, du contexte initial jusqu’au prochain résultat commercial vérifiable.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « SOP qualification d’un partenaire Academy » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-SOP-001-R1",
        "name": "Identifier le décideur et la prochaine action.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Identifier le décideur et la prochaine action.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "B2B Sales Manager",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-SOP-001-R2",
        "name": "Ne jamais clôturer sans motif et preuve.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Ne jamais clôturer sans motif et preuve.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "B2B Sales Manager",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-003"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-026",
    "code": "REV-SOP-002",
    "title": "SOP suivi après catalogue",
    "summary": "Processus de relance après envoi d’un catalogue selon intérêt, lecture, timing et potentiel.",
    "knowledgeType": "sop",
    "ownerRole": "B2B Sales Manager",
    "department": "B2B Partnerships",
    "businessUnitCodes": [
      "ACADEMY",
      "FLASHCARDS"
    ],
    "status": "effective",
    "confidentiality": "internal",
    "version": "1.0",
    "effectiveFrom": "2026-07-20",
    "nextReviewAt": "2026-10-20",
    "reviewCycleDays": 90,
    "applicableCommandFamilies": [
      "follow-up",
      "pipeline-acceleration"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "sop",
      "b2b-partnerships",
      "follow-up",
      "pipeline-acceleration"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "Processus de relance après envoi d’un catalogue selon intérêt, lecture, timing et potentiel.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « SOP suivi après catalogue » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-SOP-002-R1",
        "name": "Le suivi doit avoir un objectif unique.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Le suivi doit avoir un objectif unique.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "B2B Sales Manager",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-SOP-002-R2",
        "name": "Adapter le canal au signal disponible.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Adapter le canal au signal disponible.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "B2B Sales Manager",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-003"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-027",
    "code": "REV-SOP-003",
    "title": "SOP récupération d’opportunité bloquée",
    "summary": "Processus de diagnostic, nouvelle hypothèse, intervention et stop condition pour une opportunité stagnante.",
    "knowledgeType": "sop",
    "ownerRole": "Revenue Operations Lead",
    "department": "Revenue Operations",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "FLASHCARDS",
      "KINDERGARTEN",
      "HOSPITALITY",
      "CORPORATES",
      "EVENTS",
      "REFFERQ"
    ],
    "status": "effective",
    "confidentiality": "internal",
    "version": "1.0",
    "effectiveFrom": "2026-07-20",
    "nextReviewAt": "2026-09-20",
    "reviewCycleDays": 60,
    "applicableCommandFamilies": [
      "pipeline-rescue",
      "executive-intervention"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "sop",
      "revenue-operations",
      "pipeline-rescue",
      "executive-intervention"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "Processus de diagnostic, nouvelle hypothèse, intervention et stop condition pour une opportunité stagnante.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « SOP récupération d’opportunité bloquée » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-SOP-003-R1",
        "name": "Diagnostiquer avant de relancer.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Diagnostiquer avant de relancer.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Revenue Operations Lead",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-SOP-003-R2",
        "name": "Escalader seulement avec un enjeu et une action recommandée.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Escalader seulement avec un enjeu et une action recommandée.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Revenue Operations Lead",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-003"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-028",
    "code": "REV-PLAY-001",
    "title": "Playbook capture pré-rentrée Academy",
    "summary": "Orchestration des comptes prioritaires, de l’offre et des séquences avant une fenêtre de rentrée.",
    "knowledgeType": "playbook",
    "ownerRole": "Chief Revenue Officer",
    "department": "Revenue Strategy",
    "businessUnitCodes": [
      "ACADEMY"
    ],
    "status": "effective",
    "confidentiality": "internal",
    "version": "1.0",
    "effectiveFrom": "2026-07-20",
    "nextReviewAt": "2026-10-20",
    "reviewCycleDays": 90,
    "applicableCommandFamilies": [
      "seasonal-activation",
      "territory-capture"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "playbook",
      "revenue-strategy",
      "seasonal-activation",
      "territory-capture"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "Orchestration des comptes prioritaires, de l’offre et des séquences avant une fenêtre de rentrée.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Playbook capture pré-rentrée Academy » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-PLAY-001-R1",
        "name": "Vérifier capacité, calendrier et offre avant lancement.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Vérifier capacité, calendrier et offre avant lancement.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Chief Revenue Officer",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-PLAY-001-R2",
        "name": "Mesurer rendez-vous, qualification et conversion.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Mesurer rendez-vous, qualification et conversion.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Chief Revenue Officer",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-003"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-029",
    "code": "REV-PLAY-002",
    "title": "Playbook activation Flashcards PLV",
    "summary": "Activation d’un partenaire de point de vente avec démonstration, catalogue, conditions et réassort.",
    "knowledgeType": "playbook",
    "ownerRole": "B2B Partnerships Director",
    "department": "B2B Partnerships",
    "businessUnitCodes": [
      "FLASHCARDS"
    ],
    "status": "effective",
    "confidentiality": "internal",
    "version": "1.0",
    "effectiveFrom": "2026-07-20",
    "nextReviewAt": "2026-10-20",
    "reviewCycleDays": 90,
    "applicableCommandFamilies": [
      "partner-activation",
      "retail-partnership"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "playbook",
      "b2b-partnerships",
      "partner-activation",
      "retail-partnership"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "Activation d’un partenaire de point de vente avec démonstration, catalogue, conditions et réassort.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Playbook activation Flashcards PLV » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-PLAY-002-R1",
        "name": "Qualifier l’espace, le public et la responsabilité du stock.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Qualifier l’espace, le public et la responsabilité du stock.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "B2B Partnerships Director",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-PLAY-002-R2",
        "name": "Confirmer les outils réellement fournis.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Confirmer les outils réellement fournis.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "B2B Partnerships Director",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-003"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-030",
    "code": "REV-PLAY-003",
    "title": "Playbook réunion diagnostic B2B",
    "summary": "Cadre de réunion orienté problème, décision, faisabilité, prochaine étape et preuve.",
    "knowledgeType": "playbook",
    "ownerRole": "B2B Sales Manager",
    "department": "Sales",
    "businessUnitCodes": [
      "ACADEMY",
      "CORPORATES",
      "HOSPITALITY"
    ],
    "status": "effective",
    "confidentiality": "internal",
    "version": "1.1",
    "effectiveFrom": "2026-07-20",
    "nextReviewAt": "2026-09-20",
    "reviewCycleDays": 60,
    "applicableCommandFamilies": [
      "meeting",
      "diagnostic"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "playbook",
      "sales",
      "meeting",
      "diagnostic"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "Cadre de réunion orienté problème, décision, faisabilité, prochaine étape et preuve.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Playbook réunion diagnostic B2B » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-PLAY-003-R1",
        "name": "Préparer les hypothèses sans les présenter comme faits.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Préparer les hypothèses sans les présenter comme faits.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "B2B Sales Manager",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-PLAY-003-R2",
        "name": "Obtenir une prochaine action datée.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Obtenir une prochaine action datée.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "B2B Sales Manager",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-003"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-031",
    "code": "REV-SCR-001",
    "title": "Doctrine de script WhatsApp B2B",
    "summary": "Les scripts WhatsApp doivent être courts, contextualisés, orientés rendez-vous et compatibles avec les politiques de consentement.",
    "knowledgeType": "sales-script",
    "ownerRole": "Revenue Communications Lead",
    "department": "Sales",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "FLASHCARDS",
      "KINDERGARTEN",
      "HOSPITALITY",
      "CORPORATES",
      "EVENTS",
      "REFFERQ"
    ],
    "status": "effective",
    "confidentiality": "internal",
    "version": "1.0",
    "effectiveFrom": "2026-07-20",
    "nextReviewAt": "2026-10-20",
    "reviewCycleDays": 90,
    "applicableCommandFamilies": [
      "whatsapp",
      "outreach"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "sales-script",
      "sales",
      "whatsapp",
      "outreach"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "Les scripts WhatsApp doivent être courts, contextualisés, orientés rendez-vous et compatibles avec les politiques de consentement.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Doctrine de script WhatsApp B2B » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-SCR-001-R1",
        "name": "Personnaliser l’organisation et le bénéfice.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Personnaliser l’organisation et le bénéfice.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Revenue Communications Lead",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-SCR-001-R2",
        "name": "Limiter le message à une action demandée.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Limiter le message à une action demandée.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Revenue Communications Lead",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-003"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-032",
    "code": "REV-SCR-002",
    "title": "Doctrine de script téléphonique",
    "summary": "Les appels suivent une ouverture claire, une permission, une qualification et une prochaine étape.",
    "knowledgeType": "sales-script",
    "ownerRole": "B2B Sales Manager",
    "department": "Sales",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "FLASHCARDS",
      "KINDERGARTEN",
      "HOSPITALITY",
      "CORPORATES",
      "EVENTS",
      "REFFERQ"
    ],
    "status": "effective",
    "confidentiality": "internal",
    "version": "1.0",
    "effectiveFrom": "2026-07-20",
    "nextReviewAt": "2026-10-20",
    "reviewCycleDays": 90,
    "applicableCommandFamilies": [
      "phone",
      "qualification"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "sales-script",
      "sales",
      "phone",
      "qualification"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "Les appels suivent une ouverture claire, une permission, une qualification et une prochaine étape.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Doctrine de script téléphonique » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-SCR-002-R1",
        "name": "Confirmer le rôle du contact.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Confirmer le rôle du contact.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "B2B Sales Manager",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-SCR-002-R2",
        "name": "Documenter objections et timing.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Documenter objections et timing.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "B2B Sales Manager",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-003"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-033",
    "code": "REV-SCR-003",
    "title": "Doctrine de proposition commerciale",
    "summary": "La proposition relie problème, résultat, périmètre, prix validé, conditions et décision attendue.",
    "knowledgeType": "sales-script",
    "ownerRole": "Commercial Director",
    "department": "Sales",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "FLASHCARDS",
      "KINDERGARTEN",
      "HOSPITALITY",
      "CORPORATES",
      "EVENTS",
      "REFFERQ"
    ],
    "status": "approved",
    "confidentiality": "internal",
    "version": "1.0",
    "effectiveFrom": "2026-07-20",
    "nextReviewAt": "2026-09-20",
    "reviewCycleDays": 60,
    "applicableCommandFamilies": [
      "proposal",
      "closing"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "sales-script",
      "sales",
      "proposal",
      "closing"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "La proposition relie problème, résultat, périmètre, prix validé, conditions et décision attendue.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Doctrine de proposition commerciale » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-SCR-003-R1",
        "name": "Séparer inclus, options et exclusions.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Séparer inclus, options et exclusions.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Commercial Director",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-SCR-003-R2",
        "name": "Toute exception doit être approuvée.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Toute exception doit être approuvée.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Commercial Director",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-003"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-034",
    "code": "REV-OBJ-001",
    "title": "Doctrine de diagnostic des objections",
    "summary": "Une objection est diagnostiquée avant d’être traitée; elle peut masquer budget, autorité, timing, risque ou besoin.",
    "knowledgeType": "objection-logic",
    "ownerRole": "Sales Enablement Lead",
    "department": "Sales",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "FLASHCARDS",
      "KINDERGARTEN",
      "HOSPITALITY",
      "CORPORATES",
      "EVENTS",
      "REFFERQ"
    ],
    "status": "approved",
    "confidentiality": "internal",
    "version": "1.0",
    "effectiveFrom": "2026-07-20",
    "nextReviewAt": "2026-10-20",
    "reviewCycleDays": 90,
    "applicableCommandFamilies": [
      "objection-handling",
      "negotiation"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "objection-logic",
      "sales",
      "objection-handling",
      "negotiation"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "Une objection est diagnostiquée avant d’être traitée; elle peut masquer budget, autorité, timing, risque ou besoin.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Doctrine de diagnostic des objections » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-OBJ-001-R1",
        "name": "Poser une question de clarification.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Poser une question de clarification.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Sales Enablement Lead",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-OBJ-001-R2",
        "name": "Ne pas répondre par une remise réflexe.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Ne pas répondre par une remise réflexe.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Sales Enablement Lead",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-003"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-035",
    "code": "REV-OBJ-002",
    "title": "Doctrine objection prix",
    "summary": "Traiter le prix par valeur, périmètre, comparaison et options autorisées sans dégrader la marge automatiquement.",
    "knowledgeType": "objection-logic",
    "ownerRole": "Commercial Director",
    "department": "Sales",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "FLASHCARDS",
      "KINDERGARTEN",
      "HOSPITALITY",
      "CORPORATES",
      "EVENTS",
      "REFFERQ"
    ],
    "status": "approved",
    "confidentiality": "internal",
    "version": "1.1",
    "effectiveFrom": "2026-07-20",
    "nextReviewAt": "2026-10-20",
    "reviewCycleDays": 90,
    "applicableCommandFamilies": [
      "price-objection",
      "negotiation"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "objection-logic",
      "sales",
      "price-objection",
      "negotiation"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "Traiter le prix par valeur, périmètre, comparaison et options autorisées sans dégrader la marge automatiquement.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Doctrine objection prix » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-OBJ-002-R1",
        "name": "Vérifier le budget et la référence de comparaison.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Vérifier le budget et la référence de comparaison.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Commercial Director",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-OBJ-002-R2",
        "name": "Toute concession a une contrepartie.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Toute concession a une contrepartie.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Commercial Director",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-003"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-036",
    "code": "REV-OBJ-003",
    "title": "Doctrine objection timing",
    "summary": "Transformer le report en plan daté, prérequis et coût du retard factuel.",
    "knowledgeType": "objection-logic",
    "ownerRole": "Revenue Operations Lead",
    "department": "Sales",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "FLASHCARDS",
      "KINDERGARTEN",
      "HOSPITALITY",
      "CORPORATES",
      "EVENTS",
      "REFFERQ"
    ],
    "status": "approved",
    "confidentiality": "internal",
    "version": "1.0",
    "effectiveFrom": "2026-07-20",
    "nextReviewAt": "2026-09-20",
    "reviewCycleDays": 60,
    "applicableCommandFamilies": [
      "timing-objection",
      "pipeline-rescue"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "objection-logic",
      "sales",
      "timing-objection",
      "pipeline-rescue"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "Transformer le report en plan daté, prérequis et coût du retard factuel.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Doctrine objection timing » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-OBJ-003-R1",
        "name": "Éviter la fausse urgence.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Éviter la fausse urgence.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Revenue Operations Lead",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-OBJ-003-R2",
        "name": "Créer une prochaine action vérifiable.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Créer une prochaine action vérifiable.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Revenue Operations Lead",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-003"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-037",
    "code": "REV-CASE-001",
    "title": "Doctrine des cas de succès",
    "summary": "Un cas de succès n’est réutilisable que si contexte, actions, résultat et preuve sont documentés.",
    "knowledgeType": "case-study",
    "ownerRole": "Revenue Analytics Lead",
    "department": "Revenue Intelligence",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "FLASHCARDS",
      "KINDERGARTEN",
      "HOSPITALITY",
      "CORPORATES",
      "EVENTS",
      "REFFERQ"
    ],
    "status": "approved",
    "confidentiality": "internal",
    "version": "1.0",
    "effectiveFrom": "2026-07-20",
    "nextReviewAt": "2026-10-20",
    "reviewCycleDays": 90,
    "applicableCommandFamilies": [
      "case-retrieval",
      "proposal"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "case-study",
      "revenue-intelligence",
      "case-retrieval",
      "proposal"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "Un cas de succès n’est réutilisable que si contexte, actions, résultat et preuve sont documentés.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Doctrine des cas de succès » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-CASE-001-R1",
        "name": "Anonymiser les données sensibles.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Anonymiser les données sensibles.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Revenue Analytics Lead",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-CASE-001-R2",
        "name": "Ne pas généraliser un résultat unique.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Ne pas généraliser un résultat unique.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Revenue Analytics Lead",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-003"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-038",
    "code": "REV-CASE-002",
    "title": "Doctrine des cas d’échec",
    "summary": "Les échecs sont conservés pour empêcher la répétition des hypothèses, séquences ou engagements faibles.",
    "knowledgeType": "case-study",
    "ownerRole": "Revenue Analytics Lead",
    "department": "Revenue Intelligence",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "FLASHCARDS",
      "KINDERGARTEN",
      "HOSPITALITY",
      "CORPORATES",
      "EVENTS",
      "REFFERQ"
    ],
    "status": "approved",
    "confidentiality": "internal",
    "version": "1.0",
    "effectiveFrom": "2026-07-20",
    "nextReviewAt": "2026-10-20",
    "reviewCycleDays": 90,
    "applicableCommandFamilies": [
      "learning",
      "strategy-validation"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "case-study",
      "revenue-intelligence",
      "learning",
      "strategy-validation"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "Les échecs sont conservés pour empêcher la répétition des hypothèses, séquences ou engagements faibles.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Doctrine des cas d’échec » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-CASE-002-R1",
        "name": "Décrire la cause probable et les limites de certitude.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Décrire la cause probable et les limites de certitude.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Revenue Analytics Lead",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-CASE-002-R2",
        "name": "Associer une action corrective testable.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Associer une action corrective testable.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Revenue Analytics Lead",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-003"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-039",
    "code": "REV-CASE-003",
    "title": "Doctrine des cas de récupération",
    "summary": "Une récupération documente le signal, l’intervention, la nouvelle hypothèse et l’issue.",
    "knowledgeType": "case-study",
    "ownerRole": "Revenue Operations Lead",
    "department": "Revenue Operations",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "FLASHCARDS",
      "KINDERGARTEN",
      "HOSPITALITY",
      "CORPORATES",
      "EVENTS",
      "REFFERQ"
    ],
    "status": "approved",
    "confidentiality": "internal",
    "version": "1.0",
    "effectiveFrom": "2026-07-20",
    "nextReviewAt": "2026-09-20",
    "reviewCycleDays": 60,
    "applicableCommandFamilies": [
      "pipeline-rescue",
      "learning"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "case-study",
      "revenue-operations",
      "pipeline-rescue",
      "learning"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "Une récupération documente le signal, l’intervention, la nouvelle hypothèse et l’issue.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Doctrine des cas de récupération » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-CASE-003-R1",
        "name": "Distinguer corrélation et causalité.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Distinguer corrélation et causalité.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Revenue Operations Lead",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-CASE-003-R2",
        "name": "Mesurer le délai de récupération.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Mesurer le délai de récupération.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Revenue Operations Lead",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-003"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-040",
    "code": "REV-CAM-001",
    "title": "Pattern campagne saisonnière",
    "summary": "Toute campagne saisonnière dispose d’une fenêtre, d’un lead time, d’une offre prête, d’une capacité et de stop conditions.",
    "knowledgeType": "campaign-pattern",
    "ownerRole": "Growth Strategy Lead",
    "department": "Marketing",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "FLASHCARDS",
      "KINDERGARTEN",
      "HOSPITALITY",
      "CORPORATES",
      "EVENTS",
      "REFFERQ"
    ],
    "status": "approved",
    "confidentiality": "internal",
    "version": "1.1",
    "effectiveFrom": "2026-07-20",
    "nextReviewAt": "2026-10-20",
    "reviewCycleDays": 90,
    "applicableCommandFamilies": [
      "seasonal-campaign",
      "campaign-design"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "campaign-pattern",
      "marketing",
      "seasonal-campaign",
      "campaign-design"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "Toute campagne saisonnière dispose d’une fenêtre, d’un lead time, d’une offre prête, d’une capacité et de stop conditions.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Pattern campagne saisonnière » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-CAM-001-R1",
        "name": "La date doit être réelle.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "La date doit être réelle.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Growth Strategy Lead",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-CAM-001-R2",
        "name": "La capacité doit être réservée ou confirmable.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "La capacité doit être réservée ou confirmable.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Growth Strategy Lead",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-003"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-041",
    "code": "REV-CAM-002",
    "title": "Pattern capture territoriale",
    "summary": "La capture territoriale combine densité de comptes, couverture, équipe, preuve locale et vitesse de suivi.",
    "knowledgeType": "campaign-pattern",
    "ownerRole": "Growth Strategy Lead",
    "department": "Revenue Strategy",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "FLASHCARDS",
      "KINDERGARTEN",
      "HOSPITALITY",
      "CORPORATES",
      "EVENTS",
      "REFFERQ"
    ],
    "status": "in-review",
    "confidentiality": "internal",
    "version": "1.0",
    "nextReviewAt": "2026-10-20",
    "reviewCycleDays": 90,
    "applicableCommandFamilies": [
      "territory-capture",
      "market-entry"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "campaign-pattern",
      "revenue-strategy",
      "territory-capture",
      "market-entry"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "La capture territoriale combine densité de comptes, couverture, équipe, preuve locale et vitesse de suivi.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Pattern capture territoriale » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-CAM-002-R1",
        "name": "Ne pas ouvrir une zone sans capacité.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Ne pas ouvrir une zone sans capacité.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Growth Strategy Lead",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-CAM-002-R2",
        "name": "Mesurer la pénétration par segment.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Mesurer la pénétration par segment.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Growth Strategy Lead",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-003"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-042",
    "code": "REV-CAM-003",
    "title": "Pattern campagne de réactivation",
    "summary": "La réactivation utilise l’historique, la raison de stagnation et une nouvelle valeur plutôt qu’une simple répétition.",
    "knowledgeType": "campaign-pattern",
    "ownerRole": "Revenue Operations Lead",
    "department": "Revenue Operations",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "FLASHCARDS",
      "KINDERGARTEN",
      "HOSPITALITY",
      "CORPORATES",
      "EVENTS",
      "REFFERQ"
    ],
    "status": "in-review",
    "confidentiality": "internal",
    "version": "1.0",
    "nextReviewAt": "2026-09-20",
    "reviewCycleDays": 60,
    "applicableCommandFamilies": [
      "reactivation",
      "pipeline-rescue"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "campaign-pattern",
      "revenue-operations",
      "reactivation",
      "pipeline-rescue"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "La réactivation utilise l’historique, la raison de stagnation et une nouvelle valeur plutôt qu’une simple répétition.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Pattern campagne de réactivation » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-CAM-003-R1",
        "name": "Exclure les comptes retirés ou refus explicite.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Exclure les comptes retirés ou refus explicite.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Revenue Operations Lead",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-CAM-003-R2",
        "name": "Proposer une prochaine étape adaptée.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Proposer une prochaine étape adaptée.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Revenue Operations Lead",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-003"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-043",
    "code": "REV-OFF-001",
    "title": "Doctrine des preuves d’offre",
    "summary": "Chaque offre doit disposer d’un ensemble de preuves vérifiées: catalogue, périmètre, capacité, références et conditions.",
    "knowledgeType": "offer-evidence",
    "ownerRole": "Offer Governance Lead",
    "department": "Revenue Operations",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "FLASHCARDS",
      "KINDERGARTEN",
      "HOSPITALITY",
      "CORPORATES",
      "EVENTS",
      "REFFERQ"
    ],
    "status": "in-review",
    "confidentiality": "internal",
    "version": "1.0",
    "nextReviewAt": "2026-10-20",
    "reviewCycleDays": 90,
    "applicableCommandFamilies": [
      "offer-selection",
      "proposal"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "offer-evidence",
      "revenue-operations",
      "offer-selection",
      "proposal"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "Chaque offre doit disposer d’un ensemble de preuves vérifiées: catalogue, périmètre, capacité, références et conditions.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Doctrine des preuves d’offre » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-OFF-001-R1",
        "name": "Une ressource expirée ne peut pas être utilisée.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Une ressource expirée ne peut pas être utilisée.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Offer Governance Lead",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-OFF-001-R2",
        "name": "La preuve doit correspondre à l’offre et au marché.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "La preuve doit correspondre à l’offre et au marché.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Offer Governance Lead",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-003"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-044",
    "code": "REV-OFF-002",
    "title": "Doctrine de cohérence catalogue-offre",
    "summary": "Le catalogue envoyé doit correspondre à l’offre active et à la version de prix applicable.",
    "knowledgeType": "offer-evidence",
    "ownerRole": "Academy Director",
    "department": "Academy",
    "businessUnitCodes": [
      "ACADEMY",
      "FLASHCARDS"
    ],
    "status": "in-review",
    "confidentiality": "internal",
    "version": "1.0",
    "nextReviewAt": "2026-10-20",
    "reviewCycleDays": 90,
    "applicableCommandFamilies": [
      "catalogue-delivery",
      "proposal"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "offer-evidence",
      "academy",
      "catalogue-delivery",
      "proposal"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "Le catalogue envoyé doit correspondre à l’offre active et à la version de prix applicable.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Doctrine de cohérence catalogue-offre » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-OFF-002-R1",
        "name": "Versionner les catalogues.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Versionner les catalogues.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Academy Director",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-OFF-002-R2",
        "name": "Retirer les anciennes versions des séquences.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Retirer les anciennes versions des séquences.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Academy Director",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-003"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "doc-045",
    "code": "REV-OFF-003",
    "title": "Doctrine de disponibilité des supports",
    "summary": "Les supports, kits, PDF et accès ne sont annoncés que s’ils sont inclus, disponibles et gouvernés.",
    "knowledgeType": "offer-evidence",
    "ownerRole": "Academy Operations Lead",
    "department": "Academy",
    "businessUnitCodes": [
      "ACADEMY"
    ],
    "status": "in-review",
    "confidentiality": "internal",
    "version": "1.1",
    "nextReviewAt": "2026-09-20",
    "reviewCycleDays": 60,
    "applicableCommandFamilies": [
      "delivery-readiness",
      "closing"
    ],
    "applicableSegmentCodes": [],
    "applicableOfferCodes": [],
    "tags": [
      "offer-evidence",
      "academy",
      "delivery-readiness",
      "closing"
    ],
    "sourceAuthority": "Canonical Revenue Command OS Contract + validated AngelCare operational doctrine",
    "contentBlocks": [
      {
        "code": "purpose",
        "heading": "Intention stratégique",
        "body": "Les supports, kits, PDF et accès ne sont annoncés que s’ils sont inclus, disponibles et gouvernés.",
        "order": 1,
        "blockType": "principle"
      },
      {
        "code": "application",
        "heading": "Application opérationnelle",
        "body": "Cette doctrine s’applique dès qu’une décision ou une action liée à « Doctrine de disponibilité des supports » est préparée, évaluée ou exécutée dans Revenue Command OS.",
        "order": 2,
        "blockType": "procedure"
      },
      {
        "code": "control",
        "heading": "Contrôle obligatoire",
        "body": "La source, la version, le statut, l’autorité et le périmètre doivent être vérifiés avant utilisation par une commande intelligente ou une mission compilée.",
        "order": 3,
        "blockType": "warning"
      }
    ],
    "rules": [
      {
        "code": "REV-OFF-003-R1",
        "name": "Identifier les supports optionnels.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Identifier les supports optionnels.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Academy Operations Lead",
        "severity": "high",
        "machineEnforceable": true
      },
      {
        "code": "REV-OFF-003-R2",
        "name": "Confirmer les droits et durées d’accès.",
        "condition": "Whenever this doctrine is applicable",
        "requiredAction": "Confirmer les droits et durées d’accès.",
        "prohibitedAction": "Ignore the approved doctrine or use an unsupported assumption",
        "escalationRole": "Academy Operations Lead",
        "severity": "medium",
        "machineEnforceable": true
      }
    ],
    "evidenceRefs": [
      "KNW-ASSET-003"
    ],
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  }
]

export const REVENUE_KNOWLEDGE_SEED_ASSETS: RevenueKnowledgeAsset[] = [
  {
    "id": "asset-001",
    "code": "KNW-ASSET-001",
    "title": "Contrat canonique Revenue Command OS",
    "assetType": "policy-pack",
    "description": "Ressource gouvernée utilisée comme source de vérité pour contrat canonique revenue command os.",
    "ownerRole": "Revenue Knowledge Owner",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "FLASHCARDS",
      "HOSPITALITY",
      "CORPORATES"
    ],
    "confidentiality": "restricted",
    "status": "effective",
    "version": "AC-REVENUE-OS-CANONICAL-2026.07",
    "effectiveFrom": "2026-07-20",
    "mimeType": "application/pdf",
    "checksum": "a537745bc1c8fe377de9db4515a4a44354547aa1658712264ea4b8cd3b1e9594",
    "language": "fr",
    "tags": [
      "policy-pack",
      "revenue-os",
      "governed"
    ],
    "linkedDoctrineCodes": [
      "REV-DOC-001"
    ],
    "indexStatus": "indexed",
    "chunkCount": 13,
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "asset-002",
    "code": "KNW-ASSET-002",
    "title": "Jumeau commercial AngelCare — modèle approuvé",
    "assetType": "dataset",
    "description": "Ressource gouvernée utilisée comme source de vérité pour jumeau commercial angelcare — modèle approuvé.",
    "ownerRole": "Revenue Knowledge Owner",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "FLASHCARDS",
      "KINDERGARTEN",
      "HOSPITALITY",
      "CORPORATES",
      "EVENTS",
      "REFFERQ"
    ],
    "confidentiality": "confidential",
    "status": "effective",
    "version": "AC-REVENUE-TWIN-2026.07-V1",
    "effectiveFrom": "2026-07-20",
    "mimeType": "application/json",
    "checksum": "75b1fe615b038e84ae4ff98383d8d05b68d4a4e7d4f0585f80ce42d492f1b0f4",
    "language": "fr",
    "tags": [
      "dataset",
      "revenue-os",
      "governed"
    ],
    "linkedDoctrineCodes": [
      "REV-DOC-002"
    ],
    "indexStatus": "indexed",
    "chunkCount": 14,
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "asset-003",
    "code": "KNW-ASSET-003",
    "title": "Catalogue Academy B2B crèches & maternelles",
    "assetType": "catalogue",
    "description": "Ressource gouvernée utilisée comme source de vérité pour catalogue academy b2b crèches & maternelles.",
    "ownerRole": "Revenue Knowledge Owner",
    "businessUnitCodes": [
      "ACADEMY"
    ],
    "confidentiality": "internal",
    "status": "approved",
    "version": "ACADEMY-CATALOGUE-B2B-V1",
    "effectiveFrom": "2026-07-20",
    "mimeType": "application/pdf",
    "checksum": "0a26863e595b0144f98205d8c5416823c11c86c04737bc94cd16f16547953555",
    "language": "fr",
    "tags": [
      "catalogue",
      "revenue-os",
      "governed"
    ],
    "linkedDoctrineCodes": [
      "REV-DOC-003"
    ],
    "indexStatus": "indexed",
    "chunkCount": 15,
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "asset-004",
    "code": "KNW-ASSET-004",
    "title": "Catalogue Flashcards et programme PLV",
    "assetType": "catalogue",
    "description": "Ressource gouvernée utilisée comme source de vérité pour catalogue flashcards et programme plv.",
    "ownerRole": "Revenue Knowledge Owner",
    "businessUnitCodes": [
      "FLASHCARDS"
    ],
    "confidentiality": "internal",
    "status": "approved",
    "version": "FLASHCARDS-PLV-V1",
    "effectiveFrom": "2026-07-20",
    "mimeType": "application/pdf",
    "checksum": "d870af36963d9d555c011bab6544e1d079bc076204110cbe85ff46b2fbeee27f",
    "language": "fr",
    "tags": [
      "catalogue",
      "revenue-os",
      "governed"
    ],
    "linkedDoctrineCodes": [
      "REV-POL-001"
    ],
    "indexStatus": "indexed",
    "chunkCount": 16,
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "asset-005",
    "code": "KNW-ASSET-005",
    "title": "Matrice officielle des unités commerciales",
    "assetType": "policy-pack",
    "description": "Ressource gouvernée utilisée comme source de vérité pour matrice officielle des unités commerciales.",
    "ownerRole": "Revenue Knowledge Owner",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "FLASHCARDS",
      "KINDERGARTEN",
      "HOSPITALITY",
      "CORPORATES",
      "EVENTS",
      "REFFERQ"
    ],
    "confidentiality": "internal",
    "status": "effective",
    "version": "BUSINESS-UNITS-V1",
    "effectiveFrom": "2026-07-20",
    "mimeType": "application/pdf",
    "checksum": "4d479d6b91775d737dfeb02e109bab5a7a4d76cd340710ed6750217aa105d87f",
    "language": "fr",
    "tags": [
      "policy-pack",
      "revenue-os",
      "governed"
    ],
    "linkedDoctrineCodes": [
      "REV-POL-002"
    ],
    "indexStatus": "indexed",
    "chunkCount": 17,
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "asset-006",
    "code": "KNW-ASSET-006",
    "title": "Registre de prix actif — référence contrôlée",
    "assetType": "pricing-sheet",
    "description": "Ressource gouvernée utilisée comme source de vérité pour registre de prix actif — référence contrôlée.",
    "ownerRole": "Revenue Knowledge Owner",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "FLASHCARDS",
      "KINDERGARTEN",
      "HOSPITALITY",
      "CORPORATES",
      "EVENTS",
      "REFFERQ"
    ],
    "confidentiality": "restricted",
    "status": "in-review",
    "version": "PRICEBOOK-CONTROLLED",
    "mimeType": "application/pdf",
    "checksum": "7db55435da842704ccfba47bfd219f892851cec1acfa8929ec2549ac12ea7b04",
    "language": "fr",
    "tags": [
      "pricing-sheet",
      "revenue-os",
      "governed"
    ],
    "linkedDoctrineCodes": [
      "REV-POL-003"
    ],
    "indexStatus": "indexed",
    "chunkCount": 18,
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "asset-007",
    "code": "KNW-ASSET-007",
    "title": "Bibliothèque de scripts WhatsApp B2B",
    "assetType": "script-library",
    "description": "Ressource gouvernée utilisée comme source de vérité pour bibliothèque de scripts whatsapp b2b.",
    "ownerRole": "Revenue Knowledge Owner",
    "businessUnitCodes": [
      "ACADEMY",
      "FLASHCARDS",
      "HOSPITALITY",
      "CORPORATES"
    ],
    "confidentiality": "confidential",
    "status": "approved",
    "version": "SCRIPT-WA-B2B-V1",
    "effectiveFrom": "2026-07-20",
    "mimeType": "application/pdf",
    "checksum": "0c5f49ffbbc87d80b8fe144013302367672d53354910c63dff8903fbc8ce81ea",
    "language": "fr",
    "tags": [
      "script-library",
      "revenue-os",
      "governed"
    ],
    "linkedDoctrineCodes": [
      "REV-SVC-001"
    ],
    "indexStatus": "indexed",
    "chunkCount": 19,
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "asset-008",
    "code": "KNW-ASSET-008",
    "title": "Bibliothèque d’appels de qualification",
    "assetType": "script-library",
    "description": "Ressource gouvernée utilisée comme source de vérité pour bibliothèque d’appels de qualification.",
    "ownerRole": "Revenue Knowledge Owner",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "FLASHCARDS",
      "KINDERGARTEN",
      "HOSPITALITY",
      "CORPORATES",
      "EVENTS",
      "REFFERQ"
    ],
    "confidentiality": "confidential",
    "status": "approved",
    "version": "SCRIPT-PHONE-V1",
    "effectiveFrom": "2026-07-20",
    "mimeType": "application/pdf",
    "checksum": "39b1b17e210437761eba1b9cf84604338fa6adbfaf6c00fd5752cef4c822237c",
    "language": "fr",
    "tags": [
      "script-library",
      "revenue-os",
      "governed"
    ],
    "linkedDoctrineCodes": [
      "REV-SVC-002"
    ],
    "indexStatus": "indexed",
    "chunkCount": 20,
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "asset-009",
    "code": "KNW-ASSET-009",
    "title": "Trame de diagnostic Academy",
    "assetType": "template",
    "description": "Ressource gouvernée utilisée comme source de vérité pour trame de diagnostic academy.",
    "ownerRole": "Revenue Knowledge Owner",
    "businessUnitCodes": [
      "ACADEMY"
    ],
    "confidentiality": "internal",
    "status": "effective",
    "version": "ACADEMY-DIAGNOSTIC-V1",
    "effectiveFrom": "2026-07-20",
    "mimeType": "application/pdf",
    "checksum": "3fd844f692659b569f1a39b76b2bd055a0242961b64b097a081058d2a2c119ba",
    "language": "fr",
    "tags": [
      "template",
      "revenue-os",
      "governed"
    ],
    "linkedDoctrineCodes": [
      "REV-SVC-003"
    ],
    "indexStatus": "indexed",
    "chunkCount": 21,
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "asset-010",
    "code": "KNW-ASSET-010",
    "title": "Trame de proposition commerciale B2B",
    "assetType": "template",
    "description": "Ressource gouvernée utilisée comme source de vérité pour trame de proposition commerciale b2b.",
    "ownerRole": "Revenue Knowledge Owner",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "FLASHCARDS",
      "KINDERGARTEN",
      "HOSPITALITY",
      "CORPORATES",
      "EVENTS",
      "REFFERQ"
    ],
    "confidentiality": "confidential",
    "status": "approved",
    "version": "PROPOSAL-B2B-V1",
    "effectiveFrom": "2026-07-20",
    "mimeType": "application/pdf",
    "checksum": "31ab54400e4c376e06ba1a58bbf59284d464adfdae9e22d66942bd715801569e",
    "language": "fr",
    "tags": [
      "template",
      "revenue-os",
      "governed"
    ],
    "linkedDoctrineCodes": [
      "REV-POS-001"
    ],
    "indexStatus": "indexed",
    "chunkCount": 22,
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "asset-011",
    "code": "KNW-ASSET-011",
    "title": "Politique de marque et usage du logo",
    "assetType": "policy-pack",
    "description": "Ressource gouvernée utilisée comme source de vérité pour politique de marque et usage du logo.",
    "ownerRole": "Revenue Knowledge Owner",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "FLASHCARDS",
      "KINDERGARTEN",
      "HOSPITALITY",
      "CORPORATES",
      "EVENTS",
      "REFFERQ"
    ],
    "confidentiality": "internal",
    "status": "effective",
    "version": "BRAND-GOVERNANCE-V1",
    "effectiveFrom": "2026-07-20",
    "mimeType": "application/pdf",
    "checksum": "d5a3871179787104a83a78d8f9f43186d4f69237e88a780948ce9a647a792fcb",
    "language": "fr",
    "tags": [
      "policy-pack",
      "revenue-os",
      "governed"
    ],
    "linkedDoctrineCodes": [
      "REV-POS-002"
    ],
    "indexStatus": "queued",
    "chunkCount": 0,
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "asset-012",
    "code": "KNW-ASSET-012",
    "title": "Politique d’autonomie et actions externes",
    "assetType": "policy-pack",
    "description": "Ressource gouvernée utilisée comme source de vérité pour politique d’autonomie et actions externes.",
    "ownerRole": "Revenue Knowledge Owner",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "FLASHCARDS",
      "KINDERGARTEN",
      "HOSPITALITY",
      "CORPORATES",
      "EVENTS",
      "REFFERQ"
    ],
    "confidentiality": "restricted",
    "status": "effective",
    "version": "AUTONOMY-POLICY-V1",
    "effectiveFrom": "2026-07-20",
    "mimeType": "application/pdf",
    "checksum": "c7058084abed53d9b8c56721444a1fadfb1b72e8df60188e91d95a759f8b4efd",
    "language": "fr",
    "tags": [
      "policy-pack",
      "revenue-os",
      "governed"
    ],
    "linkedDoctrineCodes": [
      "REV-POS-003"
    ],
    "indexStatus": "queued",
    "chunkCount": 0,
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "asset-013",
    "code": "KNW-ASSET-013",
    "title": "Matrice de capacité Academy",
    "assetType": "dataset",
    "description": "Ressource gouvernée utilisée comme source de vérité pour matrice de capacité academy.",
    "ownerRole": "Revenue Knowledge Owner",
    "businessUnitCodes": [
      "ACADEMY"
    ],
    "confidentiality": "confidential",
    "status": "in-review",
    "version": "ACADEMY-CAPACITY-V1",
    "mimeType": "application/json",
    "checksum": "06acb7f8cc8cd84ce12e712a17711d36f9818d45f56ca1cbf37a623089bdfa80",
    "language": "fr",
    "tags": [
      "dataset",
      "revenue-os",
      "governed"
    ],
    "linkedDoctrineCodes": [
      "REV-CUS-001"
    ],
    "indexStatus": "queued",
    "chunkCount": 0,
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "asset-014",
    "code": "KNW-ASSET-014",
    "title": "Matrice de couverture Home Service",
    "assetType": "dataset",
    "description": "Ressource gouvernée utilisée comme source de vérité pour matrice de couverture home service.",
    "ownerRole": "Revenue Knowledge Owner",
    "businessUnitCodes": [
      "HOME_SERVICE"
    ],
    "confidentiality": "confidential",
    "status": "in-review",
    "version": "HOME-COVERAGE-V1",
    "mimeType": "application/json",
    "checksum": "b77a37a663e5ff6c6290420b2415078be3171385b25bfdec94578cbbc0877530",
    "language": "fr",
    "tags": [
      "dataset",
      "revenue-os",
      "governed"
    ],
    "linkedDoctrineCodes": [
      "REV-CUS-002"
    ],
    "indexStatus": "queued",
    "chunkCount": 0,
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "asset-015",
    "code": "KNW-ASSET-015",
    "title": "Registre des avantages partenaires",
    "assetType": "policy-pack",
    "description": "Ressource gouvernée utilisée comme source de vérité pour registre des avantages partenaires.",
    "ownerRole": "Revenue Knowledge Owner",
    "businessUnitCodes": [
      "ACADEMY",
      "FLASHCARDS",
      "HOSPITALITY"
    ],
    "confidentiality": "confidential",
    "status": "approved",
    "version": "PARTNER-BENEFITS-V1",
    "effectiveFrom": "2026-07-20",
    "mimeType": "application/pdf",
    "checksum": "02745e03a7af069a680f1eb8a737435562131868ed3f65e465771735650be06a",
    "language": "fr",
    "tags": [
      "policy-pack",
      "revenue-os",
      "governed"
    ],
    "linkedDoctrineCodes": [
      "REV-CUS-003"
    ],
    "indexStatus": "queued",
    "chunkCount": 0,
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "asset-016",
    "code": "KNW-ASSET-016",
    "title": "Référentiel des objections B2B",
    "assetType": "case-file",
    "description": "Ressource gouvernée utilisée comme source de vérité pour référentiel des objections b2b.",
    "ownerRole": "Revenue Knowledge Owner",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "FLASHCARDS",
      "KINDERGARTEN",
      "HOSPITALITY",
      "CORPORATES",
      "EVENTS",
      "REFFERQ"
    ],
    "confidentiality": "confidential",
    "status": "approved",
    "version": "OBJECTIONS-B2B-V1",
    "effectiveFrom": "2026-07-20",
    "mimeType": "application/pdf",
    "checksum": "cfdc5b6365e2f378a08059539591fef0d9666068d6d06a41b962999251376012",
    "language": "fr",
    "tags": [
      "case-file",
      "revenue-os",
      "governed"
    ],
    "linkedDoctrineCodes": [
      "REV-BEN-001"
    ],
    "indexStatus": "queued",
    "chunkCount": 0,
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "asset-017",
    "code": "KNW-ASSET-017",
    "title": "Référentiel des cas de succès",
    "assetType": "case-file",
    "description": "Ressource gouvernée utilisée comme source de vérité pour référentiel des cas de succès.",
    "ownerRole": "Revenue Knowledge Owner",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "FLASHCARDS",
      "KINDERGARTEN",
      "HOSPITALITY",
      "CORPORATES",
      "EVENTS",
      "REFFERQ"
    ],
    "confidentiality": "restricted",
    "status": "in-review",
    "version": "SUCCESS-CASES-V1",
    "mimeType": "application/pdf",
    "checksum": "bf6b3a7b39266ce99e4218a02d0d548be43a071d2c9b0a5ff091bae0b48cfd16",
    "language": "fr",
    "tags": [
      "case-file",
      "revenue-os",
      "governed"
    ],
    "linkedDoctrineCodes": [
      "REV-BEN-002"
    ],
    "indexStatus": "queued",
    "chunkCount": 0,
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "asset-018",
    "code": "KNW-ASSET-018",
    "title": "Référentiel des échecs et récupérations",
    "assetType": "case-file",
    "description": "Ressource gouvernée utilisée comme source de vérité pour référentiel des échecs et récupérations.",
    "ownerRole": "Revenue Knowledge Owner",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "FLASHCARDS",
      "KINDERGARTEN",
      "HOSPITALITY",
      "CORPORATES",
      "EVENTS",
      "REFFERQ"
    ],
    "confidentiality": "restricted",
    "status": "in-review",
    "version": "FAILURE-RECOVERY-V1",
    "mimeType": "application/pdf",
    "checksum": "581b97d31fd896da0a11123495d848aade7c931adce61dca0899dcda1df177fe",
    "language": "fr",
    "tags": [
      "case-file",
      "revenue-os",
      "governed"
    ],
    "linkedDoctrineCodes": [
      "REV-BEN-003"
    ],
    "indexStatus": "queued",
    "chunkCount": 0,
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "asset-019",
    "code": "KNW-ASSET-019",
    "title": "SOP suivi catalogue et rendez-vous",
    "assetType": "policy-pack",
    "description": "Ressource gouvernée utilisée comme source de vérité pour sop suivi catalogue et rendez-vous.",
    "ownerRole": "Revenue Knowledge Owner",
    "businessUnitCodes": [
      "ACADEMY",
      "FLASHCARDS"
    ],
    "confidentiality": "internal",
    "status": "approved",
    "version": "FOLLOWUP-SOP-V1",
    "effectiveFrom": "2026-07-20",
    "mimeType": "application/pdf",
    "checksum": "9629a3dae5f74b39228552e564cd9e3e6557868308b3ae50a9e69810103e8f58",
    "language": "fr",
    "tags": [
      "policy-pack",
      "revenue-os",
      "governed"
    ],
    "linkedDoctrineCodes": [
      "REV-BRD-001"
    ],
    "indexStatus": "not-indexed",
    "chunkCount": 0,
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "asset-020",
    "code": "KNW-ASSET-020",
    "title": "SOP proposition, négociation et clôture",
    "assetType": "policy-pack",
    "description": "Ressource gouvernée utilisée comme source de vérité pour sop proposition, négociation et clôture.",
    "ownerRole": "Revenue Knowledge Owner",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "FLASHCARDS",
      "KINDERGARTEN",
      "HOSPITALITY",
      "CORPORATES",
      "EVENTS",
      "REFFERQ"
    ],
    "confidentiality": "confidential",
    "status": "in-review",
    "version": "CLOSING-SOP-V1",
    "mimeType": "application/pdf",
    "checksum": "08a11c848ceb8a19757018449a7de981a9f54b85f9464b78e563989e26fc1939",
    "language": "fr",
    "tags": [
      "policy-pack",
      "revenue-os",
      "governed"
    ],
    "linkedDoctrineCodes": [
      "REV-BRD-002"
    ],
    "indexStatus": "not-indexed",
    "chunkCount": 0,
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "asset-021",
    "code": "KNW-ASSET-021",
    "title": "Politique confidentialité commerciale",
    "assetType": "policy-pack",
    "description": "Ressource gouvernée utilisée comme source de vérité pour politique confidentialité commerciale.",
    "ownerRole": "Revenue Knowledge Owner",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "FLASHCARDS",
      "KINDERGARTEN",
      "HOSPITALITY",
      "CORPORATES",
      "EVENTS",
      "REFFERQ"
    ],
    "confidentiality": "restricted",
    "status": "effective",
    "version": "DATA-PRIVACY-V1",
    "effectiveFrom": "2026-07-20",
    "mimeType": "application/pdf",
    "checksum": "13a50469f92c7b7c88946ef886c9510bb5bc0bbaf4041d9007d9f73b1a3287a9",
    "language": "fr",
    "tags": [
      "policy-pack",
      "revenue-os",
      "governed"
    ],
    "linkedDoctrineCodes": [
      "REV-BRD-003"
    ],
    "indexStatus": "not-indexed",
    "chunkCount": 0,
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "asset-022",
    "code": "KNW-ASSET-022",
    "title": "Guide de positionnement Hospitality",
    "assetType": "document",
    "description": "Ressource gouvernée utilisée comme source de vérité pour guide de positionnement hospitality.",
    "ownerRole": "Revenue Knowledge Owner",
    "businessUnitCodes": [
      "HOSPITALITY"
    ],
    "confidentiality": "internal",
    "status": "in-review",
    "version": "HOSPITALITY-POSITION-V1",
    "mimeType": "application/pdf",
    "checksum": "4d14e5266f07b29ca989a7799d856871d31c0f9fa6a76d3a077223f14a6e6d5a",
    "language": "fr",
    "tags": [
      "document",
      "revenue-os",
      "governed"
    ],
    "linkedDoctrineCodes": [
      "REV-LEG-001"
    ],
    "indexStatus": "not-indexed",
    "chunkCount": 0,
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "asset-023",
    "code": "KNW-ASSET-023",
    "title": "Guide de positionnement Corporate Care",
    "assetType": "document",
    "description": "Ressource gouvernée utilisée comme source de vérité pour guide de positionnement corporate care.",
    "ownerRole": "Revenue Knowledge Owner",
    "businessUnitCodes": [
      "CORPORATES"
    ],
    "confidentiality": "internal",
    "status": "in-review",
    "version": "CORPORATE-POSITION-V1",
    "mimeType": "application/pdf",
    "checksum": "cf40bfd638e4f2a383a5cda516d1c61eb9d8798fcc99b4be5d4bad8085b12cf5",
    "language": "fr",
    "tags": [
      "document",
      "revenue-os",
      "governed"
    ],
    "linkedDoctrineCodes": [
      "REV-LEG-002"
    ],
    "indexStatus": "not-indexed",
    "chunkCount": 0,
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "asset-024",
    "code": "KNW-ASSET-024",
    "title": "Matrice saisonnalité et fenêtres marché",
    "assetType": "dataset",
    "description": "Ressource gouvernée utilisée comme source de vérité pour matrice saisonnalité et fenêtres marché.",
    "ownerRole": "Revenue Knowledge Owner",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "FLASHCARDS",
      "KINDERGARTEN",
      "HOSPITALITY",
      "CORPORATES",
      "EVENTS",
      "REFFERQ"
    ],
    "confidentiality": "confidential",
    "status": "approved",
    "version": "SEASONAL-WINDOWS-V1",
    "effectiveFrom": "2026-07-20",
    "mimeType": "application/json",
    "checksum": "9104febc1ac6709767c876dd9fcfc860af5a61cc2d8a80cea3381f1448c4ea22",
    "language": "fr",
    "tags": [
      "dataset",
      "revenue-os",
      "governed"
    ],
    "linkedDoctrineCodes": [
      "REV-LEG-003"
    ],
    "indexStatus": "not-indexed",
    "chunkCount": 0,
    "source": "contract-seed",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  }
]

export const REVENUE_KNOWLEDGE_SEED_RELATIONSHIPS: RevenueKnowledgeRelationship[] = [
  {
    "id": "rel-001",
    "code": "REL-001",
    "sourceType": "doctrine",
    "sourceCode": "REV-DOC-001",
    "relationshipType": "supports",
    "targetType": "asset",
    "targetCode": "KNW-ASSET-001",
    "rationale": "Relie la doctrine à une source gouvernée et versionnée.",
    "active": true
  },
  {
    "id": "rel-002",
    "code": "REL-002",
    "sourceType": "doctrine",
    "sourceCode": "REV-DOC-002",
    "relationshipType": "supports",
    "targetType": "asset",
    "targetCode": "KNW-ASSET-002",
    "rationale": "Relie la doctrine à une source gouvernée et versionnée.",
    "active": true
  },
  {
    "id": "rel-003",
    "code": "REL-003",
    "sourceType": "doctrine",
    "sourceCode": "REV-DOC-003",
    "relationshipType": "evidences",
    "targetType": "asset",
    "targetCode": "KNW-ASSET-003",
    "rationale": "Relie la doctrine à une source gouvernée et versionnée.",
    "active": true
  },
  {
    "id": "rel-004",
    "code": "REL-004",
    "sourceType": "doctrine",
    "sourceCode": "REV-POL-001",
    "relationshipType": "supports",
    "targetType": "asset",
    "targetCode": "KNW-ASSET-004",
    "rationale": "Relie la doctrine à une source gouvernée et versionnée.",
    "active": true
  },
  {
    "id": "rel-005",
    "code": "REL-005",
    "sourceType": "doctrine",
    "sourceCode": "REV-POL-002",
    "relationshipType": "supports",
    "targetType": "asset",
    "targetCode": "KNW-ASSET-005",
    "rationale": "Relie la doctrine à une source gouvernée et versionnée.",
    "active": true
  },
  {
    "id": "rel-006",
    "code": "REL-006",
    "sourceType": "doctrine",
    "sourceCode": "REV-POL-003",
    "relationshipType": "evidences",
    "targetType": "asset",
    "targetCode": "KNW-ASSET-006",
    "rationale": "Relie la doctrine à une source gouvernée et versionnée.",
    "active": true
  },
  {
    "id": "rel-007",
    "code": "REL-007",
    "sourceType": "doctrine",
    "sourceCode": "REV-SVC-001",
    "relationshipType": "supports",
    "targetType": "asset",
    "targetCode": "KNW-ASSET-007",
    "rationale": "Relie la doctrine à une source gouvernée et versionnée.",
    "active": true
  },
  {
    "id": "rel-008",
    "code": "REL-008",
    "sourceType": "doctrine",
    "sourceCode": "REV-SVC-002",
    "relationshipType": "supports",
    "targetType": "asset",
    "targetCode": "KNW-ASSET-008",
    "rationale": "Relie la doctrine à une source gouvernée et versionnée.",
    "active": true
  },
  {
    "id": "rel-009",
    "code": "REL-009",
    "sourceType": "doctrine",
    "sourceCode": "REV-SVC-003",
    "relationshipType": "evidences",
    "targetType": "asset",
    "targetCode": "KNW-ASSET-009",
    "rationale": "Relie la doctrine à une source gouvernée et versionnée.",
    "active": true
  },
  {
    "id": "rel-010",
    "code": "REL-010",
    "sourceType": "doctrine",
    "sourceCode": "REV-POS-001",
    "relationshipType": "supports",
    "targetType": "asset",
    "targetCode": "KNW-ASSET-010",
    "rationale": "Relie la doctrine à une source gouvernée et versionnée.",
    "active": true
  },
  {
    "id": "rel-011",
    "code": "REL-011",
    "sourceType": "doctrine",
    "sourceCode": "REV-POS-002",
    "relationshipType": "supports",
    "targetType": "asset",
    "targetCode": "KNW-ASSET-011",
    "rationale": "Relie la doctrine à une source gouvernée et versionnée.",
    "active": true
  },
  {
    "id": "rel-012",
    "code": "REL-012",
    "sourceType": "doctrine",
    "sourceCode": "REV-POS-003",
    "relationshipType": "evidences",
    "targetType": "asset",
    "targetCode": "KNW-ASSET-012",
    "rationale": "Relie la doctrine à une source gouvernée et versionnée.",
    "active": true
  },
  {
    "id": "rel-013",
    "code": "REL-013",
    "sourceType": "doctrine",
    "sourceCode": "REV-CUS-001",
    "relationshipType": "supports",
    "targetType": "asset",
    "targetCode": "KNW-ASSET-013",
    "rationale": "Relie la doctrine à une source gouvernée et versionnée.",
    "active": true
  },
  {
    "id": "rel-014",
    "code": "REL-014",
    "sourceType": "doctrine",
    "sourceCode": "REV-CUS-002",
    "relationshipType": "supports",
    "targetType": "asset",
    "targetCode": "KNW-ASSET-014",
    "rationale": "Relie la doctrine à une source gouvernée et versionnée.",
    "active": true
  },
  {
    "id": "rel-015",
    "code": "REL-015",
    "sourceType": "doctrine",
    "sourceCode": "REV-CUS-003",
    "relationshipType": "evidences",
    "targetType": "asset",
    "targetCode": "KNW-ASSET-015",
    "rationale": "Relie la doctrine à une source gouvernée et versionnée.",
    "active": true
  },
  {
    "id": "rel-016",
    "code": "REL-016",
    "sourceType": "doctrine",
    "sourceCode": "REV-BEN-001",
    "relationshipType": "supports",
    "targetType": "asset",
    "targetCode": "KNW-ASSET-016",
    "rationale": "Relie la doctrine à une source gouvernée et versionnée.",
    "active": true
  },
  {
    "id": "rel-017",
    "code": "REL-017",
    "sourceType": "doctrine",
    "sourceCode": "REV-BEN-002",
    "relationshipType": "supports",
    "targetType": "asset",
    "targetCode": "KNW-ASSET-017",
    "rationale": "Relie la doctrine à une source gouvernée et versionnée.",
    "active": true
  },
  {
    "id": "rel-018",
    "code": "REL-018",
    "sourceType": "doctrine",
    "sourceCode": "REV-BEN-003",
    "relationshipType": "evidences",
    "targetType": "asset",
    "targetCode": "KNW-ASSET-018",
    "rationale": "Relie la doctrine à une source gouvernée et versionnée.",
    "active": true
  },
  {
    "id": "rel-019",
    "code": "REL-019",
    "sourceType": "doctrine",
    "sourceCode": "REV-BRD-001",
    "relationshipType": "supports",
    "targetType": "asset",
    "targetCode": "KNW-ASSET-019",
    "rationale": "Relie la doctrine à une source gouvernée et versionnée.",
    "active": true
  },
  {
    "id": "rel-020",
    "code": "REL-020",
    "sourceType": "doctrine",
    "sourceCode": "REV-BRD-002",
    "relationshipType": "supports",
    "targetType": "asset",
    "targetCode": "KNW-ASSET-020",
    "rationale": "Relie la doctrine à une source gouvernée et versionnée.",
    "active": true
  },
  {
    "id": "rel-021",
    "code": "REL-021",
    "sourceType": "doctrine",
    "sourceCode": "REV-BRD-003",
    "relationshipType": "evidences",
    "targetType": "asset",
    "targetCode": "KNW-ASSET-021",
    "rationale": "Relie la doctrine à une source gouvernée et versionnée.",
    "active": true
  },
  {
    "id": "rel-022",
    "code": "REL-022",
    "sourceType": "doctrine",
    "sourceCode": "REV-LEG-001",
    "relationshipType": "supports",
    "targetType": "asset",
    "targetCode": "KNW-ASSET-022",
    "rationale": "Relie la doctrine à une source gouvernée et versionnée.",
    "active": true
  },
  {
    "id": "rel-023",
    "code": "REL-023",
    "sourceType": "doctrine",
    "sourceCode": "REV-LEG-002",
    "relationshipType": "supports",
    "targetType": "asset",
    "targetCode": "KNW-ASSET-023",
    "rationale": "Relie la doctrine à une source gouvernée et versionnée.",
    "active": true
  },
  {
    "id": "rel-024",
    "code": "REL-024",
    "sourceType": "doctrine",
    "sourceCode": "REV-LEG-003",
    "relationshipType": "evidences",
    "targetType": "asset",
    "targetCode": "KNW-ASSET-024",
    "rationale": "Relie la doctrine à une source gouvernée et versionnée.",
    "active": true
  }
]

export const REVENUE_KNOWLEDGE_SEED_SCRIPTS: RevenueSalesScript[] = [
  {
    "id": "script-001",
    "code": "WA-ACADEMY-INTRO",
    "name": "Prise de contact Academy — direction",
    "channel": "whatsapp",
    "stage": "first-contact",
    "segmentCodes": [
      "CRECHE_PRIVATE",
      "PRESCHOOL"
    ],
    "offerCodes": [
      "ACADEMY_ONSITE"
    ],
    "objective": "Obtenir la permission de présenter le catalogue",
    "opening": "Bonjour {{contact_name}}, je vous contacte au nom d’AngelCare Academy au sujet de la préparation et de la montée en compétences de votre équipe.",
    "body": "Nous avons structuré des parcours destinés aux crèches et maternelles, réalisables sur site ou avec supports et accès adaptés.",
    "callToAction": "Puis-je vous proposer un échange de 15 minutes pour identifier les priorités de votre établissement ?",
    "fallback": "Créer une prochaine action interne sans envoyer de message non approuvé.",
    "prohibitedClaims": [
      "Garantie de résultat",
      "Capacité non confirmée",
      "Remise non validée"
    ],
    "requiredPersonalizationFields": [
      "contact_name",
      "organization_name",
      "known_priority"
    ],
    "status": "approved",
    "version": "1.0",
    "ownerRole": "Revenue Communications Lead",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "script-002",
    "code": "WA-CATALOGUE-FOLLOWUP",
    "name": "Suivi après catalogue",
    "channel": "whatsapp",
    "stage": "catalogue-sent",
    "segmentCodes": [
      "CRECHE_PRIVATE",
      "PRESCHOOL"
    ],
    "offerCodes": [
      "ACADEMY_ONSITE",
      "FLASHCARDS_PLV"
    ],
    "objective": "Transformer l’envoi en rendez-vous",
    "opening": "Bonjour {{contact_name}}, avez-vous pu parcourir le catalogue transmis ?",
    "body": "Je peux vous orienter directement vers les modules les plus pertinents selon votre équipe, votre calendrier et vos priorités.",
    "callToAction": "Quel créneau vous conviendrait pour un court diagnostic ?",
    "fallback": "Créer une prochaine action interne sans envoyer de message non approuvé.",
    "prohibitedClaims": [
      "Garantie de résultat",
      "Capacité non confirmée",
      "Remise non validée"
    ],
    "requiredPersonalizationFields": [
      "contact_name",
      "organization_name",
      "known_priority"
    ],
    "status": "approved",
    "version": "1.0",
    "ownerRole": "Revenue Communications Lead",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "script-003",
    "code": "WA-FLASHCARDS-PARTNER",
    "name": "Invitation partenaire Flashcards",
    "channel": "whatsapp",
    "stage": "first-contact",
    "segmentCodes": [
      "CRECHE_PRIVATE",
      "ORTHOPHONIST",
      "MATERNITY_CLINIC"
    ],
    "offerCodes": [
      "FLASHCARDS_PLV"
    ],
    "objective": "Qualifier l’intérêt partenaire",
    "opening": "Bonjour {{contact_name}}, AngelCare active un programme partenaire autour de collections éducatives et d’une PLV dédiée.",
    "body": "Le dispositif peut compléter votre expérience familles ou vos outils pédagogiques, sous réserve d’adéquation avec votre établissement.",
    "callToAction": "Souhaitez-vous recevoir la présentation partenaire et les conditions applicables ?",
    "fallback": "Créer une prochaine action interne sans envoyer de message non approuvé.",
    "prohibitedClaims": [
      "Garantie de résultat",
      "Capacité non confirmée",
      "Remise non validée"
    ],
    "requiredPersonalizationFields": [
      "contact_name",
      "organization_name",
      "known_priority"
    ],
    "status": "approved",
    "version": "1.0",
    "ownerRole": "Revenue Communications Lead",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "script-004",
    "code": "EMAIL-ACADEMY-DIAGNOSTIC",
    "name": "Email rendez-vous diagnostic Academy",
    "channel": "email",
    "stage": "meeting-generation",
    "segmentCodes": [
      "CRECHE_PRIVATE",
      "PRESCHOOL"
    ],
    "offerCodes": [
      "ACADEMY_ONSITE"
    ],
    "objective": "Confirmer un échange de direction",
    "opening": "Objet : Préparation de votre équipe — échange AngelCare Academy",
    "body": "Nous proposons un diagnostic court pour identifier les formations et supports réellement utiles à votre établissement. Le rendez-vous ne vaut pas engagement et permet de cadrer priorité, format et calendrier.",
    "callToAction": "Répondez avec deux créneaux ou contactez notre équipe.",
    "fallback": "Créer une prochaine action interne sans envoyer de message non approuvé.",
    "prohibitedClaims": [
      "Garantie de résultat",
      "Capacité non confirmée",
      "Remise non validée"
    ],
    "requiredPersonalizationFields": [
      "contact_name",
      "organization_name",
      "known_priority"
    ],
    "status": "approved",
    "version": "1.0",
    "ownerRole": "Revenue Communications Lead",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "script-005",
    "code": "PHONE-QUALIFICATION-B2B",
    "name": "Appel de qualification B2B",
    "channel": "phone",
    "stage": "qualification",
    "segmentCodes": [
      "CRECHE_PRIVATE",
      "PRESCHOOL",
      "CORPORATE"
    ],
    "offerCodes": [
      "ACADEMY_ONSITE",
      "CORPORATE_CARE"
    ],
    "objective": "Qualifier besoin, autorité, timing et prochaine étape",
    "opening": "Bonjour, je suis {{agent_name}} d’AngelCare. Est-ce un bon moment pour deux questions rapides ?",
    "body": "Comprendre l’organisation, l’équipe, le besoin prioritaire, le calendrier et le circuit de décision.",
    "callToAction": "Proposer une prochaine étape datée et envoyer uniquement les ressources pertinentes.",
    "fallback": "Créer une prochaine action interne sans envoyer de message non approuvé.",
    "prohibitedClaims": [
      "Garantie de résultat",
      "Capacité non confirmée",
      "Remise non validée"
    ],
    "requiredPersonalizationFields": [
      "contact_name",
      "organization_name",
      "known_priority"
    ],
    "status": "approved",
    "version": "1.0",
    "ownerRole": "Revenue Communications Lead",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "script-006",
    "code": "MEETING-DIAGNOSTIC",
    "name": "Réunion diagnostic structurée",
    "channel": "meeting",
    "stage": "diagnostic",
    "segmentCodes": [
      "CRECHE_PRIVATE",
      "PRESCHOOL",
      "CORPORATE"
    ],
    "offerCodes": [
      "ACADEMY_ONSITE",
      "CORPORATE_CARE"
    ],
    "objective": "Construire un diagnostic partagé",
    "opening": "Merci pour votre temps. L’objectif est de comprendre vos priorités avant toute recommandation.",
    "body": "Explorer situation, écarts, impact, décision, capacité et calendrier; reformuler et valider.",
    "callToAction": "Convenir de la recommandation, des informations manquantes et de la date de décision.",
    "fallback": "Créer une prochaine action interne sans envoyer de message non approuvé.",
    "prohibitedClaims": [
      "Garantie de résultat",
      "Capacité non confirmée",
      "Remise non validée"
    ],
    "requiredPersonalizationFields": [
      "contact_name",
      "organization_name",
      "known_priority"
    ],
    "status": "approved",
    "version": "1.0",
    "ownerRole": "Revenue Communications Lead",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "script-007",
    "code": "PROPOSAL-DELIVERY",
    "name": "Présentation de proposition",
    "channel": "proposal",
    "stage": "proposal-sent",
    "segmentCodes": [
      "CRECHE_PRIVATE",
      "PRESCHOOL",
      "CORPORATE"
    ],
    "offerCodes": [
      "ACADEMY_ONSITE",
      "CORPORATE_CARE"
    ],
    "objective": "Obtenir une décision ou une correction précise",
    "opening": "Voici la proposition construite à partir du diagnostic validé.",
    "body": "Présenter résultat attendu, périmètre, inclus, options, prix approuvé, conditions et capacité.",
    "callToAction": "Valider la décision, les changements requis ou la date de retour.",
    "fallback": "Créer une prochaine action interne sans envoyer de message non approuvé.",
    "prohibitedClaims": [
      "Garantie de résultat",
      "Capacité non confirmée",
      "Remise non validée"
    ],
    "requiredPersonalizationFields": [
      "contact_name",
      "organization_name",
      "known_priority"
    ],
    "status": "approved",
    "version": "1.0",
    "ownerRole": "Revenue Communications Lead",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "script-008",
    "code": "WA-REACTIVATION",
    "name": "Réactivation contextualisée",
    "channel": "whatsapp",
    "stage": "stalled",
    "segmentCodes": [
      "CRECHE_PRIVATE",
      "PRESCHOOL",
      "CORPORATE"
    ],
    "offerCodes": [
      "ACADEMY_ONSITE",
      "FLASHCARDS_PLV",
      "CORPORATE_CARE"
    ],
    "objective": "Réouvrir une opportunité sans répétition",
    "opening": "Bonjour {{contact_name}}, je reviens vers vous avec un angle plus directement lié à {{known_priority}}.",
    "body": "Nous pouvons isoler une première étape plus simple, sans élargir le périmètre avant validation.",
    "callToAction": "Souhaitez-vous examiner cette option lors d’un échange court ?",
    "fallback": "Créer une prochaine action interne sans envoyer de message non approuvé.",
    "prohibitedClaims": [
      "Garantie de résultat",
      "Capacité non confirmée",
      "Remise non validée"
    ],
    "requiredPersonalizationFields": [
      "contact_name",
      "organization_name",
      "known_priority"
    ],
    "status": "in-review",
    "version": "1.0",
    "ownerRole": "Revenue Communications Lead",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "script-009",
    "code": "EMAIL-RENEWAL",
    "name": "Préparation renouvellement",
    "channel": "email",
    "stage": "renewal",
    "segmentCodes": [
      "CRECHE_PRIVATE",
      "PRESCHOOL",
      "CORPORATE"
    ],
    "offerCodes": [
      "ACADEMY_ELEARNING",
      "ACADEMY_REFRESH"
    ],
    "objective": "Initier une revue de valeur avant échéance",
    "opening": "Objet : Revue de votre dispositif AngelCare",
    "body": "Nous vous proposons une revue des usages, évolutions d’équipe et priorités du prochain cycle afin de décider du renouvellement ou de l’ajustement.",
    "callToAction": "Réservez la revue avant la date d’échéance indiquée.",
    "fallback": "Créer une prochaine action interne sans envoyer de message non approuvé.",
    "prohibitedClaims": [
      "Garantie de résultat",
      "Capacité non confirmée",
      "Remise non validée"
    ],
    "requiredPersonalizationFields": [
      "contact_name",
      "organization_name",
      "known_priority"
    ],
    "status": "in-review",
    "version": "1.0",
    "ownerRole": "Revenue Communications Lead",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "script-010",
    "code": "PHONE-PRICE-OBJECTION",
    "name": "Appel objection prix",
    "channel": "phone",
    "stage": "negotiation",
    "segmentCodes": [
      "CRECHE_PRIVATE",
      "PRESCHOOL",
      "CORPORATE"
    ],
    "offerCodes": [
      "ACADEMY_ONSITE",
      "CORPORATE_CARE"
    ],
    "objective": "Diagnostiquer la référence de prix et protéger la valeur",
    "opening": "Merci pour votre transparence. Quand vous dites que le prix est élevé, à quoi le comparez-vous exactement ?",
    "body": "Clarifier budget, périmètre, priorité, alternatives et risque; présenter options autorisées sans remise automatique.",
    "callToAction": "Choisir une option, demander une validation interne ou convenir d’un arrêt justifié.",
    "fallback": "Créer une prochaine action interne sans envoyer de message non approuvé.",
    "prohibitedClaims": [
      "Garantie de résultat",
      "Capacité non confirmée",
      "Remise non validée"
    ],
    "requiredPersonalizationFields": [
      "contact_name",
      "organization_name",
      "known_priority"
    ],
    "status": "in-review",
    "version": "1.0",
    "ownerRole": "Revenue Communications Lead",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  }
]

export const REVENUE_KNOWLEDGE_SEED_OBJECTIONS: RevenueObjectionPattern[] = [
  {
    "id": "obj-001",
    "code": "OBJ-PRICE",
    "objection": "« C’est trop cher »",
    "category": "price",
    "segmentCodes": [
      "CRECHE_PRIVATE",
      "PRESCHOOL",
      "CORPORATE"
    ],
    "offerCodes": [
      "ACADEMY_ONSITE",
      "ACADEMY_ELEARNING"
    ],
    "diagnosticQuestions": [
      "Qu’est-ce qui vous fait dire cela ?",
      "Quelle condition changerait votre décision ?",
      "Qui doit être impliqué pour décider ?"
    ],
    "responseFramework": [
      "Identifier la comparaison, le budget, la valeur manquante et le périmètre.",
      "Reformuler la réponse du prospect.",
      "Proposer une prochaine étape adaptée et mesurable."
    ],
    "evidenceRefs": [
      "KNW-ASSET-016"
    ],
    "escalationTrigger": "Escalader si l’objection implique prix exceptionnel, engagement contractuel ou risque sensible.",
    "prohibitedResponse": "Promettre un résultat, inventer une remise ou contester agressivement le prospect.",
    "status": "approved",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "obj-002",
    "code": "OBJ-NOW",
    "objection": "« Ce n’est pas le bon moment »",
    "category": "timing",
    "segmentCodes": [
      "CRECHE_PRIVATE",
      "PRESCHOOL",
      "CORPORATE"
    ],
    "offerCodes": [
      "ACADEMY_ONSITE",
      "ACADEMY_ELEARNING"
    ],
    "diagnosticQuestions": [
      "Qu’est-ce qui vous fait dire cela ?",
      "Quelle condition changerait votre décision ?",
      "Qui doit être impliqué pour décider ?"
    ],
    "responseFramework": [
      "Identifier la vraie date, le déclencheur et le coût du report.",
      "Reformuler la réponse du prospect.",
      "Proposer une prochaine étape adaptée et mesurable."
    ],
    "evidenceRefs": [
      "KNW-ASSET-016"
    ],
    "escalationTrigger": "Escalader si l’objection implique prix exceptionnel, engagement contractuel ou risque sensible.",
    "prohibitedResponse": "Promettre un résultat, inventer une remise ou contester agressivement le prospect.",
    "status": "approved",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "obj-003",
    "code": "OBJ-THINK",
    "objection": "« Je dois réfléchir »",
    "category": "authority",
    "segmentCodes": [
      "CRECHE_PRIVATE",
      "PRESCHOOL",
      "CORPORATE"
    ],
    "offerCodes": [
      "ACADEMY_ONSITE",
      "ACADEMY_ELEARNING"
    ],
    "diagnosticQuestions": [
      "Qu’est-ce qui vous fait dire cela ?",
      "Quelle condition changerait votre décision ?",
      "Qui doit être impliqué pour décider ?"
    ],
    "responseFramework": [
      "Identifier l’information manquante et les autres parties prenantes.",
      "Reformuler la réponse du prospect.",
      "Proposer une prochaine étape adaptée et mesurable."
    ],
    "evidenceRefs": [
      "KNW-ASSET-016"
    ],
    "escalationTrigger": "Escalader si l’objection implique prix exceptionnel, engagement contractuel ou risque sensible.",
    "prohibitedResponse": "Promettre un résultat, inventer une remise ou contester agressivement le prospect.",
    "status": "approved",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "obj-004",
    "code": "OBJ-DIRECTOR",
    "objection": "« Je dois demander à la direction »",
    "category": "authority",
    "segmentCodes": [
      "CRECHE_PRIVATE",
      "PRESCHOOL",
      "CORPORATE"
    ],
    "offerCodes": [
      "ACADEMY_ONSITE",
      "ACADEMY_ELEARNING"
    ],
    "diagnosticQuestions": [
      "Qu’est-ce qui vous fait dire cela ?",
      "Quelle condition changerait votre décision ?",
      "Qui doit être impliqué pour décider ?"
    ],
    "responseFramework": [
      "Cartographier le circuit de décision et équiper l’interlocuteur.",
      "Reformuler la réponse du prospect.",
      "Proposer une prochaine étape adaptée et mesurable."
    ],
    "evidenceRefs": [
      "KNW-ASSET-016"
    ],
    "escalationTrigger": "Escalader si l’objection implique prix exceptionnel, engagement contractuel ou risque sensible.",
    "prohibitedResponse": "Promettre un résultat, inventer une remise ou contester agressivement le prospect.",
    "status": "approved",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "obj-005",
    "code": "OBJ-TRUST",
    "objection": "« Nous ne vous connaissons pas encore »",
    "category": "trust",
    "segmentCodes": [
      "CRECHE_PRIVATE",
      "PRESCHOOL",
      "CORPORATE"
    ],
    "offerCodes": [
      "ACADEMY_ONSITE",
      "ACADEMY_ELEARNING"
    ],
    "diagnosticQuestions": [
      "Qu’est-ce qui vous fait dire cela ?",
      "Quelle condition changerait votre décision ?",
      "Qui doit être impliqué pour décider ?"
    ],
    "responseFramework": [
      "Identifier la preuve attendue et proposer une étape de faible risque.",
      "Reformuler la réponse du prospect.",
      "Proposer une prochaine étape adaptée et mesurable."
    ],
    "evidenceRefs": [
      "KNW-ASSET-016"
    ],
    "escalationTrigger": "Escalader si l’objection implique prix exceptionnel, engagement contractuel ou risque sensible.",
    "prohibitedResponse": "Promettre un résultat, inventer une remise ou contester agressivement le prospect.",
    "status": "approved",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "obj-006",
    "code": "OBJ-TEAM",
    "objection": "« Mon équipe n’est pas disponible »",
    "category": "capacity",
    "segmentCodes": [
      "CRECHE_PRIVATE",
      "PRESCHOOL",
      "CORPORATE"
    ],
    "offerCodes": [
      "ACADEMY_ONSITE",
      "ACADEMY_ELEARNING"
    ],
    "diagnosticQuestions": [
      "Qu’est-ce qui vous fait dire cela ?",
      "Quelle condition changerait votre décision ?",
      "Qui doit être impliqué pour décider ?"
    ],
    "responseFramework": [
      "Clarifier contraintes, format et fenêtres possibles.",
      "Reformuler la réponse du prospect.",
      "Proposer une prochaine étape adaptée et mesurable."
    ],
    "evidenceRefs": [
      "KNW-ASSET-016"
    ],
    "escalationTrigger": "Escalader si l’objection implique prix exceptionnel, engagement contractuel ou risque sensible.",
    "prohibitedResponse": "Promettre un résultat, inventer une remise ou contester agressivement le prospect.",
    "status": "approved",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "obj-007",
    "code": "OBJ-ONLINE",
    "objection": "« Nous préférons uniquement du présentiel »",
    "category": "delivery",
    "segmentCodes": [
      "CRECHE_PRIVATE",
      "PRESCHOOL",
      "CORPORATE"
    ],
    "offerCodes": [
      "ACADEMY_ONSITE",
      "ACADEMY_ELEARNING"
    ],
    "diagnosticQuestions": [
      "Qu’est-ce qui vous fait dire cela ?",
      "Quelle condition changerait votre décision ?",
      "Qui doit être impliqué pour décider ?"
    ],
    "responseFramework": [
      "Comprendre le résultat recherché et présenter les formats réellement disponibles.",
      "Reformuler la réponse du prospect.",
      "Proposer une prochaine étape adaptée et mesurable."
    ],
    "evidenceRefs": [
      "KNW-ASSET-016"
    ],
    "escalationTrigger": "Escalader si l’objection implique prix exceptionnel, engagement contractuel ou risque sensible.",
    "prohibitedResponse": "Promettre un résultat, inventer une remise ou contester agressivement le prospect.",
    "status": "approved",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "obj-008",
    "code": "OBJ-COMPETITOR",
    "objection": "« Nous avons déjà un prestataire »",
    "category": "competition",
    "segmentCodes": [
      "CRECHE_PRIVATE",
      "PRESCHOOL",
      "CORPORATE"
    ],
    "offerCodes": [
      "ACADEMY_ONSITE",
      "ACADEMY_ELEARNING"
    ],
    "diagnosticQuestions": [
      "Qu’est-ce qui vous fait dire cela ?",
      "Quelle condition changerait votre décision ?",
      "Qui doit être impliqué pour décider ?"
    ],
    "responseFramework": [
      "Comprendre satisfaction, écarts, échéance et complémentarité possible.",
      "Reformuler la réponse du prospect.",
      "Proposer une prochaine étape adaptée et mesurable."
    ],
    "evidenceRefs": [
      "KNW-ASSET-016"
    ],
    "escalationTrigger": "Escalader si l’objection implique prix exceptionnel, engagement contractuel ou risque sensible.",
    "prohibitedResponse": "Promettre un résultat, inventer une remise ou contester agressivement le prospect.",
    "status": "approved",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "obj-009",
    "code": "OBJ-BUDGET",
    "objection": "« Aucun budget n’est prévu »",
    "category": "price",
    "segmentCodes": [
      "CRECHE_PRIVATE",
      "PRESCHOOL",
      "CORPORATE"
    ],
    "offerCodes": [
      "ACADEMY_ONSITE",
      "ACADEMY_ELEARNING"
    ],
    "diagnosticQuestions": [
      "Qu’est-ce qui vous fait dire cela ?",
      "Quelle condition changerait votre décision ?",
      "Qui doit être impliqué pour décider ?"
    ],
    "responseFramework": [
      "Identifier cycle budgétaire, sponsor et petite première étape autorisée.",
      "Reformuler la réponse du prospect.",
      "Proposer une prochaine étape adaptée et mesurable."
    ],
    "evidenceRefs": [
      "KNW-ASSET-016"
    ],
    "escalationTrigger": "Escalader si l’objection implique prix exceptionnel, engagement contractuel ou risque sensible.",
    "prohibitedResponse": "Promettre un résultat, inventer une remise ou contester agressivement le prospect.",
    "status": "in-review",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "obj-010",
    "code": "OBJ-NEED",
    "objection": "« Nous n’avons pas besoin de formation »",
    "category": "need",
    "segmentCodes": [
      "CRECHE_PRIVATE",
      "PRESCHOOL",
      "CORPORATE"
    ],
    "offerCodes": [
      "ACADEMY_ONSITE",
      "ACADEMY_ELEARNING"
    ],
    "diagnosticQuestions": [
      "Qu’est-ce qui vous fait dire cela ?",
      "Quelle condition changerait votre décision ?",
      "Qui doit être impliqué pour décider ?"
    ],
    "responseFramework": [
      "Explorer incidents, objectifs, turnover, parents et standards avant d’accepter ou disqualifier.",
      "Reformuler la réponse du prospect.",
      "Proposer une prochaine étape adaptée et mesurable."
    ],
    "evidenceRefs": [
      "KNW-ASSET-016"
    ],
    "escalationTrigger": "Escalader si l’objection implique prix exceptionnel, engagement contractuel ou risque sensible.",
    "prohibitedResponse": "Promettre un résultat, inventer une remise ou contester agressivement le prospect.",
    "status": "in-review",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "obj-011",
    "code": "OBJ-RISK",
    "objection": "« Nous craignons de perturber l’activité »",
    "category": "risk",
    "segmentCodes": [
      "CRECHE_PRIVATE",
      "PRESCHOOL",
      "CORPORATE"
    ],
    "offerCodes": [
      "ACADEMY_ONSITE",
      "ACADEMY_ELEARNING"
    ],
    "diagnosticQuestions": [
      "Qu’est-ce qui vous fait dire cela ?",
      "Quelle condition changerait votre décision ?",
      "Qui doit être impliqué pour décider ?"
    ],
    "responseFramework": [
      "Cartographier le risque et les options de déploiement progressif.",
      "Reformuler la réponse du prospect.",
      "Proposer une prochaine étape adaptée et mesurable."
    ],
    "evidenceRefs": [
      "KNW-ASSET-016"
    ],
    "escalationTrigger": "Escalader si l’objection implique prix exceptionnel, engagement contractuel ou risque sensible.",
    "prohibitedResponse": "Promettre un résultat, inventer une remise ou contester agressivement le prospect.",
    "status": "in-review",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "obj-012",
    "code": "OBJ-RESULT",
    "objection": "« Comment savoir que cela fonctionnera ? »",
    "category": "trust",
    "segmentCodes": [
      "CRECHE_PRIVATE",
      "PRESCHOOL",
      "CORPORATE"
    ],
    "offerCodes": [
      "ACADEMY_ONSITE",
      "ACADEMY_ELEARNING"
    ],
    "diagnosticQuestions": [
      "Qu’est-ce qui vous fait dire cela ?",
      "Quelle condition changerait votre décision ?",
      "Qui doit être impliqué pour décider ?"
    ],
    "responseFramework": [
      "Présenter objectifs, méthode, indicateurs et limites sans garantie.",
      "Reformuler la réponse du prospect.",
      "Proposer une prochaine étape adaptée et mesurable."
    ],
    "evidenceRefs": [
      "KNW-ASSET-016"
    ],
    "escalationTrigger": "Escalader si l’objection implique prix exceptionnel, engagement contractuel ou risque sensible.",
    "prohibitedResponse": "Promettre un résultat, inventer une remise ou contester agressivement le prospect.",
    "status": "in-review",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  }
]

export const REVENUE_KNOWLEDGE_SEED_CASES: RevenueCaseStudy[] = [
  {
    "id": "case-001",
    "code": "CASE-ACADEMY-WARM",
    "title": "Accélération d’un prospect Academy déjà exposé au catalogue",
    "caseType": "success",
    "businessUnitCode": "ACADEMY",
    "segmentCode": "CRECHE_PRIVATE",
    "marketCode": "RABAT",
    "context": "Catalogue reçu, intérêt signalé, mais aucune prochaine action.",
    "problem": "Risque de refroidissement avant la fenêtre de rentrée",
    "actions": [
      "Reconstruction du contexte",
      "Appel court orienté diagnostic",
      "Deux créneaux proposés"
    ],
    "outcome": "Rendez-vous diagnostic obtenu",
    "measurableSignals": {
      "evidence_status": "documented",
      "confidence": "medium"
    },
    "lessons": [
      "Le suivi contextualisé est supérieur à une relance générique."
    ],
    "reusablePatterns": [
      "diagnostic-first",
      "next-action",
      "capacity-aware"
    ],
    "evidenceRefs": [
      "KNW-ASSET-017"
    ],
    "status": "approved",
    "confidentiality": "restricted",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "case-002",
    "code": "CASE-PLV-SPACE",
    "title": "Qualification d’un partenaire PLV avec contrainte d’espace",
    "caseType": "recovery",
    "businessUnitCode": "FLASHCARDS",
    "segmentCode": "ORTHOPHONIST",
    "marketCode": "CASABLANCA",
    "context": "Le partenaire apprécie le produit mais refuse un grand présentoir.",
    "problem": "Configuration initiale inadéquate",
    "actions": [
      "Qualification de l’espace",
      "Proposition d’un format plus compact",
      "Validation logistique"
    ],
    "outcome": "Intérêt réouvert sous condition de configuration",
    "measurableSignals": {
      "evidence_status": "documented",
      "confidence": "medium"
    },
    "lessons": [
      "La contrainte physique doit être qualifiée avant l’offre."
    ],
    "reusablePatterns": [
      "diagnostic-first",
      "next-action",
      "capacity-aware"
    ],
    "evidenceRefs": [
      "KNW-ASSET-018"
    ],
    "status": "approved",
    "confidentiality": "restricted",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "case-003",
    "code": "CASE-PRICE-DISCOUNT",
    "title": "Remise proposée trop tôt",
    "caseType": "failure",
    "businessUnitCode": "ACADEMY",
    "segmentCode": "CRECHE_PRIVATE",
    "marketCode": "KENITRA",
    "context": "Une remise a été évoquée avant qualification de la valeur.",
    "problem": "Marge fragilisée et absence de contrepartie",
    "actions": [
      "Revue de l’échange",
      "Retour au diagnostic",
      "Nouvelle proposition structurée"
    ],
    "outcome": "Opportunité restée incertaine",
    "measurableSignals": {
      "evidence_status": "documented",
      "confidence": "medium"
    },
    "lessons": [
      "La remise ne remplace pas une proposition de valeur claire."
    ],
    "reusablePatterns": [
      "diagnostic-first",
      "next-action",
      "capacity-aware"
    ],
    "evidenceRefs": [
      "KNW-ASSET-018"
    ],
    "status": "approved",
    "confidentiality": "restricted",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "case-004",
    "code": "CASE-HOSPITALITY-CYCLE",
    "title": "Partenariat hôtelier avec cycle de décision multi-acteurs",
    "caseType": "success",
    "businessUnitCode": "HOSPITALITY",
    "segmentCode": "HOTEL",
    "marketCode": "MARRAKECH",
    "context": "Intérêt opérationnel mais décision répartie entre direction, opérations et finance.",
    "problem": "Absence de sponsor unique",
    "actions": [
      "Carte des parties prenantes",
      "Réunion multi-acteurs",
      "Plan de preuve et pilote"
    ],
    "outcome": "Décision structurée sur un pilote",
    "measurableSignals": {
      "evidence_status": "documented",
      "confidence": "medium"
    },
    "lessons": [
      "Les comptes complexes exigent une stratégie de coalition."
    ],
    "reusablePatterns": [
      "diagnostic-first",
      "next-action",
      "capacity-aware"
    ],
    "evidenceRefs": [
      "KNW-ASSET-017"
    ],
    "status": "approved",
    "confidentiality": "restricted",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "case-005",
    "code": "CASE-CORPORATE-NO-SPONSOR",
    "title": "Compte corporate sans sponsor interne",
    "caseType": "failure",
    "businessUnitCode": "CORPORATES",
    "segmentCode": "CORPORATE",
    "marketCode": "CASABLANCA",
    "context": "Contact RH intéressé mais sans enjeu prioritaire ni sponsor.",
    "problem": "Conversation active sans chemin de décision",
    "actions": [
      "Qualification du problème",
      "Recherche du sponsor",
      "Stop condition"
    ],
    "outcome": "Compte mis en nurturing au lieu de surcharger le pipeline",
    "measurableSignals": {
      "evidence_status": "documented",
      "confidence": "medium"
    },
    "lessons": [
      "Un contact intéressé n’est pas une opportunité qualifiée."
    ],
    "reusablePatterns": [
      "diagnostic-first",
      "next-action",
      "capacity-aware"
    ],
    "evidenceRefs": [
      "KNW-ASSET-018"
    ],
    "status": "in-review",
    "confidentiality": "restricted",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "case-006",
    "code": "CASE-RENEWAL-TEAMCHANGE",
    "title": "Renouvellement déclenché par évolution d’équipe",
    "caseType": "success",
    "businessUnitCode": "ACADEMY",
    "segmentCode": "PRESCHOOL",
    "marketCode": "RABAT",
    "context": "Nouveaux collaborateurs après une première formation.",
    "problem": "Besoin de continuité des standards",
    "actions": [
      "Revue des changements",
      "Parcours de mise à niveau",
      "Calendrier adapté"
    ],
    "outcome": "Extension du parcours proposée",
    "measurableSignals": {
      "evidence_status": "documented",
      "confidence": "medium"
    },
    "lessons": [
      "Les changements d’équipe constituent un signal de renouvellement."
    ],
    "reusablePatterns": [
      "diagnostic-first",
      "next-action",
      "capacity-aware"
    ],
    "evidenceRefs": [
      "KNW-ASSET-017"
    ],
    "status": "in-review",
    "confidentiality": "restricted",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "case-007",
    "code": "CASE-HOME-CAPACITY",
    "title": "Campagne Home Service sans capacité suffisante",
    "caseType": "failure",
    "businessUnitCode": "HOME_SERVICE",
    "segmentCode": "FAMILY",
    "marketCode": "CASABLANCA",
    "context": "Demande activée dans une zone sous tension opérationnelle.",
    "problem": "Risque de survente",
    "actions": [
      "Gel de la campagne",
      "Validation couverture",
      "Réorientation géographique"
    ],
    "outcome": "Campagne limitée à la capacité confirmée",
    "measurableSignals": {
      "evidence_status": "documented",
      "confidence": "medium"
    },
    "lessons": [
      "La capacité est un gate stratégique, pas une note opérationnelle."
    ],
    "reusablePatterns": [
      "diagnostic-first",
      "next-action",
      "capacity-aware"
    ],
    "evidenceRefs": [
      "KNW-ASSET-018"
    ],
    "status": "in-review",
    "confidentiality": "restricted",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "case-008",
    "code": "CASE-SEASONAL-LATE",
    "title": "Campagne rentrée lancée trop tard",
    "caseType": "failure",
    "businessUnitCode": "ACADEMY",
    "segmentCode": "CRECHE_PRIVATE",
    "marketCode": "RABAT",
    "context": "La campagne commence après la période de décision principale.",
    "problem": "Coût du retard élevé",
    "actions": [
      "Analyse de la fenêtre",
      "Réactivation des comptes chauds",
      "Planification anticipée du cycle suivant"
    ],
    "outcome": "Résultats limités et doctrine saisonnière renforcée",
    "measurableSignals": {
      "evidence_status": "documented",
      "confidence": "medium"
    },
    "lessons": [
      "La préparation doit commencer avant la fenêtre visible."
    ],
    "reusablePatterns": [
      "diagnostic-first",
      "next-action",
      "capacity-aware"
    ],
    "evidenceRefs": [
      "KNW-ASSET-018"
    ],
    "status": "in-review",
    "confidentiality": "restricted",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  }
]

export const REVENUE_KNOWLEDGE_SEED_CAMPAIGN_PATTERNS: RevenueCampaignPattern[] = [
  {
    "id": "pattern-001",
    "code": "PATTERN-PRE-RENTREE",
    "name": "Capture pré-rentrée",
    "patternType": "seasonal",
    "objective": "Transformer la fenêtre de préparation en rendez-vous qualifiés",
    "applicability": [
      "academy",
      "preschool"
    ],
    "sequence": [
      "Segmenter comptes chauds",
      "Personnaliser par priorité",
      "Proposer diagnostic",
      "Suivre sous SLA"
    ],
    "requiredSignals": [
      "offer_active",
      "capacity_confirmable",
      "approved_evidence"
    ],
    "stopConditions": [
      "authority_missing_after_defined_attempts",
      "capacity_blocked",
      "explicit_refusal"
    ],
    "successMetrics": [
      "qualified_reply_rate",
      "meeting_rate",
      "progression_rate"
    ],
    "riskControls": [
      "doctrine_check",
      "capacity_gate",
      "approval_gate"
    ],
    "status": "approved",
    "version": "1.0",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "pattern-002",
    "code": "PATTERN-TERRITORY-WAVE",
    "name": "Vagues de capture territoriale",
    "patternType": "territory-capture",
    "objective": "Concentrer effort, preuve et suivi sur une zone livrable",
    "applicability": [
      "b2b",
      "city"
    ],
    "sequence": [
      "Scorer les comptes",
      "Construire vagues",
      "Assigner capacité",
      "Mesurer densité"
    ],
    "requiredSignals": [
      "offer_active",
      "capacity_confirmable",
      "approved_evidence"
    ],
    "stopConditions": [
      "authority_missing_after_defined_attempts",
      "capacity_blocked",
      "explicit_refusal"
    ],
    "successMetrics": [
      "qualified_reply_rate",
      "meeting_rate",
      "progression_rate"
    ],
    "riskControls": [
      "doctrine_check",
      "capacity_gate",
      "approval_gate"
    ],
    "status": "approved",
    "version": "1.0",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "pattern-003",
    "code": "PATTERN-STALLED-RESCUE",
    "name": "Récupération pipeline bloqué",
    "patternType": "pipeline-rescue",
    "objective": "Réduire la stagnation avec diagnostic et nouvelle hypothèse",
    "applicability": [
      "pipeline",
      "all-units"
    ],
    "sequence": [
      "Classer la cause",
      "Sélectionner intervention",
      "Définir stop condition",
      "Mesurer récupération"
    ],
    "requiredSignals": [
      "offer_active",
      "capacity_confirmable",
      "approved_evidence"
    ],
    "stopConditions": [
      "authority_missing_after_defined_attempts",
      "capacity_blocked",
      "explicit_refusal"
    ],
    "successMetrics": [
      "qualified_reply_rate",
      "meeting_rate",
      "progression_rate"
    ],
    "riskControls": [
      "doctrine_check",
      "capacity_gate",
      "approval_gate"
    ],
    "status": "approved",
    "version": "1.0",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "pattern-004",
    "code": "PATTERN-PARTNER-LAUNCH",
    "name": "Lancement programme partenaire",
    "patternType": "launch",
    "objective": "Activer un réseau initial avec conditions et capacité vérifiées",
    "applicability": [
      "flashcards",
      "academy"
    ],
    "sequence": [
      "Définir ICP",
      "Préparer preuve",
      "Séquence direction",
      "Onboarding partenaire"
    ],
    "requiredSignals": [
      "offer_active",
      "capacity_confirmable",
      "approved_evidence"
    ],
    "stopConditions": [
      "authority_missing_after_defined_attempts",
      "capacity_blocked",
      "explicit_refusal"
    ],
    "successMetrics": [
      "qualified_reply_rate",
      "meeting_rate",
      "progression_rate"
    ],
    "riskControls": [
      "doctrine_check",
      "capacity_gate",
      "approval_gate"
    ],
    "status": "approved",
    "version": "1.0",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "pattern-005",
    "code": "PATTERN-REFERRAL",
    "name": "Activation recommandation",
    "patternType": "referral",
    "objective": "Transformer satisfaction documentée en introductions qualifiées",
    "applicability": [
      "all-units"
    ],
    "sequence": [
      "Vérifier satisfaction",
      "Demander introduction précise",
      "Tracer source",
      "Remercier partenaire"
    ],
    "requiredSignals": [
      "offer_active",
      "capacity_confirmable",
      "approved_evidence"
    ],
    "stopConditions": [
      "authority_missing_after_defined_attempts",
      "capacity_blocked",
      "explicit_refusal"
    ],
    "successMetrics": [
      "qualified_reply_rate",
      "meeting_rate",
      "progression_rate"
    ],
    "riskControls": [
      "doctrine_check",
      "capacity_gate",
      "approval_gate"
    ],
    "status": "approved",
    "version": "1.0",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "pattern-006",
    "code": "PATTERN-RENEWAL",
    "name": "Revue avant renouvellement",
    "patternType": "renewal",
    "objective": "Anticiper valeur, changement et décision avant échéance",
    "applicability": [
      "academy",
      "corporate"
    ],
    "sequence": [
      "Analyser usage",
      "Identifier changements",
      "Construire options",
      "Décider avant échéance"
    ],
    "requiredSignals": [
      "offer_active",
      "capacity_confirmable",
      "approved_evidence"
    ],
    "stopConditions": [
      "authority_missing_after_defined_attempts",
      "capacity_blocked",
      "explicit_refusal"
    ],
    "successMetrics": [
      "qualified_reply_rate",
      "meeting_rate",
      "progression_rate"
    ],
    "riskControls": [
      "doctrine_check",
      "capacity_gate",
      "approval_gate"
    ],
    "status": "in-review",
    "version": "1.0",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "pattern-007",
    "code": "PATTERN-CROSSSELL",
    "name": "Cross-sell fondé sur signal",
    "patternType": "cross-sell",
    "objective": "Proposer une offre complémentaire uniquement après signal d’adéquation",
    "applicability": [
      "academy",
      "flashcards"
    ],
    "sequence": [
      "Détecter signal",
      "Vérifier éligibilité",
      "Relier valeur",
      "Proposer étape"
    ],
    "requiredSignals": [
      "offer_active",
      "capacity_confirmable",
      "approved_evidence"
    ],
    "stopConditions": [
      "authority_missing_after_defined_attempts",
      "capacity_blocked",
      "explicit_refusal"
    ],
    "successMetrics": [
      "qualified_reply_rate",
      "meeting_rate",
      "progression_rate"
    ],
    "riskControls": [
      "doctrine_check",
      "capacity_gate",
      "approval_gate"
    ],
    "status": "in-review",
    "version": "1.0",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  }
]

export const REVENUE_KNOWLEDGE_SEED_PLAYBOOKS: RevenuePlaybook[] = [
  {
    "id": "play-001",
    "code": "PLAY-ACADEMY-PARTNER",
    "name": "Activation partenaire Academy",
    "objective": "Exécuter activation partenaire academy de manière gouvernée et mesurable.",
    "businessUnitCodes": [
      "ACADEMY"
    ],
    "segmentCodes": [
      "CRECHE_PRIVATE",
      "PRESCHOOL"
    ],
    "trigger": "Prospect qualifié ou objectif de capture approuvé",
    "preconditions": [
      "Données minimales disponibles",
      "Offre active",
      "Absence de restriction bloquante"
    ],
    "steps": [
      {
        "code": "PLAY-ACADEMY-PARTNER-S1",
        "order": 1,
        "name": "Construire le contexte",
        "purpose": "Construire le contexte",
        "instructions": [
          "Récupérer uniquement les données autorisées.",
          "Appliquer les règles et restrictions effectives.",
          "Documenter tout écart ou hypothèse."
        ],
        "requiredInputs": [
          "entity_context",
          "effective_doctrines"
        ],
        "expectedOutputs": [
          "structured_result",
          "next_action"
        ],
        "evidenceRequired": [
          "execution_note",
          "status_update"
        ],
        "responsibleRole": "Revenue Operations",
        "slaHours": 4,
        "approvalRequired": false,
        "recoveryRoute": "Escalader au Revenue Operations Lead avec contexte et recommandation."
      },
      {
        "code": "PLAY-ACADEMY-PARTNER-S2",
        "order": 2,
        "name": "Valider doctrine et capacité",
        "purpose": "Valider doctrine et capacité",
        "instructions": [
          "Récupérer uniquement les données autorisées.",
          "Appliquer les règles et restrictions effectives.",
          "Documenter tout écart ou hypothèse."
        ],
        "requiredInputs": [
          "entity_context",
          "effective_doctrines"
        ],
        "expectedOutputs": [
          "structured_result",
          "next_action"
        ],
        "evidenceRequired": [
          "execution_note",
          "status_update"
        ],
        "responsibleRole": "Revenue Operations",
        "slaHours": 4,
        "approvalRequired": false,
        "recoveryRoute": "Escalader au Revenue Operations Lead avec contexte et recommandation."
      },
      {
        "code": "PLAY-ACADEMY-PARTNER-S3",
        "order": 3,
        "name": "Exécuter l’action commerciale",
        "purpose": "Exécuter l’action commerciale",
        "instructions": [
          "Récupérer uniquement les données autorisées.",
          "Appliquer les règles et restrictions effectives.",
          "Documenter tout écart ou hypothèse."
        ],
        "requiredInputs": [
          "entity_context",
          "effective_doctrines"
        ],
        "expectedOutputs": [
          "structured_result",
          "next_action"
        ],
        "evidenceRequired": [
          "execution_note",
          "status_update"
        ],
        "responsibleRole": "B2B Development Agent",
        "slaHours": 24,
        "approvalRequired": true,
        "recoveryRoute": "Escalader au Revenue Operations Lead avec contexte et recommandation."
      },
      {
        "code": "PLAY-ACADEMY-PARTNER-S4",
        "order": 4,
        "name": "Capturer preuves et objections",
        "purpose": "Capturer preuves et objections",
        "instructions": [
          "Récupérer uniquement les données autorisées.",
          "Appliquer les règles et restrictions effectives.",
          "Documenter tout écart ou hypothèse."
        ],
        "requiredInputs": [
          "entity_context",
          "effective_doctrines"
        ],
        "expectedOutputs": [
          "structured_result",
          "next_action"
        ],
        "evidenceRequired": [
          "execution_note",
          "status_update"
        ],
        "responsibleRole": "B2B Development Agent",
        "slaHours": 24,
        "approvalRequired": false,
        "recoveryRoute": "Escalader au Revenue Operations Lead avec contexte et recommandation."
      },
      {
        "code": "PLAY-ACADEMY-PARTNER-S5",
        "order": 5,
        "name": "Définir la prochaine action",
        "purpose": "Définir la prochaine action",
        "instructions": [
          "Récupérer uniquement les données autorisées.",
          "Appliquer les règles et restrictions effectives.",
          "Documenter tout écart ou hypothèse."
        ],
        "requiredInputs": [
          "entity_context",
          "effective_doctrines"
        ],
        "expectedOutputs": [
          "structured_result",
          "next_action"
        ],
        "evidenceRequired": [
          "execution_note",
          "status_update"
        ],
        "responsibleRole": "B2B Development Agent",
        "slaHours": 24,
        "approvalRequired": false,
        "recoveryRoute": "Escalader au Revenue Operations Lead avec contexte et recommandation."
      },
      {
        "code": "PLAY-ACADEMY-PARTNER-S6",
        "order": 6,
        "name": "Contrôler résultat et escalade",
        "purpose": "Contrôler résultat et escalade",
        "instructions": [
          "Récupérer uniquement les données autorisées.",
          "Appliquer les règles et restrictions effectives.",
          "Documenter tout écart ou hypothèse."
        ],
        "requiredInputs": [
          "entity_context",
          "effective_doctrines"
        ],
        "expectedOutputs": [
          "structured_result",
          "next_action"
        ],
        "evidenceRequired": [
          "execution_note",
          "status_update"
        ],
        "responsibleRole": "B2B Development Agent",
        "slaHours": 24,
        "approvalRequired": false,
        "recoveryRoute": "Escalader au Revenue Operations Lead avec contexte et recommandation."
      }
    ],
    "completionRule": "Résultat commercial documenté et prochaine action datée, ou disqualification justifiée.",
    "escalationPolicy": "Escalader tout prix, engagement, risque sensible ou blocage de capacité.",
    "status": "approved",
    "version": "1.0",
    "ownerRole": "Revenue Operations Lead",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "play-002",
    "code": "PLAY-FLASHCARDS-PLV",
    "name": "Activation Flashcards PLV",
    "objective": "Exécuter activation flashcards plv de manière gouvernée et mesurable.",
    "businessUnitCodes": [
      "FLASHCARDS"
    ],
    "segmentCodes": [
      "CRECHE_PRIVATE",
      "ORTHOPHONIST",
      "MATERNITY_CLINIC"
    ],
    "trigger": "Compte compatible avec point de vente ou usage professionnel",
    "preconditions": [
      "Données minimales disponibles",
      "Offre active",
      "Absence de restriction bloquante"
    ],
    "steps": [
      {
        "code": "PLAY-FLASHCARDS-PLV-S1",
        "order": 1,
        "name": "Construire le contexte",
        "purpose": "Construire le contexte",
        "instructions": [
          "Récupérer uniquement les données autorisées.",
          "Appliquer les règles et restrictions effectives.",
          "Documenter tout écart ou hypothèse."
        ],
        "requiredInputs": [
          "entity_context",
          "effective_doctrines"
        ],
        "expectedOutputs": [
          "structured_result",
          "next_action"
        ],
        "evidenceRequired": [
          "execution_note",
          "status_update"
        ],
        "responsibleRole": "Revenue Operations",
        "slaHours": 4,
        "approvalRequired": false,
        "recoveryRoute": "Escalader au Revenue Operations Lead avec contexte et recommandation."
      },
      {
        "code": "PLAY-FLASHCARDS-PLV-S2",
        "order": 2,
        "name": "Valider doctrine et capacité",
        "purpose": "Valider doctrine et capacité",
        "instructions": [
          "Récupérer uniquement les données autorisées.",
          "Appliquer les règles et restrictions effectives.",
          "Documenter tout écart ou hypothèse."
        ],
        "requiredInputs": [
          "entity_context",
          "effective_doctrines"
        ],
        "expectedOutputs": [
          "structured_result",
          "next_action"
        ],
        "evidenceRequired": [
          "execution_note",
          "status_update"
        ],
        "responsibleRole": "Revenue Operations",
        "slaHours": 4,
        "approvalRequired": false,
        "recoveryRoute": "Escalader au Revenue Operations Lead avec contexte et recommandation."
      },
      {
        "code": "PLAY-FLASHCARDS-PLV-S3",
        "order": 3,
        "name": "Exécuter l’action commerciale",
        "purpose": "Exécuter l’action commerciale",
        "instructions": [
          "Récupérer uniquement les données autorisées.",
          "Appliquer les règles et restrictions effectives.",
          "Documenter tout écart ou hypothèse."
        ],
        "requiredInputs": [
          "entity_context",
          "effective_doctrines"
        ],
        "expectedOutputs": [
          "structured_result",
          "next_action"
        ],
        "evidenceRequired": [
          "execution_note",
          "status_update"
        ],
        "responsibleRole": "B2B Development Agent",
        "slaHours": 24,
        "approvalRequired": true,
        "recoveryRoute": "Escalader au Revenue Operations Lead avec contexte et recommandation."
      },
      {
        "code": "PLAY-FLASHCARDS-PLV-S4",
        "order": 4,
        "name": "Capturer preuves et objections",
        "purpose": "Capturer preuves et objections",
        "instructions": [
          "Récupérer uniquement les données autorisées.",
          "Appliquer les règles et restrictions effectives.",
          "Documenter tout écart ou hypothèse."
        ],
        "requiredInputs": [
          "entity_context",
          "effective_doctrines"
        ],
        "expectedOutputs": [
          "structured_result",
          "next_action"
        ],
        "evidenceRequired": [
          "execution_note",
          "status_update"
        ],
        "responsibleRole": "B2B Development Agent",
        "slaHours": 24,
        "approvalRequired": false,
        "recoveryRoute": "Escalader au Revenue Operations Lead avec contexte et recommandation."
      },
      {
        "code": "PLAY-FLASHCARDS-PLV-S5",
        "order": 5,
        "name": "Définir la prochaine action",
        "purpose": "Définir la prochaine action",
        "instructions": [
          "Récupérer uniquement les données autorisées.",
          "Appliquer les règles et restrictions effectives.",
          "Documenter tout écart ou hypothèse."
        ],
        "requiredInputs": [
          "entity_context",
          "effective_doctrines"
        ],
        "expectedOutputs": [
          "structured_result",
          "next_action"
        ],
        "evidenceRequired": [
          "execution_note",
          "status_update"
        ],
        "responsibleRole": "B2B Development Agent",
        "slaHours": 24,
        "approvalRequired": false,
        "recoveryRoute": "Escalader au Revenue Operations Lead avec contexte et recommandation."
      },
      {
        "code": "PLAY-FLASHCARDS-PLV-S6",
        "order": 6,
        "name": "Contrôler résultat et escalade",
        "purpose": "Contrôler résultat et escalade",
        "instructions": [
          "Récupérer uniquement les données autorisées.",
          "Appliquer les règles et restrictions effectives.",
          "Documenter tout écart ou hypothèse."
        ],
        "requiredInputs": [
          "entity_context",
          "effective_doctrines"
        ],
        "expectedOutputs": [
          "structured_result",
          "next_action"
        ],
        "evidenceRequired": [
          "execution_note",
          "status_update"
        ],
        "responsibleRole": "B2B Development Agent",
        "slaHours": 24,
        "approvalRequired": false,
        "recoveryRoute": "Escalader au Revenue Operations Lead avec contexte et recommandation."
      }
    ],
    "completionRule": "Résultat commercial documenté et prochaine action datée, ou disqualification justifiée.",
    "escalationPolicy": "Escalader tout prix, engagement, risque sensible ou blocage de capacité.",
    "status": "approved",
    "version": "1.0",
    "ownerRole": "Revenue Operations Lead",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "play-003",
    "code": "PLAY-B2B-DIAGNOSTIC",
    "name": "Diagnostic B2B direction",
    "objective": "Exécuter diagnostic b2b direction de manière gouvernée et mesurable.",
    "businessUnitCodes": [
      "ACADEMY",
      "CORPORATES",
      "HOSPITALITY"
    ],
    "segmentCodes": [
      "CRECHE_PRIVATE",
      "CORPORATE",
      "HOTEL"
    ],
    "trigger": "Rendez-vous confirmé avec décideur ou sponsor",
    "preconditions": [
      "Données minimales disponibles",
      "Offre active",
      "Absence de restriction bloquante"
    ],
    "steps": [
      {
        "code": "PLAY-B2B-DIAGNOSTIC-S1",
        "order": 1,
        "name": "Construire le contexte",
        "purpose": "Construire le contexte",
        "instructions": [
          "Récupérer uniquement les données autorisées.",
          "Appliquer les règles et restrictions effectives.",
          "Documenter tout écart ou hypothèse."
        ],
        "requiredInputs": [
          "entity_context",
          "effective_doctrines"
        ],
        "expectedOutputs": [
          "structured_result",
          "next_action"
        ],
        "evidenceRequired": [
          "execution_note",
          "status_update"
        ],
        "responsibleRole": "Revenue Operations",
        "slaHours": 4,
        "approvalRequired": false,
        "recoveryRoute": "Escalader au Revenue Operations Lead avec contexte et recommandation."
      },
      {
        "code": "PLAY-B2B-DIAGNOSTIC-S2",
        "order": 2,
        "name": "Valider doctrine et capacité",
        "purpose": "Valider doctrine et capacité",
        "instructions": [
          "Récupérer uniquement les données autorisées.",
          "Appliquer les règles et restrictions effectives.",
          "Documenter tout écart ou hypothèse."
        ],
        "requiredInputs": [
          "entity_context",
          "effective_doctrines"
        ],
        "expectedOutputs": [
          "structured_result",
          "next_action"
        ],
        "evidenceRequired": [
          "execution_note",
          "status_update"
        ],
        "responsibleRole": "Revenue Operations",
        "slaHours": 4,
        "approvalRequired": false,
        "recoveryRoute": "Escalader au Revenue Operations Lead avec contexte et recommandation."
      },
      {
        "code": "PLAY-B2B-DIAGNOSTIC-S3",
        "order": 3,
        "name": "Exécuter l’action commerciale",
        "purpose": "Exécuter l’action commerciale",
        "instructions": [
          "Récupérer uniquement les données autorisées.",
          "Appliquer les règles et restrictions effectives.",
          "Documenter tout écart ou hypothèse."
        ],
        "requiredInputs": [
          "entity_context",
          "effective_doctrines"
        ],
        "expectedOutputs": [
          "structured_result",
          "next_action"
        ],
        "evidenceRequired": [
          "execution_note",
          "status_update"
        ],
        "responsibleRole": "B2B Development Agent",
        "slaHours": 24,
        "approvalRequired": true,
        "recoveryRoute": "Escalader au Revenue Operations Lead avec contexte et recommandation."
      },
      {
        "code": "PLAY-B2B-DIAGNOSTIC-S4",
        "order": 4,
        "name": "Capturer preuves et objections",
        "purpose": "Capturer preuves et objections",
        "instructions": [
          "Récupérer uniquement les données autorisées.",
          "Appliquer les règles et restrictions effectives.",
          "Documenter tout écart ou hypothèse."
        ],
        "requiredInputs": [
          "entity_context",
          "effective_doctrines"
        ],
        "expectedOutputs": [
          "structured_result",
          "next_action"
        ],
        "evidenceRequired": [
          "execution_note",
          "status_update"
        ],
        "responsibleRole": "B2B Development Agent",
        "slaHours": 24,
        "approvalRequired": false,
        "recoveryRoute": "Escalader au Revenue Operations Lead avec contexte et recommandation."
      },
      {
        "code": "PLAY-B2B-DIAGNOSTIC-S5",
        "order": 5,
        "name": "Définir la prochaine action",
        "purpose": "Définir la prochaine action",
        "instructions": [
          "Récupérer uniquement les données autorisées.",
          "Appliquer les règles et restrictions effectives.",
          "Documenter tout écart ou hypothèse."
        ],
        "requiredInputs": [
          "entity_context",
          "effective_doctrines"
        ],
        "expectedOutputs": [
          "structured_result",
          "next_action"
        ],
        "evidenceRequired": [
          "execution_note",
          "status_update"
        ],
        "responsibleRole": "B2B Development Agent",
        "slaHours": 24,
        "approvalRequired": false,
        "recoveryRoute": "Escalader au Revenue Operations Lead avec contexte et recommandation."
      },
      {
        "code": "PLAY-B2B-DIAGNOSTIC-S6",
        "order": 6,
        "name": "Contrôler résultat et escalade",
        "purpose": "Contrôler résultat et escalade",
        "instructions": [
          "Récupérer uniquement les données autorisées.",
          "Appliquer les règles et restrictions effectives.",
          "Documenter tout écart ou hypothèse."
        ],
        "requiredInputs": [
          "entity_context",
          "effective_doctrines"
        ],
        "expectedOutputs": [
          "structured_result",
          "next_action"
        ],
        "evidenceRequired": [
          "execution_note",
          "status_update"
        ],
        "responsibleRole": "B2B Development Agent",
        "slaHours": 24,
        "approvalRequired": false,
        "recoveryRoute": "Escalader au Revenue Operations Lead avec contexte et recommandation."
      }
    ],
    "completionRule": "Résultat commercial documenté et prochaine action datée, ou disqualification justifiée.",
    "escalationPolicy": "Escalader tout prix, engagement, risque sensible ou blocage de capacité.",
    "status": "approved",
    "version": "1.0",
    "ownerRole": "Revenue Operations Lead",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "play-004",
    "code": "PLAY-PROPOSAL-CLOSE",
    "name": "Proposition et plan de clôture",
    "objective": "Exécuter proposition et plan de clôture de manière gouvernée et mesurable.",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "FLASHCARDS",
      "KINDERGARTEN",
      "HOSPITALITY",
      "CORPORATES",
      "EVENTS",
      "REFFERQ"
    ],
    "segmentCodes": [
      "CRECHE_PRIVATE",
      "CORPORATE",
      "HOTEL"
    ],
    "trigger": "Besoin, autorité, calendrier et faisabilité qualifiés",
    "preconditions": [
      "Données minimales disponibles",
      "Offre active",
      "Absence de restriction bloquante"
    ],
    "steps": [
      {
        "code": "PLAY-PROPOSAL-CLOSE-S1",
        "order": 1,
        "name": "Construire le contexte",
        "purpose": "Construire le contexte",
        "instructions": [
          "Récupérer uniquement les données autorisées.",
          "Appliquer les règles et restrictions effectives.",
          "Documenter tout écart ou hypothèse."
        ],
        "requiredInputs": [
          "entity_context",
          "effective_doctrines"
        ],
        "expectedOutputs": [
          "structured_result",
          "next_action"
        ],
        "evidenceRequired": [
          "execution_note",
          "status_update"
        ],
        "responsibleRole": "Revenue Operations",
        "slaHours": 4,
        "approvalRequired": false,
        "recoveryRoute": "Escalader au Revenue Operations Lead avec contexte et recommandation."
      },
      {
        "code": "PLAY-PROPOSAL-CLOSE-S2",
        "order": 2,
        "name": "Valider doctrine et capacité",
        "purpose": "Valider doctrine et capacité",
        "instructions": [
          "Récupérer uniquement les données autorisées.",
          "Appliquer les règles et restrictions effectives.",
          "Documenter tout écart ou hypothèse."
        ],
        "requiredInputs": [
          "entity_context",
          "effective_doctrines"
        ],
        "expectedOutputs": [
          "structured_result",
          "next_action"
        ],
        "evidenceRequired": [
          "execution_note",
          "status_update"
        ],
        "responsibleRole": "Revenue Operations",
        "slaHours": 4,
        "approvalRequired": false,
        "recoveryRoute": "Escalader au Revenue Operations Lead avec contexte et recommandation."
      },
      {
        "code": "PLAY-PROPOSAL-CLOSE-S3",
        "order": 3,
        "name": "Exécuter l’action commerciale",
        "purpose": "Exécuter l’action commerciale",
        "instructions": [
          "Récupérer uniquement les données autorisées.",
          "Appliquer les règles et restrictions effectives.",
          "Documenter tout écart ou hypothèse."
        ],
        "requiredInputs": [
          "entity_context",
          "effective_doctrines"
        ],
        "expectedOutputs": [
          "structured_result",
          "next_action"
        ],
        "evidenceRequired": [
          "execution_note",
          "status_update"
        ],
        "responsibleRole": "B2B Development Agent",
        "slaHours": 24,
        "approvalRequired": true,
        "recoveryRoute": "Escalader au Revenue Operations Lead avec contexte et recommandation."
      },
      {
        "code": "PLAY-PROPOSAL-CLOSE-S4",
        "order": 4,
        "name": "Capturer preuves et objections",
        "purpose": "Capturer preuves et objections",
        "instructions": [
          "Récupérer uniquement les données autorisées.",
          "Appliquer les règles et restrictions effectives.",
          "Documenter tout écart ou hypothèse."
        ],
        "requiredInputs": [
          "entity_context",
          "effective_doctrines"
        ],
        "expectedOutputs": [
          "structured_result",
          "next_action"
        ],
        "evidenceRequired": [
          "execution_note",
          "status_update"
        ],
        "responsibleRole": "B2B Development Agent",
        "slaHours": 24,
        "approvalRequired": false,
        "recoveryRoute": "Escalader au Revenue Operations Lead avec contexte et recommandation."
      },
      {
        "code": "PLAY-PROPOSAL-CLOSE-S5",
        "order": 5,
        "name": "Définir la prochaine action",
        "purpose": "Définir la prochaine action",
        "instructions": [
          "Récupérer uniquement les données autorisées.",
          "Appliquer les règles et restrictions effectives.",
          "Documenter tout écart ou hypothèse."
        ],
        "requiredInputs": [
          "entity_context",
          "effective_doctrines"
        ],
        "expectedOutputs": [
          "structured_result",
          "next_action"
        ],
        "evidenceRequired": [
          "execution_note",
          "status_update"
        ],
        "responsibleRole": "B2B Development Agent",
        "slaHours": 24,
        "approvalRequired": false,
        "recoveryRoute": "Escalader au Revenue Operations Lead avec contexte et recommandation."
      },
      {
        "code": "PLAY-PROPOSAL-CLOSE-S6",
        "order": 6,
        "name": "Contrôler résultat et escalade",
        "purpose": "Contrôler résultat et escalade",
        "instructions": [
          "Récupérer uniquement les données autorisées.",
          "Appliquer les règles et restrictions effectives.",
          "Documenter tout écart ou hypothèse."
        ],
        "requiredInputs": [
          "entity_context",
          "effective_doctrines"
        ],
        "expectedOutputs": [
          "structured_result",
          "next_action"
        ],
        "evidenceRequired": [
          "execution_note",
          "status_update"
        ],
        "responsibleRole": "B2B Development Agent",
        "slaHours": 24,
        "approvalRequired": false,
        "recoveryRoute": "Escalader au Revenue Operations Lead avec contexte et recommandation."
      }
    ],
    "completionRule": "Résultat commercial documenté et prochaine action datée, ou disqualification justifiée.",
    "escalationPolicy": "Escalader tout prix, engagement, risque sensible ou blocage de capacité.",
    "status": "approved",
    "version": "1.0",
    "ownerRole": "Revenue Operations Lead",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "play-005",
    "code": "PLAY-STALLED-RECOVERY",
    "name": "Récupération opportunité stagnante",
    "objective": "Exécuter récupération opportunité stagnante de manière gouvernée et mesurable.",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "FLASHCARDS",
      "KINDERGARTEN",
      "HOSPITALITY",
      "CORPORATES",
      "EVENTS",
      "REFFERQ"
    ],
    "segmentCodes": [
      "CRECHE_PRIVATE",
      "CORPORATE",
      "HOTEL"
    ],
    "trigger": "Aucune progression au-delà du seuil défini",
    "preconditions": [
      "Données minimales disponibles",
      "Offre active",
      "Absence de restriction bloquante"
    ],
    "steps": [
      {
        "code": "PLAY-STALLED-RECOVERY-S1",
        "order": 1,
        "name": "Construire le contexte",
        "purpose": "Construire le contexte",
        "instructions": [
          "Récupérer uniquement les données autorisées.",
          "Appliquer les règles et restrictions effectives.",
          "Documenter tout écart ou hypothèse."
        ],
        "requiredInputs": [
          "entity_context",
          "effective_doctrines"
        ],
        "expectedOutputs": [
          "structured_result",
          "next_action"
        ],
        "evidenceRequired": [
          "execution_note",
          "status_update"
        ],
        "responsibleRole": "Revenue Operations",
        "slaHours": 4,
        "approvalRequired": false,
        "recoveryRoute": "Escalader au Revenue Operations Lead avec contexte et recommandation."
      },
      {
        "code": "PLAY-STALLED-RECOVERY-S2",
        "order": 2,
        "name": "Valider doctrine et capacité",
        "purpose": "Valider doctrine et capacité",
        "instructions": [
          "Récupérer uniquement les données autorisées.",
          "Appliquer les règles et restrictions effectives.",
          "Documenter tout écart ou hypothèse."
        ],
        "requiredInputs": [
          "entity_context",
          "effective_doctrines"
        ],
        "expectedOutputs": [
          "structured_result",
          "next_action"
        ],
        "evidenceRequired": [
          "execution_note",
          "status_update"
        ],
        "responsibleRole": "Revenue Operations",
        "slaHours": 4,
        "approvalRequired": false,
        "recoveryRoute": "Escalader au Revenue Operations Lead avec contexte et recommandation."
      },
      {
        "code": "PLAY-STALLED-RECOVERY-S3",
        "order": 3,
        "name": "Exécuter l’action commerciale",
        "purpose": "Exécuter l’action commerciale",
        "instructions": [
          "Récupérer uniquement les données autorisées.",
          "Appliquer les règles et restrictions effectives.",
          "Documenter tout écart ou hypothèse."
        ],
        "requiredInputs": [
          "entity_context",
          "effective_doctrines"
        ],
        "expectedOutputs": [
          "structured_result",
          "next_action"
        ],
        "evidenceRequired": [
          "execution_note",
          "status_update"
        ],
        "responsibleRole": "B2B Development Agent",
        "slaHours": 24,
        "approvalRequired": true,
        "recoveryRoute": "Escalader au Revenue Operations Lead avec contexte et recommandation."
      },
      {
        "code": "PLAY-STALLED-RECOVERY-S4",
        "order": 4,
        "name": "Capturer preuves et objections",
        "purpose": "Capturer preuves et objections",
        "instructions": [
          "Récupérer uniquement les données autorisées.",
          "Appliquer les règles et restrictions effectives.",
          "Documenter tout écart ou hypothèse."
        ],
        "requiredInputs": [
          "entity_context",
          "effective_doctrines"
        ],
        "expectedOutputs": [
          "structured_result",
          "next_action"
        ],
        "evidenceRequired": [
          "execution_note",
          "status_update"
        ],
        "responsibleRole": "B2B Development Agent",
        "slaHours": 24,
        "approvalRequired": false,
        "recoveryRoute": "Escalader au Revenue Operations Lead avec contexte et recommandation."
      },
      {
        "code": "PLAY-STALLED-RECOVERY-S5",
        "order": 5,
        "name": "Définir la prochaine action",
        "purpose": "Définir la prochaine action",
        "instructions": [
          "Récupérer uniquement les données autorisées.",
          "Appliquer les règles et restrictions effectives.",
          "Documenter tout écart ou hypothèse."
        ],
        "requiredInputs": [
          "entity_context",
          "effective_doctrines"
        ],
        "expectedOutputs": [
          "structured_result",
          "next_action"
        ],
        "evidenceRequired": [
          "execution_note",
          "status_update"
        ],
        "responsibleRole": "B2B Development Agent",
        "slaHours": 24,
        "approvalRequired": false,
        "recoveryRoute": "Escalader au Revenue Operations Lead avec contexte et recommandation."
      },
      {
        "code": "PLAY-STALLED-RECOVERY-S6",
        "order": 6,
        "name": "Contrôler résultat et escalade",
        "purpose": "Contrôler résultat et escalade",
        "instructions": [
          "Récupérer uniquement les données autorisées.",
          "Appliquer les règles et restrictions effectives.",
          "Documenter tout écart ou hypothèse."
        ],
        "requiredInputs": [
          "entity_context",
          "effective_doctrines"
        ],
        "expectedOutputs": [
          "structured_result",
          "next_action"
        ],
        "evidenceRequired": [
          "execution_note",
          "status_update"
        ],
        "responsibleRole": "B2B Development Agent",
        "slaHours": 24,
        "approvalRequired": false,
        "recoveryRoute": "Escalader au Revenue Operations Lead avec contexte et recommandation."
      }
    ],
    "completionRule": "Résultat commercial documenté et prochaine action datée, ou disqualification justifiée.",
    "escalationPolicy": "Escalader tout prix, engagement, risque sensible ou blocage de capacité.",
    "status": "in-review",
    "version": "1.0",
    "ownerRole": "Revenue Operations Lead",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "play-006",
    "code": "PLAY-RENEWAL-REVIEW",
    "name": "Revue renouvellement et expansion",
    "objective": "Exécuter revue renouvellement et expansion de manière gouvernée et mesurable.",
    "businessUnitCodes": [
      "ACADEMY",
      "CORPORATES"
    ],
    "segmentCodes": [
      "CRECHE_PRIVATE",
      "CORPORATE"
    ],
    "trigger": "Échéance ou changement d’équipe détecté",
    "preconditions": [
      "Données minimales disponibles",
      "Offre active",
      "Absence de restriction bloquante"
    ],
    "steps": [
      {
        "code": "PLAY-RENEWAL-REVIEW-S1",
        "order": 1,
        "name": "Construire le contexte",
        "purpose": "Construire le contexte",
        "instructions": [
          "Récupérer uniquement les données autorisées.",
          "Appliquer les règles et restrictions effectives.",
          "Documenter tout écart ou hypothèse."
        ],
        "requiredInputs": [
          "entity_context",
          "effective_doctrines"
        ],
        "expectedOutputs": [
          "structured_result",
          "next_action"
        ],
        "evidenceRequired": [
          "execution_note",
          "status_update"
        ],
        "responsibleRole": "Revenue Operations",
        "slaHours": 4,
        "approvalRequired": false,
        "recoveryRoute": "Escalader au Revenue Operations Lead avec contexte et recommandation."
      },
      {
        "code": "PLAY-RENEWAL-REVIEW-S2",
        "order": 2,
        "name": "Valider doctrine et capacité",
        "purpose": "Valider doctrine et capacité",
        "instructions": [
          "Récupérer uniquement les données autorisées.",
          "Appliquer les règles et restrictions effectives.",
          "Documenter tout écart ou hypothèse."
        ],
        "requiredInputs": [
          "entity_context",
          "effective_doctrines"
        ],
        "expectedOutputs": [
          "structured_result",
          "next_action"
        ],
        "evidenceRequired": [
          "execution_note",
          "status_update"
        ],
        "responsibleRole": "Revenue Operations",
        "slaHours": 4,
        "approvalRequired": false,
        "recoveryRoute": "Escalader au Revenue Operations Lead avec contexte et recommandation."
      },
      {
        "code": "PLAY-RENEWAL-REVIEW-S3",
        "order": 3,
        "name": "Exécuter l’action commerciale",
        "purpose": "Exécuter l’action commerciale",
        "instructions": [
          "Récupérer uniquement les données autorisées.",
          "Appliquer les règles et restrictions effectives.",
          "Documenter tout écart ou hypothèse."
        ],
        "requiredInputs": [
          "entity_context",
          "effective_doctrines"
        ],
        "expectedOutputs": [
          "structured_result",
          "next_action"
        ],
        "evidenceRequired": [
          "execution_note",
          "status_update"
        ],
        "responsibleRole": "B2B Development Agent",
        "slaHours": 24,
        "approvalRequired": true,
        "recoveryRoute": "Escalader au Revenue Operations Lead avec contexte et recommandation."
      },
      {
        "code": "PLAY-RENEWAL-REVIEW-S4",
        "order": 4,
        "name": "Capturer preuves et objections",
        "purpose": "Capturer preuves et objections",
        "instructions": [
          "Récupérer uniquement les données autorisées.",
          "Appliquer les règles et restrictions effectives.",
          "Documenter tout écart ou hypothèse."
        ],
        "requiredInputs": [
          "entity_context",
          "effective_doctrines"
        ],
        "expectedOutputs": [
          "structured_result",
          "next_action"
        ],
        "evidenceRequired": [
          "execution_note",
          "status_update"
        ],
        "responsibleRole": "B2B Development Agent",
        "slaHours": 24,
        "approvalRequired": false,
        "recoveryRoute": "Escalader au Revenue Operations Lead avec contexte et recommandation."
      },
      {
        "code": "PLAY-RENEWAL-REVIEW-S5",
        "order": 5,
        "name": "Définir la prochaine action",
        "purpose": "Définir la prochaine action",
        "instructions": [
          "Récupérer uniquement les données autorisées.",
          "Appliquer les règles et restrictions effectives.",
          "Documenter tout écart ou hypothèse."
        ],
        "requiredInputs": [
          "entity_context",
          "effective_doctrines"
        ],
        "expectedOutputs": [
          "structured_result",
          "next_action"
        ],
        "evidenceRequired": [
          "execution_note",
          "status_update"
        ],
        "responsibleRole": "B2B Development Agent",
        "slaHours": 24,
        "approvalRequired": false,
        "recoveryRoute": "Escalader au Revenue Operations Lead avec contexte et recommandation."
      },
      {
        "code": "PLAY-RENEWAL-REVIEW-S6",
        "order": 6,
        "name": "Contrôler résultat et escalade",
        "purpose": "Contrôler résultat et escalade",
        "instructions": [
          "Récupérer uniquement les données autorisées.",
          "Appliquer les règles et restrictions effectives.",
          "Documenter tout écart ou hypothèse."
        ],
        "requiredInputs": [
          "entity_context",
          "effective_doctrines"
        ],
        "expectedOutputs": [
          "structured_result",
          "next_action"
        ],
        "evidenceRequired": [
          "execution_note",
          "status_update"
        ],
        "responsibleRole": "B2B Development Agent",
        "slaHours": 24,
        "approvalRequired": false,
        "recoveryRoute": "Escalader au Revenue Operations Lead avec contexte et recommandation."
      }
    ],
    "completionRule": "Résultat commercial documenté et prochaine action datée, ou disqualification justifiée.",
    "escalationPolicy": "Escalader tout prix, engagement, risque sensible ou blocage de capacité.",
    "status": "in-review",
    "version": "1.0",
    "ownerRole": "Revenue Operations Lead",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  }
]

export const REVENUE_KNOWLEDGE_SEED_RESTRICTIONS: RevenuePolicyRestriction[] = [
  {
    "id": "rest-001",
    "code": "REST-PRICE-VERIFY",
    "name": "Prix non vérifié",
    "restrictionType": "pricing",
    "scope": [
      "all-revenue-os"
    ],
    "rule": "Interdire tout prix sans registre actif",
    "prohibitedActions": [
      "Inventer un prix",
      "Réutiliser un ancien prix"
    ],
    "requiredApproverRole": "Direction Administrative & Financière",
    "escalationPath": "Escalader à Direction Administrative & Financière.",
    "severity": "critical",
    "status": "effective",
    "effectiveFrom": "2026-07-20",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "rest-002",
    "code": "REST-DISCOUNT",
    "name": "Remise non autorisée",
    "restrictionType": "discount",
    "scope": [
      "all-revenue-os"
    ],
    "rule": "Interdire toute remise hors seuil et autorité",
    "prohibitedActions": [
      "Promettre une remise",
      "Masquer la remise"
    ],
    "requiredApproverRole": "Managing Director",
    "escalationPath": "Escalader à Managing Director.",
    "severity": "critical",
    "status": "effective",
    "effectiveFrom": "2026-07-20",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "rest-003",
    "code": "REST-EXTERNAL",
    "name": "Action externe en Shadow",
    "restrictionType": "external-action",
    "scope": [
      "all-revenue-os"
    ],
    "rule": "Interdire envoi externe automatique en mode Shadow",
    "prohibitedActions": [
      "Envoyer WhatsApp",
      "Envoyer email",
      "Publier campagne"
    ],
    "requiredApproverRole": "Managing Director",
    "escalationPath": "Escalader à Managing Director.",
    "severity": "critical",
    "status": "effective",
    "effectiveFrom": "2026-07-20",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "rest-004",
    "code": "REST-CONTRACT",
    "name": "Engagement contractuel",
    "restrictionType": "legal",
    "scope": [
      "all-revenue-os"
    ],
    "rule": "Réserver signature et engagement aux autorités désignées",
    "prohibitedActions": [
      "Signer",
      "Accepter clauses",
      "Modifier conditions"
    ],
    "requiredApproverRole": "Managing Director",
    "escalationPath": "Escalader à Managing Director.",
    "severity": "critical",
    "status": "effective",
    "effectiveFrom": "2026-07-20",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "rest-005",
    "code": "REST-BRAND-LOGO",
    "name": "Logo officiel",
    "restrictionType": "brand",
    "scope": [
      "all-revenue-os"
    ],
    "rule": "Interdire redessin, déformation ou remplacement du logo officiel",
    "prohibitedActions": [
      "Déformer logo",
      "Changer formes",
      "Inventer symbole"
    ],
    "requiredApproverRole": "Brand Governance Lead",
    "escalationPath": "Escalader à Brand Governance Lead.",
    "severity": "high",
    "status": "effective",
    "effectiveFrom": "2026-07-20",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "rest-006",
    "code": "REST-CHILD-DATA",
    "name": "Données enfants",
    "restrictionType": "privacy",
    "scope": [
      "all-revenue-os"
    ],
    "rule": "Limiter strictement l’accès et l’usage des données enfants/familles",
    "prohibitedActions": [
      "Prospection basée sur données enfants",
      "Exposition inutile"
    ],
    "requiredApproverRole": "Data Protection Owner",
    "escalationPath": "Escalader à Data Protection Owner.",
    "severity": "critical",
    "status": "effective",
    "effectiveFrom": "2026-07-20",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "rest-007",
    "code": "REST-CAPACITY",
    "name": "Capacité non confirmée",
    "restrictionType": "capacity",
    "scope": [
      "all-revenue-os"
    ],
    "rule": "Interdire la promesse de livraison sans capacité vérifiable",
    "prohibitedActions": [
      "Promettre un créneau",
      "Survendre une ville"
    ],
    "requiredApproverRole": "Operations Manager",
    "escalationPath": "Escalader à Operations Manager.",
    "severity": "high",
    "status": "effective",
    "effectiveFrom": "2026-07-20",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "rest-008",
    "code": "REST-GUARANTEE",
    "name": "Garantie de résultat",
    "restrictionType": "promise",
    "scope": [
      "all-revenue-os"
    ],
    "rule": "Interdire toute garantie non contractuelle et non prouvable",
    "prohibitedActions": [
      "Garantir conversion",
      "Garantir résultat pédagogique"
    ],
    "requiredApproverRole": "Managing Director",
    "escalationPath": "Escalader à Managing Director.",
    "severity": "high",
    "status": "effective",
    "effectiveFrom": "2026-07-20",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "rest-009",
    "code": "REST-CASE",
    "name": "Cas client sensible",
    "restrictionType": "privacy",
    "scope": [
      "all-revenue-os"
    ],
    "rule": "Anonymiser les cas avant usage commercial",
    "prohibitedActions": [
      "Exposer nom ou données sensibles"
    ],
    "requiredApproverRole": "Data Protection Owner",
    "escalationPath": "Escalader à Data Protection Owner.",
    "severity": "high",
    "status": "effective",
    "effectiveFrom": "2026-07-20",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "rest-010",
    "code": "REST-AUTHORITY",
    "name": "Autorité manquante",
    "restrictionType": "approval",
    "scope": [
      "all-revenue-os"
    ],
    "rule": "Interdire progression finale sans circuit de décision identifié",
    "prohibitedActions": [
      "Marquer gagné sans décideur"
    ],
    "requiredApproverRole": "Commercial Director",
    "escalationPath": "Escalader à Commercial Director.",
    "severity": "high",
    "status": "effective",
    "effectiveFrom": "2026-07-20",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  }
]

export const REVENUE_KNOWLEDGE_SEED_BRAND_REQUIREMENTS: RevenueBrandRequirement[] = [
  {
    "id": "brand-001",
    "code": "BRAND-LOGO",
    "name": "Usage du logo officiel",
    "scope": [
      "commercial-communication",
      "ui",
      "documents"
    ],
    "requirement": "Logo ANGELCARE inchangé, sans tagline lorsque le format le demande",
    "allowedPatterns": [
      "Fichier officiel approuvé"
    ],
    "prohibitedPatterns": [
      "Redessin IA",
      "Déformation",
      "Changement des motifs"
    ],
    "evidenceRequired": [
      "brand-review"
    ],
    "status": "effective",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "brand-002",
    "code": "BRAND-WHITE",
    "name": "Univers visuel entreprise",
    "scope": [
      "commercial-communication",
      "ui",
      "documents"
    ],
    "requirement": "Fond blanc premium, hiérarchie nette et accents maîtrisés",
    "allowedPatterns": [
      "Navy, blanc, accents contrôlés"
    ],
    "prohibitedPatterns": [
      "Dark dashboard générique",
      "Surcharge visuelle"
    ],
    "evidenceRequired": [
      "brand-review"
    ],
    "status": "effective",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "brand-003",
    "code": "BRAND-TONE",
    "name": "Ton commercial B2B",
    "scope": [
      "commercial-communication",
      "ui",
      "documents"
    ],
    "requirement": "Direct, expert, chaleureux, sans tromperie",
    "allowedPatterns": [
      "CTA clair",
      "Preuve",
      "Concision"
    ],
    "prohibitedPatterns": [
      "Fausses garanties",
      "Fausse rareté",
      "Culpabilisation abusive"
    ],
    "evidenceRequired": [
      "brand-review"
    ],
    "status": "effective",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "brand-004",
    "code": "BRAND-CURRENCY",
    "name": "Devise",
    "scope": [
      "commercial-communication",
      "ui",
      "documents"
    ],
    "requirement": "Afficher Dh dans les interfaces et documents commerciaux",
    "allowedPatterns": [
      "Dh"
    ],
    "prohibitedPatterns": [
      "MAD dans les interfaces client"
    ],
    "evidenceRequired": [
      "brand-review"
    ],
    "status": "effective",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "brand-005",
    "code": "BRAND-LANGUAGE",
    "name": "Langue opérationnelle",
    "scope": [
      "commercial-communication",
      "ui",
      "documents"
    ],
    "requirement": "Français pour interfaces, documents internes et supports B2B principaux",
    "allowedPatterns": [
      "Français professionnel"
    ],
    "prohibitedPatterns": [
      "Mélange linguistique non demandé"
    ],
    "evidenceRequired": [
      "brand-review"
    ],
    "status": "effective",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "brand-006",
    "code": "BRAND-UNIT",
    "name": "Descripteurs business units",
    "scope": [
      "commercial-communication",
      "ui",
      "documents"
    ],
    "requirement": "Utiliser les descripteurs officiels des unités",
    "allowedPatterns": [
      "Academy",
      "Home Service",
      "Hospitality Kids Friendly",
      "Corporates"
    ],
    "prohibitedPatterns": [
      "Noms improvisés"
    ],
    "evidenceRequired": [
      "brand-review"
    ],
    "status": "effective",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  }
]

export const REVENUE_KNOWLEDGE_SEED_PARTNER_BENEFITS: RevenuePartnerBenefit[] = [
  {
    "id": "benefit-001",
    "code": "BEN-PARTNER-DISCOUNT",
    "name": "Remise partenaire conditionnelle",
    "segmentCodes": [
      "CRECHE_PRIVATE",
      "PRESCHOOL"
    ],
    "offerCodes": [
      "ACADEMY_ONSITE"
    ],
    "valueStatement": "Une condition préférentielle peut être accordée selon offre et autorité",
    "eligibilityRules": [
      "Partenaire qualifié",
      "Offre active",
      "Capacité vérifiée"
    ],
    "approvalRole": "Direction Commerciale",
    "communicationRules": [
      "Présenter comme conditionnel tant que non approuvé",
      "Ne jamais inventer une date ou un montant"
    ],
    "status": "approved",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "benefit-002",
    "code": "BEN-PRIORITY",
    "name": "Priorité de planification",
    "segmentCodes": [
      "CRECHE_PRIVATE",
      "PRESCHOOL"
    ],
    "offerCodes": [
      "ACADEMY_ONSITE"
    ],
    "valueStatement": "Priorité sous réserve de paiement, capacité et calendrier confirmés",
    "eligibilityRules": [
      "Partenaire qualifié",
      "Offre active",
      "Capacité vérifiée"
    ],
    "approvalRole": "Operations Manager",
    "communicationRules": [
      "Présenter comme conditionnel tant que non approuvé",
      "Ne jamais inventer une date ou un montant"
    ],
    "status": "approved",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "benefit-003",
    "code": "BEN-SUPPORTS",
    "name": "Supports professionnels",
    "segmentCodes": [
      "CRECHE_PRIVATE",
      "PRESCHOOL"
    ],
    "offerCodes": [
      "ACADEMY_ONSITE",
      "ACADEMY_ELEARNING"
    ],
    "valueStatement": "Supports inclus selon périmètre contracté",
    "eligibilityRules": [
      "Partenaire qualifié",
      "Offre active",
      "Capacité vérifiée"
    ],
    "approvalRole": "Academy Director",
    "communicationRules": [
      "Présenter comme conditionnel tant que non approuvé",
      "Ne jamais inventer une date ou un montant"
    ],
    "status": "approved",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "benefit-004",
    "code": "BEN-ELEARNING",
    "name": "Accès e-learning",
    "segmentCodes": [
      "CRECHE_PRIVATE",
      "PRESCHOOL",
      "CORPORATE"
    ],
    "offerCodes": [
      "ACADEMY_ELEARNING"
    ],
    "valueStatement": "Accès selon durée, nombre d’utilisateurs et offre validés",
    "eligibilityRules": [
      "Partenaire qualifié",
      "Offre active",
      "Capacité vérifiée"
    ],
    "approvalRole": "Academy Director",
    "communicationRules": [
      "Présenter comme conditionnel tant que non approuvé",
      "Ne jamais inventer une date ou un montant"
    ],
    "status": "approved",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "benefit-005",
    "code": "BEN-DIAGNOSTIC",
    "name": "Diagnostic initial",
    "segmentCodes": [
      "CRECHE_PRIVATE",
      "PRESCHOOL",
      "CORPORATE"
    ],
    "offerCodes": [
      "ACADEMY_ONSITE"
    ],
    "valueStatement": "Échange de cadrage destiné à identifier les priorités avant proposition",
    "eligibilityRules": [
      "Partenaire qualifié",
      "Offre active",
      "Capacité vérifiée"
    ],
    "approvalRole": "B2B Sales Manager",
    "communicationRules": [
      "Présenter comme conditionnel tant que non approuvé",
      "Ne jamais inventer une date ou un montant"
    ],
    "status": "approved",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "benefit-006",
    "code": "BEN-PLV",
    "name": "Outils PLV partenaire",
    "segmentCodes": [
      "CRECHE_PRIVATE",
      "ORTHOPHONIST",
      "MATERNITY_CLINIC"
    ],
    "offerCodes": [
      "FLASHCARDS_PLV"
    ],
    "valueStatement": "Matériel de présentation selon disponibilité et configuration",
    "eligibilityRules": [
      "Partenaire qualifié",
      "Offre active",
      "Capacité vérifiée"
    ],
    "approvalRole": "B2B Partnerships Director",
    "communicationRules": [
      "Présenter comme conditionnel tant que non approuvé",
      "Ne jamais inventer une date ou un montant"
    ],
    "status": "approved",
    "updatedAt": "2026-07-20T03:00:00.000Z"
  }
]

export const REVENUE_KNOWLEDGE_SEED_APPROVALS: RevenueKnowledgeApproval[] = [
  {
    "id": "appr-001",
    "code": "APPROVAL-001",
    "resourceType": "doctrine",
    "resourceCode": "REV-CAM-002",
    "resourceVersion": "1.0",
    "requestedBy": "Growth Strategy Lead",
    "requestedAt": "2026-07-20T03:00:00.000Z",
    "requiredApproverRole": "Revenue Knowledge Owner",
    "decision": "pending",
    "checklist": [
      {
        "key": "source",
        "label": "Source d’autorité vérifiée",
        "passed": true
      },
      {
        "key": "scope",
        "label": "Périmètre défini",
        "passed": true
      },
      {
        "key": "conflict",
        "label": "Absence de conflit bloquant",
        "passed": false
      }
    ]
  },
  {
    "id": "appr-002",
    "code": "APPROVAL-002",
    "resourceType": "doctrine",
    "resourceCode": "REV-CAM-003",
    "resourceVersion": "1.0",
    "requestedBy": "Revenue Operations Lead",
    "requestedAt": "2026-07-20T03:00:00.000Z",
    "requiredApproverRole": "Revenue Knowledge Owner",
    "decision": "pending",
    "checklist": [
      {
        "key": "source",
        "label": "Source d’autorité vérifiée",
        "passed": true
      },
      {
        "key": "scope",
        "label": "Périmètre défini",
        "passed": true
      },
      {
        "key": "conflict",
        "label": "Absence de conflit bloquant",
        "passed": false
      }
    ]
  },
  {
    "id": "appr-003",
    "code": "APPROVAL-003",
    "resourceType": "doctrine",
    "resourceCode": "REV-OFF-001",
    "resourceVersion": "1.0",
    "requestedBy": "Offer Governance Lead",
    "requestedAt": "2026-07-20T03:00:00.000Z",
    "requiredApproverRole": "Revenue Knowledge Owner",
    "decision": "pending",
    "checklist": [
      {
        "key": "source",
        "label": "Source d’autorité vérifiée",
        "passed": true
      },
      {
        "key": "scope",
        "label": "Périmètre défini",
        "passed": true
      },
      {
        "key": "conflict",
        "label": "Absence de conflit bloquant",
        "passed": false
      }
    ]
  },
  {
    "id": "appr-004",
    "code": "APPROVAL-004",
    "resourceType": "doctrine",
    "resourceCode": "REV-OFF-002",
    "resourceVersion": "1.0",
    "requestedBy": "Academy Director",
    "requestedAt": "2026-07-20T03:00:00.000Z",
    "requiredApproverRole": "Revenue Knowledge Owner",
    "decision": "pending",
    "checklist": [
      {
        "key": "source",
        "label": "Source d’autorité vérifiée",
        "passed": true
      },
      {
        "key": "scope",
        "label": "Périmètre défini",
        "passed": true
      },
      {
        "key": "conflict",
        "label": "Absence de conflit bloquant",
        "passed": false
      }
    ]
  },
  {
    "id": "appr-005",
    "code": "APPROVAL-005",
    "resourceType": "doctrine",
    "resourceCode": "REV-OFF-003",
    "resourceVersion": "1.1",
    "requestedBy": "Academy Operations Lead",
    "requestedAt": "2026-07-20T03:00:00.000Z",
    "requiredApproverRole": "Revenue Knowledge Owner",
    "decision": "pending",
    "checklist": [
      {
        "key": "source",
        "label": "Source d’autorité vérifiée",
        "passed": true
      },
      {
        "key": "scope",
        "label": "Périmètre défini",
        "passed": true
      },
      {
        "key": "conflict",
        "label": "Absence de conflit bloquant",
        "passed": false
      }
    ]
  }
]

export const REVENUE_KNOWLEDGE_SEED_CONFLICTS: RevenueKnowledgeConflict[] = [
  {
    "id": "conf-001",
    "code": "CONFLICT-PRICEBOOK",
    "conflictType": "pricing",
    "leftResourceCode": "KNW-ASSET-006",
    "rightResourceCode": "REV-POL-001",
    "summary": "Le livre de prix est encore en revue alors que la politique exige une source active.",
    "risk": "Les futures stratégies ne peuvent pas proposer de prix fiables.",
    "recommendedResolution": "Valider le registre de prix ou bloquer toute commande de pricing.",
    "status": "open",
    "severity": "critical",
    "detectedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "conf-002",
    "code": "CONFLICT-CAPACITY-ACADEMY",
    "conflictType": "source",
    "leftResourceCode": "KNW-ASSET-013",
    "rightResourceCode": "REV-SVC-001",
    "summary": "La matrice de capacité Academy n’est pas encore approuvée.",
    "risk": "Risque de stratégie commercialement intéressante mais non livrable.",
    "recommendedResolution": "Faire valider la capacité par Academy et Operations.",
    "status": "under-review",
    "severity": "high",
    "detectedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "conf-003",
    "code": "CONFLICT-PARTNER-BENEFITS",
    "conflictType": "scope",
    "leftResourceCode": "KNW-ASSET-015",
    "rightResourceCode": "REV-BEN-001",
    "summary": "Certains avantages sont approuvés mais leurs fenêtres de validité restent absentes.",
    "risk": "Communication ambiguë ou promesse non bornée.",
    "recommendedResolution": "Renseigner la validité et les segments éligibles.",
    "status": "open",
    "severity": "high",
    "detectedAt": "2026-07-20T03:00:00.000Z"
  }
]

export const REVENUE_KNOWLEDGE_SEED_VERSIONS: RevenueKnowledgeVersion[] = [
  {
    "id": "ver-001",
    "resourceType": "doctrine",
    "resourceCode": "REV-DOC-001",
    "version": "1.0",
    "status": "effective",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "3ece17bd61898ae28277e2cb854c4c9faa56cb26d62c5eefdb62f6fe64cc26af",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "approvedBy": "Managing Director",
    "approvedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "ver-002",
    "resourceType": "doctrine",
    "resourceCode": "REV-DOC-002",
    "version": "1.0",
    "status": "effective",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "7160b9bf9fe2b75b21b823ab4805486855686bcf8e5ae70cfae313b8bad34dff",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "approvedBy": "Managing Director",
    "approvedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "ver-003",
    "resourceType": "doctrine",
    "resourceCode": "REV-DOC-003",
    "version": "1.0",
    "status": "effective",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "782ecde5e55fb1c37e13cd346262e48e8cb23c2cea1de5f2d7e8422312f38cf0",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "approvedBy": "Managing Director",
    "approvedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "ver-004",
    "resourceType": "doctrine",
    "resourceCode": "REV-POL-001",
    "version": "1.0",
    "status": "effective",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "e9b8adb69bae30f4a361ef7114635ced629e0729ecc8aaa7e71047ed3bc4283a",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "approvedBy": "Managing Director",
    "approvedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "ver-005",
    "resourceType": "doctrine",
    "resourceCode": "REV-POL-002",
    "version": "1.1",
    "status": "effective",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "a062b67d05d38972fd36ca4d9deb187eb74a0f7459e14db49d02e405b9d972bc",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "approvedBy": "Managing Director",
    "approvedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "ver-006",
    "resourceType": "doctrine",
    "resourceCode": "REV-POL-003",
    "version": "1.0",
    "status": "effective",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "9fd0fbfdcb836ebae1e305c03a2e67873fddf93ea4380437fd21ff291b2e4aa0",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "approvedBy": "Managing Director",
    "approvedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "ver-007",
    "resourceType": "doctrine",
    "resourceCode": "REV-SVC-001",
    "version": "1.0",
    "status": "effective",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "e3ec15370daf18d95d96be761358bd1273e39ae95747728b6b752866214aa6c4",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "approvedBy": "Managing Director",
    "approvedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "ver-008",
    "resourceType": "doctrine",
    "resourceCode": "REV-SVC-002",
    "version": "1.0",
    "status": "effective",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "2c588734259a8886842588f5301907e22d8b1780f074ec15c5c9e98433316280",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "approvedBy": "Managing Director",
    "approvedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "ver-009",
    "resourceType": "doctrine",
    "resourceCode": "REV-SVC-003",
    "version": "1.0",
    "status": "effective",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "abc6207f7e645ef679dcc40bc955aa8ba3c8f654d9f93646ce9d8bc27d04ab7d",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "approvedBy": "Managing Director",
    "approvedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "ver-010",
    "resourceType": "doctrine",
    "resourceCode": "REV-POS-001",
    "version": "1.1",
    "status": "effective",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "89c81d283383bafc91aef38c4e240335f3b796767881a7f9cd7770ea5cdad19a",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "approvedBy": "Managing Director",
    "approvedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "ver-011",
    "resourceType": "doctrine",
    "resourceCode": "REV-POS-002",
    "version": "1.0",
    "status": "effective",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "33d7eb1fe807bf8745910fe1859a6bf674880ca7a3cfafb2b32402545f88ebd4",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "approvedBy": "Managing Director",
    "approvedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "ver-012",
    "resourceType": "doctrine",
    "resourceCode": "REV-POS-003",
    "version": "1.0",
    "status": "effective",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "317c59509bba937f19d1143dcf3de28441d4f849cdc4de38827a1d6614eb9072",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "approvedBy": "Managing Director",
    "approvedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "ver-013",
    "resourceType": "doctrine",
    "resourceCode": "REV-CUS-001",
    "version": "1.0",
    "status": "effective",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "4991152d9047fe38699082a7b417473f57478845c540d023068c1adcaa6c700c",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "approvedBy": "Managing Director",
    "approvedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "ver-014",
    "resourceType": "doctrine",
    "resourceCode": "REV-CUS-002",
    "version": "1.0",
    "status": "effective",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "a3a3dcefb5487750af792774c246f9705ec475552f1663e98d1dd9ad6d3ccf82",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "approvedBy": "Managing Director",
    "approvedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "ver-015",
    "resourceType": "doctrine",
    "resourceCode": "REV-CUS-003",
    "version": "1.1",
    "status": "effective",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "566f8a7ce2eef90fddf91f160eebb4dfaa3343f7b4b439467d317e06bf73fcb5",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "approvedBy": "Managing Director",
    "approvedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "ver-016",
    "resourceType": "doctrine",
    "resourceCode": "REV-BEN-001",
    "version": "1.0",
    "status": "effective",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "fbd0d9d38a18cd189316ee415a0cb6ec4158e7fecce6b163505816cb1ae35b2d",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "approvedBy": "Managing Director",
    "approvedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "ver-017",
    "resourceType": "doctrine",
    "resourceCode": "REV-BEN-002",
    "version": "1.0",
    "status": "effective",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "8a8230b168a67a36bca0005d1176b7c749549986b8baa2312f76eafed53afa29",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "approvedBy": "Managing Director",
    "approvedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "ver-018",
    "resourceType": "doctrine",
    "resourceCode": "REV-BEN-003",
    "version": "1.0",
    "status": "effective",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "c4bc72faeaa8af8c7a02bee66fb937882b010d76db134f994743fe8b283210a9",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "approvedBy": "Managing Director",
    "approvedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "ver-019",
    "resourceType": "doctrine",
    "resourceCode": "REV-BRD-001",
    "version": "1.0",
    "status": "effective",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "5c7aacc11abab6726971a253d50b3629c085306721fc8592103af0528d4e7881",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "approvedBy": "Managing Director",
    "approvedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "ver-020",
    "resourceType": "doctrine",
    "resourceCode": "REV-BRD-002",
    "version": "1.1",
    "status": "effective",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "bf3a0db713a86f7ec93086403008492220df125cbe27ef7dcefa16552d9a652f",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "approvedBy": "Managing Director",
    "approvedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "ver-021",
    "resourceType": "doctrine",
    "resourceCode": "REV-BRD-003",
    "version": "1.0",
    "status": "effective",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "2015fcf2df4782b705a24ceeb3fb35608c88d81d6252bf096ac436f598672c91",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "approvedBy": "Managing Director",
    "approvedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "ver-022",
    "resourceType": "doctrine",
    "resourceCode": "REV-LEG-001",
    "version": "1.0",
    "status": "effective",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "6da10fc96c74ca7eaf58c272675b5cda968a7a3cb6e7082b81ddc900f23736cf",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "approvedBy": "Managing Director",
    "approvedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "ver-023",
    "resourceType": "doctrine",
    "resourceCode": "REV-LEG-002",
    "version": "1.0",
    "status": "effective",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "c8c226fd7bf05fc9a0e156b3f6832b456f1ed116b6e4eff54a19193198021448",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "approvedBy": "Managing Director",
    "approvedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "ver-024",
    "resourceType": "doctrine",
    "resourceCode": "REV-LEG-003",
    "version": "1.0",
    "status": "effective",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "332cd591808f4a8d706d62fbbf1ee4eaa1422885d86e7c726db001e56698db96",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "approvedBy": "Managing Director",
    "approvedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "ver-025",
    "resourceType": "doctrine",
    "resourceCode": "REV-SOP-001",
    "version": "1.1",
    "status": "effective",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "cf4e925c27e6edd27485ffb04ce76b67506834421cd5252e5c675b9629f4b70e",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "approvedBy": "Managing Director",
    "approvedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "ver-026",
    "resourceType": "doctrine",
    "resourceCode": "REV-SOP-002",
    "version": "1.0",
    "status": "effective",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "7127e907ec23bb697cd7cafa5d24c1da843e446d542eca49876822a645099e55",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "approvedBy": "Managing Director",
    "approvedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "ver-027",
    "resourceType": "doctrine",
    "resourceCode": "REV-SOP-003",
    "version": "1.0",
    "status": "effective",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "da154cfd0bcafce25e0b3481b3fe6b2ee39d434185d5670f0a6910af61e3cc7c",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "approvedBy": "Managing Director",
    "approvedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "ver-028",
    "resourceType": "doctrine",
    "resourceCode": "REV-PLAY-001",
    "version": "1.0",
    "status": "effective",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "3577efd8f3319b1b6cf5af1685921f111ac03f52c03942245e6037ea9a06ba91",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "approvedBy": "Managing Director",
    "approvedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "ver-029",
    "resourceType": "doctrine",
    "resourceCode": "REV-PLAY-002",
    "version": "1.0",
    "status": "effective",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "3d8ce4c7152ace42a6d233dbf5366d56134fa3fd655b383e1c54eff75d302847",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "approvedBy": "Managing Director",
    "approvedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "ver-030",
    "resourceType": "doctrine",
    "resourceCode": "REV-PLAY-003",
    "version": "1.1",
    "status": "effective",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "d35eea98f20f1bf54f733ce60f17e841bec0be9a307fd0dc887e4ba66299beaa",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "approvedBy": "Managing Director",
    "approvedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "ver-031",
    "resourceType": "doctrine",
    "resourceCode": "REV-SCR-001",
    "version": "1.0",
    "status": "effective",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "9337243a5bd60127c7aadf758c3e4568b78c44d959e9295a7b25aabf272af681",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "approvedBy": "Managing Director",
    "approvedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "ver-032",
    "resourceType": "doctrine",
    "resourceCode": "REV-SCR-002",
    "version": "1.0",
    "status": "effective",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "c00a19e801a670b53044ef456dc898264aa6c73c284dd4c6d06bec8460b96ad6",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "approvedBy": "Managing Director",
    "approvedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "ver-033",
    "resourceType": "doctrine",
    "resourceCode": "REV-SCR-003",
    "version": "1.0",
    "status": "approved",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "a3bfb3570d7fa0e06ff818b0ab548710d888707dd74139b0984968be44915f5f",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "approvedBy": "Managing Director",
    "approvedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "ver-034",
    "resourceType": "doctrine",
    "resourceCode": "REV-OBJ-001",
    "version": "1.0",
    "status": "approved",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "09484908115af0cecc0de92a1f35c27d956293c26da9c9263e27210235092bd0",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "approvedBy": "Managing Director",
    "approvedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "ver-035",
    "resourceType": "doctrine",
    "resourceCode": "REV-OBJ-002",
    "version": "1.1",
    "status": "approved",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "477655b97608845084daf82c74cad313441eb9dc6b3a6b3f610ae7d4c5aefe52",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "approvedBy": "Managing Director",
    "approvedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "ver-036",
    "resourceType": "doctrine",
    "resourceCode": "REV-OBJ-003",
    "version": "1.0",
    "status": "approved",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "354ea4f8a6df017e77dd9eeb0ed76299244ea42252c805ccd4ebb5424c5b1e2b",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "approvedBy": "Managing Director",
    "approvedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "ver-037",
    "resourceType": "doctrine",
    "resourceCode": "REV-CASE-001",
    "version": "1.0",
    "status": "approved",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "dd3d12e3d40035b273c42002d5652ecf1f1746a0ebb62a6a49a0f86e06aada25",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "approvedBy": "Managing Director",
    "approvedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "ver-038",
    "resourceType": "doctrine",
    "resourceCode": "REV-CASE-002",
    "version": "1.0",
    "status": "approved",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "24c3b0a48ce2a73dec50f14067e6695a3bb977b2d42962481ff06a47494694b6",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "approvedBy": "Managing Director",
    "approvedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "ver-039",
    "resourceType": "doctrine",
    "resourceCode": "REV-CASE-003",
    "version": "1.0",
    "status": "approved",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "8b6e454d393438e2b38601fdf5a070aac761fbc9910096c9155f1ced9b93ce65",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "approvedBy": "Managing Director",
    "approvedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "ver-040",
    "resourceType": "doctrine",
    "resourceCode": "REV-CAM-001",
    "version": "1.1",
    "status": "approved",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "87862bf013163b5c6d397c694ba8511704d0cb301230c5f7756a81237504715a",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
    "approvedBy": "Managing Director",
    "approvedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "ver-041",
    "resourceType": "doctrine",
    "resourceCode": "REV-CAM-002",
    "version": "1.0",
    "status": "in-review",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "656dcaf3d8caf1ab0b7bb398f05b2dda24f4c566eab7972c6e2dac5c045f1c12",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
  },
  {
    "id": "ver-042",
    "resourceType": "doctrine",
    "resourceCode": "REV-CAM-003",
    "version": "1.0",
    "status": "in-review",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "780c1b7d4798d9ef8d0ac8c6b92808d6fd1dce1fc981421c18da36c2ea916938",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
  },
  {
    "id": "ver-043",
    "resourceType": "doctrine",
    "resourceCode": "REV-OFF-001",
    "version": "1.0",
    "status": "in-review",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "128ed4014358a427796943c1f011f29635bdf8aad313546cb7b51c0fcac98984",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
  },
  {
    "id": "ver-044",
    "resourceType": "doctrine",
    "resourceCode": "REV-OFF-002",
    "version": "1.0",
    "status": "in-review",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "1001dfdb9fbba6310d1d4ebd06077970d0d14b6be31241fc5de4171f964e146a",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
  },
  {
    "id": "ver-045",
    "resourceType": "doctrine",
    "resourceCode": "REV-OFF-003",
    "version": "1.1",
    "status": "in-review",
    "changeReason": "Création du référentiel canonique Phase 3",
    "snapshotHash": "75eea8b50794f9699e3e4250e5f07833a27fc5c2d3f18a9f5312b3389b4fd576",
    "createdBy": "Revenue OS Migration",
    "createdAt": "2026-07-20T03:00:00.000Z",
  }
]

export const REVENUE_KNOWLEDGE_SEED_INDEX_JOBS: RevenueKnowledgeIndexJob[] = [
  {
    "id": "job-001",
    "code": "INDEX-KNW-ASSET-001",
    "assetCode": "KNW-ASSET-001",
    "requestedAt": "2026-07-20T03:00:00.000Z",
    "status": "indexed",
    "chunkCount": 13,
    "completedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "job-002",
    "code": "INDEX-KNW-ASSET-002",
    "assetCode": "KNW-ASSET-002",
    "requestedAt": "2026-07-20T03:00:00.000Z",
    "status": "indexed",
    "chunkCount": 14,
    "completedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "job-003",
    "code": "INDEX-KNW-ASSET-003",
    "assetCode": "KNW-ASSET-003",
    "requestedAt": "2026-07-20T03:00:00.000Z",
    "status": "indexed",
    "chunkCount": 15,
    "completedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "job-004",
    "code": "INDEX-KNW-ASSET-004",
    "assetCode": "KNW-ASSET-004",
    "requestedAt": "2026-07-20T03:00:00.000Z",
    "status": "indexed",
    "chunkCount": 16,
    "completedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "job-005",
    "code": "INDEX-KNW-ASSET-005",
    "assetCode": "KNW-ASSET-005",
    "requestedAt": "2026-07-20T03:00:00.000Z",
    "status": "indexed",
    "chunkCount": 17,
    "completedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "job-006",
    "code": "INDEX-KNW-ASSET-006",
    "assetCode": "KNW-ASSET-006",
    "requestedAt": "2026-07-20T03:00:00.000Z",
    "status": "indexed",
    "chunkCount": 18,
    "completedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "job-007",
    "code": "INDEX-KNW-ASSET-007",
    "assetCode": "KNW-ASSET-007",
    "requestedAt": "2026-07-20T03:00:00.000Z",
    "status": "indexed",
    "chunkCount": 19,
    "completedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "job-008",
    "code": "INDEX-KNW-ASSET-008",
    "assetCode": "KNW-ASSET-008",
    "requestedAt": "2026-07-20T03:00:00.000Z",
    "status": "indexed",
    "chunkCount": 20,
    "completedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "job-009",
    "code": "INDEX-KNW-ASSET-009",
    "assetCode": "KNW-ASSET-009",
    "requestedAt": "2026-07-20T03:00:00.000Z",
    "status": "indexed",
    "chunkCount": 21,
    "completedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "job-010",
    "code": "INDEX-KNW-ASSET-010",
    "assetCode": "KNW-ASSET-010",
    "requestedAt": "2026-07-20T03:00:00.000Z",
    "status": "indexed",
    "chunkCount": 22,
    "completedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "job-011",
    "code": "INDEX-KNW-ASSET-011",
    "assetCode": "KNW-ASSET-011",
    "requestedAt": "2026-07-20T03:00:00.000Z",
    "status": "queued",
    "chunkCount": 0,
  },
  {
    "id": "job-012",
    "code": "INDEX-KNW-ASSET-012",
    "assetCode": "KNW-ASSET-012",
    "requestedAt": "2026-07-20T03:00:00.000Z",
    "status": "queued",
    "chunkCount": 0,
  },
  {
    "id": "job-013",
    "code": "INDEX-KNW-ASSET-013",
    "assetCode": "KNW-ASSET-013",
    "requestedAt": "2026-07-20T03:00:00.000Z",
    "status": "queued",
    "chunkCount": 0,
  },
  {
    "id": "job-014",
    "code": "INDEX-KNW-ASSET-014",
    "assetCode": "KNW-ASSET-014",
    "requestedAt": "2026-07-20T03:00:00.000Z",
    "status": "queued",
    "chunkCount": 0,
  },
  {
    "id": "job-015",
    "code": "INDEX-KNW-ASSET-015",
    "assetCode": "KNW-ASSET-015",
    "requestedAt": "2026-07-20T03:00:00.000Z",
    "status": "queued",
    "chunkCount": 0,
  },
  {
    "id": "job-016",
    "code": "INDEX-KNW-ASSET-016",
    "assetCode": "KNW-ASSET-016",
    "requestedAt": "2026-07-20T03:00:00.000Z",
    "status": "queued",
    "chunkCount": 0,
  },
  {
    "id": "job-017",
    "code": "INDEX-KNW-ASSET-017",
    "assetCode": "KNW-ASSET-017",
    "requestedAt": "2026-07-20T03:00:00.000Z",
    "status": "queued",
    "chunkCount": 0,
  },
  {
    "id": "job-018",
    "code": "INDEX-KNW-ASSET-018",
    "assetCode": "KNW-ASSET-018",
    "requestedAt": "2026-07-20T03:00:00.000Z",
    "status": "queued",
    "chunkCount": 0,
  }
]

export const REVENUE_KNOWLEDGE_SEED_VALIDATION_ISSUES: RevenueKnowledgeValidationIssue[] = [
  {
    "id": "val-001",
    "code": "KNW-PRICE-SOURCE",
    "resourceType": "asset",
    "resourceCode": "KNW-ASSET-006",
    "category": "authority",
    "severity": "critical",
    "title": "Livre de prix non effectif",
    "detail": "La source de prix reste en revue. Les commandes de pricing doivent rester bloquées.",
    "recommendedAction": "Valider ou remplacer le livre de prix contrôlé.",
    "status": "open",
    "detectedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "val-002",
    "code": "KNW-CAPACITY-SOURCE",
    "resourceType": "asset",
    "resourceCode": "KNW-ASSET-013",
    "category": "provenance",
    "severity": "high",
    "title": "Capacité Academy à valider",
    "detail": "La matrice de capacité n’a pas encore reçu l’approbation opérationnelle.",
    "recommendedAction": "Soumettre à Academy et Operations.",
    "status": "open",
    "detectedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "val-003",
    "code": "KNW-CONFLICTS",
    "resourceType": "model",
    "resourceCode": "KNOWLEDGE-MODEL",
    "category": "conflict",
    "severity": "high",
    "title": "Conflits institutionnels ouverts",
    "detail": "Trois conflits empêchent une confiance complète du futur Strategy Brain.",
    "recommendedAction": "Traiter le bureau de conflits avant Phase 4.",
    "status": "open",
    "detectedAt": "2026-07-20T03:00:00.000Z"
  },
  {
    "id": "val-004",
    "code": "KNW-INDEXING",
    "resourceType": "model",
    "resourceCode": "KNOWLEDGE-MODEL",
    "category": "indexing",
    "severity": "medium",
    "title": "Actifs non indexés",
    "detail": "Plusieurs ressources approuvées ne sont pas encore préparées pour la recherche future.",
    "recommendedAction": "Mettre en file après contrôle de confidentialité.",
    "status": "open",
    "detectedAt": "2026-07-20T03:00:00.000Z"
  }
]

export const REVENUE_KNOWLEDGE_SEED_READINESS: RevenueKnowledgeReadiness = {
  "overall": 78,
  "approvedDoctrineCoverage": 84,
  "provenanceCoverage": 76,
  "versionIntegrity": 100,
  "conflictSafety": 61,
  "indexingReadiness": 58,
  "authorityCoverage": 88,
  "reviewFreshness": 92
}

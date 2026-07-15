import type { ServiceBlueprint, ServiceModule, ServiceRule, CityDeployment, ServiceMission } from './types'

export const angelCareServiceBlueprints: ServiceBlueprint[] = [
  {
    "id": "bp-h-s",
    "code": "H.S",
    "name": "Garde & Accompagnement Enfants à Domicile",
    "family": "home_care",
    "marketSegment": "B2C premium families",
    "cities": [
      "Rabat",
      "Temara",
      "Casablanca",
      "Marrakech"
    ],
    "modules": [
      "home_care",
      "parent_reporting",
      "transport_option",
      "night_shift"
    ],
    "basePriceMad": 180,
    "riskLevel": "medium",
    "status": "active",
    "requiredSkills": [
      "AngelCare certified",
      "Parent communication",
      "Safety protocol"
    ],
    "requiredDocuments": [
      "Client authorization",
      "Service consent",
      "Emergency contact"
    ],
    "defaultWorkflow": [
      "Request intake",
      "Qualification",
      "Pricing simulation",
      "Staff matching",
      "Contract/approval",
      "Mission launch",
      "Live monitoring",
      "Quality review",
      "Renewal/upsell"
    ],
    "kpis": {
      "marginTarget": 35,
      "satisfactionTarget": 92,
      "slaTarget": 95,
      "utilizationTarget": 78
    }
  },
  {
    "id": "bp-s-k",
    "code": "S.K",
    "name": "Garde Enfant à Besoins Spécifiques à Domicile",
    "family": "special_needs",
    "marketSegment": "special needs families",
    "cities": [
      "Rabat",
      "Casablanca"
    ],
    "modules": [
      "special_needs_protocol",
      "sensory_support",
      "certified_staff",
      "parent_reporting"
    ],
    "basePriceMad": 320,
    "riskLevel": "high",
    "status": "active",
    "requiredSkills": [
      "AngelCare certified",
      "Parent communication",
      "Safety protocol",
      "Special needs experience"
    ],
    "requiredDocuments": [
      "Client authorization",
      "Service consent",
      "Emergency contact",
      "Medical notes"
    ],
    "defaultWorkflow": [
      "Request intake",
      "Qualification",
      "Pricing simulation",
      "Staff matching",
      "Contract/approval",
      "Mission launch",
      "Live monitoring",
      "Quality review",
      "Renewal/upsell"
    ],
    "kpis": {
      "marginTarget": 35,
      "satisfactionTarget": 92,
      "slaTarget": 95,
      "utilizationTarget": 78
    }
  },
  {
    "id": "bp-s-h",
    "code": "S.H",
    "name": "Garde Enfant Spécial Hybride École + Domicile",
    "family": "special_needs",
    "marketSegment": "hybrid education support",
    "cities": [
      "Rabat",
      "Temara",
      "Casablanca"
    ],
    "modules": [
      "school_coordination",
      "home_care",
      "special_needs_protocol",
      "transport_option"
    ],
    "basePriceMad": 420,
    "riskLevel": "high",
    "status": "active",
    "requiredSkills": [
      "AngelCare certified",
      "Parent communication",
      "Safety protocol",
      "Special needs experience"
    ],
    "requiredDocuments": [
      "Client authorization",
      "Service consent",
      "Emergency contact",
      "Medical notes"
    ],
    "defaultWorkflow": [
      "Request intake",
      "Qualification",
      "Pricing simulation",
      "Staff matching",
      "Contract/approval",
      "Mission launch",
      "Live monitoring",
      "Quality review",
      "Renewal/upsell"
    ],
    "kpis": {
      "marginTarget": 35,
      "satisfactionTarget": 92,
      "slaTarget": 95,
      "utilizationTarget": 78
    }
  },
  {
    "id": "bp-s-s",
    "code": "S.S",
    "name": "Accompagnement Enfant Spécial à l’École",
    "family": "school_support",
    "marketSegment": "schools and institutions",
    "cities": [
      "Rabat",
      "Casablanca",
      "Marrakech"
    ],
    "modules": [
      "school_coordination",
      "institution_reporting",
      "certified_staff",
      "incident_protocol"
    ],
    "basePriceMad": 360,
    "riskLevel": "high",
    "status": "active",
    "requiredSkills": [
      "AngelCare certified",
      "Parent communication",
      "Safety protocol",
      "Special needs experience"
    ],
    "requiredDocuments": [
      "Client authorization",
      "Service consent",
      "Emergency contact",
      "Medical notes"
    ],
    "defaultWorkflow": [
      "Request intake",
      "Qualification",
      "Pricing simulation",
      "Staff matching",
      "Contract/approval",
      "Mission launch",
      "Live monitoring",
      "Quality review",
      "Renewal/upsell"
    ],
    "kpis": {
      "marginTarget": 35,
      "satisfactionTarget": 92,
      "slaTarget": 95,
      "utilizationTarget": 78
    }
  },
  {
    "id": "bp-p-p",
    "code": "P.P",
    "name": "Post-Partum Maman & Nouveau-Né",
    "family": "postpartum",
    "marketSegment": "premium postpartum care",
    "cities": [
      "Rabat",
      "Casablanca",
      "Marrakech",
      "Tangier"
    ],
    "modules": [
      "newborn_care",
      "mother_wellness",
      "night_shift",
      "medical_escalation"
    ],
    "basePriceMad": 450,
    "riskLevel": "high",
    "status": "active",
    "requiredSkills": [
      "AngelCare certified",
      "Parent communication",
      "Safety protocol",
      "Special needs experience"
    ],
    "requiredDocuments": [
      "Client authorization",
      "Service consent",
      "Emergency contact",
      "Medical notes"
    ],
    "defaultWorkflow": [
      "Request intake",
      "Qualification",
      "Pricing simulation",
      "Staff matching",
      "Contract/approval",
      "Mission launch",
      "Live monitoring",
      "Quality review",
      "Renewal/upsell"
    ],
    "kpis": {
      "marginTarget": 35,
      "satisfactionTarget": 92,
      "slaTarget": 95,
      "utilizationTarget": 78
    }
  },
  {
    "id": "bp-a-b",
    "code": "A.B",
    "name": "Animation Anniversaire Premium",
    "family": "events",
    "marketSegment": "family events",
    "cities": [
      "Rabat",
      "Temara",
      "Casablanca",
      "Marrakech"
    ],
    "modules": [
      "event_animation",
      "group_capacity",
      "materials_checklist",
      "upsell_photos"
    ],
    "basePriceMad": 600,
    "riskLevel": "medium",
    "status": "active",
    "requiredSkills": [
      "AngelCare certified",
      "Parent communication",
      "Safety protocol"
    ],
    "requiredDocuments": [
      "Client authorization",
      "Service consent",
      "Emergency contact"
    ],
    "defaultWorkflow": [
      "Request intake",
      "Qualification",
      "Pricing simulation",
      "Staff matching",
      "Contract/approval",
      "Mission launch",
      "Live monitoring",
      "Quality review",
      "Renewal/upsell"
    ],
    "kpis": {
      "marginTarget": 35,
      "satisfactionTarget": 92,
      "slaTarget": 95,
      "utilizationTarget": 78
    }
  },
  {
    "id": "bp-k-p",
    "code": "K.P",
    "name": "Animation Fêtes & Événements Enfants",
    "family": "events",
    "marketSegment": "private and corporate events",
    "cities": [
      "Rabat",
      "Casablanca",
      "Marrakech",
      "Tangier"
    ],
    "modules": [
      "event_animation",
      "group_capacity",
      "transport_option",
      "commercial_package"
    ],
    "basePriceMad": 900,
    "riskLevel": "medium",
    "status": "active",
    "requiredSkills": [
      "AngelCare certified",
      "Parent communication",
      "Safety protocol"
    ],
    "requiredDocuments": [
      "Client authorization",
      "Service consent",
      "Emergency contact"
    ],
    "defaultWorkflow": [
      "Request intake",
      "Qualification",
      "Pricing simulation",
      "Staff matching",
      "Contract/approval",
      "Mission launch",
      "Live monitoring",
      "Quality review",
      "Renewal/upsell"
    ],
    "kpis": {
      "marginTarget": 35,
      "satisfactionTarget": 92,
      "slaTarget": 95,
      "utilizationTarget": 78
    }
  },
  {
    "id": "bp-s-l",
    "code": "S.L",
    "name": "Ateliers Montessori & Ludique Avancés",
    "family": "education",
    "marketSegment": "parascolaire and Montessori",
    "cities": [
      "Rabat",
      "Temara",
      "Casablanca"
    ],
    "modules": [
      "montessori_program",
      "learning_reports",
      "materials_checklist",
      "subscription_ready"
    ],
    "basePriceMad": 220,
    "riskLevel": "low",
    "status": "active",
    "requiredSkills": [
      "AngelCare certified",
      "Parent communication",
      "Safety protocol"
    ],
    "requiredDocuments": [
      "Client authorization",
      "Service consent",
      "Emergency contact"
    ],
    "defaultWorkflow": [
      "Request intake",
      "Qualification",
      "Pricing simulation",
      "Staff matching",
      "Contract/approval",
      "Mission launch",
      "Live monitoring",
      "Quality review",
      "Renewal/upsell"
    ],
    "kpis": {
      "marginTarget": 35,
      "satisfactionTarget": 92,
      "slaTarget": 95,
      "utilizationTarget": 78
    }
  },
  {
    "id": "bp-e-x",
    "code": "E.X",
    "name": "Excursions & Sorties Encadrées",
    "family": "mobility",
    "marketSegment": "schools and families",
    "cities": [
      "Rabat",
      "Casablanca",
      "Marrakech"
    ],
    "modules": [
      "transport_option",
      "safety_checklist",
      "group_capacity",
      "incident_protocol"
    ],
    "basePriceMad": 750,
    "riskLevel": "high",
    "status": "active",
    "requiredSkills": [
      "AngelCare certified",
      "Parent communication",
      "Safety protocol",
      "Special needs experience"
    ],
    "requiredDocuments": [
      "Client authorization",
      "Service consent",
      "Emergency contact",
      "Medical notes"
    ],
    "defaultWorkflow": [
      "Request intake",
      "Qualification",
      "Pricing simulation",
      "Staff matching",
      "Contract/approval",
      "Mission launch",
      "Live monitoring",
      "Quality review",
      "Renewal/upsell"
    ],
    "kpis": {
      "marginTarget": 35,
      "satisfactionTarget": 92,
      "slaTarget": 95,
      "utilizationTarget": 78
    }
  },
  {
    "id": "bp-a-a",
    "code": "A.A",
    "name": "AngelCare Academy Formation & Certification",
    "family": "academy",
    "marketSegment": "training center B2B/B2C",
    "cities": [
      "Rabat",
      "Casablanca",
      "Online"
    ],
    "modules": [
      "training_program",
      "certification",
      "trainer_assignment",
      "institution_contract"
    ],
    "basePriceMad": 1200,
    "riskLevel": "medium",
    "status": "active",
    "requiredSkills": [
      "AngelCare certified",
      "Parent communication",
      "Safety protocol"
    ],
    "requiredDocuments": [
      "Client authorization",
      "Service consent",
      "Emergency contact"
    ],
    "defaultWorkflow": [
      "Request intake",
      "Qualification",
      "Pricing simulation",
      "Staff matching",
      "Contract/approval",
      "Mission launch",
      "Live monitoring",
      "Quality review",
      "Renewal/upsell"
    ],
    "kpis": {
      "marginTarget": 35,
      "satisfactionTarget": 92,
      "slaTarget": 95,
      "utilizationTarget": 78
    }
  },
  {
    "id": "bp-b2b-school",
    "code": "B2B.SCHOOL",
    "name": "Contrats Écoles & Institutions",
    "family": "institutional",
    "marketSegment": "schools, clinics, corporations",
    "cities": [
      "Rabat",
      "Casablanca",
      "Marrakech",
      "Tangier"
    ],
    "modules": [
      "sla_contract",
      "dedicated_staff_pool",
      "institution_reporting",
      "monthly_billing"
    ],
    "basePriceMad": 8500,
    "riskLevel": "high",
    "status": "active",
    "requiredSkills": [
      "AngelCare certified",
      "Parent communication",
      "Safety protocol",
      "Special needs experience"
    ],
    "requiredDocuments": [
      "Client authorization",
      "Service consent",
      "Emergency contact",
      "Medical notes"
    ],
    "defaultWorkflow": [
      "Request intake",
      "Qualification",
      "Pricing simulation",
      "Staff matching",
      "Contract/approval",
      "Mission launch",
      "Live monitoring",
      "Quality review",
      "Renewal/upsell"
    ],
    "kpis": {
      "marginTarget": 35,
      "satisfactionTarget": 92,
      "slaTarget": 95,
      "utilizationTarget": 78
    }
  },
  {
    "id": "bp-hotel-care",
    "code": "HOTEL.CARE",
    "name": "Childcare Hôtel & Tourisme Famille",
    "family": "tourism",
    "marketSegment": "hotels and tourism families",
    "cities": [
      "Marrakech",
      "Casablanca",
      "Tangier",
      "Rabat"
    ],
    "modules": [
      "hotel_coordination",
      "multilingual_staff",
      "short_notice",
      "premium_zone"
    ],
    "basePriceMad": 550,
    "riskLevel": "medium",
    "status": "active",
    "requiredSkills": [
      "AngelCare certified",
      "Parent communication",
      "Safety protocol"
    ],
    "requiredDocuments": [
      "Client authorization",
      "Service consent",
      "Emergency contact"
    ],
    "defaultWorkflow": [
      "Request intake",
      "Qualification",
      "Pricing simulation",
      "Staff matching",
      "Contract/approval",
      "Mission launch",
      "Live monitoring",
      "Quality review",
      "Renewal/upsell"
    ],
    "kpis": {
      "marginTarget": 35,
      "satisfactionTarget": 92,
      "slaTarget": 95,
      "utilizationTarget": 78
    }
  },
  {
    "id": "bp-family-premium",
    "code": "FAMILY.PREMIUM",
    "name": "AngelCare Family Premium Membership",
    "family": "subscription",
    "marketSegment": "recurring family revenue",
    "cities": [
      "Rabat",
      "Temara",
      "Casablanca",
      "Marrakech"
    ],
    "modules": [
      "priority_booking",
      "monthly_hours",
      "emergency_hotline",
      "discounts"
    ],
    "basePriceMad": 1490,
    "riskLevel": "low",
    "status": "active",
    "requiredSkills": [
      "AngelCare certified",
      "Parent communication",
      "Safety protocol"
    ],
    "requiredDocuments": [
      "Client authorization",
      "Service consent",
      "Emergency contact"
    ],
    "defaultWorkflow": [
      "Request intake",
      "Qualification",
      "Pricing simulation",
      "Staff matching",
      "Contract/approval",
      "Mission launch",
      "Live monitoring",
      "Quality review",
      "Renewal/upsell"
    ],
    "kpis": {
      "marginTarget": 35,
      "satisfactionTarget": 92,
      "slaTarget": 95,
      "utilizationTarget": 78
    }
  }
]

export const angelCareServiceModules: ServiceModule[] = [
  {
    "key": "home_care",
    "label": "Home Care",
    "description": "Care at home with arrival checklist, parent handoff and mission closeout",
    "category": "enterprise_service_module",
    "enterpriseReady": true
  },
  {
    "key": "parent_reporting",
    "label": "Parent Reporting",
    "description": "Daily reports, notes, photos policy and satisfaction follow-up",
    "category": "enterprise_service_module",
    "enterpriseReady": true
  },
  {
    "key": "transport_option",
    "label": "Transport Option",
    "description": "Transport consent, route validation, pickup/drop-off checklist",
    "category": "enterprise_service_module",
    "enterpriseReady": true
  },
  {
    "key": "night_shift",
    "label": "Night Shift",
    "description": "Night availability, overtime premium and safety escalation",
    "category": "enterprise_service_module",
    "enterpriseReady": true
  },
  {
    "key": "special_needs_protocol",
    "label": "Special Needs Protocol",
    "description": "Specific needs intake, sensory profile, risk protocol",
    "category": "enterprise_service_module",
    "enterpriseReady": true
  },
  {
    "key": "sensory_support",
    "label": "Sensory Support",
    "description": "Sensory-friendly routines, triggers and calming checklist",
    "category": "enterprise_service_module",
    "enterpriseReady": true
  },
  {
    "key": "certified_staff",
    "label": "Certified Staff",
    "description": "Certification requirement linked to HR skills and training",
    "category": "enterprise_service_module",
    "enterpriseReady": true
  },
  {
    "key": "school_coordination",
    "label": "School Coordination",
    "description": "School authorization, teacher handoff and institution report",
    "category": "enterprise_service_module",
    "enterpriseReady": true
  },
  {
    "key": "institution_reporting",
    "label": "Institution Reporting",
    "description": "B2B operational report and SLA tracking",
    "category": "enterprise_service_module",
    "enterpriseReady": true
  },
  {
    "key": "incident_protocol",
    "label": "Incident Protocol",
    "description": "Incident categorization, escalation and root cause analysis",
    "category": "enterprise_service_module",
    "enterpriseReady": true
  },
  {
    "key": "newborn_care",
    "label": "Newborn Care",
    "description": "Newborn feeding, sleep, hygiene and safety checklist",
    "category": "enterprise_service_module",
    "enterpriseReady": true
  },
  {
    "key": "mother_wellness",
    "label": "Mother Wellness",
    "description": "Mother support, postpartum observation and escalation",
    "category": "enterprise_service_module",
    "enterpriseReady": true
  },
  {
    "key": "medical_escalation",
    "label": "Medical Escalation",
    "description": "Emergency contacts, nurse/doctor escalation and documentation",
    "category": "enterprise_service_module",
    "enterpriseReady": true
  },
  {
    "key": "event_animation",
    "label": "Event Animation",
    "description": "Animation program, materials and event timeline",
    "category": "enterprise_service_module",
    "enterpriseReady": true
  },
  {
    "key": "group_capacity",
    "label": "Group Capacity",
    "description": "Ratio rules by age, event size and risk",
    "category": "enterprise_service_module",
    "enterpriseReady": true
  },
  {
    "key": "materials_checklist",
    "label": "Materials Checklist",
    "description": "Equipment checklist, stock readiness and accountability",
    "category": "enterprise_service_module",
    "enterpriseReady": true
  },
  {
    "key": "upsell_photos",
    "label": "Upsell Photos",
    "description": "Optional photo/video/commercial memories upsell workflow",
    "category": "enterprise_service_module",
    "enterpriseReady": true
  },
  {
    "key": "montessori_program",
    "label": "Montessori Program",
    "description": "Montessori-inspired program library and learning objectives",
    "category": "enterprise_service_module",
    "enterpriseReady": true
  },
  {
    "key": "learning_reports",
    "label": "Learning Reports",
    "description": "Progress observations and parent/academy reporting",
    "category": "enterprise_service_module",
    "enterpriseReady": true
  },
  {
    "key": "subscription_ready",
    "label": "Subscription Ready",
    "description": "Can be bundled into recurring family or institution plan",
    "category": "enterprise_service_module",
    "enterpriseReady": true
  },
  {
    "key": "safety_checklist",
    "label": "Safety Checklist",
    "description": "Pre-mission safety checklist and authorization controls",
    "category": "enterprise_service_module",
    "enterpriseReady": true
  },
  {
    "key": "commercial_package",
    "label": "Commercial Package",
    "description": "Reusable pricing/package bundle",
    "category": "enterprise_service_module",
    "enterpriseReady": true
  },
  {
    "key": "training_program",
    "label": "Training Program",
    "description": "Academy curriculum, sessions and trainer mapping",
    "category": "enterprise_service_module",
    "enterpriseReady": true
  },
  {
    "key": "certification",
    "label": "Certification",
    "description": "Certification issuance, validity and renewal reminders",
    "category": "enterprise_service_module",
    "enterpriseReady": true
  },
  {
    "key": "trainer_assignment",
    "label": "Trainer Assignment",
    "description": "Trainer matching and capacity planning",
    "category": "enterprise_service_module",
    "enterpriseReady": true
  },
  {
    "key": "institution_contract",
    "label": "Institution Contract",
    "description": "Institution deal, dedicated SLA and billing terms",
    "category": "enterprise_service_module",
    "enterpriseReady": true
  },
  {
    "key": "sla_contract",
    "label": "Sla Contract",
    "description": "Service level commitments, response times and penalties",
    "category": "enterprise_service_module",
    "enterpriseReady": true
  },
  {
    "key": "dedicated_staff_pool",
    "label": "Dedicated Staff Pool",
    "description": "Reserved staff pool for contract execution",
    "category": "enterprise_service_module",
    "enterpriseReady": true
  },
  {
    "key": "monthly_billing",
    "label": "Monthly Billing",
    "description": "Recurring invoice profile and reconciliation",
    "category": "enterprise_service_module",
    "enterpriseReady": true
  },
  {
    "key": "hotel_coordination",
    "label": "Hotel Coordination",
    "description": "Hotel concierge flow, guest identity and room handoff",
    "category": "enterprise_service_module",
    "enterpriseReady": true
  },
  {
    "key": "multilingual_staff",
    "label": "Multilingual Staff",
    "description": "Arabic, French, English or Spanish matching",
    "category": "enterprise_service_module",
    "enterpriseReady": true
  },
  {
    "key": "short_notice",
    "label": "Short Notice",
    "description": "Urgent request workflow and surcharge",
    "category": "enterprise_service_module",
    "enterpriseReady": true
  },
  {
    "key": "premium_zone",
    "label": "Premium Zone",
    "description": "Premium district pricing and priority rules",
    "category": "enterprise_service_module",
    "enterpriseReady": true
  },
  {
    "key": "priority_booking",
    "label": "Priority Booking",
    "description": "Priority service allocation for members",
    "category": "enterprise_service_module",
    "enterpriseReady": true
  },
  {
    "key": "monthly_hours",
    "label": "Monthly Hours",
    "description": "Recurring hour allowance and balance tracking",
    "category": "enterprise_service_module",
    "enterpriseReady": true
  },
  {
    "key": "emergency_hotline",
    "label": "Emergency Hotline",
    "description": "Emergency booking/support path",
    "category": "enterprise_service_module",
    "enterpriseReady": true
  },
  {
    "key": "discounts",
    "label": "Discounts",
    "description": "Membership discount logic and upsell restrictions",
    "category": "enterprise_service_module",
    "enterpriseReady": true
  }
]

export const angelCareServiceRules: ServiceRule[] = [
  {
    "id": "rule-special-needs-certified",
    "name": "Special needs certification required",
    "when": "service.family == special_needs OR input.specialNeeds == true",
    "then": [
      "Require certified staff",
      "Attach sensory/support SOP",
      "Raise risk review before confirmation"
    ],
    "pricingModifierMad": 120,
    "riskImpact": "high"
  },
  {
    "id": "rule-night-premium",
    "name": "Night shift premium",
    "when": "input.night == true OR mission.startAt after 22:00",
    "then": [
      "Apply night premium",
      "Require transport review",
      "Notify operations manager"
    ],
    "pricingModifierMad": 90,
    "riskImpact": "medium"
  },
  {
    "id": "rule-premium-zone",
    "name": "Premium district pricing",
    "when": "input.premiumZone == true",
    "then": [
      "Apply premium-zone modifier",
      "Prioritize top-rated staff"
    ],
    "pricingModifierMad": 70,
    "riskImpact": "low"
  },
  {
    "id": "rule-transport",
    "name": "Transport option",
    "when": "input.transport == true",
    "then": [
      "Require transport consent",
      "Attach pickup/drop checklist",
      "Apply transport fee"
    ],
    "pricingModifierMad": 60,
    "riskImpact": "medium"
  },
  {
    "id": "rule-urgent",
    "name": "Urgent request handling",
    "when": "input.urgent == true",
    "then": [
      "Activate urgent workflow",
      "Notify available staff pool",
      "Apply urgency surcharge"
    ],
    "pricingModifierMad": 100,
    "riskImpact": "medium"
  },
  {
    "id": "rule-b2b-contract",
    "name": "B2B contract SLA",
    "when": "input.b2b == true",
    "then": [
      "Attach SLA",
      "Use institutional reporting",
      "Use monthly billing profile"
    ],
    "pricingModifierMad": 0,
    "riskImpact": "medium"
  }
]

export const angelCareCityDeployments: CityDeployment[] = [
  {
    "city": "Rabat",
    "blueprintCode": "H.S",
    "active": true,
    "capacityScore": 80,
    "demandScore": 88,
    "staffAvailable": 14,
    "launchPriority": "dominate"
  },
  {
    "city": "Temara",
    "blueprintCode": "H.S",
    "active": true,
    "capacityScore": 80,
    "demandScore": 72,
    "staffAvailable": 6,
    "launchPriority": "scale"
  },
  {
    "city": "Casablanca",
    "blueprintCode": "H.S",
    "active": true,
    "capacityScore": 80,
    "demandScore": 88,
    "staffAvailable": 14,
    "launchPriority": "dominate"
  },
  {
    "city": "Marrakech",
    "blueprintCode": "H.S",
    "active": true,
    "capacityScore": 80,
    "demandScore": 72,
    "staffAvailable": 6,
    "launchPriority": "scale"
  },
  {
    "city": "Rabat",
    "blueprintCode": "S.K",
    "active": true,
    "capacityScore": 80,
    "demandScore": 88,
    "staffAvailable": 14,
    "launchPriority": "dominate"
  },
  {
    "city": "Casablanca",
    "blueprintCode": "S.K",
    "active": true,
    "capacityScore": 80,
    "demandScore": 88,
    "staffAvailable": 14,
    "launchPriority": "dominate"
  },
  {
    "city": "Rabat",
    "blueprintCode": "S.H",
    "active": true,
    "capacityScore": 80,
    "demandScore": 88,
    "staffAvailable": 14,
    "launchPriority": "dominate"
  },
  {
    "city": "Temara",
    "blueprintCode": "S.H",
    "active": true,
    "capacityScore": 80,
    "demandScore": 72,
    "staffAvailable": 6,
    "launchPriority": "scale"
  },
  {
    "city": "Casablanca",
    "blueprintCode": "S.H",
    "active": true,
    "capacityScore": 80,
    "demandScore": 88,
    "staffAvailable": 14,
    "launchPriority": "dominate"
  },
  {
    "city": "Rabat",
    "blueprintCode": "S.S",
    "active": true,
    "capacityScore": 80,
    "demandScore": 88,
    "staffAvailable": 14,
    "launchPriority": "dominate"
  },
  {
    "city": "Casablanca",
    "blueprintCode": "S.S",
    "active": true,
    "capacityScore": 80,
    "demandScore": 88,
    "staffAvailable": 14,
    "launchPriority": "dominate"
  },
  {
    "city": "Marrakech",
    "blueprintCode": "S.S",
    "active": true,
    "capacityScore": 80,
    "demandScore": 72,
    "staffAvailable": 6,
    "launchPriority": "scale"
  },
  {
    "city": "Rabat",
    "blueprintCode": "P.P",
    "active": true,
    "capacityScore": 80,
    "demandScore": 88,
    "staffAvailable": 14,
    "launchPriority": "dominate"
  },
  {
    "city": "Casablanca",
    "blueprintCode": "P.P",
    "active": true,
    "capacityScore": 80,
    "demandScore": 88,
    "staffAvailable": 14,
    "launchPriority": "dominate"
  },
  {
    "city": "Marrakech",
    "blueprintCode": "P.P",
    "active": true,
    "capacityScore": 80,
    "demandScore": 72,
    "staffAvailable": 6,
    "launchPriority": "scale"
  },
  {
    "city": "Tangier",
    "blueprintCode": "P.P",
    "active": true,
    "capacityScore": 80,
    "demandScore": 72,
    "staffAvailable": 6,
    "launchPriority": "scale"
  },
  {
    "city": "Rabat",
    "blueprintCode": "A.B",
    "active": true,
    "capacityScore": 80,
    "demandScore": 88,
    "staffAvailable": 14,
    "launchPriority": "dominate"
  },
  {
    "city": "Temara",
    "blueprintCode": "A.B",
    "active": true,
    "capacityScore": 80,
    "demandScore": 72,
    "staffAvailable": 6,
    "launchPriority": "scale"
  },
  {
    "city": "Casablanca",
    "blueprintCode": "A.B",
    "active": true,
    "capacityScore": 80,
    "demandScore": 88,
    "staffAvailable": 14,
    "launchPriority": "dominate"
  },
  {
    "city": "Marrakech",
    "blueprintCode": "A.B",
    "active": true,
    "capacityScore": 80,
    "demandScore": 72,
    "staffAvailable": 6,
    "launchPriority": "scale"
  },
  {
    "city": "Rabat",
    "blueprintCode": "K.P",
    "active": true,
    "capacityScore": 80,
    "demandScore": 88,
    "staffAvailable": 14,
    "launchPriority": "dominate"
  },
  {
    "city": "Casablanca",
    "blueprintCode": "K.P",
    "active": true,
    "capacityScore": 80,
    "demandScore": 88,
    "staffAvailable": 14,
    "launchPriority": "dominate"
  },
  {
    "city": "Marrakech",
    "blueprintCode": "K.P",
    "active": true,
    "capacityScore": 80,
    "demandScore": 72,
    "staffAvailable": 6,
    "launchPriority": "scale"
  },
  {
    "city": "Tangier",
    "blueprintCode": "K.P",
    "active": true,
    "capacityScore": 80,
    "demandScore": 72,
    "staffAvailable": 6,
    "launchPriority": "scale"
  },
  {
    "city": "Rabat",
    "blueprintCode": "S.L",
    "active": true,
    "capacityScore": 80,
    "demandScore": 88,
    "staffAvailable": 14,
    "launchPriority": "dominate"
  },
  {
    "city": "Temara",
    "blueprintCode": "S.L",
    "active": true,
    "capacityScore": 80,
    "demandScore": 72,
    "staffAvailable": 6,
    "launchPriority": "scale"
  },
  {
    "city": "Casablanca",
    "blueprintCode": "S.L",
    "active": true,
    "capacityScore": 80,
    "demandScore": 88,
    "staffAvailable": 14,
    "launchPriority": "dominate"
  },
  {
    "city": "Rabat",
    "blueprintCode": "E.X",
    "active": true,
    "capacityScore": 80,
    "demandScore": 88,
    "staffAvailable": 14,
    "launchPriority": "dominate"
  },
  {
    "city": "Casablanca",
    "blueprintCode": "E.X",
    "active": true,
    "capacityScore": 80,
    "demandScore": 88,
    "staffAvailable": 14,
    "launchPriority": "dominate"
  },
  {
    "city": "Marrakech",
    "blueprintCode": "E.X",
    "active": true,
    "capacityScore": 80,
    "demandScore": 72,
    "staffAvailable": 6,
    "launchPriority": "scale"
  },
  {
    "city": "Rabat",
    "blueprintCode": "A.A",
    "active": true,
    "capacityScore": 80,
    "demandScore": 88,
    "staffAvailable": 14,
    "launchPriority": "dominate"
  },
  {
    "city": "Casablanca",
    "blueprintCode": "A.A",
    "active": true,
    "capacityScore": 80,
    "demandScore": 88,
    "staffAvailable": 14,
    "launchPriority": "dominate"
  },
  {
    "city": "Online",
    "blueprintCode": "A.A",
    "active": true,
    "capacityScore": 80,
    "demandScore": 72,
    "staffAvailable": 6,
    "launchPriority": "scale"
  },
  {
    "city": "Rabat",
    "blueprintCode": "B2B.SCHOOL",
    "active": true,
    "capacityScore": 80,
    "demandScore": 88,
    "staffAvailable": 14,
    "launchPriority": "dominate"
  },
  {
    "city": "Casablanca",
    "blueprintCode": "B2B.SCHOOL",
    "active": true,
    "capacityScore": 80,
    "demandScore": 88,
    "staffAvailable": 14,
    "launchPriority": "dominate"
  },
  {
    "city": "Marrakech",
    "blueprintCode": "B2B.SCHOOL",
    "active": true,
    "capacityScore": 80,
    "demandScore": 72,
    "staffAvailable": 6,
    "launchPriority": "scale"
  },
  {
    "city": "Tangier",
    "blueprintCode": "B2B.SCHOOL",
    "active": true,
    "capacityScore": 80,
    "demandScore": 72,
    "staffAvailable": 6,
    "launchPriority": "scale"
  },
  {
    "city": "Marrakech",
    "blueprintCode": "HOTEL.CARE",
    "active": true,
    "capacityScore": 80,
    "demandScore": 72,
    "staffAvailable": 6,
    "launchPriority": "scale"
  },
  {
    "city": "Casablanca",
    "blueprintCode": "HOTEL.CARE",
    "active": true,
    "capacityScore": 80,
    "demandScore": 88,
    "staffAvailable": 14,
    "launchPriority": "dominate"
  },
  {
    "city": "Tangier",
    "blueprintCode": "HOTEL.CARE",
    "active": true,
    "capacityScore": 80,
    "demandScore": 72,
    "staffAvailable": 6,
    "launchPriority": "scale"
  },
  {
    "city": "Rabat",
    "blueprintCode": "HOTEL.CARE",
    "active": true,
    "capacityScore": 80,
    "demandScore": 88,
    "staffAvailable": 14,
    "launchPriority": "dominate"
  },
  {
    "city": "Rabat",
    "blueprintCode": "FAMILY.PREMIUM",
    "active": true,
    "capacityScore": 80,
    "demandScore": 88,
    "staffAvailable": 14,
    "launchPriority": "dominate"
  },
  {
    "city": "Temara",
    "blueprintCode": "FAMILY.PREMIUM",
    "active": true,
    "capacityScore": 80,
    "demandScore": 72,
    "staffAvailable": 6,
    "launchPriority": "scale"
  },
  {
    "city": "Casablanca",
    "blueprintCode": "FAMILY.PREMIUM",
    "active": true,
    "capacityScore": 80,
    "demandScore": 88,
    "staffAvailable": 14,
    "launchPriority": "dominate"
  },
  {
    "city": "Marrakech",
    "blueprintCode": "FAMILY.PREMIUM",
    "active": true,
    "capacityScore": 80,
    "demandScore": 72,
    "staffAvailable": 6,
    "launchPriority": "scale"
  }
]

export const demoServiceMissions: ServiceMission[] = [
  {
    "id": "mission-1",
    "blueprintCode": "H.S",
    "city": "Rabat",
    "status": "requested",
    "client": "Famille premium",
    "staff": "Caregiver 1",
    "startAt": "2026-05-12T09:00:00+01:00",
    "risk": "medium",
    "valueMad": 180
  },
  {
    "id": "mission-2",
    "blueprintCode": "S.K",
    "city": "Casablanca",
    "status": "qualified",
    "client": "École partenaire",
    "staff": "Caregiver 2",
    "startAt": "2026-05-12T09:00:00+01:00",
    "risk": "high",
    "valueMad": 400
  },
  {
    "id": "mission-3",
    "blueprintCode": "S.H",
    "city": "Marrakech",
    "status": "assigned",
    "client": "Hôtel client",
    "staff": "Caregiver 3",
    "startAt": "2026-05-12T09:00:00+01:00",
    "risk": "high",
    "valueMad": 580
  },
  {
    "id": "mission-4",
    "blueprintCode": "S.S",
    "city": "Temara",
    "status": "live",
    "client": "Compte corporate",
    "staff": "Caregiver 4",
    "startAt": "2026-05-12T09:00:00+01:00",
    "risk": "high",
    "valueMad": 600
  },
  {
    "id": "mission-5",
    "blueprintCode": "P.P",
    "city": "Rabat",
    "status": "completed",
    "client": "Famille premium",
    "staff": "Caregiver 5",
    "startAt": "2026-05-12T09:00:00+01:00",
    "risk": "high",
    "valueMad": 770
  },
  {
    "id": "mission-6",
    "blueprintCode": "A.B",
    "city": "Casablanca",
    "status": "incident",
    "client": "École partenaire",
    "staff": "Caregiver 6",
    "startAt": "2026-05-12T09:00:00+01:00",
    "risk": "medium",
    "valueMad": 1000
  },
  {
    "id": "mission-7",
    "blueprintCode": "K.P",
    "city": "Marrakech",
    "status": "requested",
    "client": "Hôtel client",
    "staff": "Caregiver 7",
    "startAt": "2026-05-12T09:00:00+01:00",
    "risk": "medium",
    "valueMad": 1380
  },
  {
    "id": "mission-8",
    "blueprintCode": "S.L",
    "city": "Temara",
    "status": "qualified",
    "client": "Compte corporate",
    "staff": "Caregiver 8",
    "startAt": "2026-05-12T09:00:00+01:00",
    "risk": "low",
    "valueMad": 780
  },
  {
    "id": "mission-9",
    "blueprintCode": "E.X",
    "city": "Rabat",
    "status": "assigned",
    "client": "Famille premium",
    "staff": "Caregiver 9",
    "startAt": "2026-05-12T09:00:00+01:00",
    "risk": "high",
    "valueMad": 1390
  },
  {
    "id": "mission-10",
    "blueprintCode": "A.A",
    "city": "Casablanca",
    "status": "live",
    "client": "École partenaire",
    "staff": "Caregiver 10",
    "startAt": "2026-05-12T09:00:00+01:00",
    "risk": "medium",
    "valueMad": 1920
  },
  {
    "id": "mission-11",
    "blueprintCode": "B2B.SCHOOL",
    "city": "Marrakech",
    "status": "completed",
    "client": "Hôtel client",
    "staff": "Caregiver 11",
    "startAt": "2026-05-12T09:00:00+01:00",
    "risk": "high",
    "valueMad": 9300
  },
  {
    "id": "mission-12",
    "blueprintCode": "HOTEL.CARE",
    "city": "Temara",
    "status": "incident",
    "client": "Compte corporate",
    "staff": "Caregiver 12",
    "startAt": "2026-05-12T09:00:00+01:00",
    "risk": "medium",
    "valueMad": 1430
  },
  {
    "id": "mission-13",
    "blueprintCode": "FAMILY.PREMIUM",
    "city": "Rabat",
    "status": "requested",
    "client": "Famille premium",
    "staff": "Caregiver 13",
    "startAt": "2026-05-12T09:00:00+01:00",
    "risk": "low",
    "valueMad": 2450
  },
  {
    "id": "mission-14",
    "blueprintCode": "H.S",
    "city": "Casablanca",
    "status": "qualified",
    "client": "École partenaire",
    "staff": "Caregiver 14",
    "startAt": "2026-05-12T09:00:00+01:00",
    "risk": "medium",
    "valueMad": 1220
  },
  {
    "id": "mission-15",
    "blueprintCode": "S.K",
    "city": "Marrakech",
    "status": "assigned",
    "client": "Hôtel client",
    "staff": "Caregiver 15",
    "startAt": "2026-05-12T09:00:00+01:00",
    "risk": "high",
    "valueMad": 1440
  },
  {
    "id": "mission-16",
    "blueprintCode": "S.H",
    "city": "Temara",
    "status": "live",
    "client": "Compte corporate",
    "staff": "Caregiver 16",
    "startAt": "2026-05-12T09:00:00+01:00",
    "risk": "high",
    "valueMad": 1620
  },
  {
    "id": "mission-17",
    "blueprintCode": "S.S",
    "city": "Rabat",
    "status": "completed",
    "client": "Famille premium",
    "staff": "Caregiver 17",
    "startAt": "2026-05-12T09:00:00+01:00",
    "risk": "high",
    "valueMad": 1640
  },
  {
    "id": "mission-18",
    "blueprintCode": "P.P",
    "city": "Casablanca",
    "status": "incident",
    "client": "École partenaire",
    "staff": "Caregiver 18",
    "startAt": "2026-05-12T09:00:00+01:00",
    "risk": "high",
    "valueMad": 1810
  }
]

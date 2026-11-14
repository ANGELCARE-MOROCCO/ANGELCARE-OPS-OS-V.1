import type {
  CatalogLocale,
  DiscoveryItem,
  StorefrontKey,
} from "../catalog-discovery/types";
import type { BusinessKey } from "./content";

export type LocalCopy = { fr: string; en: string; ar: string };
export const words = (fr: string, en: string, ar: string): LocalCopy => ({
  fr,
  en,
  ar,
});
export const localized = (copy: LocalCopy, locale: CatalogLocale) =>
  copy[locale];
export const BUSINESS_COMMERCE_REVISION = "AC-7SF-R1";
export const businessKeys = [
  "establishments",
  "hospitality",
  "health-partners",
  "corporates",
  "partner-os",
  "quality-check",
  "professionals",
] as const;
export function businessKey(
  value: StorefrontKey | string,
): value is BusinessKey {
  return (businessKeys as readonly string[]).includes(value);
}
export interface PublicFact {
  key: string;
  label: string;
  value: string;
  values: string[];
}
export interface BusinessProjection {
  version: 1;
  schema: string;
  schemaLabel: string;
  conversion: string;
  authority: string;
  categories: string[];
  reason:
    | "manual_placement"
    | "canonical_membership"
    | "native_doctrine"
    | "professional_audience"
    | "institutional_audience";
  lane: "primary" | "related";
  fields: PublicFact[];
  sourceLocale: CatalogLocale;
  linkedPlanId?: string;
}
export interface CommercialSegment {
  key: string;
  label: LocalCopy;
  schemas: readonly string[];
}
export interface CommercialProfile {
  title: LocalCopy;
  lead: LocalCopy;
  audience: LocalCopy;
  segments: CommercialSegment[];
  fields: readonly string[];
}
const segment = (
  key: string,
  label: LocalCopy,
  ...schemas: string[]
): CommercialSegment => ({ key, label, schemas });
const sharedFields = [
  "organization_type",
  "site_minimum",
  "site_maximum",
  "implementation_lead_time_days",
];
export const COMMERCIAL_PROFILES: Record<BusinessKey, CommercialProfile> = {
  establishments: {
    title: words(
      "Les solutions de votre établissement",
      "Solutions for your establishment",
      "حلول مؤسستكم",
    ),
    lead: words(
      "Programmes, équipes et progression : comparez les offres publiées selon votre projet.",
      "Programmes, teams and development: compare published offers for your project.",
      "برامج وفرق وتطوير: قارنوا العروض المنشورة حسب مشروعكم.",
    ),
    audience: words(
      "Crèches · Écoles · Directions",
      "Nurseries · Schools · Directors",
      "حضانات · مدارس · إدارات",
    ),
    segments: [
      segment(
        "programmes",
        words("Programmes", "Programmes", "البرامج"),
        "school-managed-programme",
        "custom-managed-solution",
      ),
      segment(
        "staffing",
        words("Renfort d’équipe", "Team reinforcement", "دعم الفرق"),
        "school-staff-reinforcement",
      ),
      segment(
        "learning",
        words("Formation des équipes", "Team learning", "تكوين الفرق"),
        "institutional-training",
      ),
      segment(
        "quality",
        words(
          "Qualité & organisation",
          "Quality & organisation",
          "الجودة والتنظيم",
        ),
        "quality-check-assessment",
        "partner-os-plan",
      ),
    ],
    fields: [
      ...sharedFields,
      "age_groups",
      "children_capacity",
      "staffing_model",
      "required_roles",
      "personnel_count",
      "shift_patterns",
      "qualification_requirements",
      "replacement_sla_hours",
      "operating_schedule",
      "programme_modules",
      "reporting_frequency",
      "contract_duration_months",
    ],
  },
  hospitality: {
    title: words(
      "Votre expérience famille, concrètement",
      "Your family experience, made concrete",
      "تجربة الأسرة في مؤسستكم",
    ),
    lead: words(
      "Explorez les programmes publiés, leur périmètre et leurs modalités pour votre établissement.",
      "Explore published programmes, their scope and delivery for your property.",
      "استكشفوا البرامج المنشورة ونطاقها وصيغها لمؤسستكم.",
    ),
    audience: words(
      "Hôtels · Resorts · Équipes d’exploitation",
      "Hotels · Resorts · Operating teams",
      "فنادق · منتجعات · فرق التشغيل",
    ),
    segments: [
      segment(
        "programmes",
        words(
          "Kids Club & programmes",
          "Kids Club & programmes",
          "نادي الأطفال والبرامج",
        ),
        "hospitality-kids-programme",
      ),
      segment(
        "events",
        words("Événements & saisons", "Events & seasons", "فعاليات ومواسم"),
        "event-venue-programme",
      ),
      segment(
        "design",
        words("Solutions sur mesure", "Tailored solutions", "حلول مخصصة"),
        "custom-managed-solution",
      ),
      segment(
        "guest",
        words("Services aux familles", "Family services", "خدمات الأسر"),
        "hotel-travel-childcare",
      ),
    ],
    fields: [
      ...sharedFields,
      "property_types",
      "property_size_rooms",
      "programme_modules",
      "operating_hours",
      "expected_child_volume",
      "multilingual_needs",
      "guest_booking_integration",
      "billing_model",
      "pilot_enabled",
    ],
  },
  "health-partners": {
    title: words(
      "Des partenariats autour de la famille",
      "Partnerships around the family",
      "شراكات حول الأسرة",
    ),
    lead: words(
      "Comparez les offres et leurs modalités de coordination dans un périmètre non médical.",
      "Compare offers and coordination terms within a non-medical scope.",
      "قارنوا العروض وصيغ التنسيق ضمن نطاق غير طبي.",
    ),
    audience: words(
      "Maternités · Structures partenaires · Coordination",
      "Maternity facilities · Partner organisations · Coordination",
      "مؤسسات الأمومة · شركاء · تنسيق",
    ),
    segments: [
      segment(
        "partnership",
        words("Partenariats", "Partnerships", "الشراكات"),
        "health-adjacent-programme",
        "custom-managed-solution",
      ),
      segment(
        "workshops",
        words("Ateliers & formation", "Workshops & learning", "ورشات وتكوين"),
        "parent-workshop",
        "institutional-training",
      ),
      segment(
        "family",
        words("Services aux familles", "Family services", "خدمات الأسر"),
        "non-medical-support-service",
      ),
    ],
    fields: [
      ...sharedFields,
      "partner_types",
      "programme_modules",
      "operating_hours",
      "expected_family_volume",
      "non_medical_scope_statement",
      "safeguarding_requirements",
    ],
  },
  corporates: {
    title: words(
      "Le bon programme pour vos équipes",
      "The right programme for your people",
      "البرنامج المناسب لفرقكم",
    ),
    lead: words(
      "Du soutien parental aux moments familles, partez des offres réelles et de leur périmètre.",
      "From parental support to family moments, start with actual offers and their scope.",
      "من دعم الوالدين إلى لحظات الأسرة، انطلقوا من العروض الفعلية ونطاقها.",
    ),
    audience: words(
      "RH · Avantages salariés · Employeurs",
      "HR · Employee benefits · Employers",
      "الموارد البشرية · مزايا الموظفين · المشغلون",
    ),
    segments: [
      segment(
        "benefits",
        words("Avantages & soutien", "Benefits & support", "مزايا ودعم"),
        "corporate-childcare-benefit",
      ),
      segment(
        "events",
        words(
          "Family Days & événements",
          "Family Days & events",
          "أيام الأسرة والفعاليات",
        ),
        "event-venue-programme",
      ),
      segment(
        "design",
        words("Programme sur mesure", "Tailored programme", "برنامج مخصص"),
        "custom-managed-solution",
      ),
    ],
    fields: [
      ...sharedFields,
      "benefit_models",
      "employee_population",
      "employer_contribution_type",
      "employer_contribution_value",
      "employee_eligibility_rules",
      "usage_limits",
      "covered_service_keys",
      "company_billing_cycle",
      "expected_attendance",
    ],
  },
  "partner-os": {
    title: words(
      "Choisir votre périmètre Partner OS",
      "Choose your Partner OS scope",
      "اختيار نطاق Partner OS",
    ),
    lead: words(
      "Comparez les plans publiés, leurs modules et leurs conditions. Votre choix accompagne la demande.",
      "Compare published plans, modules and terms. Your selection stays with your request.",
      "قارنوا الخطط المنشورة ووحداتها وشروطها. يرافق اختياركم الطلب.",
    ),
    audience: words(
      "Organisations · Opérateurs · Administrateurs",
      "Organisations · Operators · Administrators",
      "مؤسسات · مشغلون · مسؤولون",
    ),
    segments: [
      segment(
        "plans",
        words("Plans & abonnements", "Plans & subscriptions", "خطط واشتراكات"),
        "partner-os-plan",
      ),
      segment(
        "design",
        words("Accompagnement", "Guided setup", "المواكبة"),
        "custom-managed-solution",
      ),
    ],
    fields: [
      "tenant_type",
      "included_modules",
      "user_limit",
      "site_limit",
      "usage_limits",
      "storage_gb",
      "support_level",
      "onboarding_type",
      "setup_fee_dh",
      "recurring_fee_dh",
      "billing_period",
      "trial_days",
    ],
  },
  "quality-check": {
    title: words(
      "Une évaluation adaptée à votre périmètre",
      "An assessment shaped around your scope",
      "تقييم يناسب نطاقكم",
    ),
    lead: words(
      "Examinez le cadre, les modalités et les livrables des évaluations publiées.",
      "Review the framework, delivery and outputs of published assessments.",
      "اطلعوا على إطار وصيغ ومخرجات التقييمات المنشورة.",
    ),
    audience: words(
      "Directions · Référents qualité · Institutions",
      "Directors · Quality leads · Institutions",
      "إدارات · مسؤولو الجودة · مؤسسات",
    ),
    segments: [
      segment(
        "assessments",
        words("Évaluations", "Assessments", "التقييمات"),
        "quality-check-assessment",
      ),
      segment(
        "support",
        words("Accompagnement sur mesure", "Tailored support", "مواكبة مخصصة"),
        "custom-managed-solution",
      ),
    ],
    fields: [
      "assessment_framework",
      "assessment_scope",
      "assessment_mode",
      "site_count",
      "duration_days",
      "report_type",
      "evidence_requirements",
      "corrective_action_support",
      "followup_assessment_enabled",
    ],
  },
  professionals: {
    title: words(
      "Votre prochaine étape professionnelle",
      "Your next professional step",
      "خطوتكم المهنية المقبلة",
    ),
    lead: words(
      "Repérez les formations et parcours publiés, leurs prérequis et leurs modalités.",
      "Find published learning and pathways, with their prerequisites and delivery terms.",
      "اكتشفوا التكوينات والمسارات المنشورة ومتطلباتها وصيغها.",
    ),
    audience: words(
      "Praticiens · Prestataires · Apprenants",
      "Practitioners · Providers · Learners",
      "ممارسون · مقدمو خدمات · متعلمون",
    ),
    segments: [
      segment(
        "courses",
        words("Formations", "Courses", "التكوينات"),
        "academy-course",
        "institutional-training",
      ),
      segment(
        "sessions",
        words("Sessions", "Cohorts", "الدورات"),
        "academy-cohort",
      ),
      segment(
        "pathways",
        words(
          "Parcours & certifications",
          "Pathways & certification",
          "مسارات وشهادات",
        ),
        "certification-pathway",
      ),
    ],
    fields: [
      "intended_audience",
      "audience_types",
      "level",
      "duration_hours",
      "delivery_modality",
      "language",
      "prerequisites",
      "learning_outcomes",
      "assessment_type",
      "certificate_enabled",
      "start_date",
      "seat_capacity",
      "practical_requirement",
      "attendance_threshold",
    ],
  },
};
export const M = {
  all: words("Toutes les offres", "All offers", "جميع العروض"),
  live: words("Offres publiées", "Published offers", "العروض المنشورة"),
  explore: words("Explorer les offres", "Explore offers", "استكشاف العروض"),
  compare: words("Comparer", "Compare", "مقارنة"),
  details: words("Voir le détail", "View details", "عرض التفاصيل"),
  prepare: words("Ajouter à mon projet", "Add to my brief", "إضافة إلى مشروعي"),
  selected: words("Dans votre projet", "In your brief", "ضمن مشروعكم"),
  remove: words("Retirer", "Remove", "إزالة"),
  related: words("Service complémentaire", "Related service", "خدمة مكملة"),
  scope: words("Périmètre & modalités", "Scope & terms", "النطاق والشروط"),
  moreFacts: words(
    "Toutes les caractéristiques",
    "All specifications",
    "جميع الخصائص",
  ),
  noValue: words("Non renseigné", "Not provided", "غير محدد"),
  yes: words("Oui", "Yes", "نعم"),
  no: words("Non", "No", "لا"),
  catalogue: words(
    "Catalogue complet",
    "Complete catalogue",
    "الكتالوج الكامل",
  ),
  matching: words(
    "Offres correspondant à ce choix",
    "Offers matching this choice",
    "العروض المطابقة لهذا الاختيار",
  ),
  noMatching: words(
    "Aucune offre publiée ne correspond à ce choix. Votre besoin peut être précisé dans le projet.",
    "No published offer matches this choice. You can describe the need in your brief.",
    "لا يطابق هذا الاختيار أي عرض منشور. يمكن توضيح الحاجة في مشروعكم.",
  ),
  collections: words(
    "Sélections pour votre projet",
    "Selections for your project",
    "مختارات لمشروعكم",
  ),
  filters: words("Affiner les résultats", "Refine results", "تصفية النتائج"),
  availability: words("Disponibilité", "Availability", "التوفر"),
  solution: words("Type de solution", "Solution type", "نوع الحل"),
  reset: words("Tout effacer", "Clear all", "مسح الكل"),
  results: words("résultats", "results", "نتائج"),
  preview: words(
    "Une première sélection",
    "A first selection",
    "مختارات أولية",
  ),
  full: words(
    "Voir tout le catalogue",
    "View full catalogue",
    "عرض الكتالوج الكامل",
  ),
  project: words(
    "Votre projet en un regard",
    "Your project at a glance",
    "مشروعكم بنظرة واحدة",
  ),
  projectLead: words(
    "Vos choix et offres sélectionnées accompagnent votre demande.",
    "Your choices and selected offers accompany your request.",
    "ترافق اختياراتكم والعروض المحددة طلبكم.",
  ),
  sourceFr: words(
    "Contenu publié en français",
    "Content published in French",
    "محتوى منشور بالفرنسية",
  ),
  unknownAction: words(
    "Consulter les modalités",
    "Review terms",
    "مراجعة الشروط",
  ),
  scopeConfirm: words(
    "Périmètre à confirmer",
    "Scope to confirm",
    "نطاق يحتاج إلى تأكيد",
  ),
  filtered: words("Sélection active", "Active selection", "اختيار نشط"),
  next: words(
    "Préparer la suite",
    "Prepare next steps",
    "إعداد الخطوات التالية",
  ),
  nativePlans: words(
    "Plans Partner OS publiés",
    "Published Partner OS plans",
    "خطط Partner OS المنشورة",
  ),
  moduleCount: words("modules renseignés", "listed modules", "وحدات مدرجة"),
  choosePlan: words("Préparer ce plan", "Prepare this plan", "إعداد هذه الخطة"),
  chosenPlan: words("Plan sélectionné", "Selected plan", "الخطة المحددة"),
  saved: words("Favoris", "Saved", "المحفوظات"),
  recommended: words("Notre sélection", "Recommended", "المختارات"),
  name: words("Nom", "Name", "الاسم"),
  price: words("Prix", "Price", "السعر"),
  more: words("Afficher la suite", "Show more", "عرض المزيد"),
};
export const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
export const string = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";
export const schemaOf = (item: DiscoveryItem) =>
  string(record(item.metadata).experience_schema_key);
export function projection(item: DiscoveryItem): BusinessProjection | null {
  const value = record(record(item.metadata).business_storefront);
  return value.version === 1 && Array.isArray(value.fields)
    ? (value as unknown as BusinessProjection)
    : null;
}
export function uniqueItems(items: readonly DiscoveryItem[]) {
  const seen = new Set<string>();
  return items.filter(
    (item) =>
      item.id && item.slug && !seen.has(item.id) && Boolean(seen.add(item.id)),
  );
}
export function segmentItems(
  items: readonly DiscoveryItem[],
  segment: CommercialSegment | undefined,
) {
  return segment
    ? items.filter((item) => segment.schemas.includes(schemaOf(item)))
    : [...items];
}
export function factValues(value: unknown, locale: CatalogLocale): string[] {
  if (typeof value === "string") return value.trim() ? [value.trim()] : [];
  if (typeof value === "number")
    return Number.isFinite(value) ? [String(value)] : [];
  if (typeof value === "boolean")
    return [localized(value ? M.yes : M.no, locale)];
  if (Array.isArray(value))
    return value.slice(0, 24).flatMap((entry) => {
      if (!entry || typeof entry !== "object") return factValues(entry, locale);
      const row = record(entry);
      return factValues(
        row[`label_${locale}`] ??
          row[`name_${locale}`] ??
          row[`title_${locale}`] ??
          row.label ??
          row.name_fr ??
          row.title_fr ??
          row.name ??
          row.title,
        locale,
      );
    });
  return [];
}
export function normalizeToken(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}
export function candidateReason(
  world: BusinessKey,
  schema: string,
  categories: readonly string[],
  audience: readonly string[],
): BusinessProjection["reason"] | null {
  if (categories.includes(world)) return "canonical_membership";
  // These native schemas define their intended vertical explicitly. No label/title inference.
  const dedicated: Partial<Record<BusinessKey, readonly string[]>> = {
    establishments: ["school-managed-programme", "school-staff-reinforcement"],
    hospitality: ["hospitality-kids-programme"],
    "health-partners": ["health-adjacent-programme"],
    corporates: ["corporate-childcare-benefit"],
    "partner-os": ["partner-os-plan"],
    "quality-check": ["quality-check-assessment"],
  };
  if (dedicated[world]?.includes(schema)) return "native_doctrine";
  const tags = new Set(audience.map(normalizeToken));
  const has = (values: string[]) => values.some((value) => tags.has(value));
  if (
    world === "professionals" &&
    [
      "academy-course",
      "academy-cohort",
      "certification-pathway",
      "institutional-training",
    ].includes(schema) &&
    has([
      "professional",
      "professionals",
      "provider",
      "providers",
      "practitioner",
      "educator",
      "educators",
      "teacher",
      "teachers",
      "childcare_worker",
      "early_childhood_professional",
      "professionnel",
      "professionnels",
      "prestataire",
      "educateur",
      "enseignant",
      "nanny",
      "nannies",
      "babysitter",
      "babysitters",
      "childcare_professional",
      "childcare_professionals",
      "childcare_workers",
      "early_childhood_professionals",
      "nursery_staff",
      "school_staff",
      "educational_staff",
      "professionnels_de_la_petite_enfance",
      "assistante_maternelle",
      "assistantes_maternelles",
    ])
  )
    return "professional_audience";
  if (
    world === "establishments" &&
    [
      "institutional-training",
      "quality-check-assessment",
      "partner-os-plan",
      "custom-managed-solution",
    ].includes(schema) &&
    has([
      "school",
      "schools",
      "nursery",
      "preschool",
      "institution",
      "establishment",
      "creche",
      "ecole",
    ])
  )
    return "institutional_audience";
  const audiences: Partial<Record<BusinessKey, string[]>> = {
    hospitality: ["hotel", "resort", "hospitality"],
    corporates: ["corporate", "company", "employer", "entreprise"],
    "health-partners": ["clinic", "maternity", "health_partner"],
  };
  if (
    [
      "custom-managed-solution",
      "event-venue-programme",
      "institutional-training",
      "parent-workshop",
    ].includes(schema) &&
    audiences[world] &&
    has(audiences[world]!)
  )
    return "institutional_audience";
  return null;
}

/** Explorers may narrow only on supplied structured values, never product titles. */
export function contextualItems(
  items: readonly DiscoveryItem[],
  dimension: string,
  index: number,
): DiscoveryItem[] | null {
  const rules: Record<string, { fields: string[]; choices: string[][] }> = {
    "institution-context": {
      fields: ["organization_type", "intended_audience", "audience_types"],
      choices: [
        ["nursery", "preschool", "creche", "early_years"],
        ["school", "ecole"],
      ],
    },
    "property-context": {
      fields: ["organization_type", "property_types"],
      choices: [
        ["hotel", "city_hotel", "urban_hotel"],
        ["resort", "seasonal_resort"],
      ],
    },
    "quality-dimension": {
      fields: ["assessment_scope"],
      choices: [
        ["practice", "practices", "pratiques"],
        ["team", "staff", "equipe"],
        ["environment", "spaces", "cadre"],
        ["improvement", "followup", "progression"],
      ],
    },
    "care-stage": {
      fields: ["non_medical_scope_statement", "programme_modules"],
      choices: [
        ["maternity", "maternite"],
        ["return_home", "postpartum", "retour_domicile"],
        ["parenting", "family_support", "parentalite"],
        ["workshops", "ateliers"],
      ],
    },
    "professional-direction": {
      fields: ["intended_audience", "audience_types", "learning_outcomes"],
      choices: [
        ["educator", "teacher", "educational_practice"],
        ["provider", "childcare_worker"],
        ["professional", "practitioner"],
        ["learner", "training", "professional"],
      ],
    },
    "stay-moment": {
      fields: ["programme_modules", "programme_mode", "solution_scope"],
      choices: [
        ["arrival", "welcome", "concierge"],
        ["kids_club", "activities", "educational_activities"],
        ["guest_childcare", "childcare", "babysitting"],
        ["family_events", "family_days", "family_activities"],
        ["departure", "handover"],
      ],
    },
    "campus-dimension": {
      fields: [
        "programme_modules",
        "assessment_scope",
        "training_modules",
        "required_roles",
      ],
      choices: [
        ["spaces", "environment", "educational_environment"],
        ["staff", "staffing", "team_training"],
        ["parents", "parent_communication", "parent_support"],
        ["organisation", "operations", "quality"],
      ],
    },
    "care-perspective": {
      fields: ["partner_types", "organization_type"],
      choices: [
        ["family", "families", "parents"],
        ["clinic", "maternity", "health_partner"],
      ],
    },
    "employer-perspective": {
      fields: ["benefit_models", "employee_eligibility_rules"],
      choices: [
        ["employee", "employees", "parent", "parents"],
        ["employer", "hr", "corporate"],
      ],
    },
    "workspace-layer": {
      fields: ["included_modules", "onboarding_type"],
      choices: [
        ["workspace", "tenant", "organisation"],
        ["roles", "members", "access_control"],
        ["plans", "billing", "subscription"],
        ["onboarding", "guided", "assisted"],
      ],
    },
  };
  const rule = rules[dimension];
  if (!rule || !rule.choices[index]) return null;
  const wanted = new Set(rule.choices[index]);
  return items.filter((item) =>
    projection(item)?.fields.some(
      (field) =>
        rule.fields.includes(field.key) &&
        field.values.some((value) => wanted.has(normalizeToken(value))),
    ),
  );
}

export function businessItemHref(
  item: DiscoveryItem,
  locale: CatalogLocale,
  territory?: string | null,
): string {
  return `/angelcare-marketplace/${locale}/marketplace/item/${encodeURIComponent(item.slug)}${territory ? `?territory=${encodeURIComponent(territory)}` : ""}`;
}
export function nativeAction(
  item: DiscoveryItem,
  locale: CatalogLocale,
  territory?: string | null,
): { href: string; label: string } | null {
  const conversion = projection(item)?.conversion;
  const paths: Record<string, [string, LocalCopy]> = {
    b2b_quote: [
      "quotation",
      words("Préparer le devis", "Prepare quotation", "إعداد عرض السعر"),
    ],
    guided_diagnostic: [
      "quotation",
      words("Préparer le diagnostic", "Prepare diagnostic", "إعداد التشخيص"),
    ],
    assessment_request: [
      "quotation",
      words(
        "Demander cette évaluation",
        "Request this assessment",
        "طلب هذا التقييم",
      ),
    ],
    subscription_request: [
      "subscription",
      words("Choisir ce plan", "Choose this plan", "اختيار هذه الخطة"),
    ],
    subscription_checkout: [
      "subscription",
      words(
        "Choisir cet abonnement",
        "Choose this subscription",
        "اختيار هذا الاشتراك",
      ),
    ],
    course_enrollment: [
      "enrollment",
      words("Préparer mon inscription", "Prepare enrolment", "إعداد التسجيل"),
    ],
    cohort_enrollment: [
      "enrollment",
      words("Préparer mon inscription", "Prepare enrolment", "إعداد التسجيل"),
    ],
    pathway_enrollment: [
      "enrollment",
      words(
        "Explorer ce parcours",
        "Explore this pathway",
        "استكشاف هذا المسار",
      ),
    ],
    event_enrollment: [
      "enrollment",
      words("Préparer mon inscription", "Prepare enrolment", "إعداد التسجيل"),
    ],
  };
  const route = conversion ? paths[conversion] : undefined;
  return route
    ? {
        href: `/angelcare-marketplace/${locale}/${route[0]}/${encodeURIComponent(item.slug)}${territory ? `?territory=${encodeURIComponent(territory)}` : ""}`,
        label: localized(route[1], locale),
      }
    : null;
}

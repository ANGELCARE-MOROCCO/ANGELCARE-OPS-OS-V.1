export type CareLinkDynamicChecklistItem = {
  key: string;
  label: string;
  description: string;
  category: string;
  groupLabel: string;
  required: boolean;
  evidenceRequired: boolean;
  severity: "standard" | "important" | "critical";
  sortOrder: number;
};

export type CareLinkDynamicChecklistDefinition = {
  serviceType: string;
  serviceFamily: string;
  title: string;
  summary: string;
  requiredBeforeCompletion: boolean;
  categories: string[];
  items: CareLinkDynamicChecklistItem[];
};

type ChecklistTemplateInput = {
  serviceType?: string | null;
  serviceFamily?: string | null;
  missionScope?: string | null;
  riskLevel?: string | null;
};

const BASE_ITEMS: CareLinkDynamicChecklistItem[] = [
  {
    key: "confirm_mission_brief",
    label: "Brief mission confirmé",
    description:
      "Confirmer que les consignes de mission, contacts et restrictions sont compris avant exécution.",
    category: "brief",
    groupLabel: "Brief",
    required: true,
    evidenceRequired: false,
    severity: "important",
    sortOrder: 10,
  },
  {
    key: "confirm_safe_environment",
    label: "Environnement sécurisé",
    description:
      "Vérifier que le lieu, l’accès et le contexte immédiat permettent une exécution sûre.",
    category: "safety",
    groupLabel: "Sécurité",
    required: true,
    evidenceRequired: false,
    severity: "critical",
    sortOrder: 20,
  },
  {
    key: "confirm_parent_handover",
    label: "Remise parent / liaison confirmée",
    description:
      "Confirmer la remise d’informations de début ou fin de mission avec la famille ou la liaison OPS.",
    category: "handover",
    groupLabel: "Transmission",
    required: true,
    evidenceRequired: false,
    severity: "important",
    sortOrder: 90,
  },
  {
    key: "prepare_report_notes",
    label: "Notes de rapport préparées",
    description: "Préparer les notes nécessaires au rapport de fin de mission.",
    category: "reporting",
    groupLabel: "Rapport",
    required: true,
    evidenceRequired: false,
    severity: "standard",
    sortOrder: 100,
  },
];

const SERVICE_ITEMS: Record<string, CareLinkDynamicChecklistItem[]> = {
  childcare_home: [
    {
      key: "home_childcare_meal_hydration",
      label: "Repas / hydratation suivis",
      description:
        "Contrôler les consignes repas, hydratation, allergies et habitudes indiquées par les parents.",
      category: "care",
      groupLabel: "Soin enfant",
      required: true,
      evidenceRequired: false,
      severity: "important",
      sortOrder: 30,
    },
    {
      key: "home_childcare_activity_trace",
      label: "Activités enfant tracées",
      description:
        "Noter les activités réalisées, comportement, humeur et points importants pour le parent.",
      category: "activity",
      groupLabel: "Activités",
      required: true,
      evidenceRequired: false,
      severity: "standard",
      sortOrder: 40,
    },
  ],
  postpartum_baby_care: [
    {
      key: "baby_feeding_protocol_checked",
      label: "Protocole alimentation bébé vérifié",
      description:
        "Confirmer les horaires, quantités, allaitement/biberon et consignes de la mère.",
      category: "baby-care",
      groupLabel: "Bébé",
      required: true,
      evidenceRequired: false,
      severity: "critical",
      sortOrder: 30,
    },
    {
      key: "baby_hygiene_environment_clean",
      label: "Hygiène bébé / environnement contrôlé",
      description:
        "Contrôler hygiène, change, propreté de l’espace et points de vigilance post-accouchement.",
      category: "hygiene",
      groupLabel: "Hygiène",
      required: true,
      evidenceRequired: false,
      severity: "critical",
      sortOrder: 40,
    },
  ],
  special_child_school: [
    {
      key: "school_contact_confirmed",
      label: "Contact école confirmé",
      description:
        "Vérifier le contact école, point de remise, autorisations et consignes spécifiques.",
      category: "school",
      groupLabel: "École",
      required: true,
      evidenceRequired: false,
      severity: "critical",
      sortOrder: 30,
    },
    {
      key: "special_needs_scope_respected",
      label: "Périmètre enfant spécial respecté",
      description:
        "Confirmer les limites d’intervention, précautions, besoins particuliers et incidents à signaler.",
      category: "special-needs",
      groupLabel: "Besoins spécifiques",
      required: true,
      evidenceRequired: false,
      severity: "critical",
      sortOrder: 40,
    },
  ],
  event_animation: [
    {
      key: "animation_material_ready",
      label: "Matériel animation prêt",
      description:
        "Contrôler matériel, thème, espace, sécurité groupe et séquence d’animation.",
      category: "materials",
      groupLabel: "Matériel",
      required: true,
      evidenceRequired: false,
      severity: "important",
      sortOrder: 30,
    },
    {
      key: "group_safety_supervised",
      label: "Sécurité groupe supervisée",
      description:
        "Vérifier circulation enfants, zones sensibles, nombre d’enfants et règles d’encadrement.",
      category: "safety",
      groupLabel: "Sécurité",
      required: true,
      evidenceRequired: false,
      severity: "critical",
      sortOrder: 40,
    },
  ],
  excursion: [
    {
      key: "excursion_attendance_count",
      label: "Présence participants contrôlée",
      description:
        "Contrôler liste participants, départ, arrivée, retours et écarts éventuels.",
      category: "attendance",
      groupLabel: "Présence",
      required: true,
      evidenceRequired: true,
      severity: "critical",
      sortOrder: 30,
    },
    {
      key: "transport_supervision_checked",
      label: "Supervision transport contrôlée",
      description:
        "Confirmer transporteur, trajet, montée/descente, transits et sécurité durant déplacement.",
      category: "transport",
      groupLabel: "Transport",
      required: true,
      evidenceRequired: true,
      severity: "critical",
      sortOrder: 40,
    },
  ],
};

function clean(value: unknown) {
  return String(value || "").trim();
}

function normalize(value: unknown) {
  return clean(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function detectCareLinkServiceFamily(
  input: ChecklistTemplateInput,
): string {
  const explicit = normalize(input.serviceFamily);
  if (explicit) return explicit;

  const text = [input.serviceType, input.missionScope].map(normalize).join(" ");
  if (/post|accouche|bebe|baby|nourrisson/.test(text))
    return "postpartum_baby_care";
  if (/special|handicap|ecole|school|enseignant/.test(text))
    return "special_child_school";
  if (/animation|anniversaire|event|atelier|ludique/.test(text))
    return "event_animation";
  if (/excursion|sortie|transport|trajet|navette/.test(text))
    return "excursion";
  if (/domicile|garde|enfant|childcare|home/.test(text))
    return "childcare_home";
  return "general_service";
}

function titleForFamily(family: string) {
  const titles: Record<string, string> = {
    childcare_home: "Checklist garde à domicile",
    postpartum_baby_care: "Checklist bébé post-accouchement",
    special_child_school: "Checklist enfant spécial / école",
    event_animation: "Checklist animation événement",
    excursion: "Checklist excursion / transport",
    general_service: "Checklist service AngelCare",
  };
  return titles[family] || "Checklist service AngelCare";
}

function familySummary(family: string) {
  const summaries: Record<string, string> = {
    childcare_home:
      "Contrôles essentiels de sécurité, soins enfant, activités et transmission parent.",
    postpartum_baby_care:
      "Contrôles sensibles bébé, hygiène, alimentation et soutien post-accouchement.",
    special_child_school:
      "Contrôles haute sensibilité école, autorisations, besoins spécifiques et communication.",
    event_animation:
      "Contrôles matériel, sécurité groupe, animation et remise parent.",
    excursion: "Contrôles présence, trajet, transport, sécurité et retours.",
    general_service:
      "Contrôles opérationnels généraux requis pour clôture sécurisée.",
  };
  return summaries[family] || summaries.general_service;
}

function riskItem(
  riskLevel?: string | null,
): CareLinkDynamicChecklistItem | null {
  const risk = normalize(riskLevel);
  if (
    !["critical", "high", "elevated", "watch"].some((item) =>
      risk.includes(item),
    )
  )
    return null;
  return {
    key: "risk_watch_confirmed",
    label: "Point de vigilance risque confirmé",
    description:
      "Confirmer que le risque signalé par OPS est compris et suivi pendant l’exécution.",
    category: "risk",
    groupLabel: "Risque",
    required: true,
    evidenceRequired: false,
    severity:
      risk.includes("critical") || risk.includes("high")
        ? "critical"
        : "important",
    sortOrder: 25,
  };
}

export function buildCareLinkDynamicServiceChecklist(
  input: ChecklistTemplateInput,
): CareLinkDynamicChecklistDefinition {
  const serviceFamily = detectCareLinkServiceFamily(input);
  const serviceSpecific = SERVICE_ITEMS[serviceFamily] || [];
  const extraRiskItem = riskItem(input.riskLevel);
  const items = [
    ...BASE_ITEMS.slice(0, 2),
    ...(extraRiskItem ? [extraRiskItem] : []),
    ...serviceSpecific,
    ...BASE_ITEMS.slice(2),
  ]
    .map((item, index) => ({ ...item, sortOrder: item.sortOrder || index + 1 }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const categories = Array.from(new Set(items.map((item) => item.groupLabel)));

  return {
    serviceType: clean(input.serviceType) || "Service AngelCare",
    serviceFamily,
    title: titleForFamily(serviceFamily),
    summary: familySummary(serviceFamily),
    requiredBeforeCompletion: true,
    categories,
    items,
  };
}

export function checklistItemMetadata(
  item: CareLinkDynamicChecklistItem,
  definition: CareLinkDynamicChecklistDefinition,
) {
  return {
    template_key: item.key,
    service_type: definition.serviceType,
    service_family: definition.serviceFamily,
    checklist_group: item.groupLabel,
    check_category: item.category,
    evidence_required: item.evidenceRequired,
    severity: item.severity,
    dynamic_template_version: "p11_service_checklists_v1",
  };
}

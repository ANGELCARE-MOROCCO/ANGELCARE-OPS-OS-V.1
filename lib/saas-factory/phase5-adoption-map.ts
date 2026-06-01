export type FactoryAdoptionTarget = {
  moduleKey: string;
  moduleLabel: string;
  routePrefix: string;
  recommendedGroups: string[];
  priorityFields: Array<{
    fieldKey: string;
    optionGroup: string;
    component: string;
    priority: "critical" | "high" | "normal";
    notes: string;
  }>;
};

export const SAAS_FACTORY_PHASE5_ADOPTION_TARGETS: FactoryAdoptionTarget[] = [
  {
    moduleKey: "revenue_command_center",
    moduleLabel: "Revenue Command Center",
    routePrefix: "/revenue-command-center",
    recommendedGroups: ["cities", "lead_sources", "partner_types", "service_categories", "task_priorities"],
    priorityFields: [
      {
        fieldKey: "city",
        optionGroup: "cities",
        component: "FactoryCitySelect",
        priority: "critical",
        notes: "Prospects, partners, campaigns, partnership profiles and market mapping should consume live cities.",
      },
      {
        fieldKey: "lead_source",
        optionGroup: "lead_sources",
        component: "FactoryOptionSelect",
        priority: "high",
        notes: "Lead creation and B2B pipeline forms should consume live lead source registry.",
      },
      {
        fieldKey: "partner_type",
        optionGroup: "partner_types",
        component: "FactoryOptionSelect",
        priority: "high",
        notes: "Partnership type fields should use factory registry to avoid hardcoded statuses.",
      },
    ],
  },
  {
    moduleKey: "market_os",
    moduleLabel: "Market OS",
    routePrefix: "/market-os",
    recommendedGroups: ["cities", "market_channels", "lead_sources", "service_categories"],
    priorityFields: [
      {
        fieldKey: "city",
        optionGroup: "cities",
        component: "FactoryCitySelect",
        priority: "critical",
        notes: "Campaign lifecycle, city activation, ambassadors and content ops should consume live city registry.",
      },
      {
        fieldKey: "channel",
        optionGroup: "market_channels",
        component: "FactoryOptionSelect",
        priority: "high",
        notes: "Campaign channel choices should be centrally configurable.",
      },
    ],
  },
  {
    moduleKey: "academy",
    moduleLabel: "Academy",
    routePrefix: "/academy",
    recommendedGroups: ["cities", "academy_locations", "academy_course_categories", "service_categories"],
    priorityFields: [
      {
        fieldKey: "city",
        optionGroup: "cities",
        component: "FactoryCitySelect",
        priority: "critical",
        notes: "Trainees, receipts, certificates, enrollment and locations should consume live cities.",
      },
      {
        fieldKey: "academy_location",
        optionGroup: "academy_locations",
        component: "FactoryOptionSelect",
        priority: "high",
        notes: "Academy campuses and classroom locations should be centrally configurable.",
      },
    ],
  },
  {
    moduleKey: "hr",
    moduleLabel: "Human Resources",
    routePrefix: "/hr",
    recommendedGroups: ["cities", "departments", "positions", "hr_shift_types", "task_priorities"],
    priorityFields: [
      {
        fieldKey: "city",
        optionGroup: "cities",
        component: "FactoryCitySelect",
        priority: "critical",
        notes: "Employee profiles, onboarding, roster and attendance location fields should consume live city registry.",
      },
      {
        fieldKey: "department",
        optionGroup: "departments",
        component: "FactoryDepartmentSelect",
        priority: "critical",
        notes: "Employee and roster departments should use live factory departments.",
      },
      {
        fieldKey: "position",
        optionGroup: "positions",
        component: "FactoryOptionSelect",
        priority: "high",
        notes: "Job titles and positions should become centrally configurable.",
      },
    ],
  },
  {
    moduleKey: "service_os",
    moduleLabel: "Service OS",
    routePrefix: "/service-os",
    recommendedGroups: ["cities", "service_categories", "departments", "task_priorities"],
    priorityFields: [
      {
        fieldKey: "city",
        optionGroup: "cities",
        component: "FactoryCitySelect",
        priority: "critical",
        notes: "Service deployments, missions and operational locations should consume live city registry.",
      },
      {
        fieldKey: "service_category",
        optionGroup: "service_categories",
        component: "FactoryServiceCategorySelect",
        priority: "critical",
        notes: "Service categories should be configurable from the factory.",
      },
    ],
  },
  {
    moduleKey: "connect",
    moduleLabel: "Connect",
    routePrefix: "/connect",
    recommendedGroups: ["departments", "task_priorities", "task_statuses"],
    priorityFields: [
      {
        fieldKey: "priority",
        optionGroup: "task_priorities",
        component: "FactoryOptionSelect",
        priority: "high",
        notes: "Task priority creation and filtering should consume live priorities.",
      },
      {
        fieldKey: "department",
        optionGroup: "departments",
        component: "FactoryDepartmentSelect",
        priority: "normal",
        notes: "Room and task visibility should be configurable by department.",
      },
    ],
  },
];

export function getAdoptionTarget(moduleKey: string) {
  return SAAS_FACTORY_PHASE5_ADOPTION_TARGETS.find((target) => target.moduleKey === moduleKey);
}

export function getAllRecommendedGroups() {
  return Array.from(
    new Set(SAAS_FACTORY_PHASE5_ADOPTION_TARGETS.flatMap((target) => target.recommendedGroups))
  ).sort();
}

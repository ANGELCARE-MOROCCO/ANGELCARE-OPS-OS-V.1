export type Phase6FieldReplacement = {
  id: string;
  moduleKey: string;
  moduleLabel: string;
  fileHints: string[];
  fieldType: "city" | "department" | "service_category" | "lead_source" | "partner_type" | "market_channel" | "academy_location" | "position" | "priority";
  optionGroup: string;
  componentName: string;
  importPath: string;
  priority: "critical" | "high" | "normal";
  safePattern: string;
  notes: string;
};

export const PHASE6_FIELD_REPLACEMENTS: Phase6FieldReplacement[] = [
  {
    id: "revenue_city_fields",
    moduleKey: "revenue_command_center",
    moduleLabel: "Revenue Command Center",
    fileHints: ["revenue-command-center", "Prospects", "Partners", "Partnership"],
    fieldType: "city",
    optionGroup: "cities",
    componentName: "RevenueCityField",
    importPath: "@/components/saas-factory/adapters/ModuleLiveFields",
    priority: "critical",
    safePattern: "city select or Casablanca/Rabat/Marrakech option list",
    notes: "Replace revenue city dropdowns with live SaaS Factory city registry while preserving existing state handlers.",
  },
  {
    id: "revenue_lead_source_fields",
    moduleKey: "revenue_command_center",
    moduleLabel: "Revenue Command Center",
    fileHints: ["revenue-command-center", "Prospects", "Acquisition"],
    fieldType: "lead_source",
    optionGroup: "lead_sources",
    componentName: "RevenueLeadSourceField",
    importPath: "@/components/saas-factory/adapters/ModuleLiveFields",
    priority: "high",
    safePattern: "lead source select or source option list",
    notes: "Replace lead source dropdowns with live Factory lead source registry.",
  },
  {
    id: "market_city_fields",
    moduleKey: "market_os",
    moduleLabel: "Market OS",
    fileHints: ["market-os", "campaign", "ambassador", "territories"],
    fieldType: "city",
    optionGroup: "cities",
    componentName: "MarketCityField",
    importPath: "@/components/saas-factory/adapters/ModuleLiveFields",
    priority: "critical",
    safePattern: "city select or city option list",
    notes: "Replace Market OS city dropdowns with live city registry.",
  },
  {
    id: "hr_city_fields",
    moduleKey: "hr",
    moduleLabel: "Human Resources",
    fileHints: ["app/(protected)/hr", "components/hr", "Employees", "Onboarding"],
    fieldType: "city",
    optionGroup: "cities",
    componentName: "HRCityField",
    importPath: "@/components/saas-factory/adapters/ModuleLiveFields",
    priority: "critical",
    safePattern: "city select or employee city field",
    notes: "Replace HR city fields with live city registry.",
  },
  {
    id: "hr_department_fields",
    moduleKey: "hr",
    moduleLabel: "Human Resources",
    fileHints: ["app/(protected)/hr", "components/hr", "Employees", "Roster"],
    fieldType: "department",
    optionGroup: "departments",
    componentName: "HRDepartmentField",
    importPath: "@/components/saas-factory/adapters/ModuleLiveFields",
    priority: "critical",
    safePattern: "department select or department option list",
    notes: "Replace HR department fields with live department registry.",
  },
  {
    id: "academy_city_fields",
    moduleKey: "academy",
    moduleLabel: "Academy",
    fileHints: ["academy", "trainees", "enrollments", "certificates"],
    fieldType: "city",
    optionGroup: "cities",
    componentName: "AcademyCityField",
    importPath: "@/components/saas-factory/adapters/ModuleLiveFields",
    priority: "critical",
    safePattern: "city select or trainee city field",
    notes: "Replace Academy city fields with live city registry.",
  },
  {
    id: "service_city_fields",
    moduleKey: "service_os",
    moduleLabel: "Service OS",
    fileHints: ["service-os", "serviceos"],
    fieldType: "city",
    optionGroup: "cities",
    componentName: "ServiceCityField",
    importPath: "@/components/saas-factory/adapters/ModuleLiveFields",
    priority: "critical",
    safePattern: "city select or service deployment city field",
    notes: "Replace Service OS city fields with live city registry.",
  },
  {
    id: "service_category_fields",
    moduleKey: "service_os",
    moduleLabel: "Service OS",
    fileHints: ["service-os", "serviceos"],
    fieldType: "service_category",
    optionGroup: "service_categories",
    componentName: "ServiceCategoryField",
    importPath: "@/components/saas-factory/adapters/ModuleLiveFields",
    priority: "critical",
    safePattern: "service category select",
    notes: "Replace service category fields with live service category registry.",
  },
];

export function getPhase6Replacement(id: string) {
  return PHASE6_FIELD_REPLACEMENTS.find((replacement) => replacement.id === id);
}

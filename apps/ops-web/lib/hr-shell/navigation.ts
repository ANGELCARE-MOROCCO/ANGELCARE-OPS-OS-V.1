import type { LucideIcon } from "lucide-react";
import {
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  ClipboardCheck,
  FileCheck2,
  FileText,
  LayoutDashboard,
  Network,
  UserCheck,
  Users,
  Workflow,
} from "lucide-react";

export type HRNavigationRole =
  | "hr_admin"
  | "hr_manager"
  | "operations_manager"
  | "finance"
  | "compliance"
  | "team_lead"
  | "staff";

export type HRNavigationItem = {
  key: string;
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
  roles: HRNavigationRole[];
  aliases?: string[];
  badge?: "live" | "new" | "control";
};

export type HRNavigationGroup = {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  items: HRNavigationItem[];
};

const hrCore: HRNavigationRole[] = ["hr_admin", "hr_manager"];
const employeeAccess: HRNavigationRole[] = [
  "hr_admin",
  "hr_manager",
  "operations_manager",
  "finance",
  "compliance",
];

/**
 * Locked HR navigation authority.
 * This is intentionally limited to the original final sidebar inventory.
 * Questionnaires is the only retained addition requested by management.
 */
export const HR_NAVIGATION_GROUPS: HRNavigationGroup[] = [
  {
    key: "command",
    label: "Commandement",
    description: "Pilotage exécutif RH",
    icon: LayoutDashboard,
    items: [
      {
        key: "command-center",
        label: "Commandement RH",
        href: "/hr",
        description: "Administration RH",
        icon: LayoutDashboard,
        roles: ["hr_admin", "hr_manager", "operations_manager"],
        badge: "live",
      },
    ],
  },
  {
    key: "people",
    label: "Collaborateurs",
    description: "Dossiers, structure et conformité",
    icon: Users,
    items: [
      {
        key: "employees",
        label: "Collaborateurs",
        href: "/hr/employees",
        description: "Dossiers collaborateurs et Employee 360",
        icon: Users,
        roles: employeeAccess,
      },
      {
        key: "staff",
        label: "Personnel",
        href: "/hr/staff",
        description: "Référentiel personnel et statuts",
        icon: UserCheck,
        roles: ["hr_admin", "hr_manager", "operations_manager", "compliance"],
      },
      {
        key: "departments",
        label: "Départements",
        href: "/hr/departments",
        description: "Organisation et capacités",
        icon: Building2,
        roles: ["hr_admin", "hr_manager", "operations_manager"],
      },
      {
        key: "positions",
        label: "Postes",
        href: "/hr/positions",
        description: "Postes, familles et responsabilités",
        icon: BriefcaseBusiness,
        roles: hrCore,
      },
      {
        key: "contracts",
        label: "Contrats",
        href: "/hr/contracts",
        description: "Cycle contractuel et échéances",
        icon: FileCheck2,
        roles: ["hr_admin", "hr_manager", "finance"],
      },
      {
        key: "documents",
        label: "Documents RH",
        href: "/hr/documents",
        description: "Pièces, conformité et expirations",
        icon: FileText,
        roles: ["hr_admin", "hr_manager", "compliance"],
      },
    ],
  },
  {
    key: "talent",
    label: "Talents & recrutement",
    description: "Acquisition et intégration",
    icon: BriefcaseBusiness,
    items: [
      {
        key: "recruitment",
        label: "Recrutement",
        href: "/hr/recruitment",
        description: "Commandement du recrutement",
        icon: BriefcaseBusiness,
        roles: hrCore,
        aliases: ["/hr/recruitment/candidates", "/hr/recruitment/kanban"],
      },
      {
        key: "interviews",
        label: "Entretiens",
        href: "/hr/recruitment/interviews",
        description: "Agenda, panels et évaluations",
        icon: CalendarClock,
        roles: hrCore,
        badge: "control",
      },
      {
        key: "questionnaires",
        label: "Questionnaires",
        href: "/hr/recruitment/questionnaires",
        description: "Questionnaires et scorecards",
        icon: ClipboardCheck,
        roles: hrCore,
      },
      {
        key: "openings",
        label: "Ouvertures de poste",
        href: "/hr/openings",
        description: "Besoins, postes et publication",
        icon: Network,
        roles: hrCore,
      },
      {
        key: "onboarding",
        label: "Onboarding",
        href: "/hr/onboarding",
        description: "Intégration et activation collaborateurs",
        icon: Workflow,
        roles: hrCore,
        badge: "new",
      },
    ],
  },
];

export function normalizeNavigationRole(role: string): HRNavigationRole {
  const value = role.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (["hr_admin", "admin", "administrator", "super_admin", "owner", "direction"].includes(value)) return "hr_admin";
  if (["hr_manager", "manager_hr", "human_resources_manager"].includes(value)) return "hr_manager";
  if (["operations_manager", "ops_manager", "operations"].includes(value)) return "operations_manager";
  if (["finance", "finance_manager", "cfo"].includes(value)) return "finance";
  if (["compliance", "compliance_manager"].includes(value)) return "compliance";
  if (["team_lead", "supervisor"].includes(value)) return "team_lead";
  return "staff";
}

export function canSeeNavigationItem({
  item,
  role,
  permissions,
  sovereign,
}: {
  item: HRNavigationItem;
  role: string;
  permissions: string[];
  sovereign: boolean;
}): boolean {
  if (sovereign) return true;
  const normalizedRole = normalizeNavigationRole(role);
  if (item.roles.includes(normalizedRole)) return true;
  const routePermission = `route:${item.href}`;
  return permissions.includes(routePermission) || permissions.includes("hr.*") || permissions.includes("hr.view");
}

export function isNavigationItemActive(pathname: string, item: HRNavigationItem): boolean {
  const candidates = [item.href, ...(item.aliases ?? [])];
  return candidates.some((candidate) => pathname === candidate || pathname.startsWith(`${candidate}/`));
}

export const HR_NAVIGATION_ROLE_LABELS: Record<HRNavigationRole, string> = {
  hr_admin: "Administration RH",
  hr_manager: "Direction RH",
  operations_manager: "Direction opérations",
  finance: "Finance",
  compliance: "Conformité",
  team_lead: "Responsable d’équipe",
  staff: "Collaborateur",
};

export function isSovereignRole(value: unknown): boolean {
  const role = typeof value === "string" ? value.trim().toLowerCase() : "";
  return ["ceo", "owner", "super_admin", "superadmin"].includes(role);
}

export const HR_NAVIGATION_TOTAL_ITEMS = HR_NAVIGATION_GROUPS.reduce(
  (total, group) => total + group.items.length,
  0,
);

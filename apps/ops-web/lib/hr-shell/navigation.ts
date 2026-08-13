import type { LucideIcon } from "lucide-react";
import {
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  ClipboardCheck,
  Clock3,
  FileText,
  Gauge,
  GraduationCap,
  LayoutDashboard,
  PlugZap,
  Settings,
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
 * Canonical HR navigation authority.
 * The sovereign sidebar is the single visible HR module navigation surface.
 * Legacy in-page navigation rails are intentionally not part of this registry.
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
        key: "departments",
        label: "Départements",
        href: "/hr/departments",
        description: "Organisation et capacités",
        icon: Building2,
        roles: ["hr_admin", "hr_manager", "operations_manager"],
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
  {
    key: "performance-development",
    label: "Performance & développement",
    description: "Évaluation, compétences et formation",
    icon: Gauge,
    items: [
      {
        key: "performance-matrix",
        label: "Performance",
        href: "/hr/performance-matrix",
        description: "Matrice de performance et pilotage",
        icon: Gauge,
        roles: ["hr_admin", "hr_manager", "operations_manager"],
      },
      {
        key: "training",
        label: "Formation",
        href: "/hr/training",
        description: "Formation, ressources et développement",
        icon: GraduationCap,
        roles: ["hr_admin", "hr_manager", "operations_manager"],
        aliases: ["/hr/training/online"],
      },
    ],
  },
  {
    key: "time-organization",
    label: "Temps & organisation",
    description: "Congés, absences et planification",
    icon: CalendarClock,
    items: [
      {
        key: "leave",
        label: "Congés & absences",
        href: "/hr/leave",
        description: "Demandes, validation et disponibilité",
        icon: Clock3,
        roles: ["hr_admin", "hr_manager", "operations_manager"],
      },
      {
        key: "work-schedules",
        label: "Horaires de travail",
        href: "/hr/work-schedules",
        description: "Planning, shifts et couverture",
        icon: CalendarClock,
        roles: ["hr_admin", "hr_manager", "operations_manager"],
        aliases: ["/hr/rosters", "/hr/calendar"],
      },
    ],
  },
  {
    key: "system",
    label: "Système RH",
    description: "Connexions et configuration",
    icon: Settings,
    items: [
      {
        key: "integrations",
        label: "Intégrations",
        href: "/hr/integrations",
        description: "Connexions, synchronisation et santé",
        icon: PlugZap,
        roles: ["hr_admin", "hr_manager"],
      },
      {
        key: "settings",
        label: "Paramètres",
        href: "/hr/settings",
        description: "Configuration et gouvernance RH",
        icon: Settings,
        roles: ["hr_admin", "hr_manager"],
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

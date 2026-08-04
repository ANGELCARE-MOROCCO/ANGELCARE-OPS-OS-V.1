import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  FileCheck2,
  FileText,
  Gauge,
  GraduationCap,
  LayoutDashboard,
  Network,
  Settings,
  ShieldCheck,
  Stethoscope,
  TimerReset,
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

const all: HRNavigationRole[] = [
  "hr_admin",
  "hr_manager",
  "operations_manager",
  "finance",
  "compliance",
  "team_lead",
  "staff",
];
const hrCore: HRNavigationRole[] = ["hr_admin", "hr_manager"];
const hrOps: HRNavigationRole[] = ["hr_admin", "hr_manager", "operations_manager"];
const hrGovernance: HRNavigationRole[] = ["hr_admin", "hr_manager", "compliance"];

export const HR_NAVIGATION_GROUPS: HRNavigationGroup[] = [
  {
    key: "command",
    label: "Commandement",
    description: "Pilotage exécutif RH",
    icon: LayoutDashboard,
    items: [
      {
        key: "command-center",
        label: "Cockpit RH",
        href: "/hr",
        description: "Vue exécutive et signaux opérationnels",
        icon: LayoutDashboard,
        roles: ["hr_admin", "hr_manager", "operations_manager"],
        badge: "live",
      },
      {
        key: "approvals",
        label: "Approbations",
        href: "/hr/approvals",
        description: "Décisions et validations en attente",
        icon: BadgeCheck,
        roles: ["hr_admin", "hr_manager", "operations_manager", "finance", "compliance"],
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
        roles: ["hr_admin", "hr_manager", "operations_manager", "finance", "compliance"],
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
        roles: hrGovernance,
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
  {
    key: "operations",
    label: "Temps & opérations",
    description: "Présence, planning et charge",
    icon: CalendarDays,
    items: [
      {
        key: "attendance",
        label: "Présence",
        href: "/hr/attendance",
        description: "Pointage, anomalies et validation",
        icon: Activity,
        roles: ["hr_admin", "hr_manager", "operations_manager", "finance", "team_lead"],
      },
      {
        key: "work-schedules",
        label: "Plannings",
        href: "/hr/work-schedules",
        description: "Rosters, shifts et couverture",
        icon: CalendarDays,
        roles: hrOps,
      },
      {
        key: "rosters",
        label: "Rosters",
        href: "/hr/rosters",
        description: "Affectations et disponibilité",
        icon: CalendarClock,
        roles: hrOps,
      },
      {
        key: "leave",
        label: "Congés & absences",
        href: "/hr/leave",
        description: "Demandes, soldes et décisions",
        icon: TimerReset,
        roles: ["hr_admin", "hr_manager", "operations_manager", "team_lead", "staff"],
      },
      {
        key: "time-tracking",
        label: "Temps de travail",
        href: "/hr/time-tracking",
        description: "Temps, heures et risques de dépassement",
        icon: Gauge,
        roles: ["hr_admin", "hr_manager", "operations_manager", "finance", "team_lead"],
      },
    ],
  },
  {
    key: "development",
    label: "Performance & développement",
    description: "Compétences et progression",
    icon: GraduationCap,
    items: [
      {
        key: "training",
        label: "Formation",
        href: "/hr/training",
        description: "Plans, sessions et certifications",
        icon: GraduationCap,
        roles: ["hr_admin", "hr_manager", "operations_manager", "team_lead"],
      },
      {
        key: "performance-matrix",
        label: "Performance",
        href: "/hr/performance-matrix",
        description: "Évaluations, calibration et coaching",
        icon: BarChart3,
        roles: ["hr_admin", "hr_manager", "operations_manager", "team_lead"],
      },
    ],
  },
  {
    key: "governance",
    label: "Pilotage & administration",
    description: "Contrôle, audit et santé système",
    icon: ShieldCheck,
    items: [
      {
        key: "compliance",
        label: "Conformité",
        href: "/hr/compliance",
        description: "Obligations, risques et preuves",
        icon: ShieldCheck,
        roles: hrGovernance,
      },
      {
        key: "reports",
        label: "Rapports",
        href: "/hr/reports",
        description: "Analyses, exports et décisions",
        icon: BarChart3,
        roles: ["hr_admin", "hr_manager", "finance", "compliance"],
      },
      {
        key: "audit",
        label: "Audit RH",
        href: "/hr/audit",
        description: "Évidence et historique opérationnel",
        icon: Stethoscope,
        roles: ["hr_admin", "hr_manager", "compliance"],
      },
      {
        key: "sync-center",
        label: "Centre de synchronisation",
        href: "/hr/sync-center",
        description: "Cohérence, réparation et contrôle",
        icon: Network,
        roles: ["hr_admin"],
        badge: "control",
      },
      {
        key: "system-health",
        label: "Santé système",
        href: "/hr/system-health",
        description: "Sources, incidents et disponibilité",
        icon: Activity,
        roles: ["hr_admin"],
      },
      {
        key: "settings",
        label: "Paramètres RH",
        href: "/hr/settings",
        description: "Configuration et gouvernance",
        icon: Settings,
        roles: ["hr_admin"],
      },
    ],
  },
];

export function isNavigationItemActive(pathname: string, item: HRNavigationItem) {
  if (item.href === "/hr") return pathname === "/hr";
  if (pathname === item.href || pathname.startsWith(`${item.href}/`)) return true;
  return (item.aliases || []).some((alias) => pathname === alias || pathname.startsWith(`${alias}/`));
}

function permissionCandidates(item: HRNavigationItem) {
  const route = item.href.replace(/^\//, "");
  const dotted = route.replaceAll("/", ".");
  const underscored = route.replaceAll("/", "_");
  return [
    item.href,
    route,
    dotted,
    underscored,
    `${dotted}.view`,
    `${underscored}.view`,
    `route:${item.href}`,
  ];
}

export function canSeeNavigationItem(input: {
  item: HRNavigationItem;
  role: string;
  permissions: string[];
  sovereign: boolean;
}) {
  if (input.sovereign) return true;
  const normalizedRole = input.role.trim().toLowerCase() as HRNavigationRole;
  if (input.item.roles.includes(normalizedRole)) return true;
  const normalizedPermissions = input.permissions.map((permission) => permission.trim().toLowerCase());
  if (normalizedPermissions.some((permission) => permission === "*" || permission === "hr.*" || permission === "hr.full")) return true;
  return permissionCandidates(input.item).some((candidate) => normalizedPermissions.includes(candidate.toLowerCase()));
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

export function normalizeNavigationRole(value: unknown): HRNavigationRole {
  const role = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (["ceo", "owner", "super_admin", "superadmin", "admin", "administrator"].includes(role)) return "hr_admin";
  if (role === "hr_admin" || role === "rh_admin") return "hr_admin";
  if (role === "hr_manager" || role === "rh_manager" || role.includes("human_resources") || role.includes("ressources_humaines") || /(^|[\s_/-])rh([\s_/-]|$)/.test(role)) return "hr_manager";
  if (role === "operations_manager" || role.includes("operations")) return "operations_manager";
  if (role === "finance" || role.includes("financial") || role.includes("payroll")) return "finance";
  if (role === "compliance" || role.includes("quality") || role.includes("audit")) return "compliance";
  if (role === "team_lead" || role.includes("manager") || role.includes("lead")) return "team_lead";
  return "staff";
}

export function isSovereignRole(value: unknown) {
  const role = typeof value === "string" ? value.trim().toLowerCase() : "";
  return ["ceo", "owner", "super_admin", "superadmin"].includes(role);
}

export const HR_NAVIGATION_TOTAL_ITEMS = HR_NAVIGATION_GROUPS.reduce((sum, group) => sum + group.items.length, 0);
export const HR_NAVIGATION_ALL_ROLES = all;

import {
  Activity,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckSquare2,
  FileText,
  Gauge,
  Handshake,
  Users,
} from "lucide-react";

export type RevenueCommandRoute = {
  href: string;
  label: string;
  description: string;
  icon: string;
  group: "Pilotage" | "Exécution" | "Croissance" | "Intelligence";
  requiredPermission?: string;
};

export const REVENUE_COMMAND_CENTER_ROUTES: RevenueCommandRoute[] = [
  {
    href: "/revenue-command-center",
    label: "Poste de commandement",
    description:
      "Vue exécutive du revenu issue des tables canoniques actives.",
    icon: "Gauge",
    group: "Pilotage",
    requiredPermission: "revenue.read",
  },
  {
    href: "/revenue-command-center/prospects",
    label: "Prospects et comptes",
    description:
      "Pipeline, qualification, cartographie décisionnelle et progression commerciale.",
    icon: "Users",
    group: "Exécution",
    requiredPermission: "revenue.prospects.read",
  },
  {
    href: "/revenue-command-center/appointments",
    label: "Rendez-vous",
    description:
      "Rencontres planifiées, résultats, absences et contrôles de suivi.",
    icon: "CalendarDays",
    group: "Exécution",
    requiredPermission: "revenue.appointments.read",
  },
  {
    href: "/revenue-command-center/daily-tasks",
    label: "Exécution quotidienne",
    description:
      "Actions reliées aux prospects, rendez-vous, responsables et échéances.",
    icon: "CheckSquare2",
    group: "Exécution",
    requiredPermission: "revenue.tasks.read",
  },
  {
    href: "/revenue-command-center/partnerships",
    label: "Partenariats stratégiques",
    description:
      "Développement B2B, activation, performance et croissance partenaires.",
    icon: "Handshake",
    group: "Croissance",
    requiredPermission: "revenue.partnerships.read",
  },
  {
    href: "/revenue-command-center/b2c-workflow",
    label: "Parcours commercial B2C",
    description:
      "Demandes familles, intérêt service, conseil et parcours de conversion.",
    icon: "BriefcaseBusiness",
    group: "Croissance",
    requiredPermission: "revenue.b2c.read",
  },
  {
    href: "/revenue-command-center/revenue-analytics",
    label: "Analytics revenu",
    description:
      "Analyse exécutive fondée exclusivement sur les données disponibles.",
    icon: "BarChart3",
    group: "Intelligence",
    requiredPermission: "revenue.analytics.read",
  },
  {
    href: "/revenue-command-center/activity-timeline",
    label: "Chronologie d’activité",
    description:
      "Actions utilisateurs, mouvements d’étape et événements commerciaux.",
    icon: "Activity",
    group: "Intelligence",
    requiredPermission: "revenue.activities.read",
  },
  {
    href: "/revenue-command-center/documents",
    label: "Documents commerciaux",
    description:
      "Propositions, contrats et documents reliés à la source de vérité.",
    icon: "FileText",
    group: "Exécution",
    requiredPermission: "revenue.documents.read",
  },
  {
    href: "/revenue-command-center/executive-briefing",
    label: "Briefing exécutif",
    description:
      "Lecture direction du pipeline, des risques et de la vitesse d’exécution.",
    icon: "Building2",
    group: "Pilotage",
    requiredPermission: "revenue.executive.read",
  },
];

export const REVENUE_ICON_MAP = {
  Activity,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckSquare2,
  FileText,
  Gauge,
  Handshake,
  Users,
};

export function getRevenueRoutesForPermissions(permissions: string[] = []) {
  if (!permissions.length) return REVENUE_COMMAND_CENTER_ROUTES;
  return REVENUE_COMMAND_CENTER_ROUTES.filter(
    (route) =>
      !route.requiredPermission ||
      permissions.includes(route.requiredPermission) ||
      permissions.includes("revenue.admin"),
  );
}

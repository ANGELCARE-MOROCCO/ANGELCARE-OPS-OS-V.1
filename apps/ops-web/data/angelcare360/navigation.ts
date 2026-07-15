import type { Angelcare360ModuleSection } from '@/types/angelcare360/module'
import { ANGELCARE360_MODULE_REGISTRY } from './module-registry'

export const ANGELCARE360_NAV_SECTIONS: Omit<Angelcare360ModuleSection, 'items'>[] = [
  {
    group: 'Pilotage',
    label: 'Pilotage',
    summary: 'Cockpit, audit, rôles et paramètres de gouvernance.',
  },
  {
    group: 'Scolarité',
    label: 'Scolarité',
    summary: 'Admissions, dossiers, classes, présence et pédagogie.',
  },
  {
    group: 'Gestion',
    label: 'Gestion',
    summary: 'Finance scolaire, paie et contrôle comptable.',
  },
  {
    group: 'Services',
    label: 'Services',
    summary: 'Transport, bibliothèque, inventaire, messages et rapports.',
  },
  {
    group: 'Gouvernance',
    label: 'Gouvernance',
    summary: 'Paramétrage, RBAC et sécurité.',
  },
]

export function getAngelcare360NavigationSections(): Angelcare360ModuleSection[] {
  return ANGELCARE360_NAV_SECTIONS.map((section) => ({
    ...section,
    items: ANGELCARE360_MODULE_REGISTRY.filter((module) => module.group === section.group),
  }))
}


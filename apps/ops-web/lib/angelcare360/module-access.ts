import type { Angelcare360AccessProfile, Angelcare360ModuleRecord, Angelcare360ModuleSection } from '@/types/angelcare360/module'
import { ANGELCARE360_NAV_SECTIONS } from '@/data/angelcare360/navigation'

export function getAngelcare360VisibleModules(modules: Angelcare360ModuleRecord[], access: Angelcare360AccessProfile) {
  if (access.accessLevel === 'super_admin' || !access.moduleKeys.length) return modules
  const aliases: Record<string, string[]> = {
    finance: ['finance','paiements','rapports'], reports: ['rapports'], academics: ['academique','devoirs','examens-notes','bulletins','matieres','emploi-du-temps','annees-scolaires'], administration: ['cockpit-direction','admissions','eleves','parents','enseignants','personnel','classes-sections','annees-scolaires','parametres'], attendance: ['presences'], transport: ['transport'], operations: ['cockpit-direction','presences','transport','reclamations'], hr: ['personnel','paie'], payroll: ['paie'], support: ['reclamations','messagerie','notifications','documents'], library: ['bibliotheque'], inventory: ['inventaire'],
  }
  const allowed = new Set(['cockpit-direction'])
  for (const key of access.moduleKeys) for (const id of aliases[key] || [key]) allowed.add(id)
  return modules.filter((module) => allowed.has(module.id))
}

export function groupAngelcare360Modules(modules: Angelcare360ModuleRecord[]): Angelcare360ModuleSection[] {
  return ANGELCARE360_NAV_SECTIONS.map((section) => ({
    ...section,
    items: modules.filter((module) => module.group === section.group),
  }))
}


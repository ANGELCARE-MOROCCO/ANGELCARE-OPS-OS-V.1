import type { Angelcare360AccessProfile, Angelcare360ModuleRecord, Angelcare360ModuleSection } from '@/types/angelcare360/module'
import { ANGELCARE360_NAV_SECTIONS } from '@/data/angelcare360/navigation'

export function getAngelcare360VisibleModules(modules: Angelcare360ModuleRecord[], _access: Angelcare360AccessProfile) {
  return modules
}

export function groupAngelcare360Modules(modules: Angelcare360ModuleRecord[]): Angelcare360ModuleSection[] {
  return ANGELCARE360_NAV_SECTIONS.map((section) => ({
    ...section,
    items: modules.filter((module) => module.group === section.group),
  }))
}


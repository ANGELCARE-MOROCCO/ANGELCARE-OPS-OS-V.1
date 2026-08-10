'use client'

import { useMemo, useState } from 'react'
import type { Angelcare360ModuleDrawerState, Angelcare360ModuleRecord } from '@/types/angelcare360/module'

export function useAngelcare360Module(initialModuleId: string | null = null) {
  const [state, setState] = useState<Angelcare360ModuleDrawerState>({
    moduleId: initialModuleId,
    isOpen: Boolean(initialModuleId),
  })

  return useMemo(() => {
    return {
      state,
      openModule(moduleId: string) {
        setState({ moduleId, isOpen: true })
      },
      openRecord(module: Angelcare360ModuleRecord) {
        setState({ moduleId: module.id, isOpen: true })
      },
      closeModule() {
        setState((current) => ({ ...current, isOpen: false }))
      },
      toggleModule(moduleId: string) {
        setState((current) =>
          current.moduleId === moduleId && current.isOpen
            ? { moduleId, isOpen: false }
            : { moduleId, isOpen: true }
        )
      },
    }
  }, [state])
}


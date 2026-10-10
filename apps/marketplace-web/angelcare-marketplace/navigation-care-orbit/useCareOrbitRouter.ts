 'use client'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { beginNavigation, navigationController } from './client-controller'
export function useCareOrbitRouter() {
  const router = useRouter()
  return useMemo(() => ({ ...router,
    push: (...args: Parameters<typeof router.push>) => { const id = beginNavigation(args[0]); try { return router.push(...args) } catch (error) { navigationController()?.finish(id); throw error } },
    replace: (...args: Parameters<typeof router.replace>) => { const id = beginNavigation(args[0]); try { return router.replace(...args) } catch (error) { navigationController()?.finish(id); throw error } },
    // Preserve refresh, prefetch and history APIs without turning mutations into navigation.
  }), [router])
}

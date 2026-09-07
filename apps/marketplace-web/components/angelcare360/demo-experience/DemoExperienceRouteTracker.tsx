'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { sanilaModuleFromPath } from '@/lib/angelcare360/experience/contract'

async function send(payload: Record<string, unknown>) {
  try {
    await fetch('/api/angelcare360/demo-experience', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    })
  } catch {
    // Tracking must never interrupt the Demo product experience.
  }
}

export default function DemoExperienceRouteTracker({ enabled }: { enabled: boolean }) {
  const pathname = usePathname() || ''

  useEffect(() => {
    if (!enabled || !pathname.startsWith('/angelcare-360-command-center')) return
    const experienceModule = sanilaModuleFromPath(pathname)
    const key = `sanila-demo-visit:${pathname}`
    if (window.sessionStorage.getItem(key)) return
    window.sessionStorage.setItem(key, '1')
    void send({ eventType: 'experience_route_visited', path: pathname })
    if (experienceModule) {
      void send({
        eventType: 'experience_module_visited',
        moduleId: experienceModule.id,
        path: pathname,
      })
    }
  }, [enabled, pathname])

  return null
}

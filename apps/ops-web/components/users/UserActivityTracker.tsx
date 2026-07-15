'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

function browserName(userAgent: string) {
  if (/Edg\//i.test(userAgent)) return 'Edge'
  if (/Chrome\//i.test(userAgent)) return 'Chrome'
  if (/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)) return 'Safari'
  if (/Firefox\//i.test(userAgent)) return 'Firefox'
  return 'Unknown'
}

function osName(userAgent: string) {
  if (/Mac OS X/i.test(userAgent)) return 'macOS'
  if (/Windows NT/i.test(userAgent)) return 'Windows'
  if (/Android/i.test(userAgent)) return 'Android'
  if (/iPhone|iPad/i.test(userAgent)) return 'iOS'
  if (/Linux/i.test(userAgent)) return 'Linux'
  return 'Unknown'
}

function deviceType(userAgent: string) {
  if (/iPhone|Android.*Mobile/i.test(userAgent)) return 'Mobile'
  if (/iPad|Tablet/i.test(userAgent)) return 'Tablet'
  return 'Desktop'
}

function moduleKeyFromPath(pathname: string) {
  return pathname.split('/').filter(Boolean)[0] || 'home'
}

export default function UserActivityTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!pathname) return

    const userAgent = navigator.userAgent || ''
    const query = searchParams?.toString()
    const routeHref = query ? `${pathname}?${query}` : pathname

    const controller = new AbortController()

    window.setTimeout(() => {
      fetch('/api/users/system-activity', {
        method: 'POST',
        cache: 'no-store',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'page_view',
          routeHref,
          moduleKey: moduleKeyFromPath(pathname),
          referrer: document.referrer || '',
          screenSize: `${window.screen.width}x${window.screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
          language: navigator.language || '',
          deviceType: deviceType(userAgent),
          browserName: browserName(userAgent),
          osName: osName(userAgent),
          payload: {
            title: document.title || '',
            userAgent,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
          },
        }),
      }).catch(() => {})
    }, 350)

    return () => controller.abort()
  }, [pathname, searchParams])

  return null
}

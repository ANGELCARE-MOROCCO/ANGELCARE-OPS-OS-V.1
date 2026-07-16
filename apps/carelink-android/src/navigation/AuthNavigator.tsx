import React from 'react'
import {LoginScreen} from '../screens/auth/LoginScreen'
import type {BackendHealth} from '../types/runtime'

export function AuthNavigator({
  backendHealth,
  onLogin,
  onCheckHealth,
  onEnterDemo,
  busy,
}: {
  backendHealth: BackendHealth
  onLogin: (identifier: string, password: string) => Promise<void>
  onCheckHealth: () => Promise<void>
  onEnterDemo: () => void
  busy: boolean
}) {
  return (
    <LoginScreen
      backendHealth={backendHealth}
      onLogin={onLogin}
      onCheckHealth={onCheckHealth}
      onEnterDemo={onEnterDemo}
      busy={busy}
    />
  )
}

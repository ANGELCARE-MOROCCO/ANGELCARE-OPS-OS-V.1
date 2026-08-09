import { TrainingHubInternalBlueprintShell } from './TrainingHubInternalBlueprintShell'

type ModuleKey =
  | 'command-center' | 'partners' | 'partner-dossier' | 'commercial' | 'offres' | 'orders' | 'billing' | 'credits'
  | 'catalogue' | 'categories' | 'sessions' | 'participants' | 'trainers' | 'attendance'
  | 'certificates' | 'documents' | 'refresh' | 'quality' | 'reports'
  | 'requests' | 'notifications' | 'users' | 'access' | 'settings' | 'audit' | 'readiness'

export function TrainingHubInternalAdminPage({ moduleKey, entityId }: { moduleKey: ModuleKey; entityId?: string }) {
  return <TrainingHubInternalBlueprintShell moduleKey={moduleKey} entityId={entityId} />
}

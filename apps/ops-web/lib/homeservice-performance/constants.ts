export const PERFORMANCE_ROOT='/carelink-ops/service-design/performance'
export const OPENROUTER_FREE_ROUTE='openrouter/free' as const
export const PERFORMANCE_EVENTS={
 snapshot:'homeservice.performance.snapshot_created',
 variance:'homeservice.performance.variance_detected',
 feedback:'homeservice.customer.feedback_received',
 caseCreated:'homeservice.customer.case_created',
 caseResolved:'homeservice.customer.case_resolved',
 signal:'homeservice.quality.signal_created',
 rootCause:'homeservice.quality.root_cause_approved',
 improvement:'homeservice.quality.improvement_proposed',
 improvementApproved:'homeservice.quality.improvement_approved',
 health:'homeservice.operations.health_degraded',
 alert:'homeservice.operations.alert_triggered',
 reconciliation:'homeservice.operations.reconciliation_failed',
 incident:'homeservice.operations.incident_created',
 productionReady:'homeservice.operations.production_ready',
 releaseApproved:'homeservice.operations.production_release_approved',
} as const
export const READINESS_CONTROL_CODES=[
 'migration_umz1','migration_umz2','migration_umz3','migration_umz4','migration_umz5',
 'typescript','production_build','rls','permissions','carelink_integration','handoff_transaction',
 'enterprise_reconciliation','backup','restore_test','openrouter_configuration','ai_transparency',
 'document_generation','csv_import_rollback','incident_workflow','controlled_pilot',
 'security_findings','runbooks','monitoring_alerts','executive_release_approval',
] as const
export const CASE_TRANSITIONS:Record<string,string[]>={
 open:['acknowledged'],acknowledged:['investigating'],investigating:['resolution_proposed'],
 resolution_proposed:['awaiting_customer_confirmation'],awaiting_customer_confirmation:['resolved'],
 resolved:['closed'],closed:[],
}
export const INCIDENT_TRANSITIONS:Record<string,string[]>={
 detected:['acknowledged'],acknowledged:['contained','investigating'],contained:['investigating'],
 investigating:['correcting'],correcting:['monitoring'],monitoring:['resolved'],resolved:['reviewed'],
 reviewed:['closed'],closed:[],
}

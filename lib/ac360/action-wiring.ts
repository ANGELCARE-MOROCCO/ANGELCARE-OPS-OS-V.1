import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { guardAc360Action, runAc360GuardedAction, type Ac360GuardInput, type Ac360GuardResult } from './guard'
import { getAc360CurrentContext } from './runtime'
import { buildAc360BlockedActionUx, recordAc360PolicyEvent, resolveAc360PolicySafety, ac360PolicyToGuardResult } from './policy-enforcement'

export type Ac360WiringKey =
  | 'ac360.addon.activate'
  | 'ac360.addon.cancel'
  | 'ac360.credits.topup'
  | 'ac360.invoice.generate'
  | 'ac360.lifecycle.reconcile'
  | 'ac360.capacity.snapshot'
  | 'email_os.compose_send'
  | 'email_os.ai_assist'
  | 'email_os.compose_attachments'
  | 'capital.tasks.create'
  | 'capital.tasks.import'
  | 'revenue.tasks.update'
  | 'ac360.policy.preflight'
  | 'ac360.policy.override.request'
  | 'ac360.policy.override.decide'
  | 'ac360.policy.events.record'
  | 'ac360.policy.reconcile'
  | 'ac360.route_coverage.scan'
  | 'ac360.qa.run'
  | 'ac360.deployment_gate.evaluate'
  | 'ac360.deployment_gate.decide'
  | 'ac360.readiness_matrix.view'
  | 'ac360.school_ops.bootstrap'
  | 'ac360.school_ops.student.create'
  | 'ac360.school_ops.guardian.create'
  | 'ac360.school_ops.staff.create'
  | 'ac360.school_ops.class.create'
  | 'ac360.school_ops.enrollment.create'
  | 'ac360.school_ops.attendance.record'
  | 'ac360.school_ops.invoice.create'
  | 'ac360.school_ops.document.upload'
  | 'ac360.school_ops.message.send'
  | 'ac360.school_ops.report.generate'
  | 'ac360.school_ops.task.create'
  | 'ac360.school_lifecycle.student.transition'
  | 'ac360.school_lifecycle.student.archive'
  | 'ac360.school_lifecycle.guardian.link'
  | 'ac360.school_lifecycle.guardian.portal_status'
  | 'ac360.school_lifecycle.class.transfer'
  | 'ac360.school_lifecycle.class.capacity_reconcile'
  | 'ac360.school_lifecycle.class.close'
  | 'ac360.school_lifecycle.integrity_check'
  | 'ac360.school_attendance.session.open'
  | 'ac360.school_attendance.event.record'
  | 'ac360.school_attendance.correction.request'
  | 'ac360.school_attendance.correction.decide'
  | 'ac360.school_attendance.session.close'
  | 'ac360.school_daily_ops.reconcile'
  | 'ac360.school_daily_ops.alert.resolve'
  | 'ac360.school_finance.fee_catalog.upsert'
  | 'ac360.school_finance.billing_cycle.open'
  | 'ac360.school_finance.invoice_batch.generate'
  | 'ac360.school_finance.invoice.issue'
  | 'ac360.school_finance.payment.record'
  | 'ac360.school_finance.payment.allocate'
  | 'ac360.school_finance.receivables.reconcile'
  | 'ac360.school_finance.invoice.mark_overdue'
  | 'ac360.school_finance.payment_promise.create'
  | 'ac360.school_finance.adjustment.decide'
  | 'ac360.school_finance.alert.resolve'
  | 'ac360.school_communication.template.upsert'
  | 'ac360.school_communication.template.render'
  | 'ac360.school_communication.campaign.create'
  | 'ac360.school_communication.campaign.enqueue'
  | 'ac360.school_communication.email.dispatch'
  | 'ac360.school_communication.whatsapp.dispatch'
  | 'ac360.school_communication.sms.dispatch'
  | 'ac360.school_communication.push.dispatch'
  | 'ac360.school_communication.delivery.record'
  | 'ac360.school_communication.preference.update'
  | 'ac360.school_communication.thread.open'
  | 'ac360.school_communication.thread.reply'
  | 'ac360.school_communication.notification.mark_read'
  | 'ac360.school_communication.alert.resolve'
  | 'ac360.school_documents.document.register'
  | 'ac360.school_documents.document.version'
  | 'ac360.school_documents.document.archive'
  | 'ac360.school_documents.review.request'
  | 'ac360.school_documents.review.decide'
  | 'ac360.school_documents.access.record'
  | 'ac360.school_documents.report_template.upsert'
  | 'ac360.school_documents.report_job.queue'
  | 'ac360.school_documents.report_artifact.record'
  | 'ac360.school_documents.export.queue'
  | 'ac360.school_documents.export.ready'
  | 'ac360.school_documents.storage.reconcile'
  | 'ac360.school_documents.alert.resolve'
  | 'ac360.school_workflows.task_board.upsert'
  | 'ac360.school_workflows.task.status_update'
  | 'ac360.school_workflows.task.comment'
  | 'ac360.school_workflows.task.checklist'
  | 'ac360.school_workflows.task.recurring_rule'
  | 'ac360.school_workflows.task.recurring_generate'
  | 'ac360.school_workflows.approval_policy.upsert'
  | 'ac360.school_workflows.approval.request'
  | 'ac360.school_workflows.approval.decide'
  | 'ac360.school_workflows.template.upsert'
  | 'ac360.school_workflows.instance.start'
  | 'ac360.school_workflows.step.advance'
  | 'ac360.school_workflows.event.record'
  | 'ac360.school_workflows.ticket.open'
  | 'ac360.school_workflows.ticket.resolve'
  | 'ac360.school_workflows.operations.reconcile'
  | 'ac360.school_workflows.operations.alert.resolve'
  | 'ac360.school_health_safety.health_profile.upsert'
  | 'ac360.school_health_safety.emergency_contact.upsert'
  | 'ac360.school_health_safety.medication_plan.upsert'
  | 'ac360.school_health_safety.medication_admin.record'
  | 'ac360.school_health_safety.authorized_pickup.upsert'
  | 'ac360.school_health_safety.pickup.record'
  | 'ac360.school_health_safety.incident.report'
  | 'ac360.school_health_safety.incident.status'
  | 'ac360.school_health_safety.incident.acknowledge'
  | 'ac360.school_health_safety.checklist.upsert'
  | 'ac360.school_health_safety.check.record'
  | 'ac360.school_health_safety.reconcile'
  | 'ac360.school_health_safety.alert.resolve'
  | 'ac360.school_transport.vehicle.upsert'
  | 'ac360.school_transport.driver.upsert'
  | 'ac360.school_transport.route.upsert'
  | 'ac360.school_transport.route_stop.upsert'
  | 'ac360.school_transport.student.assign'
  | 'ac360.school_transport.route_run.open'
  | 'ac360.school_transport.route_run.event'
  | 'ac360.school_transport.route_run.close'
  | 'ac360.school_transport.safety_check.record'
  | 'ac360.school_transport.billing.reconcile'
  | 'ac360.school_transport.reconcile'
  | 'ac360.school_transport.alert.resolve'
  | 'ac360.school_parenttrust.survey_template.upsert'
  | 'ac360.school_parenttrust.survey.launch'
  | 'ac360.school_parenttrust.survey.response'
  | 'ac360.school_parenttrust.complaint.open'
  | 'ac360.school_parenttrust.complaint.status'
  | 'ac360.school_parenttrust.appointment_slot.upsert'
  | 'ac360.school_parenttrust.appointment.book'
  | 'ac360.school_parenttrust.appointment.status'
  | 'ac360.school_parenttrust.reputation_request.create'
  | 'ac360.school_parenttrust.testimonial.record'
  | 'ac360.school_parenttrust.reconcile'
  | 'ac360.school_parenttrust.alert.resolve'
  | 'ac360.school_academy.program.upsert'
  | 'ac360.school_academy.course.upsert'
  | 'ac360.school_academy.session.schedule'
  | 'ac360.school_academy.staff.enroll'
  | 'ac360.school_academy.attendance.record'
  | 'ac360.school_academy.assessment.upsert'
  | 'ac360.school_academy.assessment_result.record'
  | 'ac360.school_academy.certificate.issue'
  | 'ac360.school_academy.assignment.create'
  | 'ac360.school_academy.reconcile'
  | 'ac360.school_academy.alert.resolve'
  | 'ac360.school_automation.ai_prompt.upsert'
  | 'ac360.school_automation.ai_job.queue'
  | 'ac360.school_automation.ai_job.complete'
  | 'ac360.school_automation.ai_job.event'
  | 'ac360.school_automation.blueprint.upsert'
  | 'ac360.school_automation.rule.upsert'
  | 'ac360.school_automation.run.trigger'
  | 'ac360.school_automation.event.record'
  | 'ac360.school_automation.scheduled_job.upsert'
  | 'ac360.school_automation.scheduled_job.run'
  | 'ac360.school_automation.smart_alert_rule.upsert'
  | 'ac360.school_automation.smart_alert.emit'
  | 'ac360.school_automation.smart_alert.resolve'
  | 'ac360.school_automation.reconcile'
  | 'ac360.school_automation.alert.resolve'

  | 'ac360.school_intake.form.upsert'
  | 'ac360.school_intake.form.publish'
  | 'ac360.school_intake.submission.create'
  | 'ac360.school_intake.submission.status'
  | 'ac360.school_intake.lead_capture.process'
  | 'ac360.school_intake.parent_request.create'
  | 'ac360.school_intake.parent_request.status'
  | 'ac360.school_intake.external_source.upsert'
  | 'ac360.school_intake.mapping.upsert'
  | 'ac360.school_intake.reconcile'
  | 'ac360.school_intake.alert.resolve'

  | 'ac360.school_branding.profile.upsert'
  | 'ac360.school_branding.asset.register'
  | 'ac360.school_branding.domain.request'
  | 'ac360.school_branding.domain.verify'
  | 'ac360.school_branding.integration_connector.upsert'
  | 'ac360.school_branding.api_key.issue'
  | 'ac360.school_branding.api_key.revoke'
  | 'ac360.school_branding.webhook.upsert'
  | 'ac360.school_branding.webhook_delivery.record'
  | 'ac360.school_branding.integration_event.record'
  | 'ac360.school_branding.reconcile'
  | 'ac360.school_branding.alert.resolve'


  | 'ac360.school_onboarding.migration_project.create'
  | 'ac360.school_onboarding.migration_source.upsert'
  | 'ac360.school_onboarding.migration_batch.create'
  | 'ac360.school_onboarding.migration_record.process'
  | 'ac360.school_onboarding.validation_finding.record'
  | 'ac360.school_onboarding.project.open'
  | 'ac360.school_onboarding.step.update'
  | 'ac360.school_onboarding.setup_checklist.upsert'
  | 'ac360.school_onboarding.setup_item.complete'
  | 'ac360.school_onboarding.success_account.upsert'
  | 'ac360.school_onboarding.success_touchpoint.record'
  | 'ac360.school_onboarding.health_score.compute'
  | 'ac360.school_onboarding.success_playbook.upsert'
  | 'ac360.school_onboarding.reconcile'
  | 'ac360.school_onboarding.alert.resolve'

  | 'ac360.internal_admin.portfolio_account.upsert'
  | 'ac360.internal_admin.support_queue.upsert'
  | 'ac360.internal_admin.support_ticket.open'
  | 'ac360.internal_admin.support_ticket.status'
  | 'ac360.internal_admin.deployment_release.create'
  | 'ac360.internal_admin.deployment_check.record'
  | 'ac360.internal_admin.deployment_incident.open'
  | 'ac360.internal_admin.deployment_incident.resolve'
  | 'ac360.internal_admin.city_market.upsert'
  | 'ac360.internal_admin.expansion_campaign.create'
  | 'ac360.internal_admin.task.create'
  | 'ac360.internal_admin.reconcile'
  | 'ac360.internal_admin.alert.resolve'

  | 'ac360.phase2s.runtime_qa.run'
  | 'ac360.phase2s.coverage.refresh'
  | 'ac360.phase2s.integrity.run'
  | 'ac360.phase2s.pre_ui_gate.evaluate'
  | 'ac360.phase2s.pre_ui_gate.decide'
  | 'ac360.phase2s.hardening_event.record'
  | 'ac360.phase2s.alert.resolve'

  | 'ac360.phase2t.typescript_hardening.run'
  | 'ac360.phase2t.api_contract_sweep.run'
  | 'ac360.phase2t.deployment_readiness.evaluate'
  | 'ac360.phase2t.deployment_repair.record'
  | 'ac360.phase2t.alert.resolve'
  | 'ac360.phase2u.sql_compatibility_sweep.run'
  | 'ac360.phase2u.final_backend_lock.evaluate'
  | 'ac360.phase2u.release_manifest.create'
  | 'ac360.phase2u.pre_ui_handoff.create'
  | 'ac360.phase2u.alert.resolve'

export type Ac360StaticWiring = {
  wiringKey: Ac360WiringKey
  routePath: string
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  actionKey: string
  targetModule: string
  quantityStrategy: string
  enforcementMode: 'strict' | 'advisory' | 'shadow' | 'disabled'
}

export const AC360_REAL_APP_ACTION_WIRING: Ac360StaticWiring[] = [
  { wiringKey: 'ac360.addon.activate', routePath: '/api/ac360/addons', method: 'POST', actionKey: 'addon.activate', targetModule: 'angelcare_360', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.addon.cancel', routePath: '/api/ac360/addons', method: 'DELETE', actionKey: 'addon.cancel', targetModule: 'angelcare_360', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.credits.topup', routePath: '/api/ac360/credits/topup', method: 'POST', actionKey: 'credits.topup', targetModule: 'angelcare_360', quantityStrategy: 'amount_as_metadata', enforcementMode: 'strict' },
  { wiringKey: 'ac360.invoice.generate', routePath: '/api/ac360/invoices/generate', method: 'POST', actionKey: 'invoice.generate', targetModule: 'angelcare_360', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.lifecycle.reconcile', routePath: '/api/ac360/lifecycle/reconcile', method: 'POST', actionKey: 'lifecycle.reconcile', targetModule: 'angelcare_360', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.capacity.snapshot', routePath: '/api/ac360/capacity/snapshot', method: 'POST', actionKey: 'capacity.measure', targetModule: 'angelcare_360', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'email_os.compose_send', routePath: '/api/email-os/compose/send', method: 'POST', actionKey: 'communication.email_send', targetModule: 'email_os', quantityStrategy: 'recipient_count', enforcementMode: 'strict' },
  { wiringKey: 'email_os.ai_assist', routePath: '/api/email-os/ai-assist', method: 'POST', actionKey: 'ai.message_generate', targetModule: 'email_os', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'email_os.compose_attachments', routePath: '/api/email-os/compose/attachments', method: 'POST', actionKey: 'document.attachment_register', targetModule: 'email_os', quantityStrategy: 'attachment_storage', enforcementMode: 'strict' },
  { wiringKey: 'capital.tasks.create', routePath: '/api/capital-command-center/tasks', method: 'POST', actionKey: 'operations.task_create', targetModule: 'capital_command_center', quantityStrategy: 'fixed_or_starter_count', enforcementMode: 'strict' },
  { wiringKey: 'capital.tasks.import', routePath: '/api/capital-command-center/tasks/import', method: 'POST', actionKey: 'operations.task_import', targetModule: 'capital_command_center', quantityStrategy: 'row_count', enforcementMode: 'strict' },
  { wiringKey: 'revenue.tasks.update', routePath: '/api/tasks', method: 'PATCH', actionKey: 'operations.task_update', targetModule: 'revenue_tasks', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.policy.preflight', routePath: '/api/ac360/policy/preflight', method: 'POST', actionKey: 'policy.preflight', targetModule: 'angelcare_360', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.policy.override.request', routePath: '/api/ac360/policy/override', method: 'POST', actionKey: 'policy.override_request', targetModule: 'angelcare_360', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.policy.override.decide', routePath: '/api/ac360/policy/override', method: 'PATCH', actionKey: 'policy.override_decide', targetModule: 'angelcare_360', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.policy.events.record', routePath: '/api/ac360/policy/events', method: 'POST', actionKey: 'policy.event.record', targetModule: 'angelcare_360', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.policy.reconcile', routePath: '/api/ac360/policy-center', method: 'POST', actionKey: 'policy.safety_reconcile', targetModule: 'angelcare_360', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.route_coverage.scan', routePath: '/api/ac360/route-coverage/scan', method: 'POST', actionKey: 'route_coverage.scan', targetModule: 'angelcare_360', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.qa.run', routePath: '/api/ac360/qa/run', method: 'POST', actionKey: 'qa.foundation_run', targetModule: 'angelcare_360', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.deployment_gate.evaluate', routePath: '/api/ac360/deployment-gate/evaluate', method: 'POST', actionKey: 'deployment_gate.evaluate', targetModule: 'angelcare_360', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.deployment_gate.decide', routePath: '/api/ac360/deployment-gate/decision', method: 'POST', actionKey: 'deployment_gate.decide', targetModule: 'angelcare_360', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.readiness_matrix.view', routePath: '/api/ac360/readiness-matrix', method: 'GET', actionKey: 'readiness_matrix.view', targetModule: 'angelcare_360', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_ops.bootstrap', routePath: '/api/ac360/school-ops/bootstrap', method: 'POST', actionKey: 'school_ops.bootstrap', targetModule: 'angelcare_360_school_ops', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_ops.student.create', routePath: '/api/ac360/school-ops/students', method: 'POST', actionKey: 'school.student.create', targetModule: 'angelcare_360_school_ops', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_ops.guardian.create', routePath: '/api/ac360/school-ops/guardians', method: 'POST', actionKey: 'school.guardian.create', targetModule: 'angelcare_360_school_ops', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_ops.staff.create', routePath: '/api/ac360/school-ops/staff', method: 'POST', actionKey: 'school.staff.create', targetModule: 'angelcare_360_school_ops', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_ops.class.create', routePath: '/api/ac360/school-ops/classes', method: 'POST', actionKey: 'school.class.create', targetModule: 'angelcare_360_school_ops', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_ops.enrollment.create', routePath: '/api/ac360/school-ops/enrollments', method: 'POST', actionKey: 'school.enrollment.create', targetModule: 'angelcare_360_school_ops', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_ops.attendance.record', routePath: '/api/ac360/school-ops/attendance', method: 'POST', actionKey: 'school.attendance.record', targetModule: 'angelcare_360_school_ops', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_ops.invoice.create', routePath: '/api/ac360/school-ops/invoices', method: 'POST', actionKey: 'school.invoice.create', targetModule: 'angelcare_360_school_ops', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_ops.document.upload', routePath: '/api/ac360/school-ops/documents', method: 'POST', actionKey: 'school.document.upload', targetModule: 'angelcare_360_school_ops', quantityStrategy: 'storage_gb', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_ops.message.send', routePath: '/api/ac360/school-ops/messages', method: 'POST', actionKey: 'school.message.send', targetModule: 'angelcare_360_school_ops', quantityStrategy: 'recipient_count', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_ops.report.generate', routePath: '/api/ac360/school-ops/reports', method: 'POST', actionKey: 'school.report.generate', targetModule: 'angelcare_360_school_ops', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_ops.task.create', routePath: '/api/ac360/school-ops/tasks', method: 'POST', actionKey: 'school.task.create', targetModule: 'angelcare_360_school_ops', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_lifecycle.student.transition', routePath: '/api/ac360/school-lifecycle/students/transition', method: 'POST', actionKey: 'school.student.transition', targetModule: 'angelcare_360_school_lifecycle', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_lifecycle.student.archive', routePath: '/api/ac360/school-lifecycle/students/archive', method: 'POST', actionKey: 'school.student.archive', targetModule: 'angelcare_360_school_lifecycle', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_lifecycle.guardian.link', routePath: '/api/ac360/school-lifecycle/guardians/link', method: 'POST', actionKey: 'school.guardian.link', targetModule: 'angelcare_360_school_lifecycle', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_lifecycle.guardian.portal_status', routePath: '/api/ac360/school-lifecycle/guardians/portal-status', method: 'POST', actionKey: 'school.guardian.portal_status.update', targetModule: 'angelcare_360_school_lifecycle', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_lifecycle.class.transfer', routePath: '/api/ac360/school-lifecycle/classes/transfer', method: 'POST', actionKey: 'school.class.transfer_student', targetModule: 'angelcare_360_school_lifecycle', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_lifecycle.class.capacity_reconcile', routePath: '/api/ac360/school-lifecycle/classes/capacity-reconcile', method: 'POST', actionKey: 'school.class.capacity.reconcile', targetModule: 'angelcare_360_school_lifecycle', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_lifecycle.class.close', routePath: '/api/ac360/school-lifecycle/classes/close', method: 'POST', actionKey: 'school.class.close', targetModule: 'angelcare_360_school_lifecycle', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_lifecycle.integrity_check', routePath: '/api/ac360/school-lifecycle/integrity-check', method: 'POST', actionKey: 'school.lifecycle.integrity_check', targetModule: 'angelcare_360_school_lifecycle', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_attendance.session.open', routePath: '/api/ac360/school-attendance/sessions/open', method: 'POST', actionKey: 'school.attendance.session.open', targetModule: 'angelcare_360_school_attendance', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_attendance.event.record', routePath: '/api/ac360/school-attendance/events/record', method: 'POST', actionKey: 'school.attendance.event.record', targetModule: 'angelcare_360_school_attendance', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_attendance.correction.request', routePath: '/api/ac360/school-attendance/corrections/request', method: 'POST', actionKey: 'school.attendance.correction.request', targetModule: 'angelcare_360_school_attendance', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_attendance.correction.decide', routePath: '/api/ac360/school-attendance/corrections/decide', method: 'POST', actionKey: 'school.attendance.correction.decide', targetModule: 'angelcare_360_school_attendance', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_attendance.session.close', routePath: '/api/ac360/school-attendance/sessions/close', method: 'POST', actionKey: 'school.attendance.session.close', targetModule: 'angelcare_360_school_attendance', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_daily_ops.reconcile', routePath: '/api/ac360/school-attendance/daily/reconcile', method: 'POST', actionKey: 'school.daily_ops.reconcile', targetModule: 'angelcare_360_school_attendance', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_daily_ops.alert.resolve', routePath: '/api/ac360/school-attendance/alerts/resolve', method: 'POST', actionKey: 'school.daily_ops.alert.resolve', targetModule: 'angelcare_360_school_attendance', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_finance.fee_catalog.upsert', routePath: '/api/ac360/school-finance/fee-catalog/upsert', method: 'POST', actionKey: 'school.finance.fee_catalog.upsert', targetModule: 'angelcare_360_school_finance', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_finance.billing_cycle.open', routePath: '/api/ac360/school-finance/billing-cycles/open', method: 'POST', actionKey: 'school.finance.billing_cycle.open', targetModule: 'angelcare_360_school_finance', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_finance.invoice_batch.generate', routePath: '/api/ac360/school-finance/invoice-batches/generate', method: 'POST', actionKey: 'school.finance.invoice_batch.generate', targetModule: 'angelcare_360_school_finance', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_finance.invoice.issue', routePath: '/api/ac360/school-finance/invoices/issue', method: 'POST', actionKey: 'school.finance.invoice.issue', targetModule: 'angelcare_360_school_finance', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_finance.payment.record', routePath: '/api/ac360/school-finance/payments/record', method: 'POST', actionKey: 'school.finance.payment.record', targetModule: 'angelcare_360_school_finance', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_finance.payment.allocate', routePath: '/api/ac360/school-finance/payments/allocate', method: 'POST', actionKey: 'school.finance.payment.allocate', targetModule: 'angelcare_360_school_finance', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_finance.receivables.reconcile', routePath: '/api/ac360/school-finance/receivables/reconcile', method: 'POST', actionKey: 'school.finance.receivables.reconcile', targetModule: 'angelcare_360_school_finance', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_finance.invoice.mark_overdue', routePath: '/api/ac360/school-finance/invoices/mark-overdue', method: 'POST', actionKey: 'school.finance.invoice.mark_overdue', targetModule: 'angelcare_360_school_finance', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_finance.payment_promise.create', routePath: '/api/ac360/school-finance/payment-promises/create', method: 'POST', actionKey: 'school.finance.payment_promise.create', targetModule: 'angelcare_360_school_finance', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_finance.adjustment.decide', routePath: '/api/ac360/school-finance/adjustments/decide', method: 'POST', actionKey: 'school.finance.adjustment.decide', targetModule: 'angelcare_360_school_finance', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_finance.alert.resolve', routePath: '/api/ac360/school-finance/alerts/resolve', method: 'POST', actionKey: 'school.finance.alert.resolve', targetModule: 'angelcare_360_school_finance', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_communication.template.upsert', routePath: '/api/ac360/school-communication/templates/upsert', method: 'POST', actionKey: 'school.communication.template.upsert', targetModule: 'angelcare_360_school_communication', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_communication.template.render', routePath: '/api/ac360/school-communication/templates/render', method: 'POST', actionKey: 'school.communication.template.render', targetModule: 'angelcare_360_school_communication', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_communication.campaign.create', routePath: '/api/ac360/school-communication/campaigns/create', method: 'POST', actionKey: 'school.communication.campaign.create', targetModule: 'angelcare_360_school_communication', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_communication.campaign.enqueue', routePath: '/api/ac360/school-communication/campaigns/enqueue', method: 'POST', actionKey: 'school.communication.campaign.enqueue', targetModule: 'angelcare_360_school_communication', quantityStrategy: 'recipient_count', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_communication.email.dispatch', routePath: '/api/ac360/school-communication/campaigns/dispatch', method: 'POST', actionKey: 'school.communication.email.dispatch', targetModule: 'angelcare_360_school_communication', quantityStrategy: 'recipient_count', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_communication.whatsapp.dispatch', routePath: '/api/ac360/school-communication/campaigns/dispatch', method: 'POST', actionKey: 'school.communication.whatsapp.dispatch', targetModule: 'angelcare_360_school_communication', quantityStrategy: 'recipient_count', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_communication.sms.dispatch', routePath: '/api/ac360/school-communication/campaigns/dispatch', method: 'POST', actionKey: 'school.communication.sms.dispatch', targetModule: 'angelcare_360_school_communication', quantityStrategy: 'recipient_count', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_communication.push.dispatch', routePath: '/api/ac360/school-communication/campaigns/dispatch', method: 'POST', actionKey: 'school.communication.push.dispatch', targetModule: 'angelcare_360_school_communication', quantityStrategy: 'recipient_count', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_communication.delivery.record', routePath: '/api/ac360/school-communication/delivery/record', method: 'POST', actionKey: 'school.communication.delivery.record', targetModule: 'angelcare_360_school_communication', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_communication.preference.update', routePath: '/api/ac360/school-communication/preferences/update', method: 'POST', actionKey: 'school.communication.preference.update', targetModule: 'angelcare_360_school_communication', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_communication.thread.open', routePath: '/api/ac360/school-communication/threads/open', method: 'POST', actionKey: 'school.communication.thread.open', targetModule: 'angelcare_360_school_communication', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_communication.thread.reply', routePath: '/api/ac360/school-communication/threads/reply', method: 'POST', actionKey: 'school.communication.thread.reply', targetModule: 'angelcare_360_school_communication', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_communication.notification.mark_read', routePath: '/api/ac360/school-communication/notifications/mark-read', method: 'POST', actionKey: 'school.communication.notification.mark_read', targetModule: 'angelcare_360_school_communication', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_communication.alert.resolve', routePath: '/api/ac360/school-communication/alerts/resolve', method: 'POST', actionKey: 'school.communication.alert.resolve', targetModule: 'angelcare_360_school_communication', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },

  { wiringKey: 'ac360.school_documents.document.register', routePath: '/api/ac360/school-documents/documents/register', method: 'POST', actionKey: 'school.document.register', targetModule: 'angelcare_360_school_documents', quantityStrategy: 'storage_gb', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_documents.document.version', routePath: '/api/ac360/school-documents/documents/version', method: 'POST', actionKey: 'school.document.version.create', targetModule: 'angelcare_360_school_documents', quantityStrategy: 'storage_gb', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_documents.document.archive', routePath: '/api/ac360/school-documents/documents/archive', method: 'POST', actionKey: 'school.document.archive', targetModule: 'angelcare_360_school_documents', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_documents.review.request', routePath: '/api/ac360/school-documents/reviews/request', method: 'POST', actionKey: 'school.document.review.request', targetModule: 'angelcare_360_school_documents', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_documents.review.decide', routePath: '/api/ac360/school-documents/reviews/decide', method: 'POST', actionKey: 'school.document.review.decide', targetModule: 'angelcare_360_school_documents', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_documents.access.record', routePath: '/api/ac360/school-documents/documents/access', method: 'POST', actionKey: 'school.document.access.record', targetModule: 'angelcare_360_school_documents', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_documents.report_template.upsert', routePath: '/api/ac360/school-documents/report-templates/upsert', method: 'POST', actionKey: 'school.report.template.upsert', targetModule: 'angelcare_360_school_documents', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_documents.report_job.queue', routePath: '/api/ac360/school-documents/reports/queue', method: 'POST', actionKey: 'school.report.job.queue', targetModule: 'angelcare_360_school_documents', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_documents.report_artifact.record', routePath: '/api/ac360/school-documents/reports/artifact', method: 'POST', actionKey: 'school.report.artifact.record', targetModule: 'angelcare_360_school_documents', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_documents.export.queue', routePath: '/api/ac360/school-documents/exports/queue', method: 'POST', actionKey: 'school.export.job.queue', targetModule: 'angelcare_360_school_documents', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_documents.export.ready', routePath: '/api/ac360/school-documents/exports/ready', method: 'POST', actionKey: 'school.export.mark_ready', targetModule: 'angelcare_360_school_documents', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_documents.storage.reconcile', routePath: '/api/ac360/school-documents/storage/reconcile', method: 'POST', actionKey: 'school.storage.reconcile', targetModule: 'angelcare_360_school_documents', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_documents.alert.resolve', routePath: '/api/ac360/school-documents/alerts/resolve', method: 'POST', actionKey: 'school.document.alert.resolve', targetModule: 'angelcare_360_school_documents', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },

  { wiringKey: 'ac360.school_workflows.task_board.upsert', routePath: '/api/ac360/school-workflows/task-boards/upsert', method: 'POST', actionKey: 'school.task.board.upsert', targetModule: 'angelcare_360_school_workflows', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_workflows.task.status_update', routePath: '/api/ac360/school-workflows/tasks/status', method: 'POST', actionKey: 'school.task.status.update', targetModule: 'angelcare_360_school_workflows', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_workflows.task.comment', routePath: '/api/ac360/school-workflows/tasks/comment', method: 'POST', actionKey: 'school.task.comment.add', targetModule: 'angelcare_360_school_workflows', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_workflows.task.checklist', routePath: '/api/ac360/school-workflows/tasks/checklist', method: 'POST', actionKey: 'school.task.checklist.upsert', targetModule: 'angelcare_360_school_workflows', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_workflows.task.recurring_rule', routePath: '/api/ac360/school-workflows/tasks/recurring-rules/create', method: 'POST', actionKey: 'school.task.recurring_rule.create', targetModule: 'angelcare_360_school_workflows', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_workflows.task.recurring_generate', routePath: '/api/ac360/school-workflows/tasks/recurring-rules/generate', method: 'POST', actionKey: 'school.task.recurring.generate', targetModule: 'angelcare_360_school_workflows', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_workflows.approval_policy.upsert', routePath: '/api/ac360/school-workflows/approvals/policies/upsert', method: 'POST', actionKey: 'school.approval.policy.upsert', targetModule: 'angelcare_360_school_workflows', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_workflows.approval.request', routePath: '/api/ac360/school-workflows/approvals/request', method: 'POST', actionKey: 'school.approval.request', targetModule: 'angelcare_360_school_workflows', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_workflows.approval.decide', routePath: '/api/ac360/school-workflows/approvals/decide', method: 'POST', actionKey: 'school.approval.decide', targetModule: 'angelcare_360_school_workflows', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_workflows.template.upsert', routePath: '/api/ac360/school-workflows/workflows/templates/upsert', method: 'POST', actionKey: 'school.workflow.template.upsert', targetModule: 'angelcare_360_school_workflows', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_workflows.instance.start', routePath: '/api/ac360/school-workflows/workflows/start', method: 'POST', actionKey: 'school.workflow.instance.start', targetModule: 'angelcare_360_school_workflows', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_workflows.step.advance', routePath: '/api/ac360/school-workflows/workflows/advance-step', method: 'POST', actionKey: 'school.workflow.step.advance', targetModule: 'angelcare_360_school_workflows', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_workflows.event.record', routePath: '/api/ac360/school-workflows/workflows/events/record', method: 'POST', actionKey: 'school.workflow.event.record', targetModule: 'angelcare_360_school_workflows', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_workflows.ticket.open', routePath: '/api/ac360/school-workflows/operations/tickets/open', method: 'POST', actionKey: 'school.operations.ticket.open', targetModule: 'angelcare_360_school_workflows', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_workflows.ticket.resolve', routePath: '/api/ac360/school-workflows/operations/tickets/resolve', method: 'POST', actionKey: 'school.operations.ticket.resolve', targetModule: 'angelcare_360_school_workflows', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_workflows.operations.reconcile', routePath: '/api/ac360/school-workflows/operations/reconcile', method: 'POST', actionKey: 'school.operations.reconcile', targetModule: 'angelcare_360_school_workflows', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_workflows.operations.alert.resolve', routePath: '/api/ac360/school-workflows/operations/alerts/resolve', method: 'POST', actionKey: 'school.operations.alert.resolve', targetModule: 'angelcare_360_school_workflows', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },

  { wiringKey: 'ac360.school_health_safety.health_profile.upsert', routePath: '/api/ac360/school-health-safety/health-profiles/upsert', method: 'POST', actionKey: 'school.health.profile.upsert', targetModule: 'angelcare_360_school_health_safety', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_health_safety.emergency_contact.upsert', routePath: '/api/ac360/school-health-safety/emergency-contacts/upsert', method: 'POST', actionKey: 'school.health.emergency_contact.upsert', targetModule: 'angelcare_360_school_health_safety', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_health_safety.medication_plan.upsert', routePath: '/api/ac360/school-health-safety/medication-plans/upsert', method: 'POST', actionKey: 'school.health.medication_plan.upsert', targetModule: 'angelcare_360_school_health_safety', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_health_safety.medication_admin.record', routePath: '/api/ac360/school-health-safety/medication-admin/record', method: 'POST', actionKey: 'school.health.medication_admin.record', targetModule: 'angelcare_360_school_health_safety', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_health_safety.authorized_pickup.upsert', routePath: '/api/ac360/school-health-safety/authorized-pickups/upsert', method: 'POST', actionKey: 'school.safety.authorized_pickup.upsert', targetModule: 'angelcare_360_school_health_safety', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_health_safety.pickup.record', routePath: '/api/ac360/school-health-safety/pickups/record', method: 'POST', actionKey: 'school.safety.pickup.record', targetModule: 'angelcare_360_school_health_safety', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_health_safety.incident.report', routePath: '/api/ac360/school-health-safety/incidents/report', method: 'POST', actionKey: 'school.safety.incident.report', targetModule: 'angelcare_360_school_health_safety', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_health_safety.incident.status', routePath: '/api/ac360/school-health-safety/incidents/status', method: 'POST', actionKey: 'school.safety.incident.status.update', targetModule: 'angelcare_360_school_health_safety', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_health_safety.incident.acknowledge', routePath: '/api/ac360/school-health-safety/incidents/acknowledge', method: 'POST', actionKey: 'school.safety.incident.acknowledge', targetModule: 'angelcare_360_school_health_safety', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_health_safety.checklist.upsert', routePath: '/api/ac360/school-health-safety/safety-checklists/upsert', method: 'POST', actionKey: 'school.safety.checklist.upsert', targetModule: 'angelcare_360_school_health_safety', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_health_safety.check.record', routePath: '/api/ac360/school-health-safety/safety-checks/record', method: 'POST', actionKey: 'school.safety.check.record', targetModule: 'angelcare_360_school_health_safety', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_health_safety.reconcile', routePath: '/api/ac360/school-health-safety/reconcile', method: 'POST', actionKey: 'school.safety.reconcile', targetModule: 'angelcare_360_school_health_safety', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_health_safety.alert.resolve', routePath: '/api/ac360/school-health-safety/alerts/resolve', method: 'POST', actionKey: 'school.safety.alert.resolve', targetModule: 'angelcare_360_school_health_safety', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },

  { wiringKey: 'ac360.school_transport.vehicle.upsert', routePath: '/api/ac360/school-transport/vehicles/upsert', method: 'POST', actionKey: 'school.transport.vehicle.upsert', targetModule: 'angelcare_360_school_transport', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_transport.driver.upsert', routePath: '/api/ac360/school-transport/drivers/upsert', method: 'POST', actionKey: 'school.transport.driver.upsert', targetModule: 'angelcare_360_school_transport', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_transport.route.upsert', routePath: '/api/ac360/school-transport/routes/upsert', method: 'POST', actionKey: 'school.transport.route.upsert', targetModule: 'angelcare_360_school_transport', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_transport.route_stop.upsert', routePath: '/api/ac360/school-transport/route-stops/upsert', method: 'POST', actionKey: 'school.transport.route_stop.upsert', targetModule: 'angelcare_360_school_transport', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_transport.student.assign', routePath: '/api/ac360/school-transport/students/assign', method: 'POST', actionKey: 'school.transport.student.assign', targetModule: 'angelcare_360_school_transport', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_transport.route_run.open', routePath: '/api/ac360/school-transport/route-runs/open', method: 'POST', actionKey: 'school.transport.route_run.open', targetModule: 'angelcare_360_school_transport', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_transport.route_run.event', routePath: '/api/ac360/school-transport/route-runs/events/record', method: 'POST', actionKey: 'school.transport.route_run.event.record', targetModule: 'angelcare_360_school_transport', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_transport.route_run.close', routePath: '/api/ac360/school-transport/route-runs/close', method: 'POST', actionKey: 'school.transport.route_run.close', targetModule: 'angelcare_360_school_transport', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_transport.safety_check.record', routePath: '/api/ac360/school-transport/safety-checks/record', method: 'POST', actionKey: 'school.transport.safety_check.record', targetModule: 'angelcare_360_school_transport', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_transport.billing.reconcile', routePath: '/api/ac360/school-transport/billing/reconcile', method: 'POST', actionKey: 'school.transport.billing.reconcile', targetModule: 'angelcare_360_school_transport', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_transport.reconcile', routePath: '/api/ac360/school-transport/reconcile', method: 'POST', actionKey: 'school.transport.reconcile', targetModule: 'angelcare_360_school_transport', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_transport.alert.resolve', routePath: '/api/ac360/school-transport/alerts/resolve', method: 'POST', actionKey: 'school.transport.alert.resolve', targetModule: 'angelcare_360_school_transport', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },

  { wiringKey: 'ac360.school_parenttrust.survey_template.upsert', routePath: '/api/ac360/school-parenttrust/survey-templates/upsert', method: 'POST', actionKey: 'school.parenttrust.survey_template.upsert', targetModule: 'angelcare_360_school_parenttrust', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_parenttrust.survey.launch', routePath: '/api/ac360/school-parenttrust/surveys/launch', method: 'POST', actionKey: 'school.parenttrust.survey.launch', targetModule: 'angelcare_360_school_parenttrust', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_parenttrust.survey.response', routePath: '/api/ac360/school-parenttrust/surveys/responses/record', method: 'POST', actionKey: 'school.parenttrust.survey.response.record', targetModule: 'angelcare_360_school_parenttrust', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_parenttrust.complaint.open', routePath: '/api/ac360/school-parenttrust/complaints/open', method: 'POST', actionKey: 'school.parenttrust.complaint.open', targetModule: 'angelcare_360_school_parenttrust', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_parenttrust.complaint.status', routePath: '/api/ac360/school-parenttrust/complaints/status', method: 'POST', actionKey: 'school.parenttrust.complaint.status.update', targetModule: 'angelcare_360_school_parenttrust', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_parenttrust.appointment_slot.upsert', routePath: '/api/ac360/school-parenttrust/appointment-slots/upsert', method: 'POST', actionKey: 'school.parenttrust.appointment_slot.upsert', targetModule: 'angelcare_360_school_parenttrust', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_parenttrust.appointment.book', routePath: '/api/ac360/school-parenttrust/appointments/book', method: 'POST', actionKey: 'school.parenttrust.appointment.book', targetModule: 'angelcare_360_school_parenttrust', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_parenttrust.appointment.status', routePath: '/api/ac360/school-parenttrust/appointments/status', method: 'POST', actionKey: 'school.parenttrust.appointment.status.update', targetModule: 'angelcare_360_school_parenttrust', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_parenttrust.reputation_request.create', routePath: '/api/ac360/school-parenttrust/reputation-requests/create', method: 'POST', actionKey: 'school.parenttrust.reputation_request.create', targetModule: 'angelcare_360_school_parenttrust', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_parenttrust.testimonial.record', routePath: '/api/ac360/school-parenttrust/testimonials/record', method: 'POST', actionKey: 'school.parenttrust.testimonial.record', targetModule: 'angelcare_360_school_parenttrust', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_parenttrust.reconcile', routePath: '/api/ac360/school-parenttrust/reconcile', method: 'POST', actionKey: 'school.parenttrust.reconcile', targetModule: 'angelcare_360_school_parenttrust', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_parenttrust.alert.resolve', routePath: '/api/ac360/school-parenttrust/alerts/resolve', method: 'POST', actionKey: 'school.parenttrust.alert.resolve', targetModule: 'angelcare_360_school_parenttrust', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },

  { wiringKey: 'ac360.school_academy.program.upsert', routePath: '/api/ac360/school-academy/programs/upsert', method: 'POST', actionKey: 'school.academy.program.upsert', targetModule: 'angelcare_360_school_academy', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_academy.course.upsert', routePath: '/api/ac360/school-academy/courses/upsert', method: 'POST', actionKey: 'school.academy.course.upsert', targetModule: 'angelcare_360_school_academy', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_academy.session.schedule', routePath: '/api/ac360/school-academy/sessions/schedule', method: 'POST', actionKey: 'school.academy.session.schedule', targetModule: 'angelcare_360_school_academy', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_academy.staff.enroll', routePath: '/api/ac360/school-academy/enrollments/staff', method: 'POST', actionKey: 'school.academy.staff.enroll', targetModule: 'angelcare_360_school_academy', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_academy.attendance.record', routePath: '/api/ac360/school-academy/attendance/record', method: 'POST', actionKey: 'school.academy.attendance.record', targetModule: 'angelcare_360_school_academy', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_academy.assessment.upsert', routePath: '/api/ac360/school-academy/assessments/upsert', method: 'POST', actionKey: 'school.academy.assessment.upsert', targetModule: 'angelcare_360_school_academy', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_academy.assessment_result.record', routePath: '/api/ac360/school-academy/assessment-results/record', method: 'POST', actionKey: 'school.academy.assessment_result.record', targetModule: 'angelcare_360_school_academy', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_academy.certificate.issue', routePath: '/api/ac360/school-academy/certificates/issue', method: 'POST', actionKey: 'school.academy.certificate.issue', targetModule: 'angelcare_360_school_academy', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_academy.assignment.create', routePath: '/api/ac360/school-academy/assignments/create', method: 'POST', actionKey: 'school.academy.assignment.create', targetModule: 'angelcare_360_school_academy', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_academy.reconcile', routePath: '/api/ac360/school-academy/reconcile', method: 'POST', actionKey: 'school.academy.reconcile', targetModule: 'angelcare_360_school_academy', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_academy.alert.resolve', routePath: '/api/ac360/school-academy/alerts/resolve', method: 'POST', actionKey: 'school.academy.alert.resolve', targetModule: 'angelcare_360_school_academy', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },

  { wiringKey: 'ac360.school_automation.ai_prompt.upsert', routePath: '/api/ac360/school-automation/ai-prompts/upsert', method: 'POST', actionKey: 'school.ai.prompt.upsert', targetModule: 'angelcare_360_school_automation', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_automation.ai_job.queue', routePath: '/api/ac360/school-automation/ai-jobs/queue', method: 'POST', actionKey: 'school.ai.job.queue', targetModule: 'angelcare_360_school_automation', quantityStrategy: 'ai_credit_cost', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_automation.ai_job.complete', routePath: '/api/ac360/school-automation/ai-jobs/complete', method: 'POST', actionKey: 'school.ai.job.complete', targetModule: 'angelcare_360_school_automation', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_automation.ai_job.event', routePath: '/api/ac360/school-automation/ai-jobs/events/record', method: 'POST', actionKey: 'school.ai.job.event.record', targetModule: 'angelcare_360_school_automation', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_automation.blueprint.upsert', routePath: '/api/ac360/school-automation/automation-blueprints/upsert', method: 'POST', actionKey: 'school.automation.blueprint.upsert', targetModule: 'angelcare_360_school_automation', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_automation.rule.upsert', routePath: '/api/ac360/school-automation/automation-rules/upsert', method: 'POST', actionKey: 'school.automation.rule.upsert', targetModule: 'angelcare_360_school_automation', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_automation.run.trigger', routePath: '/api/ac360/school-automation/automation-runs/trigger', method: 'POST', actionKey: 'school.automation.run.trigger', targetModule: 'angelcare_360_school_automation', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_automation.event.record', routePath: '/api/ac360/school-automation/automation-runs/events/record', method: 'POST', actionKey: 'school.automation.event.record', targetModule: 'angelcare_360_school_automation', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_automation.scheduled_job.upsert', routePath: '/api/ac360/school-automation/scheduled-jobs/upsert', method: 'POST', actionKey: 'school.scheduled_job.upsert', targetModule: 'angelcare_360_school_automation', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_automation.scheduled_job.run', routePath: '/api/ac360/school-automation/scheduled-jobs/run', method: 'POST', actionKey: 'school.scheduled_job.run', targetModule: 'angelcare_360_school_automation', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_automation.smart_alert_rule.upsert', routePath: '/api/ac360/school-automation/smart-alert-rules/upsert', method: 'POST', actionKey: 'school.smart_alert.rule.upsert', targetModule: 'angelcare_360_school_automation', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_automation.smart_alert.emit', routePath: '/api/ac360/school-automation/smart-alerts/emit', method: 'POST', actionKey: 'school.smart_alert.emit', targetModule: 'angelcare_360_school_automation', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_automation.smart_alert.resolve', routePath: '/api/ac360/school-automation/smart-alerts/resolve', method: 'POST', actionKey: 'school.smart_alert.resolve', targetModule: 'angelcare_360_school_automation', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_automation.reconcile', routePath: '/api/ac360/school-automation/reconcile', method: 'POST', actionKey: 'school.ai_automation.reconcile', targetModule: 'angelcare_360_school_automation', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_automation.alert.resolve', routePath: '/api/ac360/school-automation/alerts/resolve', method: 'POST', actionKey: 'school.ai_automation.alert.resolve', targetModule: 'angelcare_360_school_automation', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },


  { wiringKey: 'ac360.school_intake.form.upsert', routePath: '/api/ac360/school-intake/forms/upsert', method: 'POST', actionKey: 'school.intake.form.upsert', targetModule: 'angelcare_360_school_intake', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_intake.form.publish', routePath: '/api/ac360/school-intake/forms/publish', method: 'POST', actionKey: 'school.intake.form.publish', targetModule: 'angelcare_360_school_intake', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_intake.submission.create', routePath: '/api/ac360/school-intake/submissions/create', method: 'POST', actionKey: 'school.intake.submission.create', targetModule: 'angelcare_360_school_intake', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_intake.submission.status', routePath: '/api/ac360/school-intake/submissions/status', method: 'POST', actionKey: 'school.intake.submission.status.update', targetModule: 'angelcare_360_school_intake', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_intake.lead_capture.process', routePath: '/api/ac360/school-intake/lead-capture/process', method: 'POST', actionKey: 'school.intake.lead_capture.process', targetModule: 'angelcare_360_school_intake', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_intake.parent_request.create', routePath: '/api/ac360/school-intake/parent-requests/create', method: 'POST', actionKey: 'school.intake.parent_request.create', targetModule: 'angelcare_360_school_intake', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_intake.parent_request.status', routePath: '/api/ac360/school-intake/parent-requests/status', method: 'POST', actionKey: 'school.intake.parent_request.status.update', targetModule: 'angelcare_360_school_intake', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_intake.external_source.upsert', routePath: '/api/ac360/school-intake/external-sources/upsert', method: 'POST', actionKey: 'school.intake.external_source.upsert', targetModule: 'angelcare_360_school_intake', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_intake.mapping.upsert', routePath: '/api/ac360/school-intake/mappings/upsert', method: 'POST', actionKey: 'school.intake.mapping.upsert', targetModule: 'angelcare_360_school_intake', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_intake.reconcile', routePath: '/api/ac360/school-intake/reconcile', method: 'POST', actionKey: 'school.intake.reconcile', targetModule: 'angelcare_360_school_intake', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_intake.alert.resolve', routePath: '/api/ac360/school-intake/alerts/resolve', method: 'POST', actionKey: 'school.intake.alert.resolve', targetModule: 'angelcare_360_school_intake', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },

  { wiringKey: 'ac360.school_branding.profile.upsert', routePath: '/api/ac360/school-branding/branding/profile/upsert', method: 'POST', actionKey: 'school.branding.profile.upsert', targetModule: 'angelcare_360_school_branding_integrations', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_branding.asset.register', routePath: '/api/ac360/school-branding/branding/assets/register', method: 'POST', actionKey: 'school.branding.asset.register', targetModule: 'angelcare_360_school_branding_integrations', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_branding.domain.request', routePath: '/api/ac360/school-branding/domains/request', method: 'POST', actionKey: 'school.domain.request', targetModule: 'angelcare_360_school_branding_integrations', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_branding.domain.verify', routePath: '/api/ac360/school-branding/domains/verify', method: 'POST', actionKey: 'school.domain.verify', targetModule: 'angelcare_360_school_branding_integrations', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_branding.integration_connector.upsert', routePath: '/api/ac360/school-branding/integrations/connectors/upsert', method: 'POST', actionKey: 'school.integration.connector.upsert', targetModule: 'angelcare_360_school_branding_integrations', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_branding.api_key.issue', routePath: '/api/ac360/school-branding/api-keys/issue', method: 'POST', actionKey: 'school.api_key.issue', targetModule: 'angelcare_360_school_branding_integrations', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_branding.api_key.revoke', routePath: '/api/ac360/school-branding/api-keys/revoke', method: 'POST', actionKey: 'school.api_key.revoke', targetModule: 'angelcare_360_school_branding_integrations', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_branding.webhook.upsert', routePath: '/api/ac360/school-branding/webhooks/upsert', method: 'POST', actionKey: 'school.webhook.upsert', targetModule: 'angelcare_360_school_branding_integrations', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_branding.webhook_delivery.record', routePath: '/api/ac360/school-branding/webhooks/deliveries/record', method: 'POST', actionKey: 'school.webhook.delivery.record', targetModule: 'angelcare_360_school_branding_integrations', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_branding.integration_event.record', routePath: '/api/ac360/school-branding/integrations/events/record', method: 'POST', actionKey: 'school.integration.event.record', targetModule: 'angelcare_360_school_branding_integrations', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_branding.reconcile', routePath: '/api/ac360/school-branding/reconcile', method: 'POST', actionKey: 'school.branding_integrations.reconcile', targetModule: 'angelcare_360_school_branding_integrations', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_branding.alert.resolve', routePath: '/api/ac360/school-branding/alerts/resolve', method: 'POST', actionKey: 'school.integration.alert.resolve', targetModule: 'angelcare_360_school_branding_integrations', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_onboarding.migration_project.create', routePath: '/api/ac360/school-onboarding/migration-projects/create', method: 'POST', actionKey: 'school.migration.project.create', targetModule: 'angelcare_360_school_onboarding_success', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_onboarding.migration_source.upsert', routePath: '/api/ac360/school-onboarding/migration-sources/upsert', method: 'POST', actionKey: 'school.migration.source.upsert', targetModule: 'angelcare_360_school_onboarding_success', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_onboarding.migration_batch.create', routePath: '/api/ac360/school-onboarding/migration-batches/create', method: 'POST', actionKey: 'school.migration.batch.create', targetModule: 'angelcare_360_school_onboarding_success', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_onboarding.migration_record.process', routePath: '/api/ac360/school-onboarding/migration-records/process', method: 'POST', actionKey: 'school.migration.record.process', targetModule: 'angelcare_360_school_onboarding_success', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_onboarding.validation_finding.record', routePath: '/api/ac360/school-onboarding/validation-findings/record', method: 'POST', actionKey: 'school.migration.validation.record', targetModule: 'angelcare_360_school_onboarding_success', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_onboarding.project.open', routePath: '/api/ac360/school-onboarding/projects/open', method: 'POST', actionKey: 'school.onboarding.project.open', targetModule: 'angelcare_360_school_onboarding_success', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_onboarding.step.update', routePath: '/api/ac360/school-onboarding/steps/update', method: 'POST', actionKey: 'school.onboarding.step.update', targetModule: 'angelcare_360_school_onboarding_success', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_onboarding.setup_checklist.upsert', routePath: '/api/ac360/school-onboarding/setup-checklists/upsert', method: 'POST', actionKey: 'school.setup.checklist.upsert', targetModule: 'angelcare_360_school_onboarding_success', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_onboarding.setup_item.complete', routePath: '/api/ac360/school-onboarding/setup-items/complete', method: 'POST', actionKey: 'school.setup.item.complete', targetModule: 'angelcare_360_school_onboarding_success', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_onboarding.success_account.upsert', routePath: '/api/ac360/school-onboarding/success-accounts/upsert', method: 'POST', actionKey: 'school.client_success.account.upsert', targetModule: 'angelcare_360_school_onboarding_success', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_onboarding.success_touchpoint.record', routePath: '/api/ac360/school-onboarding/touchpoints/record', method: 'POST', actionKey: 'school.client_success.touchpoint.record', targetModule: 'angelcare_360_school_onboarding_success', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_onboarding.health_score.compute', routePath: '/api/ac360/school-onboarding/health-scores/compute', method: 'POST', actionKey: 'school.client_success.health_score.compute', targetModule: 'angelcare_360_school_onboarding_success', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_onboarding.success_playbook.upsert', routePath: '/api/ac360/school-onboarding/playbooks/upsert', method: 'POST', actionKey: 'school.client_success.playbook.upsert', targetModule: 'angelcare_360_school_onboarding_success', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_onboarding.reconcile', routePath: '/api/ac360/school-onboarding/reconcile', method: 'POST', actionKey: 'school.onboarding.reconcile', targetModule: 'angelcare_360_school_onboarding_success', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.school_onboarding.alert.resolve', routePath: '/api/ac360/school-onboarding/alerts/resolve', method: 'POST', actionKey: 'school.onboarding.alert.resolve', targetModule: 'angelcare_360_school_onboarding_success', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },

  { wiringKey: 'ac360.internal_admin.portfolio_account.upsert', routePath: '/api/ac360/internal-admin/portfolio/accounts/upsert', method: 'POST', actionKey: 'internal.portfolio_account.upsert', targetModule: 'angelcare_360_internal_admin', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.internal_admin.support_queue.upsert', routePath: '/api/ac360/internal-admin/support/queues/upsert', method: 'POST', actionKey: 'internal.support_queue.upsert', targetModule: 'angelcare_360_internal_admin', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.internal_admin.support_ticket.open', routePath: '/api/ac360/internal-admin/support/tickets/open', method: 'POST', actionKey: 'internal.support_ticket.open', targetModule: 'angelcare_360_internal_admin', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.internal_admin.support_ticket.status', routePath: '/api/ac360/internal-admin/support/tickets/status', method: 'POST', actionKey: 'internal.support_ticket.status.update', targetModule: 'angelcare_360_internal_admin', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.internal_admin.deployment_release.create', routePath: '/api/ac360/internal-admin/deployments/releases/create', method: 'POST', actionKey: 'internal.deployment_release.create', targetModule: 'angelcare_360_internal_admin', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.internal_admin.deployment_check.record', routePath: '/api/ac360/internal-admin/deployments/checks/record', method: 'POST', actionKey: 'internal.deployment_check.record', targetModule: 'angelcare_360_internal_admin', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.internal_admin.deployment_incident.open', routePath: '/api/ac360/internal-admin/deployments/incidents/open', method: 'POST', actionKey: 'internal.deployment_incident.open', targetModule: 'angelcare_360_internal_admin', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.internal_admin.deployment_incident.resolve', routePath: '/api/ac360/internal-admin/deployments/incidents/resolve', method: 'POST', actionKey: 'internal.deployment_incident.resolve', targetModule: 'angelcare_360_internal_admin', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.internal_admin.city_market.upsert', routePath: '/api/ac360/internal-admin/nationwide/city-markets/upsert', method: 'POST', actionKey: 'internal.city_market.upsert', targetModule: 'angelcare_360_internal_admin', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.internal_admin.expansion_campaign.create', routePath: '/api/ac360/internal-admin/nationwide/expansion-campaigns/create', method: 'POST', actionKey: 'internal.expansion_campaign.create', targetModule: 'angelcare_360_internal_admin', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.internal_admin.task.create', routePath: '/api/ac360/internal-admin/tasks/create', method: 'POST', actionKey: 'internal.admin_task.create', targetModule: 'angelcare_360_internal_admin', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.internal_admin.reconcile', routePath: '/api/ac360/internal-admin/reconcile', method: 'POST', actionKey: 'internal.admin.reconcile', targetModule: 'angelcare_360_internal_admin', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.internal_admin.alert.resolve', routePath: '/api/ac360/internal-admin/alerts/resolve', method: 'POST', actionKey: 'internal.admin.alert.resolve', targetModule: 'angelcare_360_internal_admin', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },

  { wiringKey: 'ac360.phase2s.runtime_qa.run', routePath: '/api/ac360/phase2-runtime-qa/run', method: 'POST', actionKey: 'phase2.runtime_qa.run', targetModule: 'angelcare_360_phase2_runtime_qa', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.phase2s.coverage.refresh', routePath: '/api/ac360/phase2-runtime-qa/coverage/refresh', method: 'POST', actionKey: 'phase2.coverage.refresh', targetModule: 'angelcare_360_phase2_runtime_qa', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.phase2s.integrity.run', routePath: '/api/ac360/phase2-runtime-qa/integrity/run', method: 'POST', actionKey: 'phase2.integrity.run', targetModule: 'angelcare_360_phase2_runtime_qa', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.phase2s.pre_ui_gate.evaluate', routePath: '/api/ac360/phase2-runtime-qa/pre-ui-gate/evaluate', method: 'POST', actionKey: 'phase2.pre_ui_gate.evaluate', targetModule: 'angelcare_360_phase2_runtime_qa', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.phase2s.pre_ui_gate.decide', routePath: '/api/ac360/phase2-runtime-qa/pre-ui-gate/decision', method: 'POST', actionKey: 'phase2.pre_ui_gate.decide', targetModule: 'angelcare_360_phase2_runtime_qa', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.phase2s.hardening_event.record', routePath: '/api/ac360/phase2-runtime-qa/hardening/events', method: 'POST', actionKey: 'phase2.hardening_event.record', targetModule: 'angelcare_360_phase2_runtime_qa', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.phase2s.alert.resolve', routePath: '/api/ac360/phase2-runtime-qa/alerts/resolve', method: 'POST', actionKey: 'phase2.alert.resolve', targetModule: 'angelcare_360_phase2_runtime_qa', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },


  { wiringKey: 'ac360.phase2t.typescript_hardening.run', routePath: '/api/ac360/phase2-build-hardening/typescript/run', method: 'POST', actionKey: 'phase2.typescript_hardening.run', targetModule: 'angelcare_360_phase2_build_hardening', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.phase2t.api_contract_sweep.run', routePath: '/api/ac360/phase2-build-hardening/api-contracts/sweep', method: 'POST', actionKey: 'phase2.api_contract_sweep.run', targetModule: 'angelcare_360_phase2_build_hardening', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.phase2t.deployment_readiness.evaluate', routePath: '/api/ac360/phase2-build-hardening/deployment-readiness/evaluate', method: 'POST', actionKey: 'phase2.deployment_readiness.evaluate', targetModule: 'angelcare_360_phase2_build_hardening', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.phase2t.deployment_repair.record', routePath: '/api/ac360/phase2-build-hardening/repairs/record', method: 'POST', actionKey: 'phase2.deployment_repair.record', targetModule: 'angelcare_360_phase2_build_hardening', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.phase2t.alert.resolve', routePath: '/api/ac360/phase2-build-hardening/alerts/resolve', method: 'POST', actionKey: 'phase2.build_alert.resolve', targetModule: 'angelcare_360_phase2_build_hardening', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },

  { wiringKey: 'ac360.phase2u.sql_compatibility_sweep.run', routePath: '/api/ac360/phase2-final-lock/sql-compatibility/sweep', method: 'POST', actionKey: 'phase2.sql_compatibility_sweep.run', targetModule: 'angelcare_360_phase2_final_backend_lock', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.phase2u.final_backend_lock.evaluate', routePath: '/api/ac360/phase2-final-lock/backend-lock/evaluate', method: 'POST', actionKey: 'phase2.final_backend_lock.evaluate', targetModule: 'angelcare_360_phase2_final_backend_lock', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.phase2u.release_manifest.create', routePath: '/api/ac360/phase2-final-lock/release-manifest/create', method: 'POST', actionKey: 'phase2.release_manifest.create', targetModule: 'angelcare_360_phase2_final_backend_lock', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.phase2u.pre_ui_handoff.create', routePath: '/api/ac360/phase2-final-lock/pre-ui-handoff/create', method: 'POST', actionKey: 'phase2.pre_ui_handoff.create', targetModule: 'angelcare_360_phase2_final_backend_lock', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
  { wiringKey: 'ac360.phase2u.alert.resolve', routePath: '/api/ac360/phase2-final-lock/alerts/resolve', method: 'POST', actionKey: 'phase2.final_lock.alert.resolve', targetModule: 'angelcare_360_phase2_final_backend_lock', quantityStrategy: 'fixed_1', enforcementMode: 'strict' },
]

export function getAc360StaticWiring(wiringKey: string) {
  return AC360_REAL_APP_ACTION_WIRING.find((item) => item.wiringKey === wiringKey)
}

export function countEmailRecipients(...values: unknown[]) {
  const unique = new Set<string>()
  for (const value of values) {
    if (!value) continue
    const parts = Array.isArray(value) ? value : String(value).split(/[;,]/)
    for (const part of parts) {
      const item = String(part || '').trim().toLowerCase()
      if (item) unique.add(item)
    }
  }
  return Math.max(unique.size, 1)
}

export function estimateStorageGbFromBytes(bytes: unknown) {
  const parsed = Number(bytes || 0)
  if (!Number.isFinite(parsed) || parsed <= 0) return 1
  return Math.max(1, Number((parsed / (1024 * 1024 * 1024)).toFixed(3)))
}

export function buildAc360IdempotencyKey(prefix: string, seed?: unknown) {
  const cleanSeed = String(seed || '').trim().replace(/[^a-zA-Z0-9_.:-]/g, '-').slice(0, 120)
  return `${prefix}:${cleanSeed || `${Date.now()}:${Math.random().toString(36).slice(2, 10)}`}`
}

export function ac360GuardBlockedResponse(result: { guard?: Ac360GuardResult; error?: string }, status = 402) {
  const guard = result.guard
  const response = NextResponse.json({
    ok: false,
    error: result.error || guard?.reason || 'AC360 guard blocked this action.',
    ac360: {
      blocked: true,
      decision: guard?.decision || 'blocked',
      reason: guard?.reason || result.error || 'Action blocked by AC360.',
      actionKey: guard?.actionKey,
      featureKey: guard?.featureKey,
      meterKey: guard?.meterKey,
      guardStage: guard?.guardStage,
      guardDecisionId: guard?.guardDecisionId,
      credits: guard?.credits,
      capacity: guard?.capacity,
      ui: buildAc360BlockedActionUx(guard),
    },
  }, { status })
  response.headers.set('Cache-Control', 'no-store')
  return response
}

export async function runAc360WiredAction<T>(
  wiringKey: Ac360WiringKey,
  executor: () => Promise<T>,
  options: Omit<Ac360GuardInput, 'actionKey'> & { metadata?: Record<string, unknown> } = {},
) {
  const wiring = getAc360StaticWiring(wiringKey)
  if (!wiring) {
    return { ok: false as const, error: `Unknown AC360 wiring key: ${wiringKey}`, guard: { ok: false, allowed: false, decision: 'unknown_wiring', reason: 'Unknown AC360 wiring key.' } as Ac360GuardResult }
  }

  const quantity = options.quantity || 1
  const policy = await resolveAc360PolicySafety({
    orgId: options.orgId,
    actionKey: wiring.actionKey,
    routePath: wiring.routePath,
    httpMethod: wiring.method,
    quantity,
    metadata: {
      ...(options.metadata || {}),
      wiringKey,
      targetModule: wiring.targetModule,
      quantityStrategy: wiring.quantityStrategy,
      enforcementMode: wiring.enforcementMode,
      phase: 'phase_1e_policy_enforcement_preflight',
    },
  })

  if (!policy.allowed) {
    const guard = ac360PolicyToGuardResult(policy, wiring.actionKey)
    return { ok: false as const, error: policy.reason, guard }
  }

  const guarded = await runAc360GuardedAction(
    {
      ...options,
      actionKey: wiring.actionKey,
      quantity,
      metadata: {
        ...(options.metadata || {}),
        wiringKey,
        routePath: wiring.routePath,
        routeMethod: wiring.method,
        targetModule: wiring.targetModule,
        quantityStrategy: wiring.quantityStrategy,
        enforcementMode: wiring.enforcementMode,
        phase: 'phase_1e_policy_locked_action_wiring',
        policyDecision: policy.decision,
      },
    },
    executor,
    { idempotencyPrefix: wiringKey },
  )

  if (!guarded.ok) {
    await recordAc360PolicyEvent({
      orgId: options.orgId,
      eventKey: 'policy.guard.blocked',
      actionKey: wiring.actionKey,
      routePath: wiring.routePath,
      httpMethod: wiring.method,
      severity: 'warning',
      message: guarded.error || guarded.guard.reason || 'AC360 wired guard blocked execution.',
      guardDecisionId: guarded.guard.guardDecisionId || null,
      metadata: { wiringKey, targetModule: wiring.targetModule, phase: 'phase_1e_policy_enforcement' },
    }).catch(() => null)
  }

  return guarded
}

export async function preflightAc360WiredAction(wiringKey: Ac360WiringKey, options: Omit<Ac360GuardInput, 'actionKey'> = {}) {
  const wiring = getAc360StaticWiring(wiringKey)
  if (!wiring) return { ok: false, allowed: false, decision: 'unknown_wiring', reason: `Unknown AC360 wiring key: ${wiringKey}` }
  const policy = await resolveAc360PolicySafety({
    orgId: options.orgId,
    actionKey: wiring.actionKey,
    routePath: wiring.routePath,
    httpMethod: wiring.method,
    quantity: options.quantity || 1,
    metadata: { ...(options.metadata || {}), wiringKey, phase: 'phase_1e_policy_preflight' },
  })
  if (!policy.allowed) return ac360PolicyToGuardResult(policy, wiring.actionKey)
  return guardAc360Action({ ...options, actionKey: wiring.actionKey }, { recordUsage: false })
}

export async function getAc360ActionWiringCenter(orgId?: string) {
  const context = await getAc360CurrentContext(orgId)
  const db = await createClient()
  const resolvedOrgId = context.context?.org?.id || orgId

  const [wiring, actions, decisions, rules] = await Promise.all([
    db.from('ac360_app_action_wiring').select('*, action:ac360_action_registry(*)').order('target_module', { ascending: true }).order('route_path', { ascending: true }),
    db.from('ac360_action_registry').select('*').in('action_key', AC360_REAL_APP_ACTION_WIRING.map((item) => item.actionKey)).order('action_key', { ascending: true }),
    resolvedOrgId
      ? db.from('ac360_guard_decisions').select('*').eq('org_id', resolvedOrgId).in('action_key', AC360_REAL_APP_ACTION_WIRING.map((item) => item.actionKey)).order('created_at', { ascending: false }).limit(80)
      : Promise.resolve({ data: [], error: null }),
    db.from('ac360_automation_rules').select('*').like('rule_key', 'phase1d.%').order('sort_order', { ascending: true }),
  ] as any)

  return {
    ...context,
    wiring: {
      static: AC360_REAL_APP_ACTION_WIRING,
      rows: wiring.data || [],
      actions: actions.data || [],
      decisions: decisions.data || [],
      rules: rules.data || [],
      errors: [wiring.error, actions.error, decisions.error, rules.error].filter(Boolean).map((error: any) => error.message || String(error)),
    },
  }
}

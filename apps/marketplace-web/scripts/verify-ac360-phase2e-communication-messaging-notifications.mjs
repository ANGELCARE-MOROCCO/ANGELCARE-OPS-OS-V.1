#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const mustExist = [
  'supabase/migrations/20260630_ac360_phase2e_communication_messaging_notifications.sql',
  'lib/ac360/school-communication.ts',
  'app/api/ac360/school-communication/dashboard/route.ts',
  'app/api/ac360/school-communication/templates/upsert/route.ts',
  'app/api/ac360/school-communication/templates/render/route.ts',
  'app/api/ac360/school-communication/campaigns/create/route.ts',
  'app/api/ac360/school-communication/campaigns/enqueue/route.ts',
  'app/api/ac360/school-communication/campaigns/dispatch/route.ts',
  'app/api/ac360/school-communication/delivery/record/route.ts',
  'app/api/ac360/school-communication/preferences/update/route.ts',
  'app/api/ac360/school-communication/threads/open/route.ts',
  'app/api/ac360/school-communication/threads/reply/route.ts',
  'app/api/ac360/school-communication/notifications/mark-read/route.ts',
  'app/api/ac360/school-communication/alerts/resolve/route.ts',
]

const missing = mustExist.filter((file) => !fs.existsSync(path.join(root, file)))
if (missing.length) {
  console.error('❌ Missing Phase 2E files:', missing)
  process.exit(1)
}

const sql = fs.readFileSync(path.join(root, mustExist[0]), 'utf8')
const requiredSql = [
  'ac360_school_message_templates',
  'ac360_school_message_template_versions',
  'ac360_school_audience_segments',
  'ac360_school_notification_preferences',
  'ac360_school_message_campaigns',
  'ac360_school_message_recipients',
  'ac360_school_delivery_jobs',
  'ac360_school_delivery_events',
  'ac360_school_parent_notifications',
  'ac360_school_communication_threads',
  'ac360_school_thread_messages',
  'ac360_school_communication_alerts',
  'ac360_school_communication_dashboard',
  'ac360_school_upsert_message_template',
  'ac360_school_render_message_template',
  'ac360_school_create_message_campaign',
  'ac360_school_enqueue_campaign_recipients',
  'ac360_school_dispatch_campaign_batch',
  'ac360_school_record_delivery_event',
  'ac360_school_update_notification_preference',
  'ac360_school_open_communication_thread',
  'ac360_school_post_thread_message',
  'ac360_school_mark_parent_notification_read',
  'ac360_school_resolve_communication_alert',
  'ac360_school_ops_modules',
  'ac360_automation_rules',
]
const missingSql = requiredSql.filter((token) => !sql.includes(token))
if (missingSql.length) {
  console.error('❌ SQL missing required tokens:', missingSql)
  process.exit(1)
}

const actions = [
  'school.communication.template.upsert',
  'school.communication.template.render',
  'school.communication.campaign.create',
  'school.communication.campaign.enqueue',
  'school.communication.email.dispatch',
  'school.communication.whatsapp.dispatch',
  'school.communication.sms.dispatch',
  'school.communication.push.dispatch',
  'school.communication.delivery.record',
  'school.communication.preference.update',
  'school.communication.thread.open',
  'school.communication.thread.reply',
  'school.communication.notification.mark_read',
  'school.communication.alert.resolve',
]
const missingActions = actions.filter((action) => !sql.includes(action))
if (missingActions.length) {
  console.error('❌ Missing guarded actions:', missingActions)
  process.exit(1)
}

const wiring = fs.readFileSync(path.join(root, 'lib/ac360/action-wiring.ts'), 'utf8')
for (const key of [
  'ac360.school_communication.template.upsert',
  'ac360.school_communication.campaign.enqueue',
  'ac360.school_communication.whatsapp.dispatch',
  'ac360.school_communication.alert.resolve',
]) {
  if (!wiring.includes(key)) {
    console.error('❌ Missing action wiring key:', key)
    process.exit(1)
  }
}

const forbiddenUi = [
  'app/(protected)/angelcare-360/school-communication/page.tsx',
  'app/(protected)/angelcare-360/communication/page.tsx',
]
const uiLeaks = forbiddenUi.filter((file) => fs.existsSync(path.join(root, file)))
if (uiLeaks.length) {
  console.error('❌ UI build is locked; unexpected UI files found:', uiLeaks)
  process.exit(1)
}

console.log('✅ AC360 Phase 2E communication, messaging, templates & parent notification runtime verification passed.')
console.log('✅ UI build remains locked: no school-communication page.tsx created.')

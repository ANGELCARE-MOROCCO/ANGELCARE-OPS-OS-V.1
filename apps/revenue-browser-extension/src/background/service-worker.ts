import { exchangePairing, getBootstrap, executeB2BCommand, hydrateB2BWorkspace, hydrateB2BPartnerWorkspace, hydrateB2BManagementWorkspace, quickScanActiveContext, deepScanActiveContext, searchB2BAccounts, recordScannerDecision } from '../api.js'
import { getInstallationId, getSession, setSession } from '../storage.js'
import type { BootstrapPayload } from '../types.js'
import { flushProductionTelemetry, getProductionStatus, isProductionBlocked, measure, recordAdapterHealth, recordHealth } from '../production/runtime-health.js'

let bootstrapCache: BootstrapPayload | null = null

async function bootstrap() {
  return measure('service_worker_wake', async () => {
    const blocked = await isProductionBlocked('extension')
    if (blocked) throw new Error(`PRODUCTION_KILL_SWITCH:${blocked.switch_key}`)
    const data = await getBootstrap()
    bootstrapCache = data
    return data
  }, { component: 'service_worker' })
}

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
  if (!tab?.id) throw new Error('NO_ACTIVE_TAB')
  if (!tab.url) throw new Error('ACTIVE_TAB_URL_UNAVAILABLE')
  return tab
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function resolveAdapter(url: URL) {
  if ((/(^|\.)google\.[^/]+$/.test(url.hostname) && url.pathname.startsWith('/maps')) || url.hostname === 'maps.google.com') return { key: 'google_maps', file: 'content/google-maps.js' }
  if (url.hostname === 'mail.google.com') return { key: 'gmail', file: 'content/gmail.js' }
  if (url.hostname === 'web.whatsapp.com') return { key: 'whatsapp_web', file: 'content/whatsapp-web.js' }
  if (url.hostname === 'calendar.google.com') return { key: 'google_calendar', file: 'content/google-calendar.js' }
  return { key: 'generic_web', file: 'content/generic-web.js' }
}

async function requestContextFromTab(tabId: number) {
  let lastError: unknown = null
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await chrome.tabs.sendMessage(tabId, { type: 'ANGELCARE_EXTRACT_CONTEXT' })
    } catch (error) {
      lastError = error
      if (attempt < 2) await wait(140)
    }
  }
  const detail = lastError instanceof Error ? lastError.message : String(lastError || 'NO_RECEIVER')
  throw new Error(`CONTEXT_ADAPTER_UNAVAILABLE: ${detail}`)
}

async function captureActiveContext() {
  const currentBootstrap = bootstrapCache || (await bootstrap())
  const tab = await activeTab()
  const url = new URL(tab.url)
  const adapter = resolveAdapter(url)
  if (!currentBootstrap.adapters.includes(adapter.key)) throw new Error('ADAPTER_NOT_ASSIGNED')
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('UNSUPPORTED_PAGE_PROTOCOL')
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: [adapter.file] })
  } catch (error: any) {
    throw new Error(`PAGE_ACCESS_REQUIRED: ${error?.message || error}`)
  }
  try {
    const response = await requestContextFromTab(tab.id)
    if (!response?.ok) throw new Error(response?.error || 'CONTEXT_EXTRACTION_FAILED')
    await recordAdapterHealth({ adapterKey: adapter.key, selectorVersion: 'mega7-v1', status: 'healthy', success: true, metadata: { pageType: response.context?.pageType || null } })
    return response.context
  } catch (error) {
    await recordAdapterHealth({ adapterKey: adapter.key, selectorVersion: 'mega7-v1', status: navigator.onLine === false ? 'offline' : 'degraded', success: false, errorCode: error instanceof Error ? error.message.split(':')[0] : 'ADAPTER_FAILURE', errorMessage: error instanceof Error ? error.message : String(error) })
    throw error
  }
}

chrome.runtime.onInstalled.addListener(() => {
  recordHealth({ component: 'extension_runtime', status: 'healthy', eventType: 'installed_or_updated', metadata: { version: chrome.runtime.getManifest().version } }).catch(() => undefined)
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => undefined)
  chrome.contextMenus.create({ id: 'angelcare-open-command', title: 'Open ANGELCARE Revenue Command', contexts: ['page', 'selection'] })
})

chrome.runtime.onStartup.addListener(() => {
  recordHealth({ component: 'service_worker', status: navigator.onLine === false ? 'offline' : 'healthy', eventType: 'browser_startup', metadata: { version: chrome.runtime.getManifest().version } }).catch(() => undefined)
  getProductionStatus(true).catch(() => undefined)
  flushProductionTelemetry().catch(() => undefined)
})

chrome.contextMenus.onClicked.addListener((_info: unknown, tab: any) => {
  if (tab?.windowId) chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => undefined)
})

chrome.runtime.onMessageExternal.addListener((message: any, _sender: any, sendResponse: (value: unknown) => void) => {
  if (message?.type !== 'ANGELCARE_PAIRING_CODE') return false
  ;(async () => {
    try {
      const installationId = await getInstallationId()
      const manifest = chrome.runtime.getManifest()
      await exchangePairing(message.apiBase, message.pairingCode, {
        installationId,
        extensionId: chrome.runtime.id,
        extensionVersion: manifest.version,
        deviceName: message.deviceName || 'Chrome device',
        platform: navigator.platform,
        browserVersion: navigator.userAgent,
        publicKey: message.publicKey || null,
      })
      const data = await bootstrap()
      sendResponse({ ok: true, accessVersion: data.accessVersion })
      chrome.runtime.sendMessage({ type: 'ANGELCARE_BOOTSTRAP_UPDATED', bootstrap: data }).catch(() => undefined)
    } catch (error) {
      sendResponse({ ok: false, error: error instanceof Error ? error.message : 'PAIRING_FAILED' })
    }
  })()
  return true
})

chrome.runtime.onMessage.addListener((message: any, _sender: any, sendResponse: (value: unknown) => void) => {
  if (message?.type === 'GET_BOOTSTRAP') {
    bootstrap().then((data) => sendResponse({ ok: true, data })).catch((error: any) => sendResponse({ ok: false, error: error.message }))
    return true
  }
  if (message?.type === 'GET_INSTALLATION_ID') {
    getInstallationId().then((id) => sendResponse({ ok: true, id }))
    return true
  }
  if (message?.type === 'LOGOUT_EXTENSION') {
    bootstrapCache = null
    setSession(null).then(() => sendResponse({ ok: true }))
    return true
  }
  if (message?.type === 'GET_SESSION_STATUS') {
    getSession().then((session) => sendResponse({ ok: true, connected: Boolean(session), session }))
    return true
  }
  if (message?.type === 'CAPTURE_ACTIVE_CONTEXT') {
    captureActiveContext().then((context) => sendResponse({ ok: true, context })).catch((error) => sendResponse({ ok: false, error: error.message }))
    return true
  }
  if (message?.type === 'EXECUTE_B2B_COMMAND') {
    executeB2BCommand(message.input).then((data) => sendResponse({ ok: true, data })).catch((error: any) => sendResponse({ ok: false, error: error.message, details: error.details || null }))
    return true
  }
  if (message?.type === 'SCANNER_QUICK_SCAN') {
    quickScanActiveContext(message.context).then((data) => sendResponse({ ok: true, data: data.scan })).catch((error: any) => sendResponse({ ok: false, error: error.message, details: error.details || null }))
    return true
  }
  if (message?.type === 'SCANNER_DEEP_SCAN') {
    deepScanActiveContext(message.context, message.mode === 'strategic' ? 'strategic' : 'deep').then((data) => sendResponse({ ok: true, data: data.scan })).catch((error: any) => sendResponse({ ok: false, error: error.message, details: error.details || null }))
    return true
  }
  if (message?.type === 'SCANNER_ACCOUNT_SEARCH') {
    searchB2BAccounts(message.input || {}).then((data) => sendResponse({ ok: true, data: data.accounts })).catch((error: any) => sendResponse({ ok: false, error: error.message, details: error.details || null }))
    return true
  }
  if (message?.type === 'SCANNER_RECORD_DECISION') {
    recordScannerDecision(message.input).then((data) => sendResponse({ ok: true, data: data.decision })).catch((error: any) => sendResponse({ ok: false, error: error.message, details: error.details || null }))
    return true
  }
  if (message?.type === 'HYDRATE_B2B_WORKSPACE') {
    hydrateB2BWorkspace(message.prospectId, message.opportunityId || null)
      .then((data) => sendResponse({ ok: true, data: data.workspace }))
      .catch((error: any) => sendResponse({ ok: false, error: error.message, details: error.details || null }))
    return true
  }
  if (message?.type === 'HYDRATE_B2B_PARTNER_WORKSPACE') {
    hydrateB2BPartnerWorkspace({ partnerId: message.partnerId || null, prospectId: message.prospectId || null, activeIds: message.activeIds || {} })
      .then((data) => sendResponse({ ok: true, data: data.workspace }))
      .catch((error: any) => sendResponse({ ok: false, error: error.message, details: error.details || null }))
    return true
  }
  if (message?.type === 'HYDRATE_B2B_MANAGEMENT_WORKSPACE') {
    hydrateB2BManagementWorkspace({ activeIds: message.activeIds || {} })
      .then((data) => sendResponse({ ok: true, data: data.data }))
      .catch((error: any) => sendResponse({ ok: false, error: error.message, details: error.details || null }))
    return true
  }
  if (message?.type === 'OPEN_B2B_FOCUS_MODE') {
    chrome.tabs.create({ url: chrome.runtime.getURL('focus.html') })
      .then((tab: any) => sendResponse({ ok: true, tabId: tab.id || null }))
      .catch((error: any) => sendResponse({ ok: false, error: error.message }))
    return true
  }
  if (message?.type === 'OPEN_SAAS_ROUTE') {
    ;(async () => {
      const session = await getSession()
      if (!session) throw new Error('EXTENSION_NOT_PAIRED')
      await chrome.tabs.create({ url: `${session.apiBase}${message.route}` })
      sendResponse({ ok: true })
    })().catch((error) => sendResponse({ ok: false, error: error.message }))
    return true
  }
  return false
})

chrome.alarms.create('angelcare-capability-refresh', { periodInMinutes: 1 })
chrome.alarms.create('angelcare-workspace-refresh', { periodInMinutes: 1 })
chrome.alarms.create('angelcare-production-health', { periodInMinutes: 5 })
chrome.alarms.create('angelcare-production-status', { periodInMinutes: 1 })
chrome.alarms.onAlarm.addListener((alarm: any) => {
  if (alarm.name === 'angelcare-capability-refresh') bootstrap().then((data) => chrome.runtime.sendMessage({ type: 'ANGELCARE_BOOTSTRAP_UPDATED', bootstrap: data })).catch(() => undefined)
  if (alarm.name === 'angelcare-workspace-refresh') chrome.runtime.sendMessage({ type: 'ANGELCARE_WORKSPACE_INVALIDATE', reason: 'scheduled_refresh' }).catch(() => undefined)
  if (alarm.name === 'angelcare-production-health') {
    recordHealth({ component: 'service_worker', status: navigator.onLine === false ? 'offline' : 'healthy', eventType: 'scheduled_health', metrics: { online: navigator.onLine !== false } }).then(() => flushProductionTelemetry()).catch(() => undefined)
  }
  if (alarm.name === 'angelcare-production-status') getProductionStatus(true).then((status) => {
    if (status?.killSwitches?.length) chrome.runtime.sendMessage({ type: 'ANGELCARE_PRODUCTION_BLOCK', status }).catch(() => undefined)
  }).catch(() => undefined)
})

import type { BootstrapPayload, BootstrapModule } from '../types.js'
import { getInstallationId } from '../storage.js'
import { loadAssignedModule } from '../modules/registry.js'

const root = document.getElementById('app')!
let contract: { capabilityCount: number } = { capabilityCount: 45 }
let currentRuntime: { unmount?(): void } | null = null

function escapeHtml(value: unknown) {
  return String(value ?? '').replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c] || c))
}

async function message<T>(payload: unknown): Promise<T> {
  return chrome.runtime.sendMessage(payload)
}

async function renderDisconnected(error?: string) {
  const installationId = await getInstallationId()
  const config = await fetch(chrome.runtime.getURL('runtime-config.json')).then((response) => response.json())
  const connectUrl = `${config.apiBase}/browser-extension/connect?extensionId=${encodeURIComponent(chrome.runtime.id)}&installationId=${encodeURIComponent(installationId)}`

  root.innerHTML = `<main class="shell disconnected-shell">
    <header class="global-header disconnected-header">
      <div class="global-brand"><img src="icons/icon-48.png"><div><strong>ANGELCARE</strong><span>Revenue Command Browser OS</span></div></div>
      <span class="global-security-pill">PRIVATE</span>
    </header>
    <section class="connection-stage">
      <article class="connection-card">
        <div class="connection-orbit"><span>AC</span><i></i></div>
        <div class="eyebrow">SECURE DEVICE PAIRING</div>
        <h1>Connect this Chrome device</h1>
        <p>The Browser OS will load only the modules, data scopes and governed actions assigned to your AngelCare user.</p>
        ${error ? `<div class="error"><strong>Connection unavailable</strong><span>${escapeHtml(error)}</span></div>` : ''}
        <a class="primary" href="${connectUrl}" target="_blank">Connect to ANGELCARE</a>
        <div class="installation"><span>Installation ID</span><code>${installationId}</code></div>
        <div class="connection-assurance"><span>Device-bound session</span><span>Server permissions</span><span>Complete audit</span></div>
      </article>
    </section>
    <footer>${contract.capabilityCount} approved B2B contracts · no access before administrator assignment</footer>
  </main>`
}

async function renderConnected(bootstrap: BootstrapPayload) {
  const enabled = bootstrap.modules.filter((module) => module.enabled)
  const initials = bootstrap.user.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  const moduleDock = enabled.length > 1
    ? `<nav id="modules" class="module-tabs module-dock">${enabled.map((module, index) => `<button data-key="${module.key}" class="${index === 0 ? 'active' : ''}">${escapeHtml(module.label)}</button>`).join('')}</nav>`
    : ''

  root.innerHTML = `<main class="shell connected-shell">
    <header class="global-header">
      <div class="global-brand"><img src="icons/icon-48.png"><div><strong>ANGELCARE</strong><span>Revenue Command</span></div></div>
      <div class="global-user">
        <span class="global-avatar">${escapeHtml(initials)}</span>
        <div><strong>${escapeHtml(bootstrap.user.name)}</strong><span>${escapeHtml(bootstrap.user.role || 'Assigned operator')} · Access v${bootstrap.accessVersion}</span></div>
      </div>
      <button id="logout" class="global-icon-button" title="Disconnect">⏻</button>
    </header>
    ${moduleDock}
    <section id="module-root" class="module-root enterprise-module-root"></section>
    <footer class="runtime-footer"><span>${enabled.length} module${enabled.length === 1 ? '' : 's'}</span><span>${bootstrap.capabilities.length} capabilities</span><span>${bootstrap.adapters.length} adapters</span></footer>
  </main>`

  document.getElementById('logout')?.addEventListener('click', async () => {
    currentRuntime?.unmount?.()
    await message({ type: 'LOGOUT_EXTENSION' })
    renderDisconnected()
  })

  const mount = async (module: BootstrapModule) => {
    currentRuntime?.unmount?.()
    const container = document.getElementById('module-root')!
    container.innerHTML = '<section class="module-loading"><i></i><strong>Loading assigned workspace</strong><span>Resolving capabilities, scopes and active context…</span></section>'
    const runtime = await loadAssignedModule(module.key)
    currentRuntime = runtime
    runtime.mount(container, module)
    document.querySelectorAll('#modules button').forEach((button) => button.classList.toggle('active', (button as HTMLElement).dataset.key === module.key))
  }

  document.querySelectorAll('#modules button').forEach((button) => button.addEventListener('click', () => {
    const found = enabled.find((module) => module.key === (button as HTMLElement).dataset.key)
    if (found) void mount(found)
  }))

  if (enabled[0]) await mount(enabled[0])
  else document.getElementById('module-root')!.innerHTML = '<section class="empty"><h2>No module assigned</h2><p>An administrator must grant extension module access from the AngelCare user profile.</p></section>'
}

async function boot() {
  contract = await fetch(chrome.runtime.getURL('generated/b2b-capabilities.v1.json')).then((response) => response.json()).catch(() => ({ capabilityCount: 45 }))
  const result: any = await message({ type: 'GET_BOOTSTRAP' }).catch((error) => ({ ok: false, error: error.message }))
  if (!result?.ok) return renderDisconnected(result?.error && result.error !== 'EXTENSION_NOT_PAIRED' ? result.error : undefined)
  await renderConnected(result.data)
}

chrome.runtime.onMessage.addListener((incoming: any) => {
  if (incoming?.type === 'ANGELCARE_BOOTSTRAP_UPDATED') void renderConnected(incoming.bootstrap)
})

void boot()

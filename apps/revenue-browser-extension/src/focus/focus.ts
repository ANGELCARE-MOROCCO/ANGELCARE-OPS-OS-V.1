import type { BootstrapPayload } from '../types.js'
import { loadAssignedModule } from '../modules/registry.js'

const root = document.getElementById('app')!
async function message<T>(payload: unknown): Promise<T> { return chrome.runtime.sendMessage(payload) }
function esc(value: unknown) { return String(value ?? '').replace(/[&<>\"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c] || c)) }

async function boot() {
  const result: any = await message({ type: 'GET_BOOTSTRAP' }).catch((error) => ({ ok: false, error: error.message }))
  if (!result?.ok) {
    root.innerHTML = `<main class="focus-shell"><section class="focus-error"><h1>Connexion ANGELCARE requise</h1><p>${esc(result?.error || 'EXTENSION_NOT_PAIRED')}</p></section></main>`
    return
  }
  const bootstrap = result.data as BootstrapPayload
  const module = bootstrap.modules.find((row) => row.key === 'revenue_b2b' && row.enabled)
  if (!module) {
    root.innerHTML = '<main class="focus-shell"><section class="focus-error"><h1>Revenue B2B non assigné</h1><p>Attribuez ce module depuis le profil utilisateur.</p></section></main>'
    return
  }
  root.innerHTML = `<main class="focus-shell"><header class="focus-topbar"><div><span>ANGELCARE</span><strong>Revenue Command · Focus Mode</strong></div><div><span>${esc(bootstrap.user.name)}</span><button id="close-focus">Fermer</button></div></header><section id="focus-root" class="focus-root"></section></main>`
  document.getElementById('close-focus')?.addEventListener('click', () => window.close())
  const runtime = await loadAssignedModule('revenue_b2b')
  runtime.mount(document.getElementById('focus-root')!, module)
}

boot()

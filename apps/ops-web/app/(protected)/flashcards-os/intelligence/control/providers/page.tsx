import AiProviderControlCentre from '@/components/flashcards-os/intelligence/AiProviderControlCentre'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadIntelligenceOverview } from '@/lib/flashcards-os/intelligence/server/repository'
import { intelligenceEnvironment, providerConfigurationStatus } from '@/lib/flashcards-os/intelligence/config'

export default async function AiProviderControlPage() {
  await requireFlashcardsPageAccess('flashcards_os.manage_model_profiles')
  const data = await loadIntelligenceOverview()
  const env = intelligenceEnvironment()
  const status = providerConfigurationStatus()
  return <AiProviderControlCentre
    profiles={data.modelProfiles}
    health={data.providerHealth}
    usage={data.usage}
    runs={data.runs}
    configuration={{
      freeOnly: true,
      tavilyConfigured: status.tavilyConfigured,
      tavilyProjectConfigured: status.tavilyProjectConfigured,
      tavilyBaseUrl: env.tavily.baseUrl,
      tavilyTimeoutMs: env.tavily.timeoutMs,
      tavilyMaxResults: env.tavily.defaultMaxResults,
      openrouterConfigured: status.openrouterConfigured,
      openrouterRoute: status.openrouterRoute,
      openrouterBaseUrl: env.openrouter.baseUrl,
      openrouterTimeoutMs: env.openrouter.timeoutMs,
      workerConfigured: status.workerConfigured,
    }}
  />
}

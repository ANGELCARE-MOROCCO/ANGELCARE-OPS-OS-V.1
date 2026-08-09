import { PlaceholderWorkspace } from '@/angelcare-marketplace/localization-intelligence/components/PlaceholderWorkspace'

export default function Page() {
  return (
    <PlaceholderWorkspace
      eyebrow="TRANSLATION MEMORY"
      title="Mémoire approuvée et contexte métier"
      description="Proposer les traductions déjà validées sans publication automatique."
      items={[
        'Correspondances similaires',
        'Contexte et territoire',
        'Qualité approuvée',
        'Feedback reviewer',
      ]}
    />
  )
}

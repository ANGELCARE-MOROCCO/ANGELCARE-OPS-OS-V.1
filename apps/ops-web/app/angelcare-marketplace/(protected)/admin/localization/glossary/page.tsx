import { PlaceholderWorkspace } from '@/angelcare-marketplace/localization-intelligence/components/PlaceholderWorkspace'

export default function Page() {
  return (
    <PlaceholderWorkspace
      eyebrow="GLOSSARY GOVERNANCE"
      title="Terminologie ANGELCARE sous contrôle"
      description="Protéger les noms produits, les variantes approuvées et les usages interdits."
      items={[
        'Termes verrouillés',
        'Variantes EN',
        'Variantes AR',
        'Conflits détectés',
      ]}
    />
  )
}

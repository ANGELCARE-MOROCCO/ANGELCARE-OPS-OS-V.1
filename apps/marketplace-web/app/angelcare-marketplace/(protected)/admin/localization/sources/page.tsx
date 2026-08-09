import { PlaceholderWorkspace } from '@/angelcare-marketplace/localization-intelligence/components/PlaceholderWorkspace'

export default function Page() {
  return (
    <PlaceholderWorkspace
      eyebrow="SCANNER SOURCE REGISTRY"
      title="Sources autorisées et protégées"
      description="Enregistrer les sources de scan sans exposer les secrets, données privées ou champs non autorisés."
      items={[
        'Code source',
        'Tables enregistrées',
        'Templates',
        'Routes runtime',
      ]}
    />
  )
}

import { PlaceholderWorkspace } from '@/angelcare-marketplace/localization-intelligence/components/PlaceholderWorkspace'

export default function Page() {
  return (
    <PlaceholderWorkspace
      eyebrow="SEO LOCALIZATION CENTER"
      title="SEO par locale, route et territoire"
      description="Gérer les titres, descriptions, slugs, canonicals, alternates et états de publication."
      items={[
        'Métadonnées FR',
        'Métadonnées EN',
        'Métadonnées AR',
        'Hreflang et canonical',
      ]}
    />
  )
}

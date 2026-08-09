import { revalidatePath, revalidateTag } from 'next/cache'

const localePaths = (locale: string) => [
  `/angelcare-marketplace/${locale}`,
  `/angelcare-marketplace/${locale}/marketplace`,
]

export function affectedCommercePaths(input: {
  objectType: string
  locale?: string | null
  slug?: string | null
  categorySlug?: string | null
}): string[] {
  const locales = input.locale ? [input.locale] : ['fr', 'en', 'ar']
  const paths = new Set<string>()

  for (const currentLocale of locales) {
    for (const path of localePaths(currentLocale)) paths.add(path)
    if (input.slug) paths.add(`/angelcare-marketplace/${currentLocale}/marketplace/${input.slug}`)
    if (input.categorySlug) paths.add(`/angelcare-marketplace/${currentLocale}/marketplace/category/${input.categorySlug}`)
  }

  if (input.objectType.includes('navigation')) {
    for (const currentLocale of locales) paths.add(`/angelcare-marketplace/${currentLocale}`)
  }

  return [...paths]
}

export function refreshCommerceSurfaces(paths: string[]): void {
  for (const path of paths) revalidatePath(path)
  revalidateTag('angelcare-marketplace-homepage', 'max')
  revalidateTag('angelcare-marketplace-catalog', 'max')
  revalidateTag('angelcare-marketplace-navigation', 'max')
}

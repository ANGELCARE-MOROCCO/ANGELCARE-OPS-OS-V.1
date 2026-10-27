import type { Metadata } from 'next'

/** Fixed AngelCare Marketplace icons, independent of published CMS icon settings. */
export function marketplaceIcons(): Metadata['icons'] {
  const base = '/brand/marketplace-favicon-r2'
  return {
    icon: [
      { url: `${base}/angelcare-favicon.ico`, type: 'image/x-icon' },
      ...[16, 32, 48].map((size) => ({
        url: `${base}/angelcare-favicon-${size}.png`,
        sizes: `${size}x${size}`,
        type: 'image/png',
      })),
    ],
    shortcut: [{ url: `${base}/angelcare-favicon-32.png`, type: 'image/png' }],
    apple: [{ url: `${base}/angelcare-icon-180.png`, sizes: '180x180', type: 'image/png' }],
  }
}

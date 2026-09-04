import type { MetadataRoute } from 'next'
import { buildSitemap } from '@/angelcare-marketplace/web-presence/runtime'
export const revalidate=3600
export default function sitemap():Promise<MetadataRoute.Sitemap>{return buildSitemap()}

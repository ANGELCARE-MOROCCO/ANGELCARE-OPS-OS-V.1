import type { MetadataRoute } from 'next'
import { buildRobots } from '@/angelcare-marketplace/web-presence/runtime'
import { appendJobkixSitemap } from '@/angelcare-marketplace/jobkix/sitemap'
export const revalidate=3600
export default async function robots():Promise<MetadataRoute.Robots>{return appendJobkixSitemap(await buildRobots())}

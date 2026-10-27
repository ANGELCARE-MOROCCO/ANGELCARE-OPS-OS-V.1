import type { MetadataRoute } from 'next'
import { buildRobots } from '@/angelcare-marketplace/web-presence/runtime'
import { appendJobkixSitemap } from '@/angelcare-marketplace/jobkix/sitemap'
export const revalidate=3600
export default async function robots():Promise<MetadataRoute.Robots>{const value=await appendJobkixSitemap(await buildRobots());const entries=Array.isArray(value.sitemap)?value.sitemap:value.sitemap?[value.sitemap]:[];const origins=[...new Set(entries.flatMap(v=>{try{return[new URL(v).origin]}catch{return[]}}))];return {...value,sitemap:[...entries,...origins.map(origin=>origin+'/seo-power-sitemap.xml')]}}

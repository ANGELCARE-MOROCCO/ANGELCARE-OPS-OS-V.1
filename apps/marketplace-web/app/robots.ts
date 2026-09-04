import type { MetadataRoute } from 'next'
import { buildRobots } from '@/angelcare-marketplace/web-presence/runtime'
export const revalidate=3600
export default function robots():Promise<MetadataRoute.Robots>{return buildRobots()}

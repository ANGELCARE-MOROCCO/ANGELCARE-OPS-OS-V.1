import type { MetadataRoute } from 'next'
import { buildManifest } from '@/angelcare-marketplace/web-presence/runtime'
export default function manifest():Promise<MetadataRoute.Manifest>{return buildManifest()}

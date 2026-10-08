'use client'
import {CollectionStudio} from '@/angelcare-marketplace/commerce-studio/components/CollectionStudio'
import type {CommerceProductAtelierSnapshot} from '../types'
export function CollectionsCommandWorkspace({snapshot}:{snapshot:CommerceProductAtelierSnapshot}){return <CollectionStudio initialCollections={snapshot.collections} items={snapshot.catalogItems} media={snapshot.media} canManage canViewHistory/>}

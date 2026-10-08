'use client'
import {CategoryStudio} from '@/angelcare-marketplace/commerce-studio/components/CategoryStudio'
import type {CommerceProductAtelierSnapshot} from '../types'
export function CategoryArchitectureWorkspace({snapshot}:{snapshot:CommerceProductAtelierSnapshot}){return <CategoryStudio initialCategories={snapshot.categories} items={snapshot.catalogItems} media={snapshot.media} canManage canExport canViewHistory/>}

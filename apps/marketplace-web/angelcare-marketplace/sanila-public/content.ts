import { SANILA_PAGE_BLUEPRINT_MAP, SANILA_PAGE_BLUEPRINTS } from './pageBlueprints'
import type { CustomerAccess, SanilaPageBlueprint, SanilaPublicPage } from './types'

export const SANILA_PUBLIC_ROOT = '/angelcare-marketplace/fr/sanila'

export const SANILA_PUBLIC_PAGES: SanilaPublicPage[] = SANILA_PAGE_BLUEPRINTS

export const PRIMARY_NAVIGATION = [
  { label: 'Produit', href: `${SANILA_PUBLIC_ROOT}/produit` },
  { label: 'Fonctionnalités', href: `${SANILA_PUBLIC_ROOT}/fonctionnalites` },
  { label: 'Solutions', href: `${SANILA_PUBLIC_ROOT}/solutions` },
  { label: 'Finance', href: `${SANILA_PUBLIC_ROOT}/finance` },
  { label: 'Sécurité', href: `${SANILA_PUBLIC_ROOT}/securite` },
  { label: 'Ressources', href: `${SANILA_PUBLIC_ROOT}/ressources` },
]

export const PRODUCT_DOMAINS = SANILA_PAGE_BLUEPRINTS.filter((page) => page.kind === 'domain')

export const CUSTOMER_ACCESS: CustomerAccess[] = [
  {
    key: 'establishment',
    title: 'Établissement',
    description: 'Accès principal de l’administration et des responsables autorisés de l’établissement.',
    href: '/angelcare-360-access/login',
    image: '/sanila/gateway/sanila-gateway-admin.webp',
  },
  {
    key: 'portal',
    title: 'Portail établissement',
    description: 'Accès au portail SANILA destiné aux utilisateurs disposant de cette autorité.',
    href: '/angelcare-360-portal/login',
    image: '/sanila/gateway/sanila-gateway-admin.webp',
  },
  {
    key: 'teacher',
    title: 'Enseignant',
    description: 'Espace enseignant pour le travail pédagogique selon les droits accordés.',
    href: '/angelcare-360-teacher/login',
    image: '/sanila/teacher-login/sanila-teacher-morocco-approved.webp',
  },
  {
    key: 'staff',
    title: 'Personnel',
    description: 'Espace opérationnel du personnel selon les responsabilités définies par l’établissement.',
    href: '/angelcare-360-staff/login',
    image: '/sanila/staff-login/sanila-staff-morocco-approved.webp',
  },
  {
    key: 'parent',
    title: 'Parent',
    description: 'Expérience famille permettant d’accéder aux informations autorisées par l’établissement.',
    href: '/angelcare-360-parent/login',
    image: '/sanila/parent-login/sanila-parent-morocco-approved.webp',
  },
  {
    key: 'student',
    title: 'Élève',
    description: 'Espace élève contrôlé selon l’âge, la politique de l’établissement et les droits disponibles.',
    href: '/angelcare-360-student/login',
    image: '/sanila/student-login/sanila-student-morocco-approved.webp',
  },
]

export function resolveSanilaPublicSlug(routeSlug: string): string | null {
  const normalized = routeSlug.replace(/^\/+|\/+$/g, '')
  if (normalized === 'sanila') return 'accueil'
  if (!normalized.startsWith('sanila/')) return null
  const child = normalized.slice('sanila/'.length)
  return SANILA_PAGE_BLUEPRINT_MAP.has(child) ? child : null
}

export function isSanilaPublicRoute(routeSlug: string): boolean {
  return resolveSanilaPublicSlug(routeSlug) !== null
}

export function getSanilaPublicPage(slug: string): SanilaPageBlueprint | null {
  const normalized = slug === 'sanila' ? 'accueil' : slug.replace(/^sanila\//, '')
  return SANILA_PAGE_BLUEPRINT_MAP.get(normalized) || null
}

export function sanilaHref(slug: string): string {
  return slug === 'accueil' ? SANILA_PUBLIC_ROOT : `${SANILA_PUBLIC_ROOT}/${slug}`
}

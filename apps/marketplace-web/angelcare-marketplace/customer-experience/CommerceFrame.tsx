import type {ReactNode} from 'react'
import {GlobalPublicShell} from '../public-universe/components/GlobalPublicShell'
export function CommerceFrame({children,locale}:{children:ReactNode;locale:'fr'|'en'|'ar'}) { return <GlobalPublicShell locale={locale} navigation={[]} variant="marketplace" contentElement="div">{children}</GlobalPublicShell> }

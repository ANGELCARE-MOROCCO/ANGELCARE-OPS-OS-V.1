import { headers } from 'next/headers'
import { resolvePublicFooter } from '../repository'
import type { FooterLocale } from '../types'
import { FooterExperience } from './FooterExperience'

export async function EnterpriseFooter({locale,marketplace=true}:{locale:FooterLocale;marketplace?:boolean}){
  const headerStore=await headers()
  const pathname=headerStore.get('x-pathname')||headerStore.get('next-url')||headerStore.get('x-invoke-path')||`/angelcare-marketplace/${locale}`
  const previewProfileId=headerStore.get('x-angelcare-footer-preview')||undefined
  const experience=await resolvePublicFooter(locale,{pathname,previewProfileId})
  return <FooterExperience experience={experience} marketplace={marketplace}/>
}

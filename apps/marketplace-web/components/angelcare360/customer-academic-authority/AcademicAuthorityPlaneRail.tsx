'use client'
import CustomerPlaneNavigation from '@/components/angelcare360/customer-experience/CustomerPlaneNavigation'
import type { CustomerPlaneDefinition } from '@/types/angelcare360/customer-experience'
export default function AcademicAuthorityPlaneRail({planes,activeKey}:{planes:CustomerPlaneDefinition[];activeKey:string}){
  return <CustomerPlaneNavigation planes={planes} activeKey={activeKey}/>
}

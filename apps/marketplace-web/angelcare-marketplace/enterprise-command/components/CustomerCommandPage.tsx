'use client'
import { CustomerMegaDossierOverlay, type CustomerDossierTab } from './CustomerMegaDossier'
import type { CustomerMegaDossier } from '../types'
import type { CustomerDossierPermissions } from '../customer-permissions'

export function CustomerCommandPage({customerId,initialTab='360',initialData,permissions}:{customerId:string;initialTab?:CustomerDossierTab;initialData?:CustomerMegaDossier;permissions:CustomerDossierPermissions}){
  return <CustomerMegaDossierOverlay customerId={customerId} initialTab={initialTab} initialData={initialData} permissions={permissions} embedded />
}

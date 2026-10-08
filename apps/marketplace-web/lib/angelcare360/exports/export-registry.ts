import type { Angelcare360ExportDefinition } from '@/types/angelcare360/exports'

const exportDefinitions: Angelcare360ExportDefinition[] = [
  { exportKey:'operator-clients-csv',title:'Clients opérateur',scope:'operator',kind:'clients',format:'csv',supportedFormats:['csv','xlsx','json'],lockedReason:null,csvAvailable:true,xlsxAvailable:true,pdfAvailable:false },
  { exportKey:'operator-invoices-csv',title:'Factures opérateur',scope:'operator',kind:'invoices',format:'csv',supportedFormats:['csv','xlsx','json','pdf_a4'],lockedReason:null,csvAvailable:true,xlsxAvailable:true,pdfAvailable:true },
  { exportKey:'operator-payments-csv',title:'Paiements opérateur',scope:'operator',kind:'payments',format:'csv',supportedFormats:['csv','xlsx','json','pdf_a4'],lockedReason:null,csvAvailable:true,xlsxAvailable:true,pdfAvailable:true },
  { exportKey:'customer-students-csv',title:'Élèves établissement',scope:'customer',kind:'students',format:'csv',supportedFormats:['csv','xlsx','pdf_a4','json'],lockedReason:null,csvAvailable:true,xlsxAvailable:true,pdfAvailable:true },
  { exportKey:'customer-attendance-csv',title:'Présences détaillées',scope:'customer',kind:'attendance',format:'csv',supportedFormats:['csv','xlsx','pdf_a4','json'],lockedReason:null,csvAvailable:true,xlsxAvailable:true,pdfAvailable:true },
]
export function listAngelcare360ExportDefinitions(){return exportDefinitions.slice()}
export function getAngelcare360ExportDefinition(exportKey:string){return exportDefinitions.find((d)=>d.exportKey===exportKey)||null}
export function getAngelcare360XlsxLockedReason(){return null}

import { CareLinkOpsShell } from './CareLinkOpsShell'
import { OpsPanel } from './OpsPrimitives'

export function CareLinkOpsSettings(){return <CareLinkOpsShell title="CareLink settings" subtitle="Templates, règles lifecycle, scoring dispatch, incidents et notifications."><div className="grid grid-cols-3 gap-6">{['Lifecycle rules','Checklist templates','Dispatch scoring','Incident types','Report templates','Notification templates'].map(item=><OpsPanel key={item} title={item}><p className="text-sm font-semibold leading-6 text-slate-500">Configuration enterprise prête à brancher sur les tables CareLink sans créer de version parallèle.</p><button className="mt-5 rounded-full bg-blue-600 px-4 py-2 text-xs font-black text-white">Configurer</button></OpsPanel>)}</div></CareLinkOpsShell>}

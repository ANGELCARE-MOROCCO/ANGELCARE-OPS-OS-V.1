import PayrollSovereignWorkspace from './PayrollSovereignWorkspace'
import { getPayrollSovereignSnapshot } from '@/lib/angelcare360/server/payroll-sovereign'
import type { PayrollSovereignScene } from '@/types/angelcare360/payroll-sovereign'
export default async function PayrollSovereignPage({scene,defaultPlane}:{scene:PayrollSovereignScene;defaultPlane:string}){const snapshot=await getPayrollSovereignSnapshot(scene);if(!snapshot)return <div style={{padding:32}}>Contexte paie indisponible.</div>;return <PayrollSovereignWorkspace snapshot={snapshot} scene={scene} defaultPlane={defaultPlane}/>}

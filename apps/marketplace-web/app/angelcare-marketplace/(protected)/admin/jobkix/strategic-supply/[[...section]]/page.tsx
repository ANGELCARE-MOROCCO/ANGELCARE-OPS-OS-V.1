import {notFound} from 'next/navigation';
import {supplyAdmin} from '@/angelcare-marketplace/jobkix/supply/server';
import {SUPPLY_SECTIONS,type SupplySection} from '@/angelcare-marketplace/jobkix/supply/contracts';
import {StrategicSupply} from '@/angelcare-marketplace/jobkix/admin/StrategicSupply';
export const dynamic='force-dynamic';
export const metadata={title:'JOBKIX · Strategic Supply Command',robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{section?:string[]}>}){
 await supplyAdmin();const {section=[]}=await params;if(section.length>1||section[0]&&!SUPPLY_SECTIONS.includes(section[0] as SupplySection))notFound();return <StrategicSupply section={(section[0]||'overview') as SupplySection}/>;
}

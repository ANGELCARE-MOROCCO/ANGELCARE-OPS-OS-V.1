import {Suspense} from 'react';
import {heroAdminContext} from '@/angelcare-marketplace/jobkix/hero/admin';
import {HeroStudio} from '@/angelcare-marketplace/jobkix/admin/HeroStudio';
export const dynamic='force-dynamic';
export const metadata={title:'JOBKIX · Public Hero Studio',robots:{index:false,follow:false}};
export default async function PublicHeroStudioPage(){await heroAdminContext();return <Suspense fallback={<p role="status">Loading JOBKIX Hero Studio…</p>}><HeroStudio/></Suspense>;}

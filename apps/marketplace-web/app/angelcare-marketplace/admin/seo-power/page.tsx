import { notFound } from 'next/navigation';
import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context';
import { access, snapshot } from '@/angelcare-marketplace/seo-power/repository';
import { SeoPowerWorkspace } from '@/angelcare-marketplace/seo-power/Workspace';
export const dynamic='force-dynamic';
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.web_presence.view');if(!access(context).view)notFound();return <SeoPowerWorkspace initial={await snapshot(context,new URLSearchParams())}/>;}

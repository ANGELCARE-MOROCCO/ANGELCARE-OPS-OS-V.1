import { NextRequest } from 'next/server';
import { refreshCustomerSession } from '../customer-commerce/customer-session-proxy';
import { jobkixPathLocale,withoutJobkixPresentation } from './presentation-context';
/** Reuses the existing Supabase cookie refresh adapter, which does not initialize commerce records. */
export async function refreshJobkixSession(request:NextRequest){
 const headers=withoutJobkixPresentation(request.headers),path=request.nextUrl.pathname,locale=jobkixPathLocale(path);
 if(locale){headers.set('x-jobkix-path',path);headers.set('x-jobkix-locale',locale);}
 return refreshCustomerSession(new NextRequest(request,{headers}));
}

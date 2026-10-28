'use client';
import {NavigationBufferFace} from '@/angelcare-marketplace/jobkix/client/NavigationBufferFace';
import {useJobkixLocale} from '@/angelcare-marketplace/jobkix/client/useLocale';

/** Native route-streaming fallback uses the exact same premium visual as link navigation. */
export default function Loading(){
 const locale=useJobkixLocale();
 return <NavigationBufferFace locale={locale} phase="waiting" fallback/>;
}

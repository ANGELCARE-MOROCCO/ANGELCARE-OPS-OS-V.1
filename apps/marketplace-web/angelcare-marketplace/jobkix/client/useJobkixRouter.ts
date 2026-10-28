'use client';
import {useMemo} from 'react';
import {useRouter} from 'next/navigation';
import {announceJobkixNavigation} from './navigation-buffer-events';

/** Shared wrapper makes imperative Next App Router navigations visible to the global PM5 buffer. */
export function useJobkixRouter():ReturnType<typeof useRouter>{
 const router=useRouter();
 return useMemo(()=>({
  ...router,
  push:(destination:string,options?:Parameters<typeof router.push>[1])=>{
   announceJobkixNavigation(destination);
   router.push(destination,options);
  },
  replace:(destination:string,options?:Parameters<typeof router.replace>[1])=>{
   announceJobkixNavigation(destination);
   router.replace(destination,options);
  },
 }),[router]);
}

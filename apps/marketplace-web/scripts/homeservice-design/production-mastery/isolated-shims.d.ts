declare namespace JSX {
  interface ElementChildrenAttribute { children: {} }
  interface IntrinsicAttributes { key?: any }
  interface IntrinsicElements { [name: string]: any }
}
declare const process: { env: Record<string,string|undefined> }
declare const window: any
declare const fetch: any
declare const crypto: any
declare class URLSearchParams { constructor(value?: any); set(k:string,v:string):void; get(k:string):string|null; toString():string }
declare class DOMException extends Error { name:string }
declare class AbortController { signal:any; abort(reason?:any):void }
type RequestInit = any

declare module 'react' {
  export type ReactNode = any
  export type FormEvent = any
  export type ChangeEvent<T=any> = any
  export type MouseEvent<T=any> = any
  export type KeyboardEvent<T=any> = any
  export type Dispatch<A> = (value: A) => void
  export type SetStateAction<S> = S | ((prevState:S)=>S)
  export function useState<S>(initial:S|(()=>S)): [S,Dispatch<SetStateAction<S>>]
  export function useEffect(effect:()=>void|(()=>void), deps?:readonly unknown[]):void
  export function useMemo<T>(factory:()=>T,deps:readonly unknown[]):T
  export function useCallback<T extends (...args:any[])=>any>(callback:T,deps:readonly unknown[]):T
  export function useRef<T=any>(initial?:T):{current:T}
  export function createContext<T>(value:T):any
  export function useContext(context:any):any
}
declare module 'next/navigation' {
  export function useRouter(): { push(url:string):void; replace(url:string,options?:any):void; refresh():void; back():void }
  export function useSearchParams(): { get(key:string):string|null; toString():string }
  export function usePathname():string
  export function redirect(url:string):never
  export function notFound():never
}
declare module 'next/server' {
  export const NextResponse: { json(body:any, init?:any):any }
  export type NextRequest = any
}
declare module 'next/link' { const Link:any; export default Link }
declare module 'node:crypto' { const value:any; export default value }
declare module '@supabase/supabase-js' { export function createClient(...args:any[]):any }
declare module 'lucide-react' {
  export const Activity:any; export const AlertCircle:any; export const AlertTriangle:any; export const ArrowLeft:any; export const ArrowRight:any;
  export const BadgeCheck:any; export const Bot:any; export const BriefcaseBusiness:any; export const CalendarClock:any; export const CalendarDays:any;
  export const Check:any; export const CheckCircle2:any; export const ChevronDown:any; export const ChevronRight:any; export const ChevronUp:any;
  export const CircleDollarSign:any; export const CircleX:any; export const ClipboardCheck:any; export const Clock3:any; export const Copy:any;
  export const FileStack:any; export const FileText:any; export const GitCompareArrows:any; export const Loader2:any; export const MapPinned:any;
  export const Network:any; export const PackageCheck:any; export const Pencil:any; export const Plus:any; export const RefreshCw:any; export const RotateCcw:any;
  export const Rocket:any; export const Route:any; export const Save:any; export const Search:any; export const Settings2:any; export const ShieldCheck:any;
  export const Smartphone:any; export const Sparkles:any; export const Trash2:any; export const UserRound:any; export const UsersRound:any;
  export const WalletCards:any; export const Wrench:any; export const X:any;
}
declare module '@/lib/supabase/server' { export function createClient():Promise<any> }
declare module '@/lib/homeservice-design/constants' { export const HSD_TENANT_ID:string }
declare module '@/lib/homeservice-design/server/auth' {
  export type HomeServiceUser = Record<string,unknown> & { id?:string|number; role?:string; permissions?:string[]; email?:string }
  export function requireHomeServiceApi(permission?:string|string[]):Promise<HomeServiceUser>
  export function requireHomeServiceAccess(permission?:string|string[]):Promise<HomeServiceUser>
  export function userId(user:HomeServiceUser):string
}
declare module '@/lib/homeservice-factory/server/composer' {
  export function validateFactoryInput(input:any):any
  export function composeFactoryScenarios(input:any):Promise<any>
}
declare module '@/lib/homeservice-factory/server/repository' { export function persistFactoryComposition(input:any,actor:any):Promise<any> }
declare module '@/types/homeservice-factory' {
  export type FactoryComposeInput = any
  export type FactoryScenario = any
}

declare const process: any
declare module 'server-only'
declare module 'react' {
  export type ReactNode = any
  export type ChangeEvent<T=any> = any
  export type DragEvent<T=any> = any
  export type PointerEvent<T=any> = any
  export type MouseEvent<T=any> = any
  export type FormEvent<T=any> = any
  export type KeyboardEvent<T=any> = any
  export type ComponentType<P=any> = any
  export type FC<P={}> = (props:P)=>any
  export function useState<T=any>(value?:T|(()=>T)): [T,(value:T|((current:T)=>T))=>void]
  export function useEffect(effect:()=>void|(()=>void),deps?:any[]):void
  export function useMemo<T>(factory:()=>T,deps:any[]):T
  export function useCallback<T extends (...args:any[])=>any>(fn:T,deps:any[]):T
  export function useRef<T>(value:T):{current:T}
}
declare namespace React { type ReactNode=any; type DragEvent<T=any>=any; type MouseEvent<T=any>=any; type ChangeEvent<T=any>=any }
declare namespace JSX {
  interface Element {}
  interface ElementChildrenAttribute { children: {} }
  interface IntrinsicElements { [elemName:string]: any }
}
declare module 'react/jsx-runtime' { export const jsx:any; export const jsxs:any; export const Fragment:any }
declare module 'next/link' { const Link:any; export default Link }
declare module 'next/navigation' { export function usePathname():string; export function useRouter():any; export function redirect(url:string):never }
declare module 'next/server' { export const NextResponse:any }
declare module 'next/headers' { export function cookies(): Promise<any>; export function headers(): Promise<any> }
declare module 'crypto' { const value:any; export default value; export const createHash:any; export const randomUUID:any }
declare module 'bcryptjs' { const value:any; export default value }
declare module '@supabase/ssr' { export const createServerClient:any }
declare module 'lucide-react' {
  export const ArrowLeft: any
  export const ArrowRight: any
  export const BookOpenCheck: any
  export const Bookmark: any
  export const Bot: any
  export const Boxes: any
  export const BriefcaseBusiness: any
  export const Building2: any
  export const CheckCircle2: any
  export const CheckSquare2: any
  export const ChevronLeft: any
  export const ChevronRight: any
  export const CircleAlert: any
  export const CircleDot: any
  export const Clock3: any
  export const Command: any
  export const Copy: any
  export const FileStack: any
  export const FileText: any
  export const Focus: any
  export const Gauge: any
  export const GitCompareArrows: any
  export const GripVertical: any
  export const Handshake: any
  export const Heart: any
  export const HeartHandshake: any
  export const Layers3: any
  export const LayoutTemplate: any
  export const Loader2: any
  export const Lock: any
  export const Maximize2: any
  export const Merge: any
  export const MessageSquarePlus: any
  export const Minus: any
  export const PackageCheck: any
  export const Plus: any
  export const Redo2: any
  export const RefreshCw: any
  export const Replace: any
  export const Save: any
  export const Search: any
  export const ShieldCheck: any
  export const Sparkles: any
  export const Store: any
  export const Trash2: any
  export const Undo2: any
  export const Unlock: any
  export const UserRoundCheck: any
  export const WandSparkles: any
  export const X: any
}
declare module '@supabase/supabase-js' { export type SupabaseClient=any; export const createClient:any }
declare module '@/types/homeservice-category-experience' { export type CategoryExperienceBlueprint=any;export type CategoryExperienceField=any;export type CategoryExperiencePreset=any }
declare module '@/types/homeservice-factory' { export type FactoryCategorySource=any;export type FactoryComposeInput=any;export type FactoryDateInput=any;export type FactoryMode=any;export type FactoryScenario=any }
declare module '@/lib/homeservice-design/constants' { export const HSD_CONTEXT_NAV:any;export const HSD_MASTER_UNIVERSES:any;export const HSD_ROUTE_ROOT:string }
declare module '@/lib/auth/session' { export function getCurrentAppUser():Promise<any> }
declare module '@/lib/supabase/server' { export function createServiceClient():Promise<any>; export function createClient():Promise<any> }

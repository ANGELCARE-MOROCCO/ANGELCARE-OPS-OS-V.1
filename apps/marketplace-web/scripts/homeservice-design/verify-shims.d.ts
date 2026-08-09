declare namespace React {
  type Key = string | number
  type ReactNode = any
  type SetStateAction<S> = S | ((prevState: S) => S)
  type Dispatch<A> = (value: A) => void
  interface SyntheticEvent<T = Element> { currentTarget: T; target: EventTarget & T; preventDefault(): void; stopPropagation(): void }
  interface FormEvent<T = Element> extends SyntheticEvent<T> {}
  interface ChangeEvent<T = Element> extends SyntheticEvent<T> {}
  interface MouseEvent<T = Element> extends SyntheticEvent<T> {}
  interface KeyboardEvent<T = Element> extends SyntheticEvent<T> { key: string; metaKey: boolean; ctrlKey: boolean }
  interface DOMAttributes<T> { onClick?: (event: MouseEvent<T>) => void; onMouseDown?: (event: MouseEvent<T>) => void; onChange?: (event: ChangeEvent<T>) => void; onSubmit?: (event: FormEvent<T>) => void; onKeyDown?: (event: KeyboardEvent<T>) => void }
  interface HTMLAttributes<T> extends DOMAttributes<T> { [key: string]: any }
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> { value?: any; defaultValue?: any; checked?: boolean; type?: string; name?: string }
  interface TextareaHTMLAttributes<T> extends HTMLAttributes<T> { value?: any; defaultValue?: any; name?: string }
  interface SelectHTMLAttributes<T> extends HTMLAttributes<T> { value?: any; defaultValue?: any; name?: string }
  interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> { type?: 'button'|'submit'|'reset'; disabled?: boolean }
}
declare module 'react' {
  export type ReactNode = React.ReactNode
  export type FormEvent<T = Element> = React.FormEvent<T>
  export type ChangeEvent<T = Element> = React.ChangeEvent<T>
  export type MouseEvent<T = Element> = React.MouseEvent<T>
  export function useState<S>(initialState: S | (() => S)): [S, React.Dispatch<React.SetStateAction<S>>]
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void
  const ReactDefault: any
  export default ReactDefault
}
declare namespace JSX {
  interface Element {}
  interface IntrinsicAttributes { key?: React.Key }
  interface IntrinsicElements {
    input: React.InputHTMLAttributes<HTMLInputElement>; textarea: React.TextareaHTMLAttributes<HTMLTextAreaElement>; select: React.SelectHTMLAttributes<HTMLSelectElement>; button: React.ButtonHTMLAttributes<HTMLButtonElement>; form: React.HTMLAttributes<HTMLFormElement>;
    [elemName: string]: React.HTMLAttributes<any>
  }
}
declare module 'react/jsx-runtime' { export const jsx: any; export const jsxs: any; export const Fragment: any }
declare module 'next/link' { const Link: (props: any) => JSX.Element; export default Link }
declare module 'next/image' { const Image: (props: any) => JSX.Element; export default Image }
declare module 'next/navigation' { export function redirect(path:string): never; export function notFound(): never; export function usePathname(): string; export function useRouter(): { push(path:string):void; refresh():void } }
declare module 'next/server' { export const NextResponse: { json(data:any, init?:any): any } }
declare module 'lucide-react' {
  export const Activity: (props:any) => JSX.Element
  export const AlertOctagon: (props:any) => JSX.Element
  export const AlertTriangle: (props:any) => JSX.Element
  export const ArrowLeft: (props:any) => JSX.Element
  export const ArrowRight: (props:any) => JSX.Element
  export const ArrowUpRight: (props:any) => JSX.Element
  export const Award: (props:any) => JSX.Element
  export const BellRing: (props:any) => JSX.Element
  export const Blocks: (props:any) => JSX.Element
  export const BookOpenCheck: (props:any) => JSX.Element
  export const Bot: (props:any) => JSX.Element
  export const Boxes: (props:any) => JSX.Element
  export const BriefcaseBusiness: (props:any) => JSX.Element
  export const Building2: (props:any) => JSX.Element
  export const CalendarDays: (props:any) => JSX.Element
  export const CalendarRange: (props:any) => JSX.Element
  export const CheckCircle2: (props:any) => JSX.Element
  export const ChevronDown: (props:any) => JSX.Element
  export const ChevronRight: (props:any) => JSX.Element
  export const CircleDot: (props:any) => JSX.Element
  export const ClipboardCheck: (props:any) => JSX.Element
  export const ClipboardList: (props:any) => JSX.Element
  export const Clock3: (props:any) => JSX.Element
  export const Command: (props:any) => JSX.Element
  export const Database: (props:any) => JSX.Element
  export const Dumbbell: (props:any) => JSX.Element
  export const FileCheck2: (props:any) => JSX.Element
  export const FileSpreadsheet: (props:any) => JSX.Element
  export const FileText: (props:any) => JSX.Element
  export const FileWarning: (props:any) => JSX.Element
  export const Filter: (props:any) => JSX.Element
  export const Fingerprint: (props:any) => JSX.Element
  export const Gauge: (props:any) => JSX.Element
  export const GitBranch: (props:any) => JSX.Element
  export const GitCompareArrows: (props:any) => JSX.Element
  export const Languages: (props:any) => JSX.Element
  export const Layers3: (props:any) => JSX.Element
  export const Loader2: (props:any) => JSX.Element
  export const LockKeyhole: (props:any) => JSX.Element
  export const MapPin: (props:any) => JSX.Element
  export const MapPinned: (props:any) => JSX.Element
  export const Network: (props:any) => JSX.Element
  export const PackageCheck: (props:any) => JSX.Element
  export const PackageOpen: (props:any) => JSX.Element
  export const Plus: (props:any) => JSX.Element
  export const Repeat2: (props:any) => JSX.Element
  export const RotateCcw: (props:any) => JSX.Element
  export const Save: (props:any) => JSX.Element
  export const Scale: (props:any) => JSX.Element
  export const Search: (props:any) => JSX.Element
  export const ShieldAlert: (props:any) => JSX.Element
  export const ShieldCheck: (props:any) => JSX.Element
  export const Siren: (props:any) => JSX.Element
  export const SlidersHorizontal: (props:any) => JSX.Element
  export const Sparkles: (props:any) => JSX.Element
  export const TriangleAlert: (props:any) => JSX.Element
  export const UploadCloud: (props:any) => JSX.Element
  export const UserRound: (props:any) => JSX.Element
  export const UserRoundCheck: (props:any) => JSX.Element
  export const UsersRound: (props:any) => JSX.Element
  export const WandSparkles: (props:any) => JSX.Element
  export const Workflow: (props:any) => JSX.Element
  export const X: (props:any) => JSX.Element
}
declare module 'node:crypto' { const crypto: { randomUUID(): string; createHash(name:string): { update(value:string): any; digest(encoding:string): string } }; export default crypto }
declare var process: { env: Record<string,string|undefined> }

declare module '@supabase/supabase-js' { export type SupabaseClient=any; export function createClient(...args:any[]): any }
declare module 'lucide-react' { export const BadgeCheck:any; export const BrainCircuit:any; export const Calculator:any; export const TrendingUp:any; }

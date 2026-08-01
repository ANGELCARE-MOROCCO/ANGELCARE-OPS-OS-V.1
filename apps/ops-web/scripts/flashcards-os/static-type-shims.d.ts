declare module 'server-only' {}

declare namespace React {
  type ReactNode = any
  interface FormEvent<T = Element> { preventDefault(): void; currentTarget: T; target: EventTarget & T }
  interface ChangeEvent<T = Element> { target: EventTarget & T }
  interface MouseEvent<T = Element> { stopPropagation(): void; currentTarget: T; target: EventTarget & T }
  type SetStateAction<S> = S | ((previous: S) => S)
  type Dispatch<A> = (value: A) => void
  type CSSProperties = Record<string, string | number | undefined>
}

declare namespace JSX {
  interface IntrinsicElements { [elementName: string]: any }
  interface Element {}
}

declare module 'react' {
  export type ReactNode = React.ReactNode
  export type FormEvent<T = Element> = React.FormEvent<T>
  export type ChangeEvent<T = Element> = React.ChangeEvent<T>
  export type MouseEvent<T = Element> = React.MouseEvent<T>
  export function useState<S>(initialState: S | (() => S)): [S, React.Dispatch<React.SetStateAction<S>>]
  export function useMemo<T>(factory: () => T, dependencies: readonly unknown[]): T
}

declare module 'react/jsx-runtime' {
  export const Fragment: any
  export function jsx(type: any, props: any, key?: any): JSX.Element
  export function jsxs(type: any, props: any, key?: any): JSX.Element
}

declare module 'next/link' { const Link: any; export default Link }
declare module 'next/navigation' {
  export function usePathname(): string
  export function useRouter(): { push(path: string): void; refresh(): void; replace(path: string): void }
  export function redirect(path: string): never
  export function notFound(): never
}
declare module 'next/cache' { export function revalidatePath(path: string): void }
declare module 'next/headers' {
  export function cookies(): Promise<{
    get(name: string): { value: string } | undefined
    getAll(): Array<{ name: string; value: string }>
    set(name: string, value: string, options?: any): void
  }>
}
declare module 'next/server' {
  export class NextResponse {
    static json(body: any, init?: { status?: number }): NextResponse
  }
}

declare module '@supabase/ssr' {
  export type CookieOptions = Record<string, unknown>
  export function createServerClient(url: string, key: string, options: any): any
}

declare module 'lucide-react' {
  export type LucideIcon = any
  export const AlertTriangle: any
  export const Activity: any
  export const ArrowLeft: any
  export const Ban: any
  export const CalendarClock: any
  export const CircleAlert: any
  export const CircleCheck: any
  export const CircleDollarSign: any
  export const CircleDot: any
  export const Crosshair: any
  export const DatabaseZap: any
  export const ExternalLink: any
  export const Gauge: any
  export const GitCompareArrows: any
  export const GitMerge: any
  export const Globe2: any
  export const Lightbulb: any
  export const Play: any
  export const Scale: any
  export const SearchCheck: any
  export const ShieldX: any
  export const XCircle: any
  export const Archive: any
  export const ArrowRight: any
  export const Bell: any
  export const BookOpenCheck: any
  export const Boxes: any
  export const BrainCircuit: any
  export const CheckCircle2: any
  export const ChevronDown: any
  export const ChevronRight: any
  export const CircleGauge: any
  export const Clock3: any
  export const Command: any
  export const Database: any
  export const Edit3: any
  export const FileCheck2: any
  export const FileClock: any
  export const FileSearch: any
  export const Filter: any
  export const FolderPlus: any
  export const GitBranch: any
  export const Layers3: any
  export const LockKeyhole: any
  export const Network: any
  export const PackageCheck: any
  export const Plus: any
  export const Radar: any
  export const RefreshCw: any
  export const Route: any
  export const Save: any
  export const Search: any
  export const Settings2: any
  export const ShieldAlert: any
  export const ShieldCheck: any
  export const Sparkles: any
  export const Truck: any
  export const UsersRound: any
  export const X: any
}

declare module 'bcryptjs' { const bcrypt: { hash(value: string, rounds: number): Promise<string>; compare(value: string, hash: string): Promise<boolean> }; export default bcrypt }
declare module 'crypto' { const crypto: { randomBytes(size: number): { toString(encoding: string): string } }; export default crypto }

declare const process: { env: Record<string, string | undefined>; pid: number }

declare module 'node:crypto' {
  export function randomUUID(): string
  export function createHash(algorithm: string): { update(value: string): any; digest(encoding: string): string }
}

declare module 'lucide-react' {
  export const LoaderCircle: any
  export const ClipboardCheck: any
  export const Copy: any
  export const Download: any
  export const FileText: any
  export const Folder: any
  export const Video: any
  export const CloudUpload: any
  export const FileUp: any
  export const Pause: any
  export const UploadCloud: any
  export const HardDrive: any
}
declare module 'node:crypto' {
  export function createHmac(algorithm: string, key: string): { update(value: string): any; digest(encoding: string): string }
}

declare module 'lucide-react' {
  export const SlidersHorizontal: any
  export const Home: any
  export const ShoppingBag: any
  export const Building2: any
  export const PauseCircle: any
  export const Send: any
  export const Compass: any
  export const CalendarDays: any
  export const ListChecks: any
}

declare module 'lucide-react' {
  export const Building2: any
  export const CheckSquare2: any
  export const FileDown: any
  export const HeartHandshake: any
  export const House: any
  export const Landmark: any
  export const Mail: any
  export const MapPin: any
  export const Phone: any
  export const ReceiptText: any
  export const Target: any
  export const Trash2: any
  export const UserRound: any
}
declare module 'pdf-lib' {
  export const StandardFonts: any
  export function rgb(r:number,g:number,b:number): any
  export class PDFDocument {
    static create(): Promise<PDFDocument>
    embedFont(font:any): Promise<any>
    addPage(size?:[number,number]): any
    getPages(): any[]
    save(): Promise<Uint8Array>
  }
}
declare module 'lucide-react' { export const Bot: any; export const FileLock2: any; export const Fingerprint: any }

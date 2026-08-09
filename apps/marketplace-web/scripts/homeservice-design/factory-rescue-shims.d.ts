declare module 'server-only' {}
declare module 'node:crypto' {
  export function randomUUID(): string
  export function createHash(name: string): { update(value: string): any; digest(encoding: string): string }
}
declare module 'lucide-react' {
  export const ClipboardPaste: any
  export const Download: any
  export const CircleDollarSign: any
  export const Send: any
  export const Check: any
  export const CircleAlert: any
  export const CheckSquare2: any
  export const ChevronUp: any
  export const Trash2: any
}

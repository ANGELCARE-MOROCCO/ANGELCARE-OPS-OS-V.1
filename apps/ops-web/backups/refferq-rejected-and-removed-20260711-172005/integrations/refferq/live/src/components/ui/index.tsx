// @ts-nocheck
"use client"

import * as React from "react"
import { cn } from "@refferq/lib/utils"

type AsChildProps = {
  asChild?: boolean
  children?: React.ReactNode
}

function renderAsChild(
  children: React.ReactNode,
  props: Record<string, unknown>,
  fallback: React.ReactElement
) {
  if (React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement, props)
  }
  return fallback
}

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const classes = cn(
      "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:pointer-events-none disabled:opacity-50",
      variant === "default" && "bg-slate-950 text-white hover:bg-slate-800",
      variant === "secondary" && "bg-slate-100 text-slate-950 hover:bg-slate-200",
      variant === "outline" && "border border-slate-200 bg-white text-slate-950 hover:bg-slate-50",
      variant === "ghost" && "bg-transparent text-slate-700 hover:bg-slate-100",
      variant === "destructive" && "bg-rose-600 text-white hover:bg-rose-700",
      variant === "link" && "bg-transparent text-sky-700 underline-offset-4 hover:underline",
      size === "default" && "h-10 px-4 py-2",
      size === "sm" && "h-9 rounded-md px-3 text-xs",
      size === "lg" && "h-11 rounded-xl px-6",
      size === "icon" && "h-10 w-10",
      className
    )

    if (asChild && React.isValidElement(props.children)) {
      return React.cloneElement(props.children as React.ReactElement, {
        ...props,
        className: cn(classes, (props.children as React.ReactElement).props.className),
        ref,
      } as any)
    }

    return <button ref={ref} className={classes} {...props} />
  }
)
Button.displayName = "Button"

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
)
Input.displayName = "Input"

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[96px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
)
Textarea.displayName = "Textarea"

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium leading-none text-slate-700", className)} {...props} />
}

function CardShell({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-sm", className)}>{children}</div>
}

export function Card({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <CardShell className={className}>{children}</CardShell>
}
export function CardHeader({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 p-6", className)}>{children}</div>
}
export function CardTitle({ className, children }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-2xl font-semibold leading-none tracking-tight", className)}>{children}</h3>
}
export function CardDescription({ className, children }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-slate-500", className)}>{children}</p>
}
export function CardContent({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0", className)}>{children}</div>
}
export function CardFooter({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center p-6 pt-0", className)}>{children}</div>
}

export function Badge({ className, variant = "default", children }: React.HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "secondary" | "outline" | "destructive" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        variant === "default" && "border-slate-200 bg-slate-950 text-white",
        variant === "secondary" && "border-slate-200 bg-slate-100 text-slate-700",
        variant === "outline" && "border-slate-200 bg-white text-slate-700",
        variant === "destructive" && "border-rose-200 bg-rose-50 text-rose-700",
        className
      )}
    >
      {children}
    </span>
  )
}

export function Alert({ className, variant = "default", children }: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "destructive" }) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        variant === "default" && "border-sky-200 bg-sky-50 text-slate-950",
        variant === "destructive" && "border-rose-200 bg-rose-50 text-rose-800",
        className
      )}
    >
      {children}
    </div>
  )
}
export function AlertDescription({ className, children }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm leading-6 text-inherit", className)}>{children}</p>
}

export function Avatar({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}>{children}</div>
}
export function AvatarImage({ src, alt, className }: { src?: string | null; alt?: string | null; className?: string }) {
  if (!src) return null
  return <img src={src} alt={alt ?? ""} className={cn("aspect-square h-full w-full object-cover", className)} />
}
export function AvatarFallback({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex h-full w-full items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700", className)}>{children}</div>
}

export function Progress({ value = 0, className }: { value?: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-100", className)}>
      <div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Separator({ className, orientation = "horizontal" }: React.HTMLAttributes<HTMLDivElement> & { orientation?: "horizontal" | "vertical" }) {
  return <div className={cn(orientation === "horizontal" ? "h-px w-full bg-slate-200" : "h-full w-px bg-slate-200", className)} />
}

export function Skeleton({ className }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-slate-100", className)} />
}

export const Table = ({ className, children }: React.HTMLAttributes<HTMLTableElement>) => (
  <table className={cn("w-full caption-bottom text-sm", className)}>{children}</table>
)
export const TableHeader = ({ className, children }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={cn("[&_tr]:border-b", className)}>{children}</thead>
)
export const TableBody = ({ className, children }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={cn("[&_tr:last-child]:border-0", className)}>{children}</tbody>
)
export const TableRow = ({ className, children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn("border-b transition-colors hover:bg-slate-50", className)} {...props}>{children}</tr>
)
export const TableHead = ({ className, children }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th className={cn("h-12 px-4 text-left align-middle font-medium text-slate-500", className)}>{children}</th>
)
export const TableCell = ({ className, children }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn("p-4 align-middle", className)}>{children}</td>
)

type DialogContextValue = { open: boolean; setOpen: (v: boolean) => void }
const DialogContext = React.createContext<DialogContextValue | null>(null)
function useDialog() {
  const ctx = React.useContext(DialogContext)
  if (!ctx) throw new Error("Dialog components must be used inside <Dialog>")
  return ctx
}
export function useDialogControls() {
  return useDialog()
}
export function Dialog({ children, open: openProp, onOpenChange }: { children: React.ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const [localOpen, setLocalOpen] = React.useState(false)
  const open = openProp ?? localOpen
  const setOpen = (v: boolean) => {
    if (onOpenChange) onOpenChange(v)
    else setLocalOpen(v)
  }
  return <DialogContext.Provider value={{ open, setOpen }}>{children}</DialogContext.Provider>
}
export function DialogTrigger({ asChild = false, children }: AsChildProps) {
  const { setOpen } = useDialog()
  const onClick = () => setOpen(true)
  if (asChild && React.isValidElement(children)) return React.cloneElement(children as React.ReactElement, { onClick })
  return <button onClick={onClick}>{children}</button>
}
export function DialogContent({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  const { open, setOpen } = useDialog()
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onClick={() => setOpen(false)}>
      <div className={cn("w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl", className)} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
export function DialogHeader({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5", className)}>{children}</div>
}
export function DialogFooter({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-6 flex items-center justify-end gap-2", className)}>{children}</div>
}
export function DialogTitle({ className, children }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-xl font-semibold tracking-tight", className)}>{children}</h3>
}
export function DialogDescription({ className, children }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-slate-500", className)}>{children}</p>
}

const DropdownContext = React.createContext<{ open: boolean; setOpen: (v: boolean) => void } | null>(null)
function useDropdown() {
  const ctx = React.useContext(DropdownContext)
  if (!ctx) throw new Error("DropdownMenu components must be used within <DropdownMenu>")
  return ctx
}
export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  return <DropdownContext.Provider value={{ open, setOpen }}>{children}</DropdownContext.Provider>
}
export function DropdownMenuTrigger({ asChild = false, children }: AsChildProps) {
  const { open, setOpen } = useDropdown()
  const onClick = () => setOpen(!open)
  if (asChild && React.isValidElement(children)) return React.cloneElement(children as React.ReactElement, { onClick })
  return <button onClick={onClick}>{children}</button>
}
export function DropdownMenuContent({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  const { open, setOpen } = useDropdown()
  if (!open) return null
  return (
    <div className={cn("absolute z-50 mt-2 min-w-48 rounded-2xl border border-slate-200 bg-white p-1 shadow-xl", className)} onBlur={() => setOpen(false)}>
      {children}
    </div>
  )
}
export function DropdownMenuItem({ className, children, onClick }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useDropdown()
  return (
    <button
      type="button"
      className={cn("flex w-full items-center rounded-xl px-3 py-2 text-left text-sm hover:bg-slate-100", className)}
      onClick={(e) => {
        onClick?.(e)
        setOpen(false)
      }}
    >
      {children}
    </button>
  )
}
export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-slate-200" />
}

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
export function Tooltip({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
export function TooltipTrigger({ asChild = false, children }: AsChildProps) {
  return asChild && React.isValidElement(children) ? children : <>{children}</>
}
export function TooltipContent({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

type SidebarContextValue = { open: boolean; setOpen: (open: boolean) => void }
const SidebarContext = React.createContext<SidebarContextValue | null>(null)
function useSidebar() {
  const ctx = React.useContext(SidebarContext)
  if (!ctx) throw new Error("Sidebar components must be used within SidebarProvider")
  return ctx
}
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(true)
  return <SidebarContext.Provider value={{ open, setOpen }}>{children}</SidebarContext.Provider>
}
export function Sidebar({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  const { open } = useSidebar()
  return <aside className={cn("flex h-dvh w-72 shrink-0 flex-col border-r border-slate-200 bg-white", !open && "w-16", className)}>{children}</aside>
}
export function SidebarContent({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1 overflow-y-auto p-3", className)}>{children}</div>
}
export function SidebarHeader({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b border-slate-200 p-4", className)}>{children}</div>
}
export function SidebarFooter({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-t border-slate-200 p-3", className)}>{children}</div>
}
export function SidebarGroup({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4", className)}>{children}</div>
}
export function SidebarGroupLabel({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-2 px-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400", className)}>{children}</div>
}
export function SidebarGroupContent({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-1", className)}>{children}</div>
}
export function SidebarMenu({ className, children }: React.HTMLAttributes<HTMLUListElement>) {
  return <ul className={cn("space-y-1", className)}>{children}</ul>
}
export function SidebarMenuItem({ className, children }: React.LiHTMLAttributes<HTMLLIElement>) {
  return <li className={cn(className)}>{children}</li>
}
export function SidebarMenuButton({
  className,
  children,
  isActive,
  onClick,
  size = "default",
  tooltip,
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { isActive?: boolean; size?: "default" | "lg"; tooltip?: string }) {
  return (
    <button
      title={tooltip}
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm font-medium transition",
        isActive ? "bg-sky-50 text-sky-700" : "text-slate-700 hover:bg-slate-100",
        size === "lg" && "px-4 py-3",
        className
      )}
    >
      {children}
    </button>
  )
}
export function SidebarInset({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex h-dvh min-h-dvh min-w-0 flex-1 flex-col overflow-hidden", className)}>{children}</div>
}
export function SidebarTrigger({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen, open } = useSidebar()
  return <Button variant="outline" size="icon" className={className} onClick={() => setOpen(!open)} {...props}>☰</Button>
}
export function SidebarRail() {
  return null
}

export function Checkbox({ className, checked, onCheckedChange, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { checked?: boolean; onCheckedChange?: (checked: boolean) => void }) {
  return (
    <input
      type="checkbox"
      className={cn("h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500", className)}
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      {...props}
    />
  )
}

export function Switch({ className, checked, onCheckedChange, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { checked?: boolean; onCheckedChange?: (checked: boolean) => void }) {
  return (
    <label className={cn("relative inline-flex cursor-pointer items-center", className)}>
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        {...props}
      />
      <span className="h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-sky-600" />
      <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5" />
    </label>
  )
}

export function extractSelectText(children: React.ReactNode): string {
  return React.Children.toArray(children)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child)
      }

      if (React.isValidElement(child)) {
        return extractSelectText(child.props.children)
      }

      return ""
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
}

export function Select({ value, onValueChange, children }: { value?: string; onValueChange?: (value: string) => void; children: React.ReactNode }) {
  return <div data-refferq-select value={value} onChange={onValueChange as any}>{children}</div>
}
export function SelectTrigger({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-md border border-slate-200 bg-white px-3 py-2 text-sm", className)}>{children}</div>
}
export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <span className="text-slate-500">{placeholder}</span>
}
export function SelectContent({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  return <option value={value}>{extractSelectText(children)}</option>
}
export function SelectLabel({ children }: { children: React.ReactNode }) {
  return <option disabled>{extractSelectText(children)}</option>
}
export function SelectSeparator() {
  return <option disabled>──────────</option>
}

export function Tabs({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}
export function TabsList({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("inline-flex rounded-2xl bg-slate-100 p-1", className)}>{children}</div>
}
export function TabsTrigger({ className, children, value, onClick }: React.ButtonHTMLAttributes<HTMLButtonElement> & { value?: string }) {
  return <button type="button" onClick={onClick} className={cn("rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white", className)}>{children}</button>
}
export function TabsContent({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className}>{children}</div>
}

export function InputOTP({ value, onChange, maxLength = 6, children }: { value?: string; onChange?: (value: string) => void; maxLength?: number; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      {React.Children.map(children, (child) => child)}
      <input
        value={value ?? ""}
        maxLength={maxLength}
        onChange={(e) => onChange?.(e.target.value.replace(/\\D/g, "").slice(0, maxLength))}
        className="sr-only"
      />
    </div>
  )
}
export function InputOTPGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-2">{children}</div>
}
export function InputOTPSlot({ index }: { index: number }) {
  return <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg font-semibold text-slate-950">{index + 1}</div>
}
export function InputOTPSeparator() {
  return <div className="px-1 text-slate-400">-</div>
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
export function Toaster() {
  return null
}

export type ToastActionElement = React.ReactElement
export type ToastProps = {
  id?: string
  title?: React.ReactNode
  description?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const AlertTitle = ({ className, children }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <div className={cn("mb-1 font-semibold tracking-tight", className)}>{children}</div>
)

export const Drawer = Dialog
export const DrawerTrigger = DialogTrigger
export const DrawerContent = DialogContent
export const DrawerHeader = DialogHeader
export const DrawerFooter = DialogFooter
export const DrawerTitle = DialogTitle
export const DrawerDescription = DialogDescription

export const AspectRatio = ({ ratio = 1, children }: { ratio?: number; children: React.ReactNode }) => (
  <div style={{ aspectRatio: String(ratio) }}>{children}</div>
)

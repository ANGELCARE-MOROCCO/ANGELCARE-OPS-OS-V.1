// @ts-nocheck
import * as React from "react"
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  useDialogControls,
} from "./index"

export const AlertDialog = Dialog
export const AlertDialogTrigger = DialogTrigger
export const AlertDialogContent = DialogContent
export const AlertDialogHeader = DialogHeader
export const AlertDialogTitle = DialogTitle
export const AlertDialogDescription = DialogDescription
export const AlertDialogFooter = DialogFooter

type AlertDialogButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>

export function AlertDialogCancel({ children, onClick, ...props }: AlertDialogButtonProps) {
  const { setOpen } = useDialogControls()

  return (
    <Button
      type="button"
      variant="outline"
      onClick={(event) => {
        onClick?.(event)
        setOpen(false)
      }}
      {...props}
    >
      {children}
    </Button>
  )
}

export function AlertDialogAction({ children, onClick, ...props }: AlertDialogButtonProps) {
  const { setOpen } = useDialogControls()

  return (
    <Button
      type="button"
      onClick={(event) => {
        onClick?.(event)
        setOpen(false)
      }}
      {...props}
    >
      {children}
    </Button>
  )
}

export default AlertDialog

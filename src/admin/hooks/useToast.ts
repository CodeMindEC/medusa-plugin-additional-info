import { toast as medusaToast } from "@medusajs/ui"
import type { ReactNode } from "react"

type ToastOptions = {
    id?: string | number
    description?: ReactNode
    duration?: number
    dismissable?: boolean
}

type ToastHandler = (title: string, options?: ToastOptions) => string | number

export type ToastAPI = {
    success: ToastHandler
    error: ToastHandler
    info: ToastHandler
    warning: ToastHandler
    loading: ToastHandler
    dismiss: (id?: string | number) => string | number
}

export function useToast(): { toast: ToastAPI } {
    return {
        toast: {
            success: (title, options) => medusaToast.success(title, options),
            error: (title, options) => medusaToast.error(title, options),
            info: (title, options) => medusaToast.info(title, options),
            warning: (title, options) => medusaToast.warning(title, options),
            loading: (title, options) => medusaToast.loading(title, options),
            dismiss: (id) => medusaToast.dismiss(id),
        },
    }
}

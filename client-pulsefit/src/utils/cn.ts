import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Combina clases de Tailwind respetando el orden de override. Helper estándar de shadcn/ui. */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

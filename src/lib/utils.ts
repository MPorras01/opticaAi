import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export { formatCOP, formatDate, formatDateShort, slugify, truncate } from './utils/formatters'
export { isValidColombianPhone, isValidEmail } from './utils/validators'

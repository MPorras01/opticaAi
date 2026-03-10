/**
 * Formats a number as Colombian pesos without decimals.
 * Example: 150000 -> "$ 150.000"
 */
export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount)
}

/**
 * Formats a date in long Colombian Spanish format.
 * Example: "15 de enero de 2025"
 */
export function formatDate(date: string | Date): string {
  const parsedDate = typeof date === 'string' ? new Date(date) : date

  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsedDate)
}

/**
 * Formats a date in short dd/mm/yyyy format for Colombia.
 */
export function formatDateShort(date: string | Date): string {
  const parsedDate = typeof date === 'string' ? new Date(date) : date

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsedDate)
}

/**
 * Converts text to a URL-friendly slug.
 * Example: "Gafas Aviador Cafe" -> "gafas-aviador-cafe"
 */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/**
 * Truncates text and appends ellipsis when maxLength is exceeded.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }

  return `${text.slice(0, maxLength)}...`
}

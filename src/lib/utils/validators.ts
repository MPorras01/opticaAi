/**
 * Validates Colombian mobile numbers.
 * Accepted examples: 3001234567, +573001234567
 */
export function isValidColombianPhone(phone: string): boolean {
  const normalized = phone.replace(/\s+/g, '')
  return /^(?:\+57)?3\d{9}$/.test(normalized)
}

/**
 * Basic email format validation.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

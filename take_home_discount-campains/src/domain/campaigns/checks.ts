/** Upper bound for any money value, keeps satang arithmetic inside safe integers */
export const MAX_AMOUNT = 1_000_000_000

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

export function checkPositiveAmount(value: unknown, field: string): string[] {
  if (!isFiniteNumber(value)) return [`${field} must be a number`]
  if (value <= 0) return [`${field} must be greater than 0`]
  if (value > MAX_AMOUNT) return [`${field} must not exceed ${MAX_AMOUNT}`]
  return []
}

export function checkPercentage(value: unknown, field: string): string[] {
  if (!isFiniteNumber(value)) return [`${field} must be a number`]
  if (value <= 0 || value > 100) return [`${field} must be greater than 0 and at most 100`]
  return []
}

export function checkNonNegativeInteger(value: unknown, field: string): string[] {
  if (!isFiniteNumber(value) || !Number.isInteger(value)) return [`${field} must be a whole number`]
  if (value < 0) return [`${field} must not be negative`]
  if (value > MAX_AMOUNT) return [`${field} must not exceed ${MAX_AMOUNT}`]
  return []
}

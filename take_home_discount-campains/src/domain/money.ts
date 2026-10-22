/**
 * All calculations run on integer satang (1 THB = 100 satang)
 * so that results like 2,382.50 never drift because of floating point.
 */
export const toSatang = (thb: number): number => Math.round(thb * 100)

export const toThb = (satang: number): number => satang / 100

const thbFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const formatThb = (thb: number): string => `฿${thbFormatter.format(thb)}`

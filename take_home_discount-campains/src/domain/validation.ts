import { CAMPAIGN_TYPES, campaignRegistry, isCampaignType } from './campaigns'
import { MAX_AMOUNT } from './campaigns/checks'
import { DiscountValidationError } from './errors'
import { ITEM_CATEGORIES, type Campaign, type CartItem, type ItemCategory } from './types'

type Issues = string[]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function validateItem(raw: unknown, label: string, issues: Issues): CartItem | null {
  if (!isRecord(raw)) {
    issues.push(`${label} must be an object`)
    return null
  }
  const before = issues.length
  const { id, name, category, price } = raw
  const quantity = raw.quantity ?? 1

  if (typeof name !== 'string' || name.trim() === '') issues.push(`${label}.name must be a non-empty string`)
  if (id !== undefined && typeof id !== 'string' && typeof id !== 'number') {
    issues.push(`${label}.id must be a string or number`)
  }
  if (!ITEM_CATEGORIES.includes(category as ItemCategory)) {
    issues.push(`${label}.category must be one of: ${ITEM_CATEGORIES.join(', ')}`)
  }
  if (typeof price !== 'number' || !Number.isFinite(price) || price < 0 || price > MAX_AMOUNT) {
    issues.push(`${label}.price must be a number between 0 and ${MAX_AMOUNT}`)
  }
  if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1 || quantity > 10_000) {
    issues.push(`${label}.quantity must be a whole number between 1 and 10000`)
  }
  if (issues.length > before) return null

  return {
    id: String(id ?? name),
    name: (name as string).trim(),
    category: category as ItemCategory,
    price: price as number,
    quantity: quantity as number,
  }
}

function validateCampaign(raw: unknown, label: string, issues: Issues): Campaign | null {
  if (!isRecord(raw)) {
    issues.push(`${label} must be an object`)
    return null
  }
  if (!isCampaignType(raw.type)) {
    issues.push(`${label}.type must be one of: ${CAMPAIGN_TYPES.join(', ')}`)
    return null
  }
  const problems = campaignRegistry[raw.type].validate(raw)
  if (problems.length > 0) {
    issues.push(...problems.map((p) => `${label} (${raw.type}): ${p}`))
    return null
  }
  // Copy only the known fields so stray properties never leak into the engine
  switch (raw.type) {
    case 'FIXED_AMOUNT':
      return { type: raw.type, amount: raw.amount as number }
    case 'PERCENTAGE':
      return { type: raw.type, percentage: raw.percentage as number }
    case 'CATEGORY_PERCENTAGE':
      return { type: raw.type, category: raw.category as ItemCategory, percentage: raw.percentage as number }
    case 'POINTS':
      return { type: raw.type, points: raw.points as number }
    case 'SEASONAL':
      return { type: raw.type, every: raw.every as number, discount: raw.discount as number }
  }
}

function checkOnePerGroup(campaigns: Campaign[], issues: Issues) {
  const seen = new Map<string, string>()
  for (const campaign of campaigns) {
    const { group } = campaignRegistry[campaign.type]
    const previous = seen.get(group)
    if (previous) {
      issues.push(`Only one ${group} campaign is allowed, got ${previous} and ${campaign.type}`)
    } else {
      seen.set(group, campaign.type)
    }
  }
}

/**
 * Validates untrusted input (e.g. parsed JSON) and returns typed, normalized data.
 * Throws DiscountValidationError listing every problem found.
 */
export function parseDiscountInput(cart: unknown, campaigns: unknown): { items: CartItem[]; campaigns: Campaign[] } {
  const issues: Issues = []

  if (!Array.isArray(cart)) issues.push('cart must be an array of items')
  if (!Array.isArray(campaigns)) issues.push('campaigns must be an array')
  if (issues.length > 0) throw new DiscountValidationError(issues)

  const items = (cart as unknown[]).map((raw, i) => validateItem(raw, `cart[${i}]`, issues))
  const parsedCampaigns = (campaigns as unknown[]).map((raw, i) =>
    validateCampaign(raw, `campaigns[${i}]`, issues),
  )
  const validCampaigns = parsedCampaigns.filter((c): c is Campaign => c !== null)
  checkOnePerGroup(validCampaigns, issues)

  if (issues.length > 0) throw new DiscountValidationError(issues)
  return { items: items as CartItem[], campaigns: validCampaigns }
}

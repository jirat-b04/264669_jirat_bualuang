import { getDefinition } from './campaigns'
import { toSatang, toThb } from './money'
import { CAMPAIGN_GROUPS, type DiscountResult, type DiscountStep } from './types'
import { parseDiscountInput } from './validation'

/**
 * Calculates the final price of a cart after applying discount campaigns.
 *
 * - Input is validated first, so it is safe to pass raw JSON.
 * - At most one campaign per group (Coupon, OnTop, Seasonal).
 * - Campaigns are applied Coupon → OnTop → Seasonal regardless of input order;
 *   each one works on the price left by the previous one.
 * - The price never goes below 0.
 *
 * @throws DiscountValidationError when the cart or campaigns are invalid
 */
export function calculateDiscount(cart: unknown, campaigns: unknown): DiscountResult {
  const input = parseDiscountInput(cart, campaigns)

  const subtotal = input.items.reduce((sum, item) => sum + toSatang(item.price) * item.quantity, 0)
  const ordered = [...input.campaigns].sort(
    (a, b) =>
      CAMPAIGN_GROUPS.indexOf(getDefinition(a).group) - CAMPAIGN_GROUPS.indexOf(getDefinition(b).group),
  )

  let current = subtotal
  const steps: DiscountStep[] = []

  for (const campaign of ordered) {
    const definition = getDefinition(campaign)
    const outcome = definition.apply(campaign, { items: input.items, subtotal, current })
    const discount = Math.min(Math.max(outcome.discount, 0), current)

    steps.push({
      campaign,
      group: definition.group,
      label: `${definition.title}: ${definition.describe(campaign)}`,
      priceBefore: toThb(current),
      discount: toThb(discount),
      priceAfter: toThb(current - discount),
      note: outcome.note,
    })
    current -= discount
  }

  return {
    subtotal: toThb(subtotal),
    totalDiscount: toThb(subtotal - current),
    finalPrice: toThb(current),
    steps,
  }
}

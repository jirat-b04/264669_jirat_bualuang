import { ITEM_CATEGORIES, type CategoryPercentageCampaign, type ItemCategory } from '../types'
import { toSatang } from '../money'
import { checkPercentage } from './checks'
import type { CampaignDefinition } from './definition'

const isItemCategory = (value: unknown): value is ItemCategory =>
  ITEM_CATEGORIES.includes(value as ItemCategory)

export const categoryPercentage: CampaignDefinition<CategoryPercentageCampaign> = {
  type: 'CATEGORY_PERCENTAGE',
  group: 'OnTop',
  title: 'Percentage discount by item category',
  describe: (c) => `${c.percentage}% off ${c.category}`,
  validate: (c) => [
    ...(isItemCategory(c.category)
      ? []
      : [`category must be one of: ${ITEM_CATEGORIES.join(', ')}`]),
    ...checkPercentage(c.percentage, 'percentage'),
  ],
  apply: (c, { items, subtotal, current }) => {
    const categorySubtotal = items
      .filter((item) => item.category === c.category)
      .reduce((sum, item) => sum + toSatang(item.price) * item.quantity, 0)

    if (categorySubtotal === 0 || subtotal === 0) {
      return { discount: 0, note: `No ${c.category} items in cart` }
    }

    // Earlier coupons reduce every item proportionally, so the category's
    // share of the running price is scaled by the same ratio.
    const categoryCurrent = (categorySubtotal * current) / subtotal
    return { discount: Math.round((categoryCurrent * c.percentage) / 100) }
  },
}

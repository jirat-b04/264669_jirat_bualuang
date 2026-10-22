import type { PointsCampaign } from '../types'
import { formatThb, toThb } from '../money'
import { checkNonNegativeInteger } from './checks'
import type { CampaignDefinition } from './definition'

/** Fixed business rule: points can cover at most 20% of the price */
export const POINTS_CAP_PERCENTAGE = 20

export const points: CampaignDefinition<PointsCampaign> = {
  type: 'POINTS',
  group: 'OnTop',
  title: 'Discount by points',
  describe: (c) => `Redeem ${c.points} points (1 point = 1 THB)`,
  validate: (c) => checkNonNegativeInteger(c.points, 'points'),
  apply: (c, { current }) => {
    const requested = c.points * 100
    const cap = Math.floor((current * POINTS_CAP_PERCENTAGE) / 100)
    if (requested <= cap) return { discount: requested }
    return {
      discount: cap,
      note: `Capped at ${POINTS_CAP_PERCENTAGE}% of price (${formatThb(toThb(cap))})`,
    }
  },
}

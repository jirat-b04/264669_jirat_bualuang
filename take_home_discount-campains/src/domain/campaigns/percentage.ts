import type { PercentageCampaign } from '../types'
import { checkPercentage } from './checks'
import type { CampaignDefinition } from './definition'

export const percentage: CampaignDefinition<PercentageCampaign> = {
  type: 'PERCENTAGE',
  group: 'Coupon',
  title: 'Percentage discount',
  describe: (c) => `${c.percentage}% off the cart`,
  validate: (c) => checkPercentage(c.percentage, 'percentage'),
  apply: (c, { current }) => ({ discount: Math.round((current * c.percentage) / 100) }),
}

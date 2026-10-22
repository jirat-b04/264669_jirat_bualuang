import type { FixedAmountCampaign } from '../types'
import { formatThb, toSatang } from '../money'
import { checkPositiveAmount } from './checks'
import type { CampaignDefinition } from './definition'

export const fixedAmount: CampaignDefinition<FixedAmountCampaign> = {
  type: 'FIXED_AMOUNT',
  group: 'Coupon',
  title: 'Fixed amount',
  describe: (c) => `${formatThb(c.amount)} off the cart`,
  validate: (c) => checkPositiveAmount(c.amount, 'amount'),
  apply: (c) => ({ discount: toSatang(c.amount) }),
}
